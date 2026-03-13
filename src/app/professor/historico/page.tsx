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
  trabalho: 'bg-primary-50/60 border-primary-200/50 text-primary-700',
  relacionamentos: 'bg-warm-50/60 border-warm-300/50 text-warm-700',
  financas: 'bg-primary-50/40 border-primary-100/50 text-primary-700',
};

const perfisEmocional: Record<string, { label: string; emoji: string }> = {
  A: { label: 'Muito fortalecido(a)', emoji: '💪' },
  B: { label: 'Esperançoso(a)', emoji: '🌟' },
  C: { label: 'Em alerta', emoji: '⚡' },
  D: { label: 'Cansado(a)', emoji: '😮‍💨' },
  E: { label: 'Sobrecarregado(a)', emoji: '🫂' },
};

const coresEstresse: Record<string, string> = {
  baixo: 'bg-emotion-strength/10 text-primary-800',
  moderado: 'bg-emotion-alert/10 text-primary-800',
  elevado: 'bg-emotion-overwhelm/10 text-primary-800',
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
    <div className="min-h-screen bg-warm-50 bg-organic">
      <Header titulo="Histórico" subtitulo="Suas jornadas anteriores">
        <button
          onClick={() => router.push('/professor')}
          className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-300"
        >
          Nova jornada
        </button>
      </Header>

      <main className="max-w-3xl mx-auto p-4 space-y-4 pb-8">
        {carregando ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-primary-300 text-sm mt-4 font-medium">Carregando histórico...</p>
          </div>
        ) : jornadas.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <p className="text-warm-500 mb-6 leading-relaxed">Você ainda não realizou nenhuma jornada.</p>
            <button onClick={() => router.push('/professor')} className="btn-primary">
              Iniciar minha primeira jornada
            </button>
          </div>
        ) : (
          <div className="stagger-children space-y-4">
            {jornadas.map((j) => {
              const aberta = expandida === j.id;
              const perfil = j.diagnostico ? perfisEmocional[j.diagnostico.perfilEmocional] : null;

              return (
                <div
                  key={j.id}
                  className="card transition-all duration-300 hover:shadow-warm-lg"
                >
                  <button
                    onClick={() => setExpandida(aberta ? null : j.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-2xl">
                          {iconesTipo[j.tipo] || '📋'}
                        </span>
                        <div>
                          <h3 className="font-bold text-primary-950">
                            {nomesJornada[j.tipo] || j.tipo}
                          </h3>
                          <p className="text-xs text-primary-400 font-medium mt-0.5">{formatarData(j.iniciadaEm)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {j.status === 'concluida' ? (
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${coresTipo[j.tipo]}`}>
                            Concluída
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-warm-100 text-warm-600">
                            Em andamento
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-primary-300 transition-transform duration-300 ${aberta ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      aberta ? 'max-h-[1000px] opacity-100 mt-5' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {j.diagnostico && (
                      <div className="pt-5 border-t border-primary-100/40 space-y-5">
                        {/* Perfil emocional */}
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center">
                            <span className="text-2xl">{perfil?.emoji}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-primary-950">{perfil?.label}</p>
                            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-xl mt-1 ${coresEstresse[j.diagnostico.nivelEstresse] || 'bg-warm-100 text-warm-600'}`}>
                              Estresse: {j.diagnostico.nivelEstresse}
                            </span>
                          </div>
                        </div>

                        {/* Resumo */}
                        {j.diagnostico.resumoIA && (
                          <div>
                            <h4 className="text-sm font-bold text-primary-800 mb-2">Resumo</h4>
                            <p className="text-sm text-warm-600 leading-relaxed">{j.diagnostico.resumoIA}</p>
                          </div>
                        )}

                        {/* Pontos de atenção */}
                        {j.diagnostico.pontosAtencao && (
                          <div>
                            <h4 className="text-sm font-bold text-primary-800 mb-2">Pontos de atenção</h4>
                            <ul className="space-y-2">
                              {(() => {
                                try {
                                  return (JSON.parse(j.diagnostico.pontosAtencao) as string[]).map((p, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-warm-600">
                                      <span className="flex-shrink-0 w-5 h-5 rounded-lg bg-emotion-alert/10 flex items-center justify-center text-emotion-alert text-[10px] font-bold mt-0.5">
                                        {i + 1}
                                      </span>
                                      <span className="leading-relaxed">{p}</span>
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
                          <div className="bg-primary-50/60 rounded-2xl p-5 border border-primary-100/40">
                            <h4 className="text-sm font-bold text-primary-800 mb-2">Recomendações</h4>
                            <p className="text-sm text-primary-700 leading-relaxed whitespace-pre-wrap">
                              {j.diagnostico.planoAcao}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {!j.diagnostico && j.status === 'em_andamento' && (
                      <div className="pt-5 border-t border-primary-100/40 text-center py-6">
                        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-3">
                          <span className="text-lg">💬</span>
                        </div>
                        <p className="text-sm text-warm-500 mb-4">Esta jornada ainda não foi finalizada.</p>
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
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
