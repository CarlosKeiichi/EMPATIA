'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Jornada {
  id: string;
  tipo: string;
  status: string;
  estadoEmocionalInicial: string | null;
  estadoEmocionalFinal: string | null;
  pontuacaoTotal: number | null;
  nivelRisco: string | null;
  iniciadaEm: string;
  concluidaEm: string | null;
  diagnostico: {
    perfilEmocional: string;
    nivelEstresse: string;
    resumoIA: string;
    planoAcao: string;
    pontosAtencao: string;
  } | null;
}

const nomesJornada: Record<string, string> = {
  trabalho: 'Trabalho',
  relacionamentos: 'Relacionamentos',
  financas: 'Finanças',
};

const iconesTipo: Record<string, string> = {
  trabalho: '🏫',
  relacionamentos: '💛',
  financas: '💰',
};

const coresTipo: Record<string, string> = {
  trabalho: 'bg-blue-50 border-blue-200 text-blue-700',
  relacionamentos: 'bg-amber-50 border-amber-200 text-amber-700',
  financas: 'bg-emerald-50 border-emerald-200 text-emerald-700',
};

const perfisEmocional: Record<string, { label: string; emoji: string }> = {
  A: { label: 'Muito fortalecido(a)', emoji: '💪' },
  B: { label: 'Esperançoso(a)', emoji: '🌟' },
  C: { label: 'Em alerta', emoji: '⚡' },
  D: { label: 'Cansado(a)', emoji: '😔' },
  E: { label: 'Sobrecarregado(a)', emoji: '🆘' },
};

const coresEstresse: Record<string, string> = {
  baixo: 'bg-green-100 text-green-700',
  moderado: 'bg-yellow-100 text-yellow-700',
  elevado: 'bg-red-100 text-red-700',
};

export default function HistoricoPage() {
  const router = useRouter();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandida, setExpandida] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/jornada')
      .then((r) => r.json())
      .then((d) => setJornadas(d.jornadas || []))
      .finally(() => setCarregando(false));
  }, []);

  function formatarData(data: string) {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Histórico" subtitulo="Suas jornadas anteriores">
        <button onClick={() => router.push('/professor')} className="text-sm text-primary-600 hover:underline">
          Nova jornada
        </button>
      </Header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {carregando ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm mt-2">Carregando histórico...</p>
          </div>
        ) : jornadas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">Você ainda não realizou nenhuma jornada.</p>
            <button onClick={() => router.push('/professor')} className="btn-primary">
              Iniciar minha primeira jornada
            </button>
          </div>
        ) : (
          jornadas.map((j) => {
            const aberta = expandida === j.id;
            const perfil = j.diagnostico ? perfisEmocional[j.diagnostico.perfilEmocional] : null;

            return (
              <div key={j.id} className="card">
                <button
                  onClick={() => setExpandida(aberta ? null : j.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{iconesTipo[j.tipo] || '📋'}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {nomesJornada[j.tipo] || j.tipo}
                        </h3>
                        <p className="text-xs text-gray-400">{formatarData(j.iniciadaEm)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {j.status === 'concluida' ? (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${coresTipo[j.tipo]}`}>
                          Concluída
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                          Em andamento
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${aberta ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {aberta && j.diagnostico && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    {/* Perfil emocional */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{perfil?.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{perfil?.label}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${coresEstresse[j.diagnostico.nivelEstresse] || 'bg-gray-100 text-gray-600'}`}>
                          Estresse: {j.diagnostico.nivelEstresse}
                        </span>
                      </div>
                    </div>

                    {/* Resumo */}
                    {j.diagnostico.resumoIA && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Resumo</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">{j.diagnostico.resumoIA}</p>
                      </div>
                    )}

                    {/* Pontos de atenção */}
                    {j.diagnostico.pontosAtencao && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Pontos de atenção</h4>
                        <ul className="space-y-1">
                          {(() => {
                            try {
                              return (JSON.parse(j.diagnostico.pontosAtencao) as string[]).map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                                  <span className="text-amber-500 mt-0.5">●</span>
                                  {p}
                                </li>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </ul>
                      </div>
                    )}

                    {/* Plano de ação */}
                    {j.diagnostico.planoAcao && (
                      <div className="bg-primary-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-primary-800 mb-1">Recomendações</h4>
                        <p className="text-sm text-primary-700 leading-relaxed whitespace-pre-wrap">
                          {j.diagnostico.planoAcao}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {aberta && !j.diagnostico && j.status === 'em_andamento' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-400 mb-3">Esta jornada ainda não foi finalizada.</p>
                    <button
                      onClick={() => {
                        sessionStorage.setItem('tipoJornada', j.tipo);
                        router.push('/professor/jornada');
                      }}
                      className="btn-primary text-sm"
                    >
                      Continuar jornada
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
