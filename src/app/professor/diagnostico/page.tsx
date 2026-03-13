'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

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

export default function DiagnosticoPage() {
  const router = useRouter();
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null);
  const [pontosAtencao, setPontosAtencao] = useState<string[]>([]);

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
  }, []);

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
    <div className="min-h-screen bg-warm-50 bg-organic">
      <Header titulo="Seu Retrato Emocional" subtitulo="Diagnóstico personalizado" />

      <div className="max-w-2xl mx-auto space-y-6 p-4 pb-8 animate-fade-in">

        {/* Perfil Emocional */}
        <div className={`card border-2 ${perfil.cor} ${perfil.corBg} text-center py-8 animate-slide-up`}>
          <div className="w-20 h-20 rounded-3xl bg-white/60 backdrop-blur-sm flex items-center justify-center mx-auto shadow-warm-sm">
            <span className="text-4xl">{perfil.emoji}</span>
          </div>
          <h2 className="text-xl font-bold text-primary-950 mt-4">{perfil.label}</h2>
          <span className={`inline-block mt-3 text-xs font-semibold px-4 py-1.5 rounded-xl ${estresse.cor}`}>
            Nível de estresse: {diagnostico.nivelEstresse}
          </span>
        </div>

        {/* Resumo da IA */}
        {diagnostico.resumoIA && (
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                <span className="text-sm">💬</span>
              </div>
              <h3 className="font-bold text-primary-950">O que percebemos</h3>
            </div>
            <p className="text-warm-600 text-sm leading-relaxed">{diagnostico.resumoIA}</p>
          </div>
        )}

        {/* Pontos de atenção */}
        {pontosAtencao.length > 0 && (
          <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emotion-alert/10 flex items-center justify-center">
                <span className="text-sm">🔔</span>
              </div>
              <h3 className="font-bold text-primary-950">Pontos de atenção</h3>
            </div>
            <div className="space-y-3 stagger-children">
              {pontosAtencao.map((ponto, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-emotion-alert/10 flex items-center justify-center text-emotion-alert text-xs mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-warm-600 leading-relaxed">{ponto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plano de ação */}
        <div
          className="card bg-primary-50/60 border-primary-200/50 animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary-200/50 flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <h3 className="font-bold text-primary-800">Recomendações para você</h3>
          </div>
          <p className="text-primary-700 text-sm leading-relaxed whitespace-pre-wrap">
            {diagnostico.planoAcao}
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pt-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <button
            onClick={() => router.push('/professor/jornada')}
            className="btn-primary text-center"
          >
            💬 Conversar com a Márcia
          </button>
          <button
            onClick={() => router.push('/professor')}
            className="btn-secondary text-center"
          >
            Fazer outra jornada
          </button>
        </div>
      </div>
    </div>
  );
}
