'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Instituicao {
  id: string;
  nome: string;
  codigo: string | null;
  cidade: string | null;
  estado: string | null;
  ativa: boolean;
  criadoEm: string;
  professores: number;
  jornadasConcluidas: number;
}

export default function InstituicoesPage() {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semAcesso, setSemAcesso] = useState(false);
  const [criando, setCriando] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function carregar() {
    try {
      const res = await fetch('/api/admin/instituicoes');
      if (res.status === 403) {
        setSemAcesso(true);
        return;
      }
      const data = await res.json();
      setInstituicoes(data.instituicoes || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function criarInstituicao() {
    setErro('');
    if (!novoNome.trim()) {
      setErro('Informe o nome da instituição');
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch('/api/admin/instituicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoNome.trim(),
          codigo: novoCodigo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao criar instituição');
        return;
      }
      setNovoNome('');
      setNovoCodigo('');
      setCriando(false);
      await carregar();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtiva(inst: Instituicao) {
    await fetch(`/api/admin/instituicoes/${inst.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !inst.ativa }),
    });
    await carregar();
  }

  async function copiarLink(codigo: string) {
    const link = `${window.location.origin}/cadastro?codigo=${encodeURIComponent(codigo)}`;
    await navigator.clipboard.writeText(link);
    setCopiado(codigo);
    setTimeout(() => setCopiado(null), 2000);
  }

  if (carregando) {
    return (
      <AdminLayout titulo="Instituições" subtitulo="Códigos de acesso e uso por instituição">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (semAcesso) {
    return (
      <AdminLayout titulo="Instituições" subtitulo="Códigos de acesso e uso por instituição">
        <div className="flex items-center justify-center py-32">
          <div className="bg-white rounded-2xl border border-[#ece8e1] px-8 py-10 text-center max-w-md">
            <p className="text-[#5c5852] font-semibold">Acesso restrito</p>
            <p className="text-[#9a9590] text-sm mt-1.5">
              Só a equipe EmpatIA (superadmin) gerencia instituições.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titulo="Instituições" subtitulo="Códigos de acesso e uso por instituição">
      <div className="space-y-6">
        {/* Criar */}
        <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
          {!criando ? (
            <button onClick={() => setCriando(true)} className="btn-primary">
              Nova instituição
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-[#3d3935]">Nova instituição</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#5c5852] mb-1.5">Nome</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Descomplica"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#5c5852] mb-1.5">
                    Código <span className="font-normal text-[#9a9590]">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input uppercase tracking-wide"
                    placeholder="Geramos um se deixar vazio"
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl border border-red-100">
                  {erro}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCriando(false);
                    setErro('');
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button onClick={criarInstituicao} disabled={salvando} className="btn-primary">
                  {salvando ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        {instituicoes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#ece8e1] px-8 py-10 text-center">
            <p className="text-[#9a9590] font-medium">Nenhuma instituição cadastrada ainda.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#ece8e1] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ece8e1] text-left text-[#9a9590]">
                    <th className="px-6 py-3 font-semibold">Instituição</th>
                    <th className="px-6 py-3 font-semibold">Código</th>
                    <th className="px-6 py-3 font-semibold text-right">Professores</th>
                    <th className="px-6 py-3 font-semibold text-right">Jornadas</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {instituicoes.map((inst) => (
                    <tr key={inst.id} className="border-b border-[#f5f2ee] last:border-0">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[#3d3935]">{inst.nome}</p>
                        {(inst.cidade || inst.estado) && (
                          <p className="text-[#9a9590] text-xs mt-0.5">
                            {[inst.cidade, inst.estado].filter(Boolean).join(' — ')}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {inst.codigo ? (
                          <code className="bg-[#f5f2ee] text-[#3d3935] px-2.5 py-1 rounded-lg font-mono text-xs">
                            {inst.codigo}
                          </code>
                        ) : (
                          <span className="text-[#c4bfb8] text-xs italic">sem código</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#3d3935]">
                        {inst.professores}
                      </td>
                      <td className="px-6 py-4 text-right text-[#5c5852]">{inst.jornadasConcluidas}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            inst.ativa ? 'bg-[#e8f4ee] text-[#2d7a5e]' : 'bg-[#f5f2ee] text-[#9a9590]'
                          }`}
                        >
                          {inst.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {inst.codigo && (
                            <button
                              onClick={() => copiarLink(inst.codigo!)}
                              className="text-[#2d7a5e] font-semibold text-xs hover:underline"
                            >
                              {copiado === inst.codigo ? 'Copiado!' : 'Copiar link'}
                            </button>
                          )}
                          <button
                            onClick={() => alternarAtiva(inst)}
                            className="text-[#9a9590] font-semibold text-xs hover:underline"
                          >
                            {inst.ativa ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-[#9a9590] text-sm">
          Desativar bloqueia novos cadastros com o código. Quem já entrou continua com acesso, e as
          métricas seguem no dashboard.
        </p>
      </div>
    </AdminLayout>
  );
}
