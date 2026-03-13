'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdminNav from '@/components/AdminNav';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface DadosDash {
  totalProfessores: number;
  totalProfessoresEscola: number;
  jornadasConcluidas: number;
  taxaConclusao: number;
  irpe: { valor: number; nivel: string; cor: string };
  distribuicaoEmocional: Record<string, number>;
  radarEstresse: { dimensao: string; valor: number }[];
  topProblemas: string[];
  ibedMedio: number;
}

const CORES_EMOCIONAL: Record<string, string> = {
  Fortalecido: '#4ade80',
  Esperancoso: '#60a5fa',
  'Em alerta': '#fbbf24',
  Cansado: '#fb923c',
  Sobrecarregado: '#f87171',
};

export default function AdminDashboard() {
  const [dados, setDados] = useState<DadosDash | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('visao_geral');

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDados(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-primary-400 text-sm font-medium font-[Nunito]">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center">
        <div className="card text-center px-8 py-10 animate-fade-in">
          <p className="text-warm-500 font-medium font-[Nunito]">Erro ao carregar dados.</p>
        </div>
      </div>
    );
  }

  const pieData = Object.entries(dados.distribuicaoEmocional)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const abas = [
    { id: 'visao_geral', label: 'Visao Geral', icon: '🏠' },
    { id: 'estresse', label: 'Estresse', icon: '📊' },
    { id: 'emocional', label: 'Perfil Emocional', icon: '💜' },
    { id: 'problemas', label: 'Problemas', icon: '🔍' },
  ];

  return (
    <div className="min-h-screen bg-organic font-[Nunito]">
      <Header titulo="EmpatIA — Painel de Gestao" subtitulo="Dashboard Administrativo" />

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <AdminNav />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          <div className="bg-primary-50/60 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-5 animate-slide-up hover:shadow-warm transition-shadow duration-300">
            <p className="text-xs text-primary-500 uppercase tracking-wider font-bold">Respondentes</p>
            <p className="text-3xl font-extrabold text-primary-800 mt-2">{dados.totalProfessores}</p>
            <p className="text-xs text-primary-400 mt-1">de {dados.totalProfessoresEscola} professores</p>
          </div>
          <div className="bg-primary-50/60 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-5 animate-slide-up hover:shadow-warm transition-shadow duration-300">
            <p className="text-xs text-primary-500 uppercase tracking-wider font-bold">Jornadas</p>
            <p className="text-3xl font-extrabold text-primary-800 mt-2">{dados.jornadasConcluidas}</p>
            <p className="text-xs text-primary-400 mt-1">concluidas</p>
          </div>
          <div className="bg-primary-50/60 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-5 animate-slide-up hover:shadow-warm transition-shadow duration-300">
            <p className="text-xs text-primary-500 uppercase tracking-wider font-bold">Taxa de Conclusao</p>
            <p className="text-3xl font-extrabold text-primary-800 mt-2">{(dados.taxaConclusao * 100).toFixed(0)}%</p>
          </div>
          <div
            className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-5 animate-slide-up hover:shadow-warm transition-shadow duration-300"
            style={{ borderLeft: `4px solid ${dados.irpe.cor}` }}
          >
            <p className="text-xs text-primary-500 uppercase tracking-wider font-bold">IRPE</p>
            <p className="text-3xl font-extrabold mt-2" style={{ color: dados.irpe.cor }}>
              {dados.irpe.valor.toFixed(2)}
            </p>
            <p className="text-xs font-semibold mt-1" style={{ color: dados.irpe.cor }}>
              Risco {dados.irpe.nivel}
            </p>
          </div>
          <div className="bg-primary-50/60 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-5 animate-slide-up hover:shadow-warm transition-shadow duration-300">
            <p className="text-xs text-primary-500 uppercase tracking-wider font-bold">IBED</p>
            <p className="text-3xl font-extrabold text-primary-800 mt-2">{dados.ibedMedio.toFixed(2)}</p>
            <p className="text-xs text-primary-400 mt-1">Bem-estar medio</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex flex-wrap gap-2 bg-primary-50/50 backdrop-blur-sm p-2 rounded-2xl w-fit border border-primary-100/30 shadow-warm-sm">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                abaAtiva === aba.id
                  ? 'bg-primary-600 text-white shadow-warm shadow-glow'
                  : 'text-primary-500 hover:text-primary-700 hover:bg-primary-100/60'
              }`}
            >
              <span className="mr-1.5">{aba.icon}</span>
              {aba.label}
            </button>
          ))}
        </div>

        {/* Conteudo das abas */}
        <div className="animate-fade-in">
          {abaAtiva === 'visao_geral' && (
            <div className="grid lg:grid-cols-2 gap-6 stagger-children">
              <div className="card animate-slide-up">
                <h3 className="font-bold text-primary-800 mb-4 text-lg">Perfil Emocional da Escola</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CORES_EMOCIONAL[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card animate-slide-up">
                <h3 className="font-bold text-primary-800 mb-4 text-lg">Radar de Estresse</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={dados.radarEstresse}>
                    <PolarGrid stroke="#e2d5f0" />
                    <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11, fill: '#7c5caa' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    <Radar name="Estresse" dataKey="valor" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {abaAtiva === 'estresse' && (
            <div className="card animate-slide-up">
              <h3 className="font-bold text-primary-800 mb-4 text-lg">Estresse por Dimensao</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={dados.radarEstresse} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis type="category" dataKey="dimensao" width={150} tick={{ fontSize: 12, fill: '#7c5caa' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(167,139,250,0.3)',
                      boxShadow: '0 4px 20px rgba(124,92,170,0.1)',
                    }}
                  />
                  <Bar dataKey="valor" fill="#a78bfa" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {abaAtiva === 'emocional' && (
            <div className="card animate-slide-up">
              <h3 className="font-bold text-primary-800 mb-6 text-lg">Distribuicao Emocional</h3>
              <div className="space-y-4">
                {Object.entries(dados.distribuicaoEmocional).map(([estado, qtd]) => {
                  const total = Object.values(dados.distribuicaoEmocional).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? (qtd / total) * 100 : 0;
                  return (
                    <div key={estado} className="flex items-center gap-4">
                      <span className="w-36 text-sm text-primary-700 font-semibold">{estado}</span>
                      <div className="flex-1 bg-primary-50 rounded-full h-7 overflow-hidden border border-primary-100/50">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CORES_EMOCIONAL[estado] || '#94a3b8',
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary-700 w-20 text-right">
                        {qtd} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {abaAtiva === 'problemas' && (
            <div className="card animate-slide-up">
              <h3 className="font-bold text-primary-800 mb-6 text-lg">Top 5 Problemas Recorrentes</h3>
              {dados.topProblemas.length === 0 ? (
                <p className="text-primary-400 text-sm font-medium">Nenhum dado disponivel ainda.</p>
              ) : (
                <div className="space-y-3 stagger-children">
                  {dados.topProblemas.map((problema, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-primary-50/60 rounded-2xl border border-primary-100/40 hover:shadow-warm-sm transition-all duration-300 animate-slide-up"
                    >
                      <span className="w-9 h-9 bg-primary-200/60 text-primary-700 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-primary-800 font-medium">{problema}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
