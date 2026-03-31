'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import TrilhaJornada, { Pergunta, BlocoInfo } from '@/components/admin/TrilhaJornada';
import EditorBloco from '@/components/admin/EditorBloco';

const JORNADAS = [
  { id: 'trabalho', label: 'Trabalho', icone: '🏫', descricao: 'Impacto emocional da atividade docente' },
  { id: 'relacionamentos', label: 'Relacionamentos', icone: '💛', descricao: 'Relações pessoais e inteligência emocional' },
  { id: 'financas', label: 'Finanças', icone: '💰', descricao: 'Situação financeira e bem-estar' },
];

// Map jornada types to include estresse block
const JORNADA_FILTROS: Record<string, string[]> = {
  trabalho: ['trabalho', 'estresse'],
  relacionamentos: ['relacionamentos'],
  financas: ['financas'],
};

export default function PerguntasPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [jornadaAtiva, setJornadaAtiva] = useState('trabalho');
  const [blocoSelecionado, setBlocoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    carregarPerguntas();
  }, []);

  async function carregarPerguntas() {
    try {
      const res = await fetch('/api/admin/perguntas');
      const data = await res.json();
      setPerguntas(data.perguntas || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  }

  const filtros = JORNADA_FILTROS[jornadaAtiva] || [jornadaAtiva];
  const perguntasFiltradas = perguntas.filter((p) => filtros.includes(p.jornada));
  const perguntasBloco = blocoSelecionado
    ? perguntasFiltradas.filter((p) => p.bloco === blocoSelecionado)
    : [];

  async function handleReordenarBlocos(blocos: BlocoInfo[]) {
    // Reassign ordem values: each block's questions get sequential values
    const itens: { id: string; ordem: number }[] = [];
    let ordemBase = 0;

    for (const bloco of blocos) {
      for (let i = 0; i < bloco.perguntas.length; i++) {
        itens.push({ id: bloco.perguntas[i].id, ordem: ordemBase + i });
      }
      ordemBase += bloco.perguntas.length;
    }

    // Optimistically update local state (immutable)
    const updatedIds = new Map(itens.map((i) => [i.id, i.ordem]));
    setPerguntas(perguntas.map((p) =>
      updatedIds.has(p.id) ? { ...p, ordem: updatedIds.get(p.id)! } : p
    ));

    // Persist to server
    await fetch('/api/admin/perguntas/reordenar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
  }

  const jornadaInfo = JORNADAS.find((j) => j.id === jornadaAtiva);
  const totalPerguntas = perguntasFiltradas.length;
  const totalAtivas = perguntasFiltradas.filter((p) => p.ativa).length;

  if (carregando) {
    return (
      <AdminLayout titulo="Editor de Jornadas" subtitulo="Visualize e edite a trilha de cada jornada">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titulo="Editor de Jornadas" subtitulo="Visualize e edite a trilha de cada jornada">
      {/* Journey tabs */}
      <div role="tablist" className="flex gap-2 mb-6">
        {JORNADAS.map((j) => {
          const count = perguntas.filter((p) => (JORNADA_FILTROS[j.id] || [j.id]).includes(p.jornada)).length;
          const isActive = jornadaAtiva === j.id;
          return (
            <button
              key={j.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => { setJornadaAtiva(j.id); setBlocoSelecionado(null); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-[#2d7a5e] bg-[#e8f5ee]/50 shadow-sm'
                  : 'border-[#ece8e1] bg-white hover:border-[#d5d0c8] hover:shadow-sm'
              }`}
            >
              <span className="text-xl">{j.icone}</span>
              <div className="text-left">
                <p className={`text-[13px] font-bold ${isActive ? 'text-[#2d7a5e]' : 'text-[#4a4842]'}`}>
                  {j.label}
                </p>
                <p className="text-[10px] text-[#9a9590] font-medium">{count} perguntas</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Journey info bar */}
      <div className="bg-white rounded-2xl border border-[#ece8e1] p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{jornadaInfo?.icone}</span>
          <div>
            <h2 className="text-[15px] font-bold text-[#2d2a26]">Jornada: {jornadaInfo?.label}</h2>
            <p className="text-[12px] text-[#9a9590]">{jornadaInfo?.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-[#9a9590]">
            <strong className="text-[#2d2a26]">{totalPerguntas}</strong> perguntas
          </span>
          <span className="text-[#9a9590]">
            <strong className="text-[#2d7a5e]">{totalAtivas}</strong> ativas
          </span>
        </div>
      </div>

      {/* Main layout: trail + editor */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Trail (left panel — 3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-bold text-[#4a4842] uppercase tracking-wider">
                Trilha da Jornada
              </h3>
              <p className="text-[11px] text-[#b5b0a8]">Arraste os blocos para reordenar</p>
            </div>

            <TrilhaJornada
              perguntas={perguntasFiltradas}
              blocoSelecionado={blocoSelecionado}
              onSelecionarBloco={(b) => setBlocoSelecionado(b === blocoSelecionado ? null : b)}
              onReordenar={handleReordenarBlocos}
            />
          </div>
        </div>

        {/* Editor (right panel — 2 cols) */}
        <div className="lg:col-span-2">
          {blocoSelecionado ? (
            <EditorBloco
              bloco={blocoSelecionado}
              jornada={filtros.find((f) =>
                perguntasFiltradas.some((p) => p.bloco === blocoSelecionado && p.jornada === f)
              ) || jornadaAtiva}
              perguntas={perguntasBloco}
              onFechar={() => setBlocoSelecionado(null)}
              onRecarregar={carregarPerguntas}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#ece8e1] p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#f5f3ef] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5b0a8" strokeWidth="1.5">
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#4a4842] mb-1">Selecione um bloco</p>
              <p className="text-[12px] text-[#9a9590] leading-relaxed">
                Clique em um bloco na trilha para ver e editar suas perguntas.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
