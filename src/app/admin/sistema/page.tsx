'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdminNav from '@/components/AdminNav';

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
      <div className="min-h-screen bg-organic flex items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 border-3 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-primary-400 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center">
        <div className="card text-center px-8 py-10 animate-fade-in">
          <p className="text-warm-500 font-medium">Erro ao carregar informações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-organic font-[Nunito]">
      <Header titulo="EmpatIA — Sistema" subtitulo="Informações e status do sistema" />

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <AdminNav />

        <h2 className="text-lg font-bold text-primary-800">Visão Geral do Sistema</h2>

        {/* Status do Banco */}
        <div className="card">
          <h3 className="font-bold text-primary-700 text-sm mb-4 flex items-center gap-2">
            <span className="text-lg">🗄️</span> Banco de Dados
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40">
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${info.banco.status === 'online' ? 'bg-green-400' : 'bg-red-400'}`} />
                <p className="text-sm font-bold text-primary-800 capitalize">{info.banco.status}</p>
              </div>
            </div>
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40">
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">Tipo</p>
              <p className="text-sm font-bold text-primary-800 mt-1">{info.banco.tipo}</p>
            </div>
          </div>
        </div>

        {/* Totais */}
        <div className="card">
          <h3 className="font-bold text-primary-700 text-sm mb-4 flex items-center gap-2">
            <span className="text-lg">📋</span> Totais
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Professores', valor: info.totais.professores, icon: '👩‍🏫' },
              { label: 'Escolas', valor: info.totais.escolas, icon: '🏫' },
              { label: 'Jornadas', valor: info.totais.jornadas, icon: '🗺️' },
              { label: 'Diagnósticos', valor: info.totais.diagnosticos, icon: '📊' },
            ].map((item) => (
              <div key={item.label} className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40 text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-2xl font-extrabold text-primary-800 mt-1">{item.valor}</p>
                <p className="text-xs text-primary-500 font-bold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* IA */}
        <div className="card">
          <h3 className="font-bold text-primary-700 text-sm mb-4 flex items-center gap-2">
            <span className="text-lg">🤖</span> Inteligência Artificial
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40">
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">Modelo Padrão</p>
              <p className="text-sm font-bold text-primary-800 mt-1">{info.ia.modelo}</p>
            </div>
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40">
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">Configs Ativas</p>
              <p className="text-2xl font-extrabold text-primary-800 mt-1">{info.ia.configsAtivas}</p>
              <p className="text-xs text-primary-400">de {info.ia.totalConfigs} total</p>
            </div>
            <div className="bg-primary-50/60 rounded-2xl p-4 border border-primary-100/40">
              <p className="text-xs text-primary-500 font-bold uppercase tracking-wider">Provider</p>
              <p className="text-sm font-bold text-primary-800 mt-1">Anthropic Claude</p>
            </div>
          </div>
        </div>

        {/* Perguntas */}
        <div className="card">
          <h3 className="font-bold text-primary-700 text-sm mb-4 flex items-center gap-2">
            <span className="text-lg">❓</span> Perguntas ({info.perguntas.total} total)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Trabalho', valor: info.perguntas.trabalho, cor: 'bg-blue-100 text-blue-700' },
              { label: 'Estresse', valor: info.perguntas.estresse, cor: 'bg-orange-100 text-orange-700' },
              { label: 'Relacionamentos', valor: info.perguntas.relacionamentos, cor: 'bg-purple-100 text-purple-700' },
              { label: 'Finanças', valor: info.perguntas.financas, cor: 'bg-green-100 text-green-700' },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl p-4 text-center ${item.cor}`}>
                <p className="text-2xl font-extrabold">{item.valor}</p>
                <p className="text-xs font-bold mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
