'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import cloud from 'd3-cloud';
import {
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
  ipcs?: {
    media: number;
    zona: string;
    distribuicao: { sem_sinais: number; resistencia: number; estresse_elevado: number };
    totalProfessoresAvaliados: number;
  };
  distribuicaoEmocional: Record<string, number>;
  radarEstresse: { dimensao: string; valor: number }[];
  topProblemas: string[];
  nuvemPalavras?: { texto: string; contagem: number }[];
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
  Esperançoso: '#60a5fa',
  'Em alerta': '#fbbf24',
  Cansado: '#fb923c',
  Sobrecarregado: '#f87171',
};

const CORES_EMOCIONAL_SOFT: Record<string, string> = {
  Fortalecido: 'rgba(52, 211, 153, 0.12)',
  Esperançoso: 'rgba(96, 165, 250, 0.12)',
  'Em alerta': 'rgba(251, 191, 36, 0.12)',
  Cansado: 'rgba(251, 146, 60, 0.12)',
  Sobrecarregado: 'rgba(248, 113, 113, 0.12)',
};

const EMOJI_EMOCIONAL: Record<string, string> = {
  Fortalecido: '\uD83D\uDCAA',
  Esperançoso: '\uD83C\uDF1F',
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
  { id: 'geral', label: 'Visão Geral' },
  { id: 'trabalho', label: 'Trabalho' },
  { id: 'relacionamentos', label: 'Relacionamentos' },
];

// Insight messages per level
function getInsightMessage(indice: string, valor: number, nivel: string): string {
  const prefix = `O ${indice} da escola é ${valor.toFixed(2)} — nível ${nivel}.`;
  switch (nivel) {
    case 'baixo':
      return `${prefix} Reforçar boas práticas e oferecer escuta.`;
    case 'moderado':
      return `${prefix} Promover rodas de conversa, escuta ativa e sensibilização.`;
    case 'alto':
      return `${prefix} Implementar programa de apoio emocional, escuta com psicólogo.`;
    case 'critico':
    case 'crítico':
      return `${prefix} Encaminhar plano de intervenção com urgência, articulação com equipe de saúde mental.`;
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
          <span className="inline-block w-2 h-2 rounded-full mr-1.5 ring-2 ring-white/20" style={{ backgroundColor: p.color || '#a594d0' }} />
          {p.name === 'taxa' ? `${(p.value * 100).toFixed(0)}%` : p.value}
          <span className="text-white/40 font-medium ml-1 text-[11px]">
            {p.name === 'taxa' ? 'conclusão' : p.name === 'total' ? 'jornadas' : ''}
          </span>
        </p>
      ))}
    </div>
  );
}

// IRPE/IRPR Gauge (reutilizavel) — arco de 180° a 360° (esquerda → topo → direita)
function IndexGauge({ valor, nivel, cor, label, gradientId }: { valor: number; nivel: string; cor: string; label: string; gradientId: string }) {
  const pct = Math.max(0, Math.min(1, valor));
  // Sistema de ângulos do arco SVG: 180° = esquerda, 270° = topo, 360° = direita
  const angleDeg = 180 + pct * 180;
  const rad = (angleDeg * Math.PI) / 180;
  const needleLen = 32;
  const needleX = 50 + needleLen * Math.cos(rad);
  const needleY = 55 + needleLen * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 68" className="w-full max-w-[220px]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="30%" stopColor="#84cc16" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="75%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id={`${gradientId}Glow`}>
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Background arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#ede8f7"
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1="50"
          y1="55"
          x2={needleX}
          y2={needleY}
          stroke={cor}
          strokeWidth="2.8"
          strokeLinecap="round"
          filter={`url(#${gradientId}Glow)`}
        />
        <circle cx="50" cy="55" r="4" fill="white" stroke={cor} strokeWidth="2.2" />
        {/* Escala 0 e 1 */}
        <text x="10" y="66" fontSize="4.5" fill="#a99889" fontWeight="700" textAnchor="middle">0</text>
        <text x="90" y="66" fontSize="4.5" fill="#a99889" fontWeight="700" textAnchor="middle">1</text>
      </svg>
      <div className="text-center mt-1">
        <p className="text-3xl font-black tracking-tight" style={{ color: cor }}>{valor.toFixed(2)}</p>
        <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: cor }}>
          {label} {nivel}
        </p>
      </div>
    </div>
  );
}

// === INSIGHTS MARCIA — IA gera 3 insights curtos ===
interface InsightsMarciaData {
  dores: { resumo: string };
  planoAcao: { resumo: string; acoes: string[] };
  beneficios: { resumo: string };
  geradoEm: string;
  baseadoEm: { totalProfessores: number; totalJornadas: number; totalRespostas: number };
  fromCache?: boolean;
}

