'use client';

import { useState, useEffect } from 'react';
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
  Fortalecido: '#22c55e',
  Esperançoso: '#3b82f6',
  'Em alerta': '#eab308',
  Cansado: '#f97316',
  Sobrecarregado: '#ef4444',
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Erro ao carregar dados.</p>
      </div>
    );
  }

  const pieData = Object.entries(dados.distribuicaoEmocional)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const abas = [
    { id: 'visao_geral', label: 'Visão Geral' },
    { id: 'estresse', label: 'Estresse' },
    { id: 'emocional', label: 'Perfil Emocional' },
    { id: 'problemas', label: 'Problemas' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">EmpatIA — Painel de Gestão</h1>
            <p className="text-sm text-gray-500">Dashboard Administrativo</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin/professores" className="text-sm text-primary-600 hover:underline">
              Professores
            </a>
            <a href="/" className="text-sm text-gray-400 hover:text-gray-600">
              Sair
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Respondentes</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dados.totalProfessores}</p>
            <p className="text-xs text-gray-400">de {dados.totalProfessoresEscola} professores</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Jornadas</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dados.jornadasConcluidas}</p>
            <p className="text-xs text-gray-400">concluídas</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Taxa de Conclusão</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{(dados.taxaConclusao * 100).toFixed(0)}%</p>
          </div>
          <div className="card" style={{ borderLeft: `4px solid ${dados.irpe.cor}` }}>
            <p className="text-xs text-gray-500 uppercase tracking-wide">IRPE</p>
            <p className="text-2xl font-bold mt-1" style={{ color: dados.irpe.cor }}>
              {dados.irpe.valor.toFixed(2)}
            </p>
            <p className="text-xs" style={{ color: dados.irpe.cor }}>Risco {dados.irpe.nivel}</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wide">IBED</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{dados.ibedMedio.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Bem-estar médio</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {abas.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                abaAtiva === aba.id ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        {abaAtiva === 'visao_geral' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Perfil Emocional da Escola</h3>
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
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Radar de Estresse</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={dados.radarEstresse}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Estresse" dataKey="valor" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {abaAtiva === 'estresse' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Estresse por Dimensão</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={dados.radarEstresse} layout="vertical">
                <XAxis type="number" domain={[0, 10]} />
                <YAxis type="category" dataKey="dimensao" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="valor" fill="#f97316" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {abaAtiva === 'emocional' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Distribuição Emocional</h3>
            <div className="space-y-3">
              {Object.entries(dados.distribuicaoEmocional).map(([estado, qtd]) => {
                const total = Object.values(dados.distribuicaoEmocional).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (qtd / total) * 100 : 0;
                return (
                  <div key={estado} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-gray-600">{estado}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CORES_EMOCIONAL[estado] || '#94a3b8',
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">
                      {qtd} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {abaAtiva === 'problemas' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Top 5 Problemas Recorrentes</h3>
            {dados.topProblemas.length === 0 ? (
              <p className="text-gray-400 text-sm">Nenhum dado disponível ainda.</p>
            ) : (
              <div className="space-y-3">
                {dados.topProblemas.map((problema, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{problema}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
