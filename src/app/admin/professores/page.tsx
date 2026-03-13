'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

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
  baixo: 'bg-[#e8f5ee] text-[#2d7a5e] border border-[#c5e6d4]',
  moderado: 'bg-[#fef9ee] text-[#b8860b] border border-[#f5e6c0]',
  elevado: 'bg-[#fef2f2] text-[#dc6b6b] border border-[#fcd5d5]',
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
    <AdminLayout titulo="Professores" subtitulo="Visão anonimizada dos respondentes">
      {carregando ? (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando professores...</p>
          </div>
        </div>
      ) : professores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ece8e1] text-center py-16 px-8">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-[#4a4842] font-semibold">Nenhum professor respondeu ainda.</p>
          <p className="text-[#9a9590] text-sm mt-1">Os dados aparecerão aqui conforme os professores completarem suas jornadas.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professores.map((prof) => (
            <div
              key={prof.id}
              className="bg-white rounded-2xl border border-[#ece8e1] p-5 hover:shadow-sm transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#2d2a26] text-[14px]">{prof.identificador}</h3>
                {prof.ultimoDiagnostico && (
                  <span className="text-xl">
                    {emojisPerfil[prof.ultimoDiagnostico.perfilEmocional] || '❓'}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-[13px]">
                {prof.genero && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#9a9590]">Gênero</span>
                    <span className="font-semibold text-[#4a4842]">{prof.genero}</span>
                  </div>
                )}
                {prof.faixaEtaria && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#9a9590]">Faixa etária</span>
                    <span className="font-semibold text-[#4a4842]">{prof.faixaEtaria}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#9a9590]">Jornadas</span>
                  <span className="font-semibold text-[#4a4842]">{prof.jornadasConcluidas}/{prof.totalJornadas}</span>
                </div>
              </div>

              {prof.ultimoDiagnostico && (
                <div className="mt-4 pt-4 border-t border-[#ece8e1]">
                  <span
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-full ${
                      coresEstresse[prof.ultimoDiagnostico.nivelEstresse] || 'bg-[#f5f3ef] text-[#4a4842] border border-[#ece8e1]'
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
    </AdminLayout>
  );
}
