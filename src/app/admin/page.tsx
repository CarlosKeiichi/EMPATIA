'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, Area, AreaChart,
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
  ibedDiferencaMedia: number;
  duracaoMedia: number;
  taxaRetorno7d: number;
  taxaAbandono: number;
  tendenciaConclusao: { semana: string; taxa: number; total: number }[];
  alertas: Alerta[];
  // Relacionamentos
  irpr: { valor: number; nivel: string; cor: string } | null;
  ieMedia: { pontuacao: number; classificacao: string; nivel: string; media: number } | null;
  distribuicaoEstiloComunicacao: Record<string, number> | null;
  percentualBurnoutElevado: number | null;
}

const CORES_EMOCIONAL: Record<string, string> = {
  Fortalecido: '#34d399',
  Esperancoso: '#60a5fa',
  'Em alerta': '#fbbf24',
  Cansado: '#fb923c',
  Sobrecarregado: '#f87171',
};

const CORES_EMOCIONAL_SOFT: Record<string, string> = {
  Fortalecido: 'rgba(52, 211, 153, 0.12)',
  Esperancoso: 'rgba(96, 165, 250, 0.12)',
  'Em alerta': 'rgba(251, 191, 36, 0.12)',
  Cansado: 'rgba(251, 146, 60, 0.12)',
  Sobrecarregado: 'rgba(248, 113, 113, 0.12)',
};

const EMOJI_EMOCIONAL: Record<string, string> = {
  Fortalecido: '\uD83D\uDCAA',
  Esperancoso: '\uD83C\uDF1F',
  'Em alerta': '\u26A1',
  Cansado: '\uD83D\uDE2E\u200D\uD83D\uDCA8',
  Sobrecarregado: '\uD83D\uDD34',
};

const CORES_ESTILO: Record<string, string> = {
  assertivo: '#34d399',
  passivo: '#60a5fa',
  agressivo: '#f87171',
  passivo_agressivo: '#fb923c',
};

const LABELS_ESTILO: Record<string, string> = {
  assertivo: 'Assertivo',
  passivo: 'Passivo',
  agressivo: 'Agressivo',
  passivo_agressivo: 'Passivo-Agressivo',
};

type AbaJornada = 'geral' | 'trabalho' | 'relacionamentos';

const ABAS: { id: AbaJornada; label: string }[] = [
  { id: 'geral', label: 'Visao Geral' },
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'relacionamentos', label: 'Relacionamentos' },
];

// Insight messages per level
function getInsightMessage(indice: string, valor: number, nivel: string): string {
  const prefix = `O ${indice} da escola e ${valor.toFixed(2)} — nivel ${nivel}.`;
  switch (nivel) {
    case 'baixo':
      return `${prefix} Reforcar boas praticas e oferecer escuta.`;
    case 'moderado':
      return `${prefix} Promover rodas de conversa, escuta ativa, sensibilizacao.`;
    case 'alto':
      return `${prefix} Implementar programa de apoio emocional, escuta com psicologo.`;
    case 'critico':
    case 'crítico':
      return `${prefix} Encaminhar plano de intervencao com urgencia, articulacao com equipe de saude mental.`;
    default:
      return prefix;
  }
}

// Custom tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="admin-tooltip">
      {label && <p className="text-[11px] text-white/50 font-semibold mb-1.5">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-[13px] font-bold text-white">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 ring-2 ring-white/20" style={{ backgroundColor: p.color || '#34d399' }} />
          {p.name === 'taxa' ? `${(p.value * 100).toFixed(0)}%` : p.value}
          <span className="text-white/40 font-medium ml-1 text-[11px]">
            {p.name === 'taxa' ? 'conclusao' : p.name === 'total' ? 'jornadas' : ''}
          </span>
        </p>
      ))}
    </div>
  );
}

