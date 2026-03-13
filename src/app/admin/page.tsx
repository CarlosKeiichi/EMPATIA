'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';

interface Alerta {
  tipo: 'critico' | 'aviso';
  mensagem: string;
}

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
  duracaoMedia: number;
  taxaRetorno7d: number;
  taxaAbandono: number;
  tendenciaConclusao: { semana: string; taxa: number; total: number }[];
  alertas: Alerta[];
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
      <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando painel...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dados) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="bg-white rounded-2xl border border-[#ece8e1] px-8 py-10 text-center">
            <p className="text-[#9a9590] font-medium">Erro ao carregar dados.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pieData = Object.entries(dados.distribuicaoEmocional)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const abas = [
    { id: 'visao_geral', label: 'Visão Geral' },
    { id: 'estresse', label: 'Estresse' },
    { id: 'emocional', label: 'Perfil Emocional' },
    { id: 'tendencia', label: 'Tendências' },
    { id: 'problemas', label: 'Problemas' },
  ];

  return (
    <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
      {/* Alertas */}
      {dados.alertas && dados.alertas.length > 0 && (
        <div className="space-y-3 mb-6">
          {dados.alertas.map((alerta, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${
                alerta.tipo === 'critico'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <span className="text-lg flex-shrink-0">
                {alerta.tipo === 'critico' ? '🚨' : '⚠️'}
              </span>
              <p className="text-sm font-medium">{alerta.mensagem}</p>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Respondentes', valor: dados.totalProfessores, sub: `de ${dados.totalProfessoresEscola} professores` },
          { label: 'Jornadas', valor: dados.jornadasConcluidas, sub: 'concluídas' },
          { label: 'Taxa Conclusão', valor: `${(dados.taxaConclusao * 100).toFixed(0)}%`, sub: null },
          { label: 'IRPE', valor: dados.irpe.valor.toFixed(2), sub: `Risco ${dados.irpe.nivel}`, cor: dados.irpe.cor },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-[#ece8e1] p-5 hover:shadow-sm transition-shadow duration-200"
            style={kpi.cor ? { borderLeft: `3px solid ${kpi.cor}` } : undefined}
          >
            <p className="text-[11px] text-[#9a9590] uppercase tracking-wider font-bold">{kpi.label}</p>
            <p className="text-2xl font-extrabold text-[#2d2a26] mt-1.5" style={kpi.cor ? { color: kpi.cor } : undefined}>
              {kpi.valor}
            </p>
            {kpi.sub && (
              <p className="text-[11px] text-[#b5b0a8] mt-0.5 font-medium" style={kpi.cor ? { color: kpi.cor } : undefined}>
                {kpi.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'IBED Médio', valor: dados.ibedMedio.toFixed(2), sub: 'Bem-estar' },
          { label: 'Duração Média', valor: `${dados.duracaoMedia}min`, sub: 'por jornada' },
          { label: 'Retorno 7 dias', valor: `${(dados.taxaRetorno7d * 100).toFixed(0)}%`, sub: 'voltaram em 7d' },
          {
            label: 'Taxa Abandono',
            valor: `${(dados.taxaAbandono * 100).toFixed(0)}%`,
            sub: 'não concluíram',
            cor: dados.taxaAbandono > 0.3 ? '#f87171' : undefined,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-2xl border border-[#ece8e1] p-5 hover:shadow-sm transition-shadow duration-200"
            style={kpi.cor ? { borderLeft: `3px solid ${kpi.cor}` } : undefined}
          >
            <p className="text-[11px] text-[#9a9590] uppercase tracking-wider font-bold">{kpi.label}</p>
            <p className="text-2xl font-extrabold text-[#2d2a26] mt-1.5" style={kpi.cor ? { color: kpi.cor } : undefined}>
              {kpi.valor}
            </p>
            {kpi.sub && (
              <p className="text-[11px] text-[#b5b0a8] mt-0.5 font-medium">
                {kpi.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-[#ece8e1] p-1 w-fit mb-6 overflow-x-auto">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 whitespace-nowrap ${
              abaAtiva === aba.id
                ? 'bg-[#2d7a5e] text-white shadow-sm'
                : 'text-[#9a9590] hover:text-[#4a6b5d] hover:bg-[#f5f3ef]'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {abaAtiva === 'visao_geral' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
              <h3 className="font-bold text-[#2d2a26] mb-4">Perfil Emocional da Escola</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
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
            <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
              <h3 className="font-bold text-[#2d2a26] mb-4">Radar de Estresse</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={dados.radarEstresse}>
                  <PolarGrid stroke="#e4e0d8" />
                  <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11, fill: '#7a7a72' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Estresse" dataKey="valor" stroke="#2d7a5e" fill="#2d7a5e" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {abaAtiva === 'estresse' && (
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <h3 className="font-bold text-[#2d2a26] mb-4">Estresse por Dimensão</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dados.radarEstresse} layout="vertical">
                <XAxis type="number" domain={[0, 10]} />
                <YAxis type="category" dataKey="dimensao" width={150} tick={{ fontSize: 12, fill: '#7a7a72' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #ece8e1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="valor" fill="#2d7a5e" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {abaAtiva === 'emocional' && (
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <h3 className="font-bold text-[#2d2a26] mb-6">Distribuição Emocional</h3>
            <div className="space-y-4">
              {Object.entries(dados.distribuicaoEmocional).map(([estado, qtd]) => {
                const total = Object.values(dados.distribuicaoEmocional).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (qtd / total) * 100 : 0;
                return (
                  <div key={estado} className="flex items-center gap-4">
                    <span className="w-36 text-sm text-[#4a4842] font-semibold">{estado}</span>
                    <div className="flex-1 bg-[#f5f3ef] rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: CORES_EMOCIONAL[estado] || '#94a3b8' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[#4a4842] w-20 text-right">
                      {qtd} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {abaAtiva === 'tendencia' && (
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <h3 className="font-bold text-[#2d2a26] mb-2">Tendência de Conclusão</h3>
            <p className="text-[#9a9590] text-sm mb-6">Taxa de conclusão por semana (últimas 8 semanas)</p>
            {dados.tendenciaConclusao && dados.tendenciaConclusao.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dados.tendenciaConclusao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ece8e1" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#9a9590' }} />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: '#9a9590' }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #ece8e1',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'taxa') return [`${(value * 100).toFixed(0)}%`, 'Taxa conclusão'];
                      return [value, 'Total jornadas'];
                    }}
                  />
                  <Line type="monotone" dataKey="taxa" stroke="#2d7a5e" strokeWidth={2.5} dot={{ fill: '#2d7a5e', r: 4 }} />
                  <Line type="monotone" dataKey="total" stroke="#9a9590" strokeWidth={1.5} strokeDasharray="5 5" dot={{ fill: '#9a9590', r: 3 }} yAxisId={0} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-[#9a9590] text-sm font-medium">Dados insuficientes para exibir tendência.</p>
            )}
          </div>
        )}

        {abaAtiva === 'problemas' && (
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <h3 className="font-bold text-[#2d2a26] mb-6">Top 5 Problemas Recorrentes</h3>
            {dados.topProblemas.length === 0 ? (
              <p className="text-[#9a9590] text-sm font-medium">Nenhum dado disponível ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {dados.topProblemas.map((problema, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-[#faf8f5] rounded-xl border border-[#ece8e1]/60 hover:border-[#d5d0c8] transition-colors duration-200"
                  >
                    <span className="w-8 h-8 bg-[#e8f5ee] text-[#2d7a5e] rounded-lg flex items-center justify-center text-sm font-extrabold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#2d2a26] font-medium">{problema}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
