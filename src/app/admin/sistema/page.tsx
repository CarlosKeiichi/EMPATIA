'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface SistemaInfo {
  banco: { status: string; tipo: string };
  totais: { professores: number; escolas: number; jornadas: number; diagnosticos: number };
  ia: { modelo: string; configsAtivas: number; totalConfigs: number };
  perguntas: { total: number; trabalho: number; relacionamentos: number; financas: number; estresse: number };
}

export default function SistemaPage() {
  const [info, setInfo] = useState<SistemaInfo | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const res = await fetch('/api/admin/sistema');
        const data = await res.json();
        setInfo(data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return (
      <AdminLayout titulo="Sistema" subtitulo="Informações e status do sistema">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!info) {
    return (
      <AdminLayout titulo="Sistema" subtitulo="Informações e status do sistema">
        <div className="flex items-center justify-center py-32">
          <div className="bg-white rounded-2xl border border-[#ece8e1] px-8 py-10 text-center">
            <p className="text-[#9a9590] font-medium">Erro ao carregar informações.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titulo="Sistema" subtitulo="Informações e status do sistema">
      <div className="space-y-6">
        {/* Status do Banco */}
        <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
          <h3 className="font-bold text-[#2d2a26] text-[14px] mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#2d7a5e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="10" cy="5" rx="7" ry="3" />
              <path d="M3 5v5c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
              <path d="M3 10v5c0 1.66 3.13 3 7 3s7-1.34 7-3v-5" />
            </svg>
            Banco de Dados
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60">
              <p className="text-[11px] text-[#9a9590] font-bold uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${info.banco.status === 'online' ? 'bg-[#2d7a5e]' : 'bg-[#dc6b6b]'}`} />
                <p className="text-[14px] font-bold text-[#2d2a26] capitalize">{info.banco.status}</p>
              </div>
            </div>
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60">
              <p className="text-[11px] text-[#9a9590] font-bold uppercase tracking-wider">Tipo</p>
              <p className="text-[14px] font-bold text-[#2d2a26] mt-1.5">{info.banco.tipo}</p>
            </div>
          </div>
        </div>

        {/* Totais */}
        <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
          <h3 className="font-bold text-[#2d2a26] text-[14px] mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#2d7a5e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="16" height="14" rx="2" />
              <path d="M6 7h8M6 10h5M6 13h7" />
            </svg>
            Totais
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Professores', valor: info.totais.professores },
              { label: 'Escolas', valor: info.totais.escolas },
              { label: 'Jornadas', valor: info.totais.jornadas },
              { label: 'Diagnósticos', valor: info.totais.diagnosticos },
            ].map((item) => (
              <div key={item.label} className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60 text-center">
                <p className="text-2xl font-extrabold text-[#2d2a26]">{item.valor}</p>
                <p className="text-[11px] text-[#9a9590] font-bold mt-0.5 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* IA */}
        <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
          <h3 className="font-bold text-[#2d2a26] text-[14px] mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#2d7a5e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="7" />
              <path d="M10 6v4l2.5 2.5" />
            </svg>
            Inteligência Artificial
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60">
              <p className="text-[11px] text-[#9a9590] font-bold uppercase tracking-wider">Modelo Padrão</p>
              <p className="text-[13px] font-bold text-[#2d2a26] mt-1.5">{info.ia.modelo}</p>
            </div>
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60">
              <p className="text-[11px] text-[#9a9590] font-bold uppercase tracking-wider">Configs Ativas</p>
              <p className="text-2xl font-extrabold text-[#2d7a5e] mt-1">{info.ia.configsAtivas}</p>
              <p className="text-[11px] text-[#b5b0a8] font-medium">de {info.ia.totalConfigs} total</p>
            </div>
            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#ece8e1]/60">
              <p className="text-[11px] text-[#9a9590] font-bold uppercase tracking-wider">Provider</p>
              <p className="text-[13px] font-bold text-[#2d2a26] mt-1.5">Anthropic Claude</p>
            </div>
          </div>
        </div>

        {/* Perguntas */}
        <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
          <h3 className="font-bold text-[#2d2a26] text-[14px] mb-4 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#2d7a5e" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="10" r="8" />
              <path d="M7.5 7.5a2.5 2.5 0 014.6 1.3c0 1.7-2.6 1.7-2.6 3.2M10 15v-.5" />
            </svg>
            Perguntas ({info.perguntas.total} total)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Trabalho', valor: info.perguntas.trabalho },
              { label: 'Estresse', valor: info.perguntas.estresse },
              { label: 'Relacionamentos', valor: info.perguntas.relacionamentos },
              { label: 'Finanças', valor: info.perguntas.financas },
            ].map((item) => (
              <div key={item.label} className="bg-[#e8f5ee] rounded-xl p-4 text-center border border-[#c5e6d4]/50">
                <p className="text-2xl font-extrabold text-[#2d7a5e]">{item.valor}</p>
                <p className="text-[11px] text-[#4a6b5d] font-bold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