// IRPE/IRPR Gauge (reutilizavel)
function IndexGauge({ valor, nivel, cor, label, gradientId }: { valor: number; nivel: string; cor: string; label: string; gradientId: string }) {
  const angle = valor * 180;
  const endAngle = -90 + angle;
  const rad = (endAngle * Math.PI) / 180;
  const needleX = 50 + 35 * Math.cos(rad);
  const needleY = 55 + 35 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 62" className="w-full max-w-[200px]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="35%" stopColor="#a3e635" />
            <stop offset="55%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id={`${gradientId}Glow`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#f0ede8"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Needle with glow */}
        <line
          x1="50"
          y1="55"
          x2={needleX}
          y2={needleY}
          stroke={cor}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter={`url(#${gradientId}Glow)`}
        />
        <circle cx="50" cy="55" r="4" fill="white" stroke={cor} strokeWidth="2" />
      </svg>
      <div className="text-center mt-0.5">
        <p className="text-3xl font-black tracking-tight" style={{ color: cor }}>{valor.toFixed(2)}</p>
        <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: cor }}>
          {label} {nivel}
        </p>
      </div>
    </div>
  );
}

// KPI Card
function KPICard({ label, valor, sub, cor, icon, trend }: {
  label: string;
  valor: string | number;
  sub?: string | null;
  cor?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const accent = cor || '#2d7a5e';
  return (
    <div className="admin-card group">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accent}12, ${accent}22)` }}
        >
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
            trend === 'up' ? 'bg-emerald-50/80 text-emerald-600 ring-1 ring-emerald-200/50' :
            trend === 'down' ? 'bg-red-50/80 text-red-500 ring-1 ring-red-200/50' :
            'bg-gray-50/80 text-gray-400 ring-1 ring-gray-200/50'
          }`}>
            {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2014'}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[#9a9590] uppercase tracking-wider font-bold">{label}</p>
      <p className="text-[28px] font-black mt-0.5 leading-none tracking-tight" style={{ color: accent }}>
        {valor}
      </p>
      {sub && (
        <p className="text-[11.5px] text-[#b5b0a8] mt-1.5 font-medium">
          {sub}
        </p>
      )}
    </div>
  );
}

// Chart wrapper
function ChartCard({ title, subtitle, children, className = '' }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`admin-card ${className}`}>
      <div className="mb-5">
        <h3 className="text-[15px] font-extrabold text-[#2d2a26] tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-[#9a9590] mt-0.5 font-medium">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// Insight banner below gauges
function InsightBanner({ message, cor }: { message: string; cor: string }) {
  return (
    <div
      className="mt-3 px-4 py-3 rounded-xl text-[12px] font-semibold leading-snug backdrop-blur-sm"
      style={{
        background: `linear-gradient(135deg, ${cor}10, ${cor}18)`,
        color: cor,
        borderLeft: `3px solid ${cor}`,
        boxShadow: `0 2px 8px ${cor}08`,
      }}
    >
      {message}
    </div>
  );
}

