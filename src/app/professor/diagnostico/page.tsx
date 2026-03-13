'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';

interface Diagnostico {
  perfilEmocional: string;
  nivelEstresse: string;
  pontosAtencao: string;
  planoAcao: string;
  resumoIA: string;
}

const perfisEmocional: Record<string, { label: string; cor: string; emoji: string; corBg: string }> = {
  A: {
    label: 'Muito fortalecido(a)',
    cor: 'border-emotion-strength/40 text-primary-900',
    corBg: 'bg-emotion-strength/8',
    emoji: '💪',
  },
  B: {
    label: 'Esperançoso(a)',
    cor: 'border-emotion-hope/40 text-primary-900',
    corBg: 'bg-emotion-hope/8',
    emoji: '🌟',
  },
  C: {
    label: 'Em alerta',
    cor: 'border-emotion-alert/40 text-primary-900',
    corBg: 'bg-emotion-alert/8',
    emoji: '⚡',
  },
  D: {
    label: 'Cansado(a)',
    cor: 'border-emotion-tired/40 text-primary-900',
    corBg: 'bg-emotion-tired/8',
    emoji: '😮‍💨',
  },
  E: {
    label: 'Sobrecarregado(a)',
    cor: 'border-emotion-overwhelm/40 text-primary-900',
    corBg: 'bg-emotion-overwhelm/8',
    emoji: '🫂',
  },
};

const niveisEstresse: Record<string, { cor: string; label: string }> = {
  baixo: { cor: 'bg-emotion-strength/10 text-primary-800', label: 'Baixo' },
  moderado: { cor: 'bg-emotion-alert/10 text-primary-800', label: 'Moderado' },
  elevado: { cor: 'bg-emotion-overwhelm/10 text-primary-800', label: 'Elevado' },
};

const diasSemana = [
  { valor: 'segunda', label: 'Seg' },
  { valor: 'terca', label: 'Ter' },
  { valor: 'quarta', label: 'Qua' },
  { valor: 'quinta', label: 'Qui' },
  { valor: 'sexta', label: 'Sex' },
];

