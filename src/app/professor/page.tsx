'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const jornadas = [
  {
    tipo: 'trabalho',
    titulo: 'Trabalho',
    descricao: 'Explore como sua atividade docente impacta seu emocional',
    icone: '🏫',
    cor: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    corTexto: 'text-blue-700',
  },
  {
    tipo: 'relacionamentos',
    titulo: 'Relacionamentos',
    descricao: 'Reflita sobre suas relações pessoais e inteligência emocional',
    icone: '💛',
    cor: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    corTexto: 'text-amber-700',
  },
  {
    tipo: 'financas',
    titulo: 'Finanças',
    descricao: 'Entenda como sua situação financeira afeta seu bem-estar',
    icone: '💰',
    cor: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    corTexto: 'text-emerald-700',
  },
];

const estadosEmocionais = [
  { valor: 'A', label: 'Muito fortalecido(a)', cor: 'bg-green-100 border-green-400 text-green-700' },
  { valor: 'B', label: 'Esperançoso(a)', cor: 'bg-blue-100 border-blue-400 text-blue-700' },
  { valor: 'C', label: 'Em alerta', cor: 'bg-yellow-100 border-yellow-400 text-yellow-700' },
  { valor: 'D', label: 'Cansado(a)', cor: 'bg-orange-100 border-orange-400 text-orange-700' },
  { valor: 'E', label: 'Sobrecarregado(a)', cor: 'bg-red-100 border-red-400 text-red-700' },
];

export default function ProfessorHome() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<'boas_vindas' | 'estado_emocional' | 'escolha_jornada'>('boas_vindas');
  const [estadoEmocional, setEstadoEmocional] = useState('');

  function iniciarJornada(tipo: string) {
    // Salva no sessionStorage e navega
    sessionStorage.setItem('estadoEmocionalInicial', estadoEmocional);
    sessionStorage.setItem('tipoJornada', tipo);
    router.push('/professor/jornada');
  }

  // Tela de boas-vindas
  if (etapa === 'boas_vindas') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <Logo size={80} className="mx-auto" />

          <div>
            <h1 className="text-2xl font-bold text-gray-800">Olá! Eu sou a Márcia</h1>
            <p className="text-xs text-purple-400 font-medium">powered by EmpatIA</p>
            <p className="text-gray-500 mt-2">
              Estou aqui para te ouvir e ajudar a refletir sobre como você está se sentindo.
            </p>
          </div>

          <div className="card text-left space-y-3">
            <p className="text-gray-600 text-sm">Antes de começarmos, quero que você saiba:</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span>✅</span> Isso não é uma prova — não existem respostas certas ou erradas</li>
              <li className="flex gap-2"><span>🔒</span> Suas respostas são anônimas e protegidas</li>
              <li className="flex gap-2"><span>💚</span> Vá no seu ritmo — pode pausar quando quiser</li>
              <li className="flex gap-2"><span>🎯</span> No final, você receberá um retrato personalizado</li>
            </ul>
          </div>

          <button onClick={() => setEtapa('estado_emocional')} className="btn-primary">
            Estou pronto(a) para começar
          </button>
        </div>
      </div>
    );
  }

  // Tela de estado emocional
  if (etapa === 'estado_emocional') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">Como você está se sentindo agora?</h2>
            <p className="text-gray-500 mt-1 text-sm">
              Em relação à sua saúde emocional como educador(a):
            </p>
          </div>

          <div className="space-y-3">
            {estadosEmocionais.map((estado) => (
              <button
                key={estado.valor}
                onClick={() => setEstadoEmocional(estado.valor)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  estadoEmocional === estado.valor
                    ? estado.cor
                    : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="font-medium">{estado.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setEtapa('escolha_jornada')}
            className="btn-primary w-full"
            disabled={!estadoEmocional}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Tela de escolha da jornada
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">Qual área da vida você quer explorar?</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Escolha por onde quer começar. Você pode fazer as outras depois.
          </p>
        </div>

        <div className="space-y-4">
          {jornadas.map((j) => (
            <button
              key={j.tipo}
              onClick={() => iniciarJornada(j.tipo)}
              className={`w-full p-5 rounded-xl border-2 text-left transition-all ${j.cor}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{j.icone}</span>
                <div>
                  <h3 className={`font-semibold ${j.corTexto}`}>{j.titulo}</h3>
                  <p className="text-gray-500 text-sm">{j.descricao}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center space-y-2">
          <button
            onClick={() => router.push('/professor/historico')}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Ver meu histórico de jornadas
          </button>
        </div>
      </div>
    </div>
  );
}
