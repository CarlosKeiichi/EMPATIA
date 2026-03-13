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
  baixo: 'bg-green-100 text-green-700',
  moderado: 'bg-yellow-100 text-yellow-700',
  elevado: 'bg-red-100 text-red-700',
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
    <div className="min-h-screen bg-gray-50">
      <Header titulo="Professores" subtitulo="Visão anonimizada dos respondentes">
        <a href="/admin" className="text-sm text-primary-600 hover:underline">
          Voltar ao painel
        </a>
      </Header>

      <main className="max-w-7xl mx-auto p-6">
        {carregando ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : professores.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nenhum professor respondeu ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professores.map((prof) => (
              <div key={prof.id} className="card hover:shadow-md transition">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{prof.identificador}</h3>
                  {prof.ultimoDiagnostico && (
                    <span className="text-xl">
                      {emojisPerfil[prof.ultimoDiagnostico.perfilEmocional] || '❓'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  {prof.genero && <p>Gênero: {prof.genero}</p>}
                  {prof.faixaEtaria && <p>Faixa etária: {prof.faixaEtaria}</p>}
                  <p>Jornadas: {prof.jornadasConcluidas}/{prof.totalJornadas}</p>
                </div>

                {prof.ultimoDiagnostico && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        coresEstresse[prof.ultimoDiagnostico.nivelEstresse] || 'bg-gray-100 text-gray-600'
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