// Avatar SVG da Marci.A — vetorial, sem dependências
function MarciaAvatar({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-label="Marci.A" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="marcia-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(96% 0.025 290)" />
          <stop offset="1" stopColor="oklch(92% 0.04 310)" />
        </linearGradient>
        <clipPath id="marcia-clip"><circle cx="40" cy="40" r="40" /></clipPath>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#marcia-bg)" />
      <g clipPath="url(#marcia-clip)">
        <path d="M10 82 Q10 62 25 58 L55 58 Q70 62 70 82 Z" fill="oklch(55% 0.12 290)" />
        <path d="M25 58 Q40 68 55 58 L55 64 Q40 72 25 64 Z" fill="oklch(45% 0.13 290)" opacity="0.6" />
        <rect x="34" y="48" width="12" height="12" rx="2" fill="oklch(82% 0.04 50)" />
        <ellipse cx="40" cy="36" rx="16" ry="18" fill="oklch(86% 0.035 55)" />
        <path d="M24 32 Q23 20 33 16 Q40 13 48 16 Q57 20 56 33 Q56 28 52 26 Q49 30 44 29 Q39 28 36 30 Q31 32 28 30 Q25 29 24 32 Z" fill="oklch(78% 0.01 290)" />
        <path d="M24 32 Q22 42 26 46 L26 36 Z" fill="oklch(75% 0.01 290)" />
        <path d="M56 33 Q58 42 54 46 L54 36 Z" fill="oklch(75% 0.01 290)" />
        <path d="M30 20 Q33 18 36 19" stroke="oklch(92% 0.005 290)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <circle cx="33" cy="38" r="4.2" fill="none" stroke="oklch(30% 0.02 285)" strokeWidth="1.3" />
        <circle cx="47" cy="38" r="4.2" fill="none" stroke="oklch(30% 0.02 285)" strokeWidth="1.3" />
        <line x1="37.2" y1="38" x2="42.8" y2="38" stroke="oklch(30% 0.02 285)" strokeWidth="1.3" />
        <circle cx="33" cy="38" r="1" fill="oklch(25% 0.02 285)" />
        <circle cx="47" cy="38" r="1" fill="oklch(25% 0.02 285)" />
        <circle cx="28" cy="43" r="2" fill="oklch(78% 0.08 25)" opacity="0.5" />
        <circle cx="52" cy="43" r="2" fill="oklch(78% 0.08 25)" opacity="0.5" />
        <path d="M35 46 Q40 49 45 46" stroke="oklch(40% 0.08 25)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <circle cx="24.5" cy="40" r="1.1" fill="oklch(95% 0.01 290)" stroke="oklch(75% 0.01 290)" strokeWidth="0.3" />
        <circle cx="55.5" cy="40" r="1.1" fill="oklch(95% 0.01 290)" stroke="oklch(75% 0.01 290)" strokeWidth="0.3" />
      </g>
      <circle cx="64" cy="64" r="6" fill="oklch(58% 0.09 160)" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function InsightsMarcia() {
  const [dados, setDados] = useState<InsightsMarciaData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [regenerando, setRegenerando] = useState(false);

  const carregar = useCallback(async (forceReload = false) => {
    if (forceReload) setRegenerando(true); else setCarregando(true);
    setErro(null);
    try {
      const res = await fetch('/api/admin/insights', { method: forceReload ? 'POST' : 'GET' });
      if (!res.ok) throw new Error('Falha ao carregar insights');
      const data = await res.json();
      setDados(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
      setRegenerando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Header Marci.A comum a todos os estados
  const header = (
    <div className="flex items-center gap-3 mb-4">
      <MarciaAvatar size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-extrabold text-primary-950 tracking-tight">Marci.A</p>
          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
          </span>
        </div>
        <p className="text-[11.5px] text-warm-500 font-medium mt-0.5">
          {dados && dados.baseadoEm.totalJornadas > 0
            ? `Análise baseada em ${dados.baseadoEm.totalJornadas} jornadas de ${dados.baseadoEm.totalProfessores} professores`
            : 'Assistente de análise de saúde mental docente'}
        </p>
      </div>
      {dados && (
        <button
          onClick={() => carregar(true)}
          disabled={regenerando}
          className="flex-shrink-0 w-8 h-8 rounded-lg border border-primary-100 hover:border-primary-200 hover:bg-primary-50 text-warm-500 hover:text-primary-700 flex items-center justify-center transition-colors disabled:opacity-50"
          title="Atualizar análise"
          aria-label="Atualizar insights"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" className={regenerando ? 'animate-spin' : ''}>
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
        </button>
      )}
    </div>
  );

  if (carregando) {
    return (
      <div className="mb-6">
        {header}
        <div className="grid lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="admin-card animate-pulse">
              <div className="h-4 w-24 bg-primary-100 rounded mb-3" />
              <div className="h-3 w-full bg-primary-50 rounded mb-2" />
              <div className="h-3 w-[88%] bg-primary-50 rounded mb-2" />
              <div className="h-3 w-[72%] bg-primary-50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="mb-6">
        {header}
        <div className="admin-card">
          <p className="text-red-600 text-sm font-semibold">{erro || 'Não foi possível gerar os insights'}</p>
          <button onClick={() => carregar()} className="mt-2 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {header}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* 1. Principais Dores — destaque, texto maior */}
        <div className="admin-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.22))' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.4" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <h3 className="text-[14px] font-extrabold text-primary-950 tracking-tight">Principais Dores</h3>
          </div>
          <p className="text-[15px] text-primary-950 leading-relaxed font-semibold">
            {dados.dores.resumo}
          </p>
        </div>

        {/* 2. Plano de Ação — texto + lista */}
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(107,91,149,0.14), rgba(107,91,149,0.26))' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b5b95" strokeWidth="2.4" strokeLinecap="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h3 className="text-[13px] font-extrabold text-primary-950 tracking-tight">Plano de Ação</h3>
          </div>
          <p className="text-[12.5px] text-warm-700 leading-relaxed font-medium mb-2.5">
            {dados.planoAcao.resumo}
          </p>
          {dados.planoAcao.acoes && dados.planoAcao.acoes.length > 0 && (
            <ul className="space-y-1.5">
              {dados.planoAcao.acoes.slice(0, 4).map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-100 text-primary-700 text-[9px] font-black flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-primary-950 font-semibold leading-snug">{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 3. Impacto da Plataforma — destaque, texto maior */}
        <div className="admin-card">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.24))' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.4" strokeLinecap="round">
                <path d="M23 6l-9.5 9.5-5-5L1 18" />
                <path d="M17 6h6v6" />
              </svg>
            </div>
            <h3 className="text-[14px] font-extrabold text-primary-950 tracking-tight">Impacto da Plataforma</h3>
          </div>
          <p className="text-[15px] text-primary-950 leading-relaxed font-semibold">
            {dados.beneficios.resumo}
          </p>
        </div>
      </div>
    </div>
  );
}

// CTA do Relatório NR-1 — banner destacado direcionando para a página do relatório
function CTARelatorioNR1({ totalProfessores, jornadas }: { totalProfessores: number; jornadas: number }) {
  return (
    <a
      href="/admin/relatorio-nr1"
      className="block mb-6 rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #0e1f1a 0%, #1f3d34 50%, #2D5A4B 100%)',
      }}
    >
      <div className="relative p-5 flex items-center gap-5">
        {/* Decoração — circle gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/3 translate-x-1/4" style={{
          background: 'radial-gradient(circle, #8fbea3 0%, transparent 70%)',
        }} />

        {/* Ícone */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{
          background: 'linear-gradient(135deg, rgba(143,190,163,0.18), rgba(143,190,163,0.3))',
          border: '1px solid rgba(143,190,163,0.3)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8fbea3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0 relative">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-black text-[17px] tracking-tight">Relatório NR-1 · PGR-Ready</p>
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(143,190,163,0.2)', color: '#8fbea3' }}>
              Novo
            </span>
          </div>
          <p className="text-white/70 text-[12.5px] font-medium leading-relaxed">
            Exporte o relatório de riscos psicossociais conforme a NR-1 (item 1.5.4.4e) — fiscalização do MTE a partir de <strong className="text-white">26/05/2026</strong>. Baseado em {jornadas} jornadas de {totalProfessores} professores.
          </p>
        </div>

        {/* Seta */}
        <div className="flex-shrink-0 flex items-center gap-3 relative">
          <span className="text-white/80 text-[12px] font-bold hidden md:inline">Acessar</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1" style={{
            background: 'rgba(143,190,163,0.15)',
            border: '1px solid rgba(143,190,163,0.3)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8fbea3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}

// Bullet Chart — gráfico de bala para classificação por zonas de risco
function BulletChart({ dados, max = 10 }: {
  dados: { dimensao: string; valor: number }[];
  max?: number;
}) {
  if (!dados || dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-warm-400 text-sm font-medium">
        Sem dados disponíveis
      </div>
    );
  }

  // Zonas de risco (0-3 baixo, 3-6 atenção, 6-10 alto)
  const zona1Pct = (3 / max) * 100;   // 30%
  const zona2Pct = (6 / max) * 100;   // 60%
  const zonaCor = (v: number) => v >= 7 ? '#ef4444' : v >= 4 ? '#f59e0b' : '#22c55e';
  const zonaLabel = (v: number) => v >= 7 ? 'Alto' : v >= 4 ? 'Atenção' : 'Baixo';

  return (
    <div className="space-y-3 py-2">
      {dados.map((item) => {
        const pct = Math.max(0, Math.min(100, (item.valor / max) * 100));
        const cor = zonaCor(item.valor);
        return (
          <div key={item.dimensao} className="group">
            <div className="flex items-center gap-3">
              {/* Nome da dimensão */}
              <div className="w-[38%] min-w-0 flex-shrink-0">
                <p className="text-[12.5px] font-bold text-primary-950 truncate" title={item.dimensao}>
                  {item.dimensao}
                </p>
              </div>

              {/* Track com zonas de fundo + barra de valor */}
              <div className="flex-1 relative h-7 rounded-md overflow-hidden" style={{ background: '#f1ebe4' }}>
                {/* Zona verde (0 a 3) */}
                <div
                  className="absolute top-0 left-0 h-full"
                  style={{ width: `${zona1Pct}%`, background: '#22c55e', opacity: 0.18 }}
                />
                {/* Zona amarela (3 a 6) */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${zona1Pct}%`,
                    width: `${zona2Pct - zona1Pct}%`,
                    background: '#f59e0b',
                    opacity: 0.2,
                  }}
                />
                {/* Zona vermelha (6 a 10) */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${zona2Pct}%`,
                    width: `${100 - zona2Pct}%`,
                    background: '#ef4444',
                    opacity: 0.2,
                  }}
                />
                {/* Divisores entre zonas */}
                <div className="absolute top-0 h-full w-px bg-white/70" style={{ left: `${zona1Pct}%` }} />
                <div className="absolute top-0 h-full w-px bg-white/70" style={{ left: `${zona2Pct}%` }} />

                {/* Barra de valor (sólida) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3.5 rounded-sm transition-all duration-700 ease-out"
                  style={{
                    left: 0,
                    width: `${pct}%`,
                    background: cor,
                    boxShadow: `0 0 0 1px ${cor}33`,
                  }}
                />
                {/* Ponteiro/marcador vertical no final */}
                <div
                  className="absolute top-0.5 bottom-0.5 w-1 rounded-full transition-all duration-700 ease-out"
                  style={{
                    left: `calc(${pct}% - 2px)`,
                    background: cor,
                    boxShadow: `0 0 6px ${cor}99`,
                  }}
                />
              </div>

              {/* Valor numérico + zona */}
              <div className="w-[78px] flex-shrink-0 text-right">
                <p className="text-[15px] font-black leading-none" style={{ color: cor }}>
                  {item.valor.toFixed(1)}
                </p>
                <p className="text-[9.5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: cor, opacity: 0.85 }}>
                  {zonaLabel(item.valor)}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Escala de referência */}
      <div className="flex items-center gap-3 pt-1">
        <div className="w-[38%]" />
        <div className="flex-1 relative h-4">
          <span className="absolute left-0 text-[9px] font-bold text-warm-400">0</span>
          <span className="absolute text-[9px] font-bold text-warm-400" style={{ left: `${zona1Pct}%`, transform: 'translateX(-50%)' }}>3</span>
          <span className="absolute text-[9px] font-bold text-warm-400" style={{ left: `${zona2Pct}%`, transform: 'translateX(-50%)' }}>6</span>
          <span className="absolute right-0 text-[9px] font-bold text-warm-400">{max}</span>
        </div>
        <div className="w-[78px]" />
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-5 pt-2 text-[10.5px] font-semibold">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#22c55e', opacity: 0.5 }} />
          Baixo risco (≤3)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#f59e0b', opacity: 0.5 }} />
          Atenção (4-6)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: '#ef4444', opacity: 0.5 }} />
          Alto risco (≥7)
        </span>
      </div>
    </div>
  );
}

// Nuvem de palavras — layout em espiral usando d3-cloud
type LaidWord = {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  count: number;
  color: string;
};

function WordCloud({ palavras }: { palavras: { texto: string; contagem: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [laidOut, setLaidOut] = useState<LaidWord[]>([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 320 });

  // Paleta roxa variada
  const cores = useMemo(() => [
    '#6b5b95', '#8b6fb5', '#a594d0', '#7a6aa3', '#5a4c7d',
    '#9d8bc4', '#b4a3dd', '#7e6ea8', '#4e4070', '#8473ad',
  ], []);

  // Observar largura do container para responsividade
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setDimensions({ width: Math.floor(w), height: 320 });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Calcular layout sempre que palavras ou dimensões mudarem
  useEffect(() => {
    if (!palavras || palavras.length === 0) {
      setLaidOut([]);
      return;
    }
    const maxCount = Math.max(...palavras.map((p) => p.contagem));
    const minCount = Math.min(...palavras.map((p) => p.contagem));
    const range = maxCount - minCount || 1;

    // Escalar tamanho de fonte proporcionalmente (14-56 px)
    const fontMin = 14;
    const fontMax = Math.min(56, dimensions.width / 10);
    type CloudWord = cloud.Word & { count: number; color: string };
    const input: CloudWord[] = palavras.map((p, i) => ({
      text: p.texto,
      size: fontMin + ((p.contagem - minCount) / range) * (fontMax - fontMin),
      count: p.contagem,
      color: cores[i % cores.length],
    }));

    cloud<CloudWord>()
      .size([dimensions.width, dimensions.height])
      .words(input)
      .padding(3)
      .rotate(() => (Math.random() < 0.75 ? 0 : 90))
      .font('DM Sans, sans-serif')
      .fontWeight((d) => ((d.size ?? 0) > fontMax * 0.7 ? 900 : (d.size ?? 0) > fontMax * 0.4 ? 800 : 700))
      .fontSize((d) => d.size ?? 14)
      .spiral('archimedean')
      .on('end', (words) => {
        setLaidOut(
          words.map((w) => ({
            text: w.text ?? '',
            size: w.size ?? 14,
            x: w.x ?? 0,
            y: w.y ?? 0,
            rotate: w.rotate ?? 0,
            count: w.count,
            color: w.color,
          }))
        );
      })
      .start();
  }, [palavras, dimensions, cores]);

  if (!palavras || palavras.length === 0) {
    return (
      <div className="flex items-center justify-center h-[320px] text-warm-400 text-sm font-medium">
        Ainda não há palavras suficientes para gerar a nuvem
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full" style={{ minHeight: 320 }}>
      <svg width={dimensions.width} height={dimensions.height} style={{ display: 'block' }}>
        <g transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2})`}>
          {laidOut.map((w, i) => (
            <text
              key={`${w.text}-${i}`}
              textAnchor="middle"
              transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: `${w.size}px`,
                fontWeight: w.size > 40 ? 900 : w.size > 26 ? 800 : 700,
                fill: w.color,
                opacity: 0.6 + (w.size / 60) * 0.4,
                cursor: 'default',
                letterSpacing: '-0.01em',
              }}
            >
              <title>{`${w.text} — ${w.count} menções`}</title>
              {w.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

// IPCS Gauge — 3 zonas (sem sinais 0-6, resistência 7-13, estresse elevado 14-20)
function IPCSGauge({ media, distribuicao, total }: {
  media: number;
  distribuicao: { sem_sinais: number; resistencia: number; estresse_elevado: number };
  total: number;
}) {
  const max = 20;
  const pct = Math.max(0, Math.min(1, media / max));
  // Mesmo sistema do arcPath: 0° = esquerda (0 pts), 180° = direita (20 pts)
  const angleDeg = pct * 180;
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  const needleLen = 34;
  const needleX = 50 + needleLen * Math.cos(rad);
  const needleY = 55 + needleLen * Math.sin(rad);

  // Determinar zona e cor
  let zonaLabel: string;
  let zonaCor: string;
  let zonaBg: string;
  if (media >= 14) { zonaLabel = 'Estresse elevado'; zonaCor = '#ef4444'; zonaBg = '#fef2f2'; }
  else if (media >= 7) { zonaLabel = 'Resistência'; zonaCor = '#f59e0b'; zonaBg = '#fffbeb'; }
  else { zonaLabel = 'Sem sinais'; zonaCor = '#22c55e'; zonaBg = '#f0fdf4'; }

  // Arcos em proporção: 0-6 (30%), 7-13 (35%), 14-20 (35%)
  // 180° total: verde 0-54°, amarelo 54-117°, vermelho 117-180°
  // Raio 40, centro (50, 55)
  const arcPath = (startDeg: number, endDeg: number) => {
    const s = ((startDeg - 180) * Math.PI) / 180;
    const e = ((endDeg - 180) * Math.PI) / 180;
    const x1 = 50 + 40 * Math.cos(s);
    const y1 = 55 + 40 * Math.sin(s);
    const x2 = 50 + 40 * Math.cos(e);
    const y2 = 55 + 40 * Math.sin(e);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 100 68" className="w-full max-w-[280px]">
        {/* Arco verde (0-6 pontos = 0-54°) */}
        <path d={arcPath(0, 54)} fill="none" stroke="#22c55e" strokeWidth="9" strokeLinecap="butt" opacity="0.85" />
        {/* Arco amarelo (7-13 pontos = 54-117°) */}
        <path d={arcPath(55, 117)} fill="none" stroke="#f59e0b" strokeWidth="9" strokeLinecap="butt" opacity="0.85" />
        {/* Arco vermelho (14-20 pontos = 117-180°) */}
        <path d={arcPath(118, 180)} fill="none" stroke="#ef4444" strokeWidth="9" strokeLinecap="butt" opacity="0.85" />
        {/* Needle */}
        <line x1="50" y1="55" x2={needleX} y2={needleY} stroke="#2d2b3a" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="55" r="3.5" fill="#fff" stroke="#2d2b3a" strokeWidth="2" />
        {/* Escala */}
        <text x="10" y="66" fontSize="4" fill="#a99889" fontWeight="700" textAnchor="middle">0</text>
        <text x="50" y="12" fontSize="4" fill="#a99889" fontWeight="700" textAnchor="middle">10</text>
        <text x="90" y="66" fontSize="4" fill="#a99889" fontWeight="700" textAnchor="middle">20</text>
      </svg>
      <div className="text-center -mt-2">
        <p className="text-3xl font-black tracking-tight" style={{ color: zonaCor }}>
          {media.toFixed(1)}<span className="text-base text-warm-400 font-bold">/20</span>
        </p>
        <p className="text-[11px] font-extrabold uppercase tracking-widest mt-0.5" style={{ color: zonaCor }}>
          {zonaLabel}
        </p>
        <p className="text-[10px] font-semibold text-warm-500 mt-1">
          Pontuação IPCS média ({total} {total === 1 ? 'professor' : 'professores'})
        </p>
      </div>
      {/* Distribuição por zona */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        <div className="rounded-xl p-2.5 text-center" style={{ background: '#f0fdf4' }}>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#16a34a] mb-0.5">Sem sinais</p>
          <p className="text-[9px] text-[#16a34a]/70 font-semibold mb-1">0-6 pts</p>
          <p className="text-xl font-black text-[#16a34a]">{distribuicao.sem_sinais}</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: '#fffbeb' }}>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#d97706] mb-0.5">Resistência</p>
          <p className="text-[9px] text-[#d97706]/70 font-semibold mb-1">7-13 pts</p>
          <p className="text-xl font-black text-[#d97706]">{distribuicao.resistencia}</p>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: '#fef2f2' }}>
          <p className="text-[9px] font-bold uppercase tracking-wide text-[#dc2626] mb-0.5">Estresse elevado</p>
          <p className="text-[9px] text-[#dc2626]/70 font-semibold mb-1">14-20 pts</p>
          <p className="text-xl font-black text-[#dc2626]">{distribuicao.estresse_elevado}</p>
        </div>
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
  const accent = cor || '#6b5b95';
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
      <p className="text-[11px] text-warm-500 uppercase tracking-wider font-bold">{label}</p>
      <p className="text-[28px] font-black mt-0.5 leading-none tracking-tight" style={{ color: accent }}>
        {valor}
      </p>
      {sub && (
        <p className="text-[11.5px] text-warm-400 mt-1.5 font-medium">
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
        <h3 className="text-[15px] font-extrabold text-primary-950 tracking-tight">{title}</h3>
        {subtitle && <p className="text-[12px] text-warm-500 mt-0.5 font-medium">{subtitle}</p>}
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

const FILTROS_DEMOGRAFICOS = {
  genero: [
    { valor: '', label: 'Todos os gêneros' },
    { valor: 'feminino', label: 'Feminino' },
    { valor: 'masculino', label: 'Masculino' },
    { valor: 'nao_binario', label: 'Não-binário' },
    { valor: 'prefiro_nao_dizer', label: 'Prefiro não dizer' },
  ],
  faixaEtaria: [
    { valor: '', label: 'Todas as idades' },
    { valor: '20-29', label: '20-29 anos' },
    { valor: '30-39', label: '30-39 anos' },
    { valor: '40-49', label: '40-49 anos' },
    { valor: '50-59', label: '50-59 anos' },
    { valor: '60+', label: '60+ anos' },
  ],
  frequenciaAulas: [
    { valor: '', label: 'Todas as frequências' },
    { valor: 'integral', label: 'Tempo integral' },
    { valor: 'parcial', label: 'Meio período' },
    { valor: 'eventual', label: 'Eventual' },
  ],
  funcaoEnsino: [
    { valor: '', label: 'Todas as funções' },
    { valor: 'primaria', label: 'Função primária' },
    { valor: 'secundaria', label: 'Função secundária' },
  ],
};

export default function AdminDashboard() {
  const [dados, setDados] = useState<DadosDash | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaJornada>('geral');
  const [filtros, setFiltros] = useState<Record<string, string>>({
    genero: '', faixaEtaria: '', frequenciaAulas: '', funcaoEnsino: '',
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  // Seletor de instituição — só o superadmin enxerga. Um admin de instituição
  // já é escopado pelo escolaId dele no servidor.
  const [instituicoes, setInstituicoes] = useState<{ id: string; nome: string }[]>([]);
  const [escolaId, setEscolaId] = useState('');

  const filtrosAtivos = Object.values(filtros).filter(Boolean).length;

  useEffect(() => {
    fetch('/api/admin/instituicoes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.instituicoes) {
          setInstituicoes(data.instituicoes.map((i: { id: string; nome: string }) => ({ id: i.id, nome: i.nome })));
        }
      })
      .catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const carregarDados = useCallback(async (jornada: string, filtrosDemog: Record<string, string>, escola: string) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (escola) params.set('escolaId', escola);
      if (jornada && jornada !== 'geral') params.set('jornada', jornada);
      if (filtrosDemog.genero) params.set('genero', filtrosDemog.genero);
      if (filtrosDemog.faixaEtaria) params.set('faixaEtaria', filtrosDemog.faixaEtaria);
      if (filtrosDemog.frequenciaAulas) params.set('frequenciaAulas', filtrosDemog.frequenciaAulas);
      if (filtrosDemog.funcaoEnsino) params.set('funcaoEnsino', filtrosDemog.funcaoEnsino);
      const qs = params.toString();
      const url = `/api/dashboard${qs ? `?${qs}` : ''}`;
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
    carregarDados(abaAtiva, filtros, escolaId);
  }, [abaAtiva, filtros, escolaId, carregarDados]);

  function handleFiltroChange(campo: string, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros({ genero: '', faixaEtaria: '', frequenciaAulas: '', funcaoEnsino: '' });
  }

  if (carregando) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="relative w-12 h-12 mx-auto">
              <div className="absolute inset-0 border-[3px] border-[#ede8f7] rounded-full" />
              <div className="absolute inset-0 border-[3px] border-transparent border-t-[#6b5b95] rounded-full animate-spin" />
            </div>
            <p className="text-warm-500 text-sm font-semibold">Carregando painel...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!dados) {
    return (
      <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
        <div className="flex items-center justify-center py-32">
          <div className="admin-card px-10 py-10 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
            </div>
            <p className="text-primary-950 font-bold">Erro ao carregar dados</p>
            <p className="text-warm-500 text-sm mt-1">Verifique a conexão e tente novamente.</p>
            <button onClick={() => carregarDados(abaAtiva, filtros, escolaId)} className="mt-4 px-5 py-2 bg-[#6b5b95] text-white text-sm font-bold rounded-xl hover:bg-[#5a4c7d] transition-colors">
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
    <AdminLayout titulo="Dashboard" subtitulo="Visão geral da plataforma">
      {/* Filtros demográficos + Abas */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Só aparece para superadmin — a API de instituições nega os demais */}
        {instituicoes.length > 0 && (
          <select
            value={escolaId}
            onChange={(e) => setEscolaId(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white/70 text-primary-950 border border-primary-100 focus:outline-none focus:border-[#6b5b95]"
          >
            <option value="">Todas as instituições</option>
            {instituicoes.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nome}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 1px 3px rgba(45,42,38,0.04)' }}>
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                abaAtiva === aba.id
                  ? 'text-white shadow-md'
                  : 'text-warm-500 hover:text-[#6b5b95] hover:bg-white/50'
              }`}
              style={abaAtiva === aba.id ? { background: 'linear-gradient(135deg, #6b5b95, #a594d0)' } : undefined}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
            filtrosAtivos > 0
              ? 'bg-[#6b5b95] text-white shadow-md'
              : 'bg-white/70 text-warm-500 hover:text-[#6b5b95] border border-primary-100'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
          </svg>
          Filtros{filtrosAtivos > 0 ? ` (${filtrosAtivos})` : ''}
        </button>

        {filtrosAtivos > 0 && (
          <button
            onClick={limparFiltros}
            className="text-[12px] font-bold text-red-400 hover:text-red-600 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Painel de filtros demográficos */}
      {mostrarFiltros && (
        <div className="admin-card mb-6 animate-slide-up">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(FILTROS_DEMOGRAFICOS).map(([campo, opcoes]) => (
              <div key={campo}>
                <label className="block text-[11px] text-warm-500 uppercase tracking-wider font-bold mb-1.5">
                  {campo === 'genero' ? 'Gênero' : campo === 'faixaEtaria' ? 'Faixa Etária' : campo === 'frequenciaAulas' ? 'Frequência' : 'Função de Ensino'}
                </label>
                <select
                  value={filtros[campo] || ''}
                  onChange={(e) => handleFiltroChange(campo, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-primary-100 bg-white text-[13px] text-primary-950 font-semibold focus:outline-none focus:ring-2 focus:ring-[#6b5b95]/20 focus:border-[#6b5b95] transition-all"
                >
                  {opcoes.map((op) => (
                    <option key={op.valor} value={op.valor}>{op.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  {alerta.tipo === 'critico' ? 'Alerta Crítico' : 'Atenção'}
                </p>
                <p className="text-[13px] font-semibold leading-snug">{alerta.mensagem}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================== INSIGHTS MARCIA (IA) ==================== */}
      <InsightsMarcia />

      {/* ==================== CTA RELATÓRIO NR-1 ==================== */}
      <CTARelatorioNR1 totalProfessores={dados.totalProfessores} jornadas={dados.jornadasConcluidas} />

      {/* ==================== ABA RELACIONAMENTOS ==================== */}
      {abaAtiva === 'relacionamentos' ? (
        <DashboardRelacionamentos dados={dados} totalEmocional={totalEmocional} pieData={pieData} />
      ) : (
        /* ==================== ABA GERAL / TRABALHO ==================== */
        <DashboardGeralTrabalho dados={dados} totalEmocional={totalEmocional} pieData={pieData} abaAtiva={abaAtiva} carregarDados={() => carregarDados(abaAtiva, filtros, escolaId)} />
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
          sub="concluídas"
          cor="#3b82f6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
        />
        <KPICard
          label="Taxa Conclusão"
          valor={`${(dados.taxaConclusao * 100).toFixed(0)}%`}
          sub={dados.taxaConclusao >= 0.7 ? 'Boa adesão' : 'Adesão baixa'}
          cor={dados.taxaConclusao >= 0.7 ? '#6b5b95' : '#fb923c'}
          trend={dados.taxaConclusao >= 0.7 ? 'up' : 'down'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>}
        />
        <KPICard
          label="IBED Médio"
          valor={dados.ibedMedio.toFixed(2)}
          sub={`Evolução: ${dados.ibedDiferencaMedia > 0 ? '+' : ''}${dados.ibedDiferencaMedia.toFixed(1)}`}
          cor="#8b5cf6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7 stagger-children">
        <KPICard
          label="Duração Média"
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
          sub="não concluíram"
          cor={dados.taxaAbandono > 0.3 ? '#ef4444' : '#a99889'}
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
        <ChartCard title="Perfil Emocional" subtitle="Distribuição dos professores" className="lg:col-span-3">
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
                  <text x="50%" y="46%" textAnchor="middle" className="fill-primary-950 text-[22px] font-black">
                    {totalEmocional}
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" className="fill-warm-500 text-[10px] font-semibold">
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
                        <span className="text-[12.5px] text-warm-700 font-bold">{estado}</span>
                      </div>
                      <span className="text-[12px] font-extrabold" style={{ color: CORES_EMOCIONAL[estado] }}>
                        {qtd} <span className="text-warm-400 font-semibold">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-primary-50 rounded-full overflow-hidden">
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

        <ChartCard title="Estresse Ocupacional (IPCS)" subtitle="Índice de Percepção do Estresse — 10 perguntas (0-20 pts)" className="lg:col-span-2">
          {dados.ipcs && dados.ipcs.totalProfessoresAvaliados > 0 ? (
            <IPCSGauge
              media={dados.ipcs.media}
              distribuicao={dados.ipcs.distribuicao}
              total={dados.ipcs.totalProfessoresAvaliados}
            />
          ) : (
            <div className="flex items-center justify-center h-[250px] text-warm-400 text-sm font-medium">
              Nenhum professor respondeu ao teste IPCS ainda
            </div>
          )}
        </ChartCard>
      </div>

      {/* Second charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4 stagger-children">
        <ChartCard title="Tendência de Conclusão" subtitle="Taxa semanal nas últimas 8 semanas">
          {dados.tendenciaConclusao && dados.tendenciaConclusao.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dados.tendenciaConclusao}>
                <defs>
                  <linearGradient id="gradientConclusao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a594d0" stopOpacity={0.28} />
                    <stop offset="50%" stopColor="#6b5b95" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#6b5b95" stopOpacity={0} />
                  </linearGradient>
                  <filter id="glowPrimary">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede8f7" vertical={false} />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: '#a99889', fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: '#a99889' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="taxa"
                  stroke="#6b5b95"
                  strokeWidth={2.5}
                  fill="url(#gradientConclusao)"
                  dot={{ fill: '#fff', stroke: '#6b5b95', strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: '#6b5b95', stroke: '#fff', strokeWidth: 3, r: 7, filter: 'url(#glowPrimary)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-warm-400 text-sm font-medium">
              Dados insuficientes para exibir tendência
            </div>
          )}
        </ChartCard>

        <ChartCard title="Estresse por Dimensão" subtitle="Classificação por risco (0-10)">
          <BulletChart
            dados={(dados.radarEstresse || []).filter(
              (r) => r.dimensao.toLowerCase() !== 'trabalho' &&
                     r.dimensao.toLowerCase() !== 'relacionamentos'
            )}
          />
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-5 gap-4 stagger-children">
        <ChartCard title="Nuvem de Palavras" subtitle="Temas mais mencionados pelos professores" className="lg:col-span-3">
          <WordCloud palavras={dados.nuvemPalavras || []} />
        </ChartCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="admin-card">
            <h3 className="text-[13px] font-extrabold text-primary-950 tracking-tight mb-3">Resumo Rápido</h3>
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
                        <p className="text-[12px] font-bold text-primary-950">{estado}</p>
                        <p className="text-[11px] text-warm-500 font-medium">{qtd} prof. — {pct.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="admin-card text-center">
            <p className="text-[11px] text-warm-500 uppercase tracking-wider font-bold mb-2">Engajamento Geral</p>
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="engajGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6b5b95" />
                    <stop offset="100%" stopColor="#a594d0" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ede8f7" strokeWidth="3" />
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
                <span className="text-[17px] font-black text-primary-950">
                  {(dados.taxaConclusao * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-[11.5px] text-warm-500 font-medium">
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

  // Dimensões relacionais para gráfico de barras com risco
  const MAPA_DIMENSAO_REL: Record<string, string> = {
    'Autocuidado': 'Relação intrapessoal',
    'Vínculos Familiares': 'Relações familiares',
    'Rede de Apoio': 'Relações interpessoais',
    'Satisfação Geral': 'Satisfação geral',
    'Relações': 'Relações interpessoais',
    'Intelig. Emocional': 'Inteligência emocional',
    'Estilo Comunicação': 'Estilo de comunicação',
    'Burnout Relacional': 'Burnout relacional',
    'Comunicação': 'Comunicação',
    'Relacionamentos': 'Relacionamentos',
  };
  // Usar todos os dados do radarEstresse (já vem filtrado pela aba na API)
  const dimensoesRelacionais = dados.radarEstresse.map((r) => {
    const label = MAPA_DIMENSAO_REL[r.dimensao] || r.dimensao;
    return { dimensao: label, valor: r.valor };
  });

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
          sub="relacionamentos concluídos"
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
          sub="risco elevado/crítico"
          cor={dados.percentualBurnoutElevado !== null && dados.percentualBurnoutElevado > 0.3 ? '#ef4444' : '#a99889'}
          trend={dados.percentualBurnoutElevado !== null && dados.percentualBurnoutElevado > 0.3 ? 'down' : 'neutral'}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/></svg>}
        />
      </div>

      {/* IRPR Gauge + Radar Relacional */}
      <div className="grid lg:grid-cols-5 gap-4 mb-4 stagger-children">
        <ChartCard title="IRPR" subtitle="Índice Relacional de Professores e Rede" className="lg:col-span-2">
          {dados.irpr ? (
            <div>
              <IndexGauge valor={dados.irpr.valor} nivel={dados.irpr.nivel} cor={dados.irpr.cor} label="Risco" gradientId="gaugeGradIRPR" />
              <InsightBanner message={getInsightMessage('IRPR', dados.irpr.valor, dados.irpr.nivel)} cor={dados.irpr.cor} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-warm-400 text-sm font-medium">
              Dados insuficientes para calcular IRPR
            </div>
          )}
        </ChartCard>

        <ChartCard title="Relacional por Dimensão" subtitle="Classificação por risco (0-10)" className="lg:col-span-3">
          <BulletChart
            dados={dimensoesRelacionais.filter(
              (r) => r.dimensao.toLowerCase() !== 'trabalho' &&
                     r.dimensao.toLowerCase() !== 'relacionamentos'
            )}
          />
        </ChartCard>
      </div>

      {/* Estilo de Comunicação + IE Gauge */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4 stagger-children">
        <ChartCard title="Estilo de Comunicação" subtitle="Distribuição predominante">
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
                    <text x="50%" y="46%" textAnchor="middle" className="fill-primary-950 text-[20px] font-black">
                      {totalEstilo}
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" className="fill-warm-500 text-[10px] font-semibold">
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
                        <span className="text-[12.5px] text-warm-700 font-bold">{LABELS_ESTILO[estilo] || estilo}</span>
                        <span className="text-[12px] font-extrabold" style={{ color: CORES_ESTILO[estilo] }}>
                          {qtd} <span className="text-warm-400 font-semibold">({pct.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
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
            <div className="flex items-center justify-center h-[220px] text-warm-400 text-sm font-medium">
              Sem dados de estilo de comunicação
            </div>
          )}
        </ChartCard>

        {/* IE Gauge */}
        <ChartCard title="Inteligência Emocional" subtitle="Média geral (escala 15-75)">
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
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ede8f7" strokeWidth="3" />
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
                  <span className="text-[22px] font-black text-primary-950">
                    {dados.ieMedia.media.toFixed(0)}
                  </span>
                </div>
              </div>
              <p className="text-[13px] font-bold text-primary-950">{dados.ieMedia.classificacao}</p>
              <p className="text-[11px] text-warm-500 mt-1">de 75 pontos possiveis</p>

              {/* IE Faixas */}
              <div className="w-full mt-4 space-y-1.5">
                {[
                  { label: 'Alta (55-75)', min: 55, max: 75, cor: '#22c55e' },
                  { label: 'Média (35-54)', min: 35, max: 54, cor: '#f59e0b' },
                  { label: 'Baixa (15-34)', min: 15, max: 34, cor: '#ef4444' },
                ].map((faixa) => (
                  <div key={faixa.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: faixa.cor }} />
                    <span className="text-[11px] text-warm-500 font-medium flex-1">{faixa.label}</span>
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
            <div className="flex items-center justify-center h-[260px] text-warm-400 text-sm font-medium">
              Sem dados de inteligência emocional
            </div>
          )}
        </ChartCard>
      </div>

      {/* Bottom row: Top problemas + Perfil emocional */}
      <div className="grid lg:grid-cols-5 gap-4 stagger-children">
        <ChartCard title="Nuvem de Palavras" subtitle="Temas mais mencionados pelos professores" className="lg:col-span-3">
          <WordCloud palavras={dados.nuvemPalavras || []} />
        </ChartCard>

        <div className="lg:col-span-2 space-y-4">
          {/* Perfil Emocional compacto */}
          <div className="admin-card">
            <h3 className="text-[13px] font-extrabold text-primary-950 tracking-tight mb-3">Perfil Emocional</h3>
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
                        <p className="text-[12px] font-bold text-primary-950">{estado}</p>
                        <p className="text-[11px] text-warm-500 font-medium">{qtd} prof. — {pct.toFixed(0)}%</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Engajamento */}
          <div className="admin-card text-center">
            <p className="text-[11px] text-warm-500 uppercase tracking-wider font-bold mb-2">Engajamento</p>
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <defs>
                  <linearGradient id="engajGradPurple" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ede8f7" strokeWidth="3" />
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
                <span className="text-[17px] font-black text-primary-950">
                  {(dados.taxaConclusao * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <p className="text-[11.5px] text-warm-500 font-medium">
              {dados.taxaConclusao >= 0.7 ? 'Excelente' : dados.taxaConclusao >= 0.4 ? 'Moderado' : 'Precisa melhorar'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
