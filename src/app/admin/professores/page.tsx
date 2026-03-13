'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface ProfessorResumo {
  id: string;
  identificador: string;
  genero: string | null;
  faixaEtaria: string | null;
  totalJornadas: number;
  jornadasConcluidas: number;
  ultimoDiagnostico: {
    perfilEmocional: string;
    nivelEstresse: string;
    criadoEm: string;
  } | null;
}

const coresEstresse: Record<string, string> = {
  baixo: 'bg-green-100/80 text-green-700 border border-green-200/50',
  moderado: 'bg-yellow-100/80 text-yellow-700 border border-yellow-200/50',
  elevado: 'bg-red-100/80 text-red-700 border border-red-200/50',
};

const emojisPerfil: Record<string, string> = {
  A: '💪', B: '🌟', C: '⚡', D: '😔', E: '🆘',
};

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<ProfessorResumo[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/professores')
      .then((r) => r.json())
      .then((d) => setProfessores(d.professores || []))
      .finally(() => setCarregando(false));
  }, []);

  return (
    <div className="min-h-screen bg-organic font-[Nunito]">
      <Header titulo="Professores" subtitulo="Visao anonimizada dos respondentes">
        <a
          href="/admin"
          className="text-sm text-primary-600 hover:text-primary-800 font-semibold transition-colors duration-200"
        >
          Voltar ao painel
        </a>
      </Header>

      <main className="max-w-7xl mx-auto p-6">
        {carregando ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-primary-400 text-sm font-medium mt-3">Carregando professores...</p>
          </div>
        ) : professores.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-primary-500 font-medium">Nenhum professor respondeu ainda.</p>
            <p className="text-primary-400 text-sm mt-1">Os dados aparecerao aqui conforme os professores completarem suas jornadas.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {professores.map((prof) => (
              <div
                key={prof.id}
                className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-warm-sm border border-primary-100/50 p-6 hover:shadow-warm hover:-translate-y-0.5 transition-all duration-300 animate-slide-up"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-primary-800 text-base">{prof.identificador}</h3>
                  {prof.ultimoDiagnostico && (
                    <span className="text-2xl drop-shadow-sm">
                      {emojisPerfil[prof.ultimoDiagnostico.perfilEmocional] || '❓'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-primary-600">
                  {prof.genero && (
                    <p className="flex items-center gap-2">
                      <span className="text-primary-400">Genero:</span>
                      <span className="font-medium">{prof.genero}</span>
                    </p>
                  )}
                  {prof.faixaEtaria && (
                    <p className="flex items-center gap-2">
                      <span className="text-primary-400">Faixa etaria:</span>
                      <span className="font-medium">{prof.faixaEtaria}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <span className="text-primary-400">Jornadas:</span>
                    <span className="font-medium">{prof.jornadasConcluidas}/{prof.totalJornadas}</span>
                  </p>
                </div>

                {prof.ultimoDiagnostico && (
                  <div className="mt-4 pt-4 border-t border-primary-100/40">
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        coresEstresse[prof.ultimoDiagnostico.nivelEstresse] || 'bg-primary-50 text-primary-600 border border-primary-100/50'
                      }`}
                    >
                      Estresse: {prof.ultimoDiagnostico.nivelEstresse}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
