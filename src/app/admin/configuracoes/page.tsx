'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdminNav from '@/components/AdminNav';

interface ConfigIA {
  id: string;
  nome: string;
  systemPrompt: string;
  temperatura: number;
  modelo: string;
  descricao: string | null;
  ativo: boolean;
}

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<ConfigIA[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState<ConfigIA | null>(null);
  const [criando, setCriando] = useState(false);
  const [testeMensagem, setTesteMensagem] = useState('');
  const [testeResposta, setTesteResposta] = useState('');
  const [testeConfig, setTesteConfig] = useState('');
  const [testando, setTestando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: '',
    systemPrompt: '',
    temperatura: 0.7,
    modelo: 'claude-sonnet-4-20250514',
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    carregarConfigs();
  }, []);

  async function carregarConfigs() {
    try {
      const res = await fetch('/api/admin/config-ia');
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  }

  function abrirEdicao(config: ConfigIA) {
    setEditando(config);
    setCriando(false);
    setForm({
      nome: config.nome,
      systemPrompt: config.systemPrompt,
      temperatura: config.temperatura,
      modelo: config.modelo,
      descricao: config.descricao || '',
      ativo: config.ativo,
    });
  }

  function abrirCriacao() {
    setEditando(null);
    setCriando(true);
    setForm({
      nome: '',
      systemPrompt: '',
      temperatura: 0.7,
      modelo: 'claude-sonnet-4-20250514',
      descricao: '',
      ativo: true,
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      const url = editando
        ? `/api/admin/config-ia/${editando.id}`
        : '/api/admin/config-ia';
      const method = editando ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await carregarConfigs();
        setEditando(null);
        setCriando(false);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;
    await fetch(`/api/admin/config-ia/${id}`, { method: 'DELETE' });
    await carregarConfigs();
    if (editando?.id === id) {
      setEditando(null);
    }
  }

  async function testar() {
    if (!testeConfig || !testeMensagem) return;
    setTestando(true);
    setTesteResposta('');
    try {
      const res = await fetch('/api/admin/config-ia/testar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configNome: testeConfig, mensagem: testeMensagem }),
      });
      const data = await res.json();
      setTesteResposta(data.resposta || data.erro || 'Sem resposta');
    } catch {
      setTesteResposta('Erro de conexão');
    } finally {
      setTestando(false);
    }
  }

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
      <Header titulo="EmpatIA — Configurações IA" subtitulo="Gerencie os prompts da Márcia" />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <AdminNav />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary-800">Configurações da IA</h2>
          <button onClick={abrirCriacao} className="btn-primary text-sm px-4 py-2">
            + Nova Config
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lista de configs */}
          <div className="space-y-3">
            {configs.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-primary-400 text-sm">Nenhuma configuração cadastrada.</p>
                <p className="text-primary-300 text-xs mt-1">Clique em &quot;Nova Config&quot; para criar.</p>
              </div>
            ) : (
              configs.map((config) => (
                <div
                  key={config.id}
                  className={`card cursor-pointer transition-all duration-200 hover:shadow-warm ${
                    editando?.id === config.id ? 'ring-2 ring-primary-400' : ''
                  }`}
                  onClick={() => abrirEdicao(config)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-primary-800 text-sm">{config.nome}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            config.ativo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {config.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      {config.descricao && (
                        <p className="text-xs text-primary-400 mt-1">{config.descricao}</p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-primary-400">
                        <span>Temp: {config.temperatura}</span>
                        <span>Modelo: {config.modelo.split('-').slice(0, 2).join('-')}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); excluir(config.id); }}
                      className="text-red-400 hover:text-red-600 text-xs font-semibold ml-3"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Editor */}
          {(editando || criando) && (
            <div className="card space-y-4 animate-fade-in">
              <h3 className="font-bold text-primary-800">
                {editando ? 'Editar Configuração' : 'Nova Configuração'}
              </h3>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1">Nome</label>
                <input
                  className="input text-sm"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="ex: marcia_suporte"
                  disabled={!!editando}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1">Descrição</label>
                <input
                  className="input text-sm"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descrição breve"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-warm-700 mb-1">System Prompt</label>
                <textarea
                  className="input text-sm min-h-[160px] resize-y"
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  placeholder="Prompt do sistema para a IA..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1">
                    Temperatura: {form.temperatura.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={form.temperatura}
                    onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })}
                    className="w-full accent-primary-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-warm-700 mb-1">Modelo</label>
                  <select
                    className="input text-sm"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 accent-primary-600 rounded"
                />
                <span className="text-sm font-semibold text-warm-700">Ativo</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button onClick={salvar} disabled={salvando} className="btn-primary text-sm px-4 py-2">
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => { setEditando(null); setCriando(false); }}
                  className="text-sm text-primary-400 hover:text-primary-600 font-semibold px-4 py-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Área de teste */}
        <div className="card space-y-4">
          <h3 className="font-bold text-primary-800">Testar Configuração</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-warm-700 mb-1">Config</label>
              <select
                className="input text-sm"
                value={testeConfig}
                onChange={(e) => setTesteConfig(e.target.value)}
              >
                <option value="">Selecione...</option>
                {configs.filter(c => c.ativo).map((c) => (
                  <option key={c.id} value={c.nome}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-warm-700 mb-1">Mensagem</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  value={testeMensagem}
                  onChange={(e) => setTesteMensagem(e.target.value)}
                  placeholder="Digite uma mensagem de teste..."
                  onKeyDown={(e) => e.key === 'Enter' && testar()}
                />
                <button
                  onClick={testar}
                  disabled={testando || !testeConfig || !testeMensagem}
                  className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                >
                  {testando ? 'Enviando...' : 'Testar'}
                </button>
              </div>
            </div>
          </div>
          {testeResposta && (
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/50 animate-fade-in">
              <p className="text-xs font-bold text-primary-500 mb-2">Resposta da IA:</p>
              <p className="text-sm text-primary-800 whitespace-pre-wrap leading-relaxed">{testeResposta}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
