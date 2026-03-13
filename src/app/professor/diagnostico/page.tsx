'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Diagnostico {
  perfilEmocional: string;
  nivelEstresse: string;
  pontosAtencao: string;
  planoAcao: string;
  resumoIA: string;
}

const perfisEmocional: Record<string, { label: string; cor: string; emoji: string }> = {
  A: { label: 'Muito fortalecido(a)', cor: 'bg-green-50 border-green-300 text-green-700', emoji: '💪' },
  B: { label: 'Esperançoso(a)', cor: 'bg-blue-50 border-blue-300 text-blue-700', emoji: '🌟' },
  C: { label: 'Em alerta', cor: 'bg-yellow-50 border-yellow-300 text-yellow-700', emoji: '⚡' },
  D: { label: 'Cansado(a)', cor: 'bg-orange-50 border-orange-300 text-orange-700', emoji: '😔' },
  E: { label: 'Sobrecarregado(a)', cor: 'bg-red-50 border-red-300 text-red-700', emoji: '🆘' },
};

const niveisEstresse: Record<string, { cor: string }> = {
  baixo: { cor: 'bg-green-100 text-green-700' },
  moderado: { cor: 'bg-yellow-100 text-yellow-700' },
  elevado: { cor: 'bg-red-100 text-red-700' },
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Nenhum diagnóstico encontrado.</p>
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pt-6">
          <h1 className="text-2xl font-bold text-gray-800">Seu Retrato Emocional</h1>
          <p className="text-gray-500 text-sm">Baseado nas suas respostas durante a jornada</p>
        </div>

        {/* Perfil Emocional */}
        <div className={`card border-2 ${perfil.cor} text-center`}>
          <span className="text-4xl">{perfil.emoji}</span>
          <h2 className="text-lg font-semibold mt-2">{perfil.label}</h2>
          <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${estresse.cor}`}>
            Nível de estresse: {diagnostico.nivelEstresse}
          </span>
        </div>

        {/* Resumo da IA */}
        {diagnostico.resumoIA && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-2">O que percebemos</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{diagnostico.resumoIA}</p>
          </div>
        )}

        {/* Pontos de atenção */}
        {pontosAtencao.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Pontos de atenção</h3>
            <div className="space-y-2">
              {pontosAtencao.map((ponto, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5">●</span>
                  <span className="text-gray-600">{ponto}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plano de ação */}
        <div className="card bg-primary-50 border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-2">Recomendações para você</h3>
          <p className="text-primary-700 text-sm leading-relaxed whitespace-pre-wrap">
            {diagnostico.planoAcao}
          </p>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3 pb-8">
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
