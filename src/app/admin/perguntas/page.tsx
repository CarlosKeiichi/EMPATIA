'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Pergunta {
  id: string;
  codigo: string;
  jornada: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes: string | null;
  ordem: number;
  ativa: boolean;
}

const JORNADAS = [
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'estresse', label: 'Estresse' },
  { id: 'relacionamentos', label: 'Relacionamentos' },
  { id: 'financas', label: 'Finanças' },
];

const TIPOS_BADGE: Record<string, string> = {
  escala_0_10: 'bg-[#dbeafe] text-[#1d4ed8]',
  multipla_escolha: 'bg-[#f3e8ff] text-[#7c3aed]',
  frequencia: 'bg-[#ffedd5] text-[#c2410c]',
  aberta: 'bg-[#e8f5ee] text-[#2d7a5e]',
};

export default function PerguntasPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [jornadaAtiva, setJornadaAtiva] = useState('trabalho');
  const [editando, setEditando] = useState<Pergunta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    codigo: '',
    jornada: 'trabalho',
    bloco: '',
    texto: '',
    tipo: 'escala_0_10',
    opcoes: '',
    ordem: 0,
    ativa: true,
  });

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

  function abrirEdicao(p: Pergunta) {
    setEditando(p);
    setForm({
      codigo: p.codigo,
      jornada: p.jornada,
      bloco: p.bloco,
      texto: p.texto,
      tipo: p.tipo,
      opcoes: p.opcoes || '',
      ordem: p.ordem,
      ativa: p.ativa,
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      const payload = { ...form, opcoes: form.opcoes || null };

      if (editando) {
        await fetch(`/api/admin/perguntas/${editando.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/perguntas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await carregarPerguntas();
      setEditando(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtiva(p: Pergunta) {
    await fetch(`/api/admin/perguntas/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !p.ativa }),
    });
    await carregarPerguntas();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta pergunta?')) return;
    await fetch(`/api/admin/perguntas/${id}`, { method: 'DELETE' });
    await carregarPerguntas();
    if (editando?.id === id) setEditando(null);
  }

  async function mover(p: Pergunta, direcao: 'up' | 'down') {
    const filtradas = perguntas
      .filter((q) => q.jornada === p.jornada && q.bloco === p.bloco)
      .sort((a, b) => a.ordem - b.ordem);

    const idx = filtradas.findIndex((q) => q.id === p.id);
    const targetIdx = direcao === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= filtradas.length) return;

    const itens = [
      { id: filtradas[idx].id, ordem: filtradas[targetIdx].ordem },
      { id: filtradas[targetIdx].id, ordem: filtradas[idx].ordem },
    ];

    await fetch('/api/admin/perguntas/reordenar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
    await carregarPerguntas();
  }

  const perguntasFiltradas = perguntas.filter((p) => p.jornada === jornadaAtiva);
  const blocos = [...new Set(perguntasFiltradas.map((p) => p.bloco))];

  if (carregando) {
    return (
      <AdminLayout titulo="Perguntas" subtitulo="Gerencie as perguntas das jornadas">
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
    <AdminLayout titulo="Perguntas" subtitulo="Gerencie as perguntas das jornadas">
      {/* Tabs de jornada */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#ece8e1] p-1 w-fit mb-6">
        {JORNADAS.map((j) => {
          const count = perguntas.filter((p) => p.jornada === j.id).length;
          return (
            <button
              key={j.id}
              onClick={() => setJornadaAtiva(j.id)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 flex items-center gap-1.5 ${
                jornadaAtiva === j.id
                  ? 'bg-[#2d7a5e] text-white shadow-sm'
                  : 'text-[#9a9590] hover:text-[#4a6b5d] hover:bg-[#f5f3ef]'
              }`}
            >
              {j.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                jornadaAtiva === j.id ? 'bg-white/20' : 'bg-[#f5f3ef]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de perguntas por bloco */}
        <div className="lg:col-span-2 space-y-4">
          {blocos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ece8e1] text-center py-10 px-6">
              <p className="text-[#9a9590] text-sm">Nenhuma pergunta nesta jornada.</p>
            </div>
          ) : (
            blocos.map((bloco) => {
              const perguntasBloco = perguntasFiltradas
                .filter((p) => p.bloco === bloco)
                .sort((a, b) => a.ordem - b.ordem);

              return (
                <div key={bloco} className="bg-white rounded-2xl border border-[#ece8e1] p-5">
                  <h3 className="font-bold text-[#4a4842] text-[11px] mb-3 uppercase tracking-wider">
                    {bloco.replace(/_/g, ' ')}
                  </h3>
                  <div className="space-y-2">
                    {perguntasBloco.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                          editando?.id === p.id
                            ? 'bg-[#e8f5ee] ring-1 ring-[#2d7a5e]/30'
                            : 'bg-[#faf8f5] hover:bg-[#f5f3ef]'
                        } ${!p.ativa ? 'opacity-40' : ''}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => mover(p, 'up')}
                            className="text-[#b5b0a8] hover:text-[#2d7a5e] text-[10px] leading-none transition-colors"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => mover(p, 'down')}
                            className="text-[#b5b0a8] hover:text-[#2d7a5e] text-[10px] leading-none transition-colors"
                          >
                            ▼
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#2d2a26] font-medium truncate">{p.texto}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TIPOS_BADGE[p.tipo] || 'bg-[#f5f3ef] text-[#4a4842]'}`}>
                              {p.tipo.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-[#b5b0a8]">{p.codigo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            onClick={() => toggleAtiva(p)}
                            className={`w-8 h-[18px] rounded-full transition-all duration-200 relative cursor-pointer ${
                              p.ativa ? 'bg-[#2d7a5e]' : 'bg-[#d5d0c8]'
                            }`}
                          >
                            <span className={`absolute top-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-all duration-200 ${
                              p.ativa ? 'left-[14px]' : 'left-[2px]'
                            }`} />
                          </div>
                          <button
                            onClick={() => abrirEdicao(p)}
                            className="text-[#9a9590] hover:text-[#2d7a5e] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2l4 4-10 10H4v-4L14 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => excluir(p.id)}
                            className="text-[#d5d0c8] hover:text-[#dc6b6b] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h14M8 6V4h4v2M5 6v11a1 1 0 001 1h8a1 1 0 001-1V6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Editor lateral */}
        <div className="space-y-4">
          <button
            onClick={() => {
              setEditando(null);
              setForm({
                codigo: '',
                jornada: jornadaAtiva,
                bloco: '',
                texto: '',
                tipo: 'escala_0_10',
                opcoes: '',
                ordem: perguntasFiltradas.length,
                ativa: true,
              });
            }}
            className="w-full py-2.5 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors"
          >
            + Nova Pergunta
          </button>

          {(editando || form.texto || form.codigo) && (
            <div className="bg-white rounded-2xl border border-[#ece8e1] p-5 space-y-3">
              <h3 className="font-bold text-[#2d2a26] text-[14px]">
                {editando ? 'Editar Pergunta' : 'Nova Pergunta'}
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-[#4a4842] mb-1 uppercase tracking-wider">Código</label>
                <input
                  className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] transition-colors"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="ex: trab_lid_05"
                  disabled={!!editando}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#4a4842] mb-1 uppercase tracking-wider">Texto</label>
                <textarea
                  className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] min-h-[80px] resize-y focus:outline-none focus:border-[#2d7a5e] transition-colors"
                  value={form.texto}
                  onChange={(e) => setForm({ ...form, texto: e.target.value })}
                  placeholder="Texto da pergunta..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4a4842] mb-1 uppercase tracking-wider">Bloco</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] transition-colors"
                    value={form.bloco}
                    onChange={(e) => setForm({ ...form, bloco: e.target.value })}
                    placeholder="lideranca_sistema"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4a4842] mb-1 uppercase tracking-wider">Tipo</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] transition-colors"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="escala_0_10">Escala 0-10</option>
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="frequencia">Frequência</option>
                    <option value="aberta">Aberta</option>
                  </select>
                </div>
              </div>

              {(form.tipo === 'multipla_escolha' || form.tipo === 'frequencia') && (
                <div>
                  <label className="block text-[11px] font-bold text-[#4a4842] mb-1 uppercase tracking-wider">Opções (JSON)</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[12px] text-[#2d2a26] min-h-[60px] resize-y font-mono focus:outline-none focus:border-[#2d7a5e] transition-colors"
                    value={form.opcoes}
                    onChange={(e) => setForm({ ...form, opcoes: e.target.value })}
                    placeholder='[{"valor":"sim","label":"Sim"}]'
                  />
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, ativa: !form.ativa })}
                  className={`w-9 h-5 rounded-full transition-all duration-200 relative cursor-pointer ${
                    form.ativa ? 'bg-[#2d7a5e]' : 'bg-[#d5d0c8]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                    form.ativa ? 'left-4' : 'left-0.5'
                  }`} />
                </div>
                <span className="text-[13px] font-semibold text-[#4a4842]">Ativa</span>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="px-5 py-2 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 text-[13px] text-[#9a9590] hover:text-[#4a4842] font-semibold transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
