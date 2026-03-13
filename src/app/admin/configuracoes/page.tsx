'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

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
    modelo: 'claude-sonnet-4-6',
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
      modelo: 'claude-sonnet-4-6',
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
      <AdminLayout titulo="Config IA" subtitulo="Gerencie os prompts da Márcia">
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
    <AdminLayout titulo="Config IA" subtitulo="Gerencie os prompts da Márcia">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-bold text-[#2d2a26]">Configurações da IA</h2>
        <button
          onClick={abrirCriacao}
          className="px-4 py-2 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors"
        >
          + Nova Config
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de configs */}
        <div className="space-y-3">
          {configs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#ece8e1] text-center py-10 px-6">
              <p className="text-[#9a9590] text-sm">Nenhuma configuração cadastrada.</p>
              <p className="text-[#b5b0a8] text-xs mt-1">Clique em &quot;Nova Config&quot; para criar.</p>
            </div>
          ) : (
            configs.map((config) => (
              <div
                key={config.id}
                className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  editando?.id === config.id ? 'border-[#2d7a5e] shadow-sm' : 'border-[#ece8e1]'
                }`}
                onClick={() => abrirEdicao(config)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#2d2a26] text-[13px]">{config.nome}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          config.ativo
                            ? 'bg-[#e8f5ee] text-[#2d7a5e]'
                            : 'bg-[#fef2f2] text-[#dc6b6b]'
                        }`}
                      >
                        {config.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {config.descricao && (
                      <p className="text-[11px] text-[#9a9590] mt-1">{config.descricao}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-[11px] text-[#b5b0a8]">
                      <span>Temp: {config.temperatura}</span>
                      <span>Modelo: {config.modelo.split('-').slice(0, 2).join('-')}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); excluir(config.id); }}
                    className="text-[#dc6b6b] hover:text-[#c44] text-[11px] font-bold ml-3"
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
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6 space-y-4">
            <h3 className="font-bold text-[#2d2a26] text-[14px]">
              {editando ? 'Editar Configuração' : 'Nova Configuração'}
            </h3>

            <div>
              <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">Nome</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] focus:ring-1 focus:ring-[#2d7a5e]/20 transition-colors"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="ex: marcia_suporte"
                disabled={!!editando}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">Descrição</label>
              <input
                className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] focus:ring-1 focus:ring-[#2d7a5e]/20 transition-colors"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição breve"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">System Prompt</label>
              <textarea
                className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] min-h-[160px] resize-y focus:outline-none focus:border-[#2d7a5e] focus:ring-1 focus:ring-[#2d7a5e]/20 transition-colors"
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder="Prompt do sistema para a IA..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">
                  Temperatura: {form.temperatura.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperatura}
                  onChange={(e) => setForm({ ...form, temperatura: parseFloat(e.target.value) })}
                  className="w-full accent-[#2d7a5e]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">Modelo</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] transition-colors"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                >
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                  <option value="claude-opus-4-6">Claude Opus 4.6</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, ativo: !form.ativo })}
                className={`w-9 h-5 rounded-full transition-all duration-200 relative cursor-pointer ${
                  form.ativo ? 'bg-[#2d7a5e]' : 'bg-[#d5d0c8]'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                  form.ativo ? 'left-4' : 'left-0.5'
                }`} />
              </div>
              <span className="text-[13px] font-semibold text-[#4a4842]">Ativo</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={salvar}
                disabled={salvando}
                className="px-5 py-2 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => { setEditando(null); setCriando(false); }}
                className="px-4 py-2 text-[13px] text-[#9a9590] hover:text-[#4a4842] font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Area de teste */}
      <div className="bg-white rounded-2xl border border-[#ece8e1] p-6 space-y-4 mt-6">
        <h3 className="font-bold text-[#2d2a26] text-[14px]">Testar Configuração</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">Config</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] transition-colors"
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
            <label className="block text-[12px] font-bold text-[#4a4842] mb-1.5">Mensagem</label>
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e] focus:ring-1 focus:ring-[#2d7a5e]/20 transition-colors"
                value={testeMensagem}
                onChange={(e) => setTesteMensagem(e.target.value)}
                placeholder="Digite uma mensagem de teste..."
                onKeyDown={(e) => e.key === 'Enter' && testar()}
              />
              <button
                onClick={testar}
                disabled={testando || !testeConfig || !testeMensagem}
                className="px-4 py-2 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {testando ? 'Enviando...' : 'Testar'}
              </button>
            </div>
          </div>
        </div>
        {testeResposta && (
          <div className="bg-[#f5f3ef] rounded-xl p-4 border border-[#ece8e1]">
            <p className="text-[11px] font-bold text-[#9a9590] uppercase tracking-wider mb-2">Resposta da IA:</p>
            <p className="text-[13px] text-[#2d2a26] whitespace-pre-wrap leading-relaxed">{testeResposta}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