export default function DiagnosticoPage() {
  const router = useRouter();
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [pontosAtencao, setPontosAtencao] = useState<string[]>([]);
  const [radarData, setRadarData] = useState<{ dimensao: string; valor: number }[]>([]);
  const [lembreteAtivo, setLembreteAtivo] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('diagnostico');
    if (saved) {
      const d = JSON.parse(saved);
      setDiagnostico(d);
      try {
        setPontosAtencao(JSON.parse(d.pontosAtencao || '[]'));
      } catch {
        setPontosAtencao([]);
      }
    }

    // Carregar dimension scores se disponivel
    const scores = sessionStorage.getItem('dimensionScores');
    if (scores) {
      try {
        setRadarData(JSON.parse(scores));
      } catch {
        // fallback: gerar dados basicos do diagnostico
      }
    }

    // Carregar lembrete existente
    const lembrete = localStorage.getItem('lembreteCheckin');
    if (lembrete) setLembreteAtivo(lembrete);
  }, []);

  function selecionarLembrete(dia: string) {
    if (lembreteAtivo === dia) {
      localStorage.removeItem('lembreteCheckin');
      setLembreteAtivo('');
    } else {
      localStorage.setItem('lembreteCheckin', dia);
      setLembreteAtivo(dia);
    }
  }

  if (!diagnostico) {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
            <span className="text-2xl">🔍</span>
          </div>
          <p className="text-warm-500 leading-relaxed">Nenhum diagnóstico encontrado.</p>
          <button onClick={() => router.push('/professor')} className="btn-primary">
            Iniciar uma jornada
          </button>
        </div>
      </div>
    );
  }

  const perfil = perfisEmocional[diagnostico.perfilEmocional] || perfisEmocional['C'];
  const estresse = niveisEstresse[diagnostico.nivelEstresse] || niveisEstresse['moderado'];

  return (
    <div className="min-h-screen bg-warm-50 bg-organic print:bg-white">
      <div className="print:hidden">
        <Header titulo="Seu Retrato Emocional" subtitulo="Diagnóstico personalizado" />
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center py-6 border-b border-gray-200 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Retrato Emocional</h1>
        <p className="text-sm text-gray-500 mt-1">EmpatIA - Diagnóstico personalizado</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6 p-4 pb-8 animate-fade-in print:animate-none">

        {/* Perfil Emocional */}
        <div className={`card border-2 ${perfil.cor} ${perfil.corBg} text-center py-8 animate-slide-up print:animate-none print:shadow-none print:border`}>
          <div className="w-20 h-20 rounded-3xl bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto shadow-warm-sm print:shadow-none">
            <span className="text-4xl">{perfil.emoji}</span>
          </div>
          <h2 className="text-xl font-bold text-primary-950 mt-4 print:text-gray-900">{perfil.label}</h2>
          <span className={`inline-block mt-3 text-xs font-semibold px-4 py-1.5 rounded-xl ${estresse.cor}`}>
            Nível de estresse: {diagnostico.nivelEstresse}
          </span>
        </div>

        {/* Radar Chart */}
        {radarData.length >= 3 && (
          <div className="card animate-slide-up print:shadow-none print:border" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <h3 className="font-bold text-primary-950 print:text-gray-900">Seu perfil por dimensão</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e4e0d8" />
                <PolarAngleAxis dataKey="dimensao" tick={{ fontSize: 11, fill: '#7a7a72' }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 9 }} />
                <Radar name="Estresse" dataKey="valor" stroke="#2d7a5e" fill="#2d7a5e" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resumo da IA */}
        {diagnostico.resumoIA && (
          <div className="card animate-slide-up print:shadow-none print:border" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                <span className="text-sm">💬</span>
              </div>
              <h3 className="font-bold text-primary-950 print:text-gray-900">O que percebemos</h3>
            </div>
            <p className="text-warm-600 text-sm leading-relaxed print:text-gray-700">{diagnostico.resumoIA}</p>
          </div>
        )}

        {/* Pontos de atenção */}
        {pontosAtencao.length > 0 && (
          <div className="card animate-slide-up print:shadow-none print:border" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emotion-alert/10 flex items-center justify-center">
                <span className="text-sm">🔔</span>
              </div>
              <h3 className="font-bold text-primary-950 print:text-gray-900">Pontos de atenção</h3>
            </div>
            <div className="space-y-3 stagger-children print:[&>*]:opacity-100 print:[&>*]:animate-none">
              {pontosAtencao.map((ponto, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emotion-alert/10 flex items-center justify-center text-emotion-alert text-xs mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-warm-600 leading-relaxed print:text-gray-700">{ponto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plano de ação */}
        <div
          className="card bg-primary-50/60 border-primary-200/50 animate-slide-up print:shadow-none print:border print:bg-gray-50"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-200/50 flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <h3 className="font-bold text-primary-800 print:text-gray-900">Recomendações para você</h3>
          </div>
          <p className="text-primary-700 text-sm leading-relaxed whitespace-pre-wrap print:text-gray-700">
            {diagnostico.planoAcao}
          </p>
        </div>

        {/* Lembrete semanal */}
        <div className="card animate-slide-up print:hidden" style={{ animationDelay: '0.22s' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <span className="text-sm">🔔</span>
            </div>
            <div>
              <h3 className="font-bold text-primary-950 text-sm">Lembrete semanal</h3>
              <p className="text-xs text-primary-400 mt-0.5">Escolha um dia para fazer seu check-in emocional</p>
            </div>
          </div>
          <div className="flex gap-2">
            {diasSemana.map((dia) => (
              <button
                key={dia.valor}
                onClick={() => selecionarLembrete(dia.valor)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                  lembreteAtivo === dia.valor
                    ? 'bg-primary-600 text-white shadow-warm'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100 border border-primary-100'
                }`}
              >
                {dia.label}
              </button>
            ))}
          </div>
          {lembreteAtivo && (
            <p className="text-xs text-primary-500 mt-2 text-center font-medium">
              Lembrete ativo para {diasSemana.find((d) => d.valor === lembreteAtivo)?.label || lembreteAtivo}
            </p>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2 animate-slide-up print:hidden" style={{ animationDelay: '0.25s' }}>
          <button
            onClick={() => window.print()}
            className="btn-secondary text-center"
          >
            📄 Exportar como PDF
          </button>
          <button
            onClick={() => router.push('/professor/jornada')}
            className="btn-primary text-center"
          >
            💬 Conversar com a Márcia
          </button>
          <button
            onClick={() => router.push('/professor/historico')}
            className="btn-secondary text-center"
          >
            📊 Ver meu histórico
          </button>
          <button
            onClick={() => router.push('/professor')}
            className="text-sm text-primary-400 hover:text-primary-600 font-medium transition-colors duration-300 underline underline-offset-4 decoration-primary-200 hover:decoration-primary-400 text-center"
          >
            Fazer outra jornada
          </button>
        </div>
      </div>
    </div>
  );
}