export default function AdminDashboard() {
  const [dados, setDados] = useState<DadosDash | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaJornada>('geral');

  const carregarDados = useCallback(async (jornada?: string) => {
    setCarregando(true);
    try {
      const url = jornada && jornada !== 'geral'
        ? `/api/dashboard?jornada=${jornada}`
        : '/api/dashboard';
      const res = await fetch(url);
      const data = await res.json();
      setDados(data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados(abaAtiva);
  }, [abaAtiva, carregarDados]);

  if (carregando) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Visao geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-[3px] border-[#e8f5ee] rounded-full" />
              <div className="absolute inset-0 border-[3px] border-transparent border-t-[#2d7a5e] rounded-full animate-spin" />
            </div>
            <p className="text-[#9a9590] text-sm font-semibold">Carregando painel...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dados) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Visao geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="admin-card px-10 py-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            </div>
            <p className="text-[#2d2a26] font-bold">Erro ao carregar dados</p>
            <p className="text-[#9a9590] text-sm mt-1">Verifique a conexao e tente novamente.</p>
            <button onClick={() => carregarDados(abaAtiva)} className="mt-4 px-5 py-2 bg-[#2d7a5e] text-white text-sm font-bold rounded-xl hover:bg-[#24674f] transition-colors">
              Tentar novamente
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pieData = Object.entries(dados.distribuicaoEmocional)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const totalEmocional = Object.values(dados.distribuicaoEmocional).reduce((a, b) => a + b, 0);

  return (
    <AdminLayout titulo="Dashboard" subtitulo="Visao geral da plataforma">
      {/* Abas de jornada */}
      <div className="flex gap-1 rounded-xl p-1 w-fit mb-6" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 1px 3px rgba(45,42,38,0.04)' }}>
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
              abaAtiva === aba.id
                ? 'text-white shadow-md'
                : 'text-[#9a9590] hover:text-[#4a6b5d] hover:bg-white/50'
            }`}
            style={abaAtiva === aba.id ? { background: 'linear-gradient(135deg, #2d7a5e, #34d399)' } : undefined}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Alertas */}
      {dados.alertas && dados.alertas.length > 0 && (
        <div className="space-y-3 mb-7 animate-fade-in">
          {dados.alertas.map((alerta, i) => (
            <div
              key={i}
              className={`flex items-start gap-3.5 px-5 py-4 rounded-2xl border backdrop-blur-sm ${
                alerta.tipo === 'critico'
                  ? 'bg-gradient-to-r from-red-50 to-red-50/50 border-red-200/60 text-red-800'
                  : 'bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200/60 text-amber-800'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                alerta.tipo === 'critico' ? 'bg-red-100' : 'bg-amber-100'
              }`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 9v4m0 4h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider opacity-70 mb-0.5">
                  {alerta.tipo === 'critico' ? 'Alerta Critico' : 'Atencao'}
                </p>
                <p className="text-[13px] font-semibold leading-snug">{alerta.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== ABA RELACIONAMENTOS ==================== */}
      {abaAtiva === 'relacionamentos' ? (
        <DashboardRelacionamentos dados={dados} totalEmocional={totalEmocional} pieData={pieData} />
      ) : (
        /* ==================== ABA GERAL / TRABALHO ==================== */
        <DashboardGeralTrabalho dados={dados} totalEmocional={totalEmocional} pieData={pieData} abaAtiva={abaAtiva} carregarDados={() => carregarDados(abaAtiva)} />
      )}
    </AdminLayout>
  );
}

// ==================== DASHBOARD GERAL / TRABALHO ====================
function DashboardGeralTrabalho({ dados, totalEmocional, pieData, abaAtiva, carregarDados }: {
  dados: DadosDash;
  totalEmocional: number;
  pieData: { name: string; value: number }[];
  abaAtiva: AbaJornada;
  carregarDados: () => void;
}) {
  return (
    <>
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger-children">
        <KPICard
          label="Respondentes"
          valor={dados.totalProfessores}
          sub={`de ${dados.totalProfessoresEscola} professores`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <KPICard
          label="Jornadas"
          valor={dados.jornadasConcluidas}
          sub="concluidas"
          cor="#3b82f6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <KPICard
          label="Taxa Conclusao"
          valor={`${(dados.taxaConclusao * 100).toFixed(0)}%`}
          sub={dados.taxaConclusao >= 0.7 ? 'Boa adesao' : 'Adesao baixa'}
          cor={dados.taxaConclusao >= 0.7 ? '#2d7a5e' : '#fb923c'}
          trend={dados.taxaConclusao >= 0.7 ? 'up' : 'down'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
        />
        <KPICard
          label="IBED Medio"
          valor={dados.ibedMedio.toFixed(2)}
          sub={`Evolucao: ${dados.ibedDiferencaMedia > 0 ? '+' : ''}${dados.ibedDiferencaMedia.toFixed(1)}`}
          cor="#8b5cf6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
        <KPICard
          label="Duracao Media"
          valor={`${dados.duracaoMedia}min`}
          sub="por jornada"
          cor="#06b6d4"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        />
        <KPICard
          label="Retorno 7d"
          valor={`${(dados.taxaRetorno7d * 100).toFixed(0)}%`}
          sub="voltaram em 7 dias"
          cor="#10b981"
          trend={dados.taxaRetorno7d >= 0.3 ? 'up' : 'neutral'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>}
        />
        <KPICard
          label="Taxa Abandono"
          valor={`${(dados.taxaAbandono * 100).toFixed(0)}%`}
          sub="nao concluiram"
          cor={dados.taxaAbandono > 0.3 ? '#ef4444' : '#9a9590'}
          trend={dados.taxaAbandono > 0.3 ? 'down' : 'neutral'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.88 9.88a3 3 0 104.24 4.24M10.73 5.08A10.43 10.43 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 002 12s3 7 10 7a9.74 9.74 0 005.39-1.61M1 1l22 22"/></svg>}
        />
        <div className="admin-card flex flex-col items-center justify-center">
          <IndexGauge valor={dados.irpe.valor} nivel={dados.irpe.nivel} cor={dados.irpe.cor} label="Risco" gradientId="gaugeGradIRPE" />
          <InsightBanner message={getInsightMessage('IRPE', dados.irpe.valor, dados.irpe.nivel)} cor={dados.irpe.cor} />
        </div>
      </div>

      {/* Main charts row */}
      <div className="grid lg:grid-cols-5 gap-4 mb-4 stagger-children">
        <ChartCard title="Perfil Emocional" subtitle="Distribuicao dos professores" className="lg:col-span-3">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="w-full lg:w-[45%]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <filter id="pieShadow">
                      <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CORES_EMOCIONAL[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" className="fill-[#2d2a26] text-[22px] font-black">
                    {totalEmocional}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" className="fill-[#9a9590] text-[10px] font-semibold">
                    professores
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5 w-full">
              {Object.entries(dados.distribuicaoEmocional).map(([estado, qtd]) => {
                const pct = totalEmocional > 0 ? (qtd / totalEmocional) * 100 : 0;
                return (
                  <div key={estado} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{EMOJI_EMOCIONAL[estado] || '\u25CF'}</span>
                        <span className="text-[12.5px] text-[#4a4842] font-bold">{estado}</span>
                      </div>
                      <span className="text-[12px] font-extrabold" style={{ color: CORES_EMOCIONAL[estado] }}>
                        {qtd} <span className="text-[#b5b0a8] font-semibold">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#f5f3ef] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${CORES_EMOCIONAL[estado] || '#94a3b8'}, ${CORES_EMOCIONAL[estado] || '#94a3b8'}cc)`,
                          boxShadow: `0 0 8px ${CORES_EMOCIONAL[estado] || '#94a3b8'}30`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Radar de Estresse" subtitle="Pontuacao por dimensao" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={dados.radarEstresse} cx="50%" cy="50%" outerRadius="72%">
              <defs>
                <radialGradient id="radarGradGreen" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#2d7a5e" stopOpacity={0.06} />
                </radialGradient>
              </defs>
              <PolarGrid stroke="#e4e0d8" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimensao"
                tick={{ fontSize: 10, fill: '#7a7a72', fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
              <Radar
                name="Estresse"
                dataKey="valor"
                stroke="#2d7a5e"
                fill="url(#radarGradGreen)"
                fillOpacity={1}
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#fff', stroke: '#2d7a5e', strokeWidth: 2 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Second charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4 stagger-children">
        <ChartCard title="Tendencia de Conclusao" subtitle="Taxa semanal nas ultimas 8 semanas">
          {dados.tendenciaConclusao && dados.tendenciaConclusao.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dados.tendenciaConclusao}>
                <defs>
                  <linearGradient id="gradientConclusao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.28} />
                    <stop offset="50%" stopColor="#2d7a5e" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#2d7a5e" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowGreen">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: '#9a9590', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: '#9a9590' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="taxa"
                  stroke="#2d7a5e"
                  strokeWidth={2.5}
                  fill="url(#gradientConclusao)"
                  dot={{ fill: '#fff', stroke: '#2d7a5e', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#2d7a5e', stroke: '#fff', strokeWidth: 3, r: 7, filter: 'url(#glowGreen)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[#b5b0a8] text-sm font-medium">
              Dados insuficientes para exibir tendencia
            </div>
          )}
        </ChartCard>

        <ChartCard title="Estresse por Dimensao" subtitle="Pontuacao media (0-10)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dados.radarEstresse} layout="vertical" barCategoryGap={8}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2d7a5e" stopOpacity={0.9} />
                  <stop offset="60%" stopColor="#34d399" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <XAxis
                type="number"
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: '#9a9590' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="dimensao"
                width={120}
                tick={{ fontSize: 11.5, fill: '#4a4842', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="valor"
                fill="url(#barGrad)"
                radius={[0, 6, 6, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-5 gap-4 stagger-children">
        <ChartCard title="Problemas Recorrentes" subtitle="Top 5 mais reportados" className="lg:col-span-3">
          {dados.topProblemas.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-[#b5b0a8] text-sm font-medium">
              Nenhum dado disponivel ainda
            </div>
          ) : (
            <div className="space-y-2">
              {dados.topProblemas.map((problema, i) => {
                const intensidade = 1 - (i * 0.15);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-[#ece8e1] hover:bg-[#faf8f5] transition-all duration-200 group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{
                        backgroundColor: `rgba(45, 122, 94, ${intensidade * 0.12})`,
                        color: `rgba(45, 122, 94, ${intensidade})`,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#2d2a26] font-semibold truncate">{problema}</p>
                    </div>
                    <div className="w-16 h-1.5 bg-[#f0ede8] rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-[#2d7a5e] transition-all duration-700"
                        style={{ width: `${intensidade * 100}%`, opacity: intensidade }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="admin-card">
            <h3 className="text-[13px] font-extrabold text-[#2d2a26] tracking-tight mb-3">Resumo Rapido</h3>
            <div className="space-y-3">
              {Object.entries(dados.distribuicaoEmocional)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([estado, qtd]) => {
                  const pct = totalEmocional > 0 ? (qtd / totalEmocional) * 100 : 0;
                  return (
                    <div
                      key={estado}
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                      style={{ backgroundColor: CORES_EMOCIONAL_SOFT[estado] }}
                    >
                      <span className="text-lg">{EMOJI_EMOCIONAL[estado] || '\u25CF'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#2d2a26]">{estado}</p>
                        <p className="text-[11px] text-[#9a9590] font-medium">{qtd} prof. — {pct.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="admin-card text-center">
            <p className="text-[11px] text-[#9a9590] uppercase tracking-wider font-bold mb-2">Engajamento Geral</p>
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="engajGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2d7a5e" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f0ede8" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="url(#engajGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${dados.taxaConclusao * 97.4} 97.4`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[17px] font-black text-[#2d2a26]">
                  {(dados.taxaConclusao * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-[11.5px] text-[#9a9590] font-medium">
              {dados.taxaConclusao >= 0.7 ? 'Excelente' : dados.taxaConclusao >= 0.4 ? 'Moderado' : 'Precisa melhorar'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== DASHBOARD RELACIONAMENTOS ====================
function DashboardRelacionamentos({ dados, totalEmocional, pieData }: {
  dados: DadosDash;
  totalEmocional: number;
  pieData: { name: string; value: number }[];
}) {
  // Estilo comunicacao pie data
  const estiloPieData = dados.distribuicaoEstiloComunicacao
    ? Object.entries(dados.distribuicaoEstiloComunicacao)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];
  const totalEstilo = estiloPieData.reduce((a, b) => a + b.value, 0);

  // Radar relacional: filtrar apenas blocos de relacionamento
  const blocosRel = ['Autocuidado', 'Vinculos Familiares', 'Rede de Apoio', 'Satisfacao Geral'];
  const radarRelacional = dados.radarEstresse.filter((r) =>
    blocosRel.some((b) => r.dimensao.toLowerCase().includes(b.toLowerCase().slice(0, 6)))
  );
  // Se radar vazio, usar todos os dados de estresse disponíveis
  const radarData = radarRelacional.length > 0 ? radarRelacional : dados.radarEstresse;

  return (
    <>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger-children">
        <KPICard
          label="Respondentes"
          valor={dados.totalProfessores}
          sub={`de ${dados.totalProfessoresEscola} professores`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <KPICard
          label="Jornadas"
          valor={dados.jornadasConcluidas}
          sub="relacionamentos concluidas"
          cor="#3b82f6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
        />
        <KPICard
          label="IE Media"
          valor={dados.ieMedia ? dados.ieMedia.media.toFixed(0) : '--'}
          sub={dados.ieMedia ? dados.ieMedia.classificacao : 'Sem dados'}
          cor={dados.ieMedia?.nivel === 'alta' ? '#22c55e' : dados.ieMedia?.nivel === 'media' ? '#f59e0b' : '#ef4444'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2a10 10 0 0110 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>}
        />
        <KPICard
          label="Burnout Elevado"
          valor={dados.percentualBurnoutElevado !== null ? `${(dados.percentualBurnoutElevado * 100).toFixed(0)}%` : '--'}
          sub="risco elevado/critico"
          cor={dados.percentualBurnoutElevado !== null && dados.percentualBurnoutElevado > 0.3 ? '#ef4444' : '#9a9590'}
          trend={dados.percentualBurnoutElevado !== null && dados.percentualBurnoutElevado > 0.3 ? 'down' : 'neutral'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>}
        />
      </div>

      {/* IRPR Gauge + Radar Relacional */}
      <div className="grid lg:grid-cols-5 gap-4 mb-4 stagger-children">
        <ChartCard title="IRPR" subtitle="Indice Relacional de Professores e Rede" className="lg:col-span-2">
          {dados.irpr ? (
            <div>
              <IndexGauge valor={dados.irpr.valor} nivel={dados.irpr.nivel} cor={dados.irpr.cor} label="Risco" gradientId="gaugeGradIRPR" />
              <InsightBanner message={getInsightMessage('IRPR', dados.irpr.valor, dados.irpr.nivel)} cor={dados.irpr.cor} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[#b5b0a8] text-sm font-medium">
              Dados insuficientes para calcular IRPR
            </div>
          )}
        </ChartCard>

        <ChartCard title="Radar Relacional" subtitle="4 dimensoes do relacionamento" className="lg:col-span-3">
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <defs>
                  <radialGradient id="radarGradPurple" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.06} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke="#e4e0d8" strokeDasharray="3 3" />
                <PolarAngleAxis
                  dataKey="dimensao"
                  tick={{ fontSize: 10, fill: '#7a7a72', fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  name="Estresse"
                  dataKey="valor"
                  stroke="#8b5cf6"
                  fill="url(#radarGradPurple)"
                  fillOpacity={1}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[#b5b0a8] text-sm font-medium">
              Sem dados de radar relacional
            </div>
          )}
        </ChartCard>
      </div>

      {/* Estilo de Comunicacao + IE Gauge */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4 stagger-children">
        <ChartCard title="Estilo de Comunicacao" subtitle="Distribuicao predominante">
          {estiloPieData.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-[45%]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={estiloPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    >
                      {estiloPieData.map((entry) => (
                        <Cell key={entry.name} fill={CORES_ESTILO[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" className="fill-[#2d2a26] text-[20px] font-black">
                      {totalEstilo}
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" className="fill-[#9a9590] text-[10px] font-semibold">
                      respostas
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                {Object.entries(dados.distribuicaoEstiloComunicacao || {}).map(([estilo, qtd]) => {
                  const pct = totalEstilo > 0 ? (qtd / totalEstilo) * 100 : 0;
                  return (
                    <div key={estilo} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12.5px] text-[#4a4842] font-bold">{LABELS_ESTILO[estilo] || estilo}</span>
                        <span className="text-[12px] font-extrabold" style={{ color: CORES_ESTILO[estilo] }}>
                          {qtd} <span className="text-[#b5b0a8] font-semibold">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-[#f5f3ef] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: CORES_ESTILO[estilo] || '#94a3b8',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[#b5b0a8] text-sm font-medium">
              Sem dados de estilo de comunicacao
            </div>
          )}
        </ChartCard>

        {/* IE Gauge */}
        <ChartCard title="Inteligencia Emocional" subtitle="Media geral (escala 15-75)">
          {dados.ieMedia ? (
            <div className="flex flex-col items-center">
              <div className="relative w-28 h-28 mx-auto mb-3">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="ieGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={dados.ieMedia.nivel === 'alta' ? '#22c55e' : dados.ieMedia.nivel === 'media' ? '#f59e0b' : '#ef4444'} />
                      <stop offset="100%" stopColor={dados.ieMedia.nivel === 'alta' ? '#86efac' : dados.ieMedia.nivel === 'media' ? '#fcd34d' : '#fca5a5'} />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f0ede8" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#ieGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${((dados.ieMedia.media - 15) / 60) * 97.4} 97.4`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[22px] font-black text-[#2d2a26]">
                    {dados.ieMedia.media.toFixed(0)}
                  </span>
                </div>
              </div>
              <p className="text-[13px] font-bold text-[#2d2a26]">{dados.ieMedia.classificacao}</p>
              <p className="text-[11px] text-[#9a9590] mt-1">de 75 pontos possiveis</p>

              {/* IE Faixas */}
              <div className="w-full mt-4 space-y-1.5">
                {[
                  { label: 'Alta (55-75)', min: 55, max: 75, cor: '#22c55e' },
                  { label: 'Media (35-54)', min: 35, max: 54, cor: '#f59e0b' },
                  { label: 'Baixa (15-34)', min: 15, max: 34, cor: '#ef4444' },
                ].map((faixa) => (
                  <div key={faixa.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: faixa.cor }} />
                    <span className="text-[11px] text-[#9a9590] font-medium flex-1">{faixa.label}</span>
                    {dados.ieMedia!.media >= faixa.min && dados.ieMedia!.media <= faixa.max && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${faixa.cor}18`, color: faixa.cor }}>
                        ATUAL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[#b5b0a8] text-sm font-medium">
              Sem dados de inteligencia emocional
            </div>
          )}
        </ChartCard>
      </div>

      {/* Bottom row: Top problemas + Perfil emocional */}
      <div className="grid lg:grid-cols-5 gap-4 stagger-children">
        <ChartCard title="Pontos de Atencao" subtitle="Top 5 relacionamentos" className="lg:col-span-3">
          {dados.topProblemas.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-[#b5b0a8] text-sm font-medium">
              Nenhum dado disponivel ainda
            </div>
          ) : (
            <div className="space-y-2">
              {dados.topProblemas.map((problema, i) => {
                const intensidade = 1 - (i * 0.15);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3.5 rounded-xl border border-transparent hover:border-[#ece8e1] hover:bg-[#faf8f5] transition-all duration-200 group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black flex-shrink-0"
                      style={{
                        backgroundColor: `rgba(139, 92, 246, ${intensidade * 0.12})`,
                        color: `rgba(139, 92, 246, ${intensidade})`,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#2d2a26] font-semibold truncate">{problema}</p>
                    </div>
                    <div className="w-16 h-1.5 bg-[#f0ede8] rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-[#8b5cf6] transition-all duration-700"
                        style={{ width: `${intensidade * 100}%`, opacity: intensidade }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        <div className="lg:col-span-2 space-y-4">
          {/* Perfil Emocional compacto */}
          <div className="admin-card">
            <h3 className="text-[13px] font-extrabold text-[#2d2a26] tracking-tight mb-3">Perfil Emocional</h3>
            <div className="space-y-3">
              {Object.entries(dados.distribuicaoEmocional)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([estado, qtd]) => {
                  const pct = totalEmocional > 0 ? (qtd / totalEmocional) * 100 : 0;
                  return (
                    <div
                      key={estado}
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-colors"
                      style={{ backgroundColor: CORES_EMOCIONAL_SOFT[estado] }}
                    >
                      <span className="text-lg">{EMOJI_EMOCIONAL[estado] || '\u25CF'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#2d2a26]">{estado}</p>
                        <p className="text-[11px] text-[#9a9590] font-medium">{qtd} prof. — {pct.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Engajamento */}
          <div className="admin-card text-center">
            <p className="text-[11px] text-[#9a9590] uppercase tracking-wider font-bold mb-2">Engajamento</p>
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="engajGradPurple" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f0ede8" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  stroke="url(#engajGradPurple)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${dados.taxaConclusao * 97.4} 97.4`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[17px] font-black text-[#2d2a26]">
                  {(dados.taxaConclusao * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-[11.5px] text-[#9a9590] font-medium">
              {dados.taxaConclusao >= 0.7 ? 'Excelente' : dados.taxaConclusao >= 0.4 ? 'Moderado' : 'Precisa melhorar'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
