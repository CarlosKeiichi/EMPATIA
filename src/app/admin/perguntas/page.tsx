'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdminNav from '@/components/AdminNav';

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
  { id: 'trabalho', label: 'Trabalho', icon: '💼' },
  { id: 'estresse', label: 'Estresse', icon: '😰' },
  { id: 'relacionamentos', label: 'Relacionamentos', icon: '💜' },
  { id: 'financas', label: 'Finanças', icon: '💰' },
];

const TIPOS_BADGE: Record<string, string> = {
  escala_0_10: 'bg-blue-100 text-blue-700',
  multipla_escolha: 'bg-purple-100 text-purple-700',
  frequencia: 'bg-orange-100 text-orange-700',
  aberta: 'bg-green-100 text-green-700',
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
      const payload = {
        ...form,
        opcoes: form.opcoes || null,
      };

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
      <div className="min-h-screen bg-organic flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-primary-400 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-organic font-[Nunito]">
      <Header titulo="EmpatIA — Perguntas" subtitulo="Gerencie as perguntas das jornadas" />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <AdminNav />

        {/* Tabs de jornada */}
        <div className="flex flex-wrap gap-2">
          {JORNADAS.map((j) => {
            const count = perguntas.filter((p) => p.jornada === j.id).length;
            return (
              <button
                key={j.id}
                onClick={() => setJornadaAtiva(j.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 ${
                  jornadaAtiva === j.id
                    ? 'bg-primary-600 text-white shadow-warm'
                    : 'bg-primary-50/50 text-primary-500 hover:bg-primary-100/60 border border-primary-100/30'
                }`}
              >
                <span>{j.icon}</span>
                {j.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  jornadaAtiva === j.id ? 'bg-white/20' : 'bg-primary-200/50'
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
              <div className="card text-center py-10">
                <p className="text-primary-400 text-sm">Nenhuma pergunta nesta jornada.</p>
              </div>
            ) : (
              blocos.map((bloco) => {
                const perguntasBloco = perguntasFiltradas
                  .filter((p) => p.bloco === bloco)
                  .sort((a, b) => a.ordem - b.ordem);

                return (
                  <div key={bloco} className="card">
                    <h3 className="font-bold text-primary-700 text-sm mb-3 uppercase tracking-wider">
                      {bloco.replace(/_/g, ' ')}
                    </h3>
                    <div className="space-y-2">
                      {perguntasBloco.map((p) => (
                        <div
                          key={p.id}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                            editando?.id === p.id
                              ? 'bg-primary-100/60 ring-1 ring-primary-300'
                              : 'bg-primary-50/40 hover:bg-primary-50/70'
                          } ${!p.ativa ? 'opacity-50' : ''}`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => mover(p, 'up')}
                              className="text-primary-400 hover:text-primary-600 text-xs leading-none"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => mover(p, 'down')}
                              className="text-primary-400 hover:text-primary-600 text-xs leading-none"
                            >
                              ▼
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-primary-800 font-medium truncate">{p.texto}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${TIPOS_BADGE[p.tipo] || 'bg-gray-100 text-gray-600'}`}>
                                {p.tipo.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-primary-300">{p.codigo}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => toggleAtiva(p)}
                              className={`w-8 h-5 rounded-full transition-all duration-200 relative ${
                                p.ativa ? 'bg-green-400' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                                p.ativa ? 'left-3.5' : 'left-0.5'
                              }`} />
                            </button>
                            <button
                              onClick={() => abrirEdicao(p)}
                              className="text-primary-400 hover:text-primary-600 text-xs font-semibold"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => excluir(p.id)}
                              className="text-red-300 hover:text-red-500 text-xs font-semibold"
                            >
                              🗑
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
              className="btn-primary text-sm w-full py-2"
            >
              + Nova Pergunta
            </button>

            {(editando || form.texto || form.codigo) && (
              <div className="card space-y-3 animate-fade-in">
                <h3 className="font-bold text-primary-800 text-sm">
                  {editando ? 'Editar Pergunta' : 'Nova Pergunta'}
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Código</label>
                  <input
                    className="input text-sm"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="ex: trab_lid_05"
                    disabled={!!editando}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-600 mb-1">Texto</label>
                  <textarea
                    className="input text-sm min-h-[80px] resize-y"
                    value={form.texto}
                    onChange={(e) => setForm({ ...form, texto: e.target.value })}
                    placeholder="Texto da pergunta..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-warm-600 mb-1">Bloco</label>
                    <input
                      className="input text-sm"
                      value={form.bloco}
                      onChange={(e) => setForm({ ...form, bloco: e.target.value })}
                      placeholder="lideranca_sistema"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-warm-600 mb-1">Tipo</label>
                    <select
                      className="input text-sm"
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
                    <label className="block text-xs font-semibold text-warm-600 mb-1">
                      Opções (JSON)
                    </label>
                    <textarea
                      className="input text-sm min-h-[60px] resize-y font-mono text-xs"
                      value={form.opcoes}
                      onChange={(e) => setForm({ ...form, opcoes: e.target.value })}
                      placeholder='[{"valor":"sim","label":"Sim"},{"valor":"nao","label":"Não"}]'
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ativa}
                    onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                    className="w-4 h-4 accent-primary-600 rounded"
                  />
                  <span className="text-sm font-semibold text-warm-700">Ativa</span>
                </label>

                <div className="flex gap-2 pt-1">
                  <button onClick={salvar} disabled={salvando} className="btn-primary text-sm px-4 py-2">
                    {salvando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditando(null)}
                    className="text-sm text-primary-400 hover:text-primary-600 font-semibold px-4 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
