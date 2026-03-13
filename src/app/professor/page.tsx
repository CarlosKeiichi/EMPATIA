'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

const jornadas = [
  {
    tipo: 'trabalho',
    titulo: 'Trabalho',
    descricao: 'Explore como sua atividade docente impacta seu emocional',
    icone: '🏫',
    cor: 'bg-primary-50/60 border-primary-200/60 hover:border-primary-400 hover:bg-primary-50',
    corTexto: 'text-primary-700',
    corIconeBg: 'bg-primary-100',
  },
  {
    tipo: 'relacionamentos',
    titulo: 'Relacionamentos',
    descricao: 'Reflita sobre suas relações pessoais e inteligência emocional',
    icone: '💛',
    cor: 'bg-warm-50/60 border-warm-300/60 hover:border-warm-400 hover:bg-warm-50',
    corTexto: 'text-warm-700',
    corIconeBg: 'bg-warm-100',
  },
  {
    tipo: 'financas',
    titulo: 'Finanças',
    descricao: 'Entenda como sua situação financeira afeta seu bem-estar',
    icone: '💰',
    cor: 'bg-primary-50/40 border-primary-100/60 hover:border-primary-300 hover:bg-primary-50/60',
    corTexto: 'text-primary-800',
    corIconeBg: 'bg-primary-50',
  },
];

const estadosEmocionais = [
  {
    valor: 'A',
    label: 'Muito fortalecido(a)',
    emoji: '💪',
    corAtivo: 'bg-emotion-strength/10 border-emotion-strength/50 text-primary-900',
    corBorda: 'border-emotion-strength/30',
  },
  {
    valor: 'B',
    label: 'Esperançoso(a)',
    emoji: '🌟',
    corAtivo: 'bg-emotion-hope/10 border-emotion-hope/50 text-primary-900',
    corBorda: 'border-emotion-hope/30',
  },
  {
    valor: 'C',
    label: 'Em alerta',
    emoji: '⚡',
    corAtivo: 'bg-emotion-alert/10 border-emotion-alert/50 text-primary-900',
    corBorda: 'border-emotion-alert/30',
  },
  {
    valor: 'D',
    label: 'Cansado(a)',
    emoji: '😮‍💨',
    corAtivo: 'bg-emotion-tired/10 border-emotion-tired/50 text-primary-900',
    corBorda: 'border-emotion-tired/30',
  },
  {
    valor: 'E',
    label: 'Sobrecarregado(a)',
    emoji: '🫂',
    corAtivo: 'bg-emotion-overwhelm/10 border-emotion-overwhelm/50 text-primary-900',
    corBorda: 'border-emotion-overwhelm/30',
  },
];

export default function ProfessorHome() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<'loading' | 'boas_vindas' | 'retornante' | 'jornada_aberta' | 'estado_emocional' | 'escolha_jornada'>('loading');
  const [estadoEmocional, setEstadoEmocional] = useState('');
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [diasDesdeUltima, setDiasDesdeUltima] = useState<number | null>(null);
  const [temLembrete, setTemLembrete] = useState(false);
  const [jornadaAberta, setJornadaAberta] = useState<{ id: string; tipo: string; iniciadaEm: string } | null>(null);
  const [abandonando, setAbandonando] = useState(false);

  useEffect(() => {
    async function verificarRetornante() {
      try {
        const [authRes, jornadaRes] = await Promise.all([
          fetch('/api/auth'),
          fetch('/api/jornada'),
        ]);
        const authData = await authRes.json();
        const jornadaData = await jornadaRes.json();

        if (authData.nome) setNomeUsuario(authData.nome.split(' ')[0]);

        const todasJornadas = jornadaData.jornadas || [];
        const emAndamento = todasJornadas.find(
          (j: { status: string }) => j.status === 'em_andamento'
        );
        if (emAndamento) {
          setJornadaAberta({ id: emAndamento.id, tipo: emAndamento.tipo, iniciadaEm: emAndamento.iniciadaEm });
        }

        const concluidas = todasJornadas.filter(
          (j: { status: string }) => j.status === 'concluida'
        );

        if (emAndamento) {
          setEtapa('jornada_aberta');
        } else if (concluidas.length > 0) {
          const ultima = new Date(concluidas[0].concluidaEm || concluidas[0].iniciadaEm);
          const dias = Math.floor((Date.now() - ultima.getTime()) / (1000 * 60 * 60 * 24));
          setDiasDesdeUltima(dias);

          // Verificar lembrete
          const lembreteDia = localStorage.getItem('lembreteCheckin');
          if (lembreteDia && dias >= 5) {
            const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
            const hoje = diasSemana[new Date().getDay()];
            if (hoje === lembreteDia) setTemLembrete(true);
          }

          setEtapa('retornante');
        } else {
          setEtapa('boas_vindas');
        }
      } catch {
        setEtapa('boas_vindas');
      }
    }
    verificarRetornante();
  }, []);

  function iniciarJornada(tipo: string) {
    sessionStorage.setItem('estadoEmocionalInicial', estadoEmocional);
    sessionStorage.setItem('tipoJornada', tipo);
    router.push('/professor/jornada');
  }

  function continuarJornada() {
    if (!jornadaAberta) return;
    sessionStorage.setItem('tipoJornada', jornadaAberta.tipo);
    sessionStorage.setItem('jornadaAbertaId', jornadaAberta.id);
    router.push('/professor/jornada');
  }

  async function abandonarJornada() {
    if (!jornadaAberta) return;
    setAbandonando(true);
    try {
      const res = await fetch(`/api/jornada?jornadaId=${jornadaAberta.id}`, { method: 'DELETE' });
      if (res.ok) {
        setJornadaAberta(null);
        setEtapa(diasDesdeUltima !== null ? 'retornante' : 'boas_vindas');
      }
    } catch {
      // silently fail
    } finally {
      setAbandonando(false);
    }
  }

  // Loading
  if (etapa === 'loading') {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-primary-300 text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tela de retornante - modo rapido
  if (etapa === 'retornante') {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6 animate-fade-in">
          <div className="animate-float">
            <Logo size={60} className="mx-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary-950">
              Olá de volta{nomeUsuario ? `, ${nomeUsuario}` : ''}!
            </h1>
            <p className="text-warm-500 text-sm leading-relaxed">
              Que bom te ver novamente. A Márcia está aqui para você.
            </p>
          </div>

          {/* Nudge de lembrete */}
          {temLembrete && (
            <div className="card bg-primary-50/80 border-primary-200/60 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔔</span>
                <p className="text-sm text-primary-700 font-medium">
                  Hoje é seu dia de check-in! Como você está se sentindo?
                </p>
              </div>
            </div>
          )}

          {/* Info ultima jornada */}
          {diasDesdeUltima !== null && (
            <p className="text-xs text-primary-400 font-medium">
              Última jornada: {diasDesdeUltima === 0 ? 'hoje' : diasDesdeUltima === 1 ? 'ontem' : `${diasDesdeUltima} dias atrás`}
            </p>
          )}

          {/* Micro check-in rapido */}
          <div className="card animate-slide-up">
            <p className="text-sm font-semibold text-primary-800 mb-4">Como você está hoje?</p>
            <div className="grid grid-cols-5 gap-2">
              {estadosEmocionais.map((e) => (
                <button
                  key={e.valor}
                  onClick={() => {
                    setEstadoEmocional(e.valor);
                    setEtapa('escolha_jornada');
                  }}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-primary-100/40 hover:border-primary-300 hover:bg-primary-50/60 transition-all duration-300"
                >
                  <span className="text-2xl">{e.emoji}</span>
                  <span className="text-[10px] text-primary-500 font-medium leading-tight text-center">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Atalhos */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setEtapa('escolha_jornada')}
              className="btn-primary w-full"
            >
              Ir direto para jornadas
            </button>
            <button
              onClick={() => router.push('/professor/historico')}
              className="text-sm text-primary-400 hover:text-primary-600 font-medium transition-colors duration-300 underline underline-offset-4 decoration-primary-200 hover:decoration-primary-400"
            >
              Ver meu histórico
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela de jornada em andamento
  if (etapa === 'jornada_aberta' && jornadaAberta) {
    const tipoLabel = jornadas.find((j) => j.tipo === jornadaAberta.tipo);
    const inicio = new Date(jornadaAberta.iniciadaEm);
    const tempoAtras = Math.floor((Date.now() - inicio.getTime()) / (1000 * 60));
    const tempoTexto = tempoAtras < 60
      ? `${tempoAtras} minutos atrás`
      : tempoAtras < 1440
        ? `${Math.floor(tempoAtras / 60)} horas atrás`
        : `${Math.floor(tempoAtras / 1440)} dias atrás`;

    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6 animate-fade-in">
          <div className="animate-float">
            <Logo size={60} className="mx-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary-950">
              {nomeUsuario ? `Olá, ${nomeUsuario}!` : 'Olá!'}
            </h1>
            <p className="text-warm-500 text-sm leading-relaxed">
              Você tem uma jornada em andamento.
            </p>
          </div>

          <div className="card border-2 border-primary-200/60 bg-primary-50/40">
            <div className="flex items-center gap-4">
              <span className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl">
                {tipoLabel?.icone || '📋'}
              </span>
              <div className="text-left">
                <h3 className="font-bold text-primary-800">{tipoLabel?.titulo || jornadaAberta.tipo}</h3>
                <p className="text-xs text-primary-400 mt-0.5">Iniciada {tempoTexto}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={continuarJornada}
              className="btn-primary w-full"
            >
              Continuar jornada
            </button>
            <button
              onClick={abandonarJornada}
              disabled={abandonando}
              className="btn-secondary w-full text-warm-500 border-warm-200 hover:border-warm-300 hover:text-warm-600"
            >
              {abandonando ? 'Abandonando...' : 'Desistir e começar nova'}
            </button>
          </div>

          <button
            onClick={() => router.push('/professor/historico')}
            className="text-sm text-primary-400 hover:text-primary-600 font-medium transition-colors duration-300 underline underline-offset-4 decoration-primary-200 hover:decoration-primary-400"
          >
            Ver meu histórico
          </button>
        </div>
      </div>
    );
  }

  // Tela de boas-vindas (primeiro acesso)
  if (etapa === 'boas_vindas') {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
          <div className="animate-float">
            <Logo size={80} className="mx-auto" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-primary-950">Olá! Eu sou a Márcia</h1>
            <p className="text-xs text-primary-400 font-semibold tracking-wide">powered by EmpatIA</p>
            <p className="text-warm-600 mt-3 leading-relaxed">
              Estou aqui para te ouvir e ajudar a refletir sobre como você está se sentindo.
            </p>
          </div>

          <div className="card text-left space-y-4 animate-slide-up">
            <p className="text-warm-700 text-sm font-medium">Antes de começarmos, quero que você saiba:</p>
            <ul className="space-y-3 text-sm text-warm-600 stagger-children">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">✅</span>
                <span className="pt-1">Isso não é uma prova — não existem respostas certas ou erradas</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">🔒</span>
                <span className="pt-1">Suas respostas são anônimas e protegidas</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">💚</span>
                <span className="pt-1">Vá no seu ritmo — pode pausar quando quiser</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center">🎯</span>
                <span className="pt-1">No final, você receberá um retrato personalizado</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setEtapa('estado_emocional')}
            className="btn-primary w-full animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            Estou pronto(a) para começar
          </button>
        </div>
      </div>
    );
  }

  // Tela de estado emocional
  if (etapa === 'estado_emocional') {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-primary-950">Como você está se sentindo agora?</h2>
            <p className="text-warm-500 text-sm leading-relaxed">
              Em relação à sua saúde emocional como educador(a):
            </p>
          </div>

          <div className="space-y-3 stagger-children">
            {estadosEmocionais.map((estado) => (
              <button
                key={estado.valor}
                onClick={() => setEstadoEmocional(estado.valor)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${
                  estadoEmocional === estado.valor
                    ? `${estado.corAtivo} shadow-warm scale-[1.02]`
                    : `bg-white/70 backdrop-blur-sm ${estado.corBorda} hover:bg-white hover:shadow-warm-sm text-primary-800`
                }`}
              >
                <span className="text-2xl">{estado.emoji}</span>
                <span className="font-semibold">{estado.label}</span>
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
    <div className="min-h-screen bg-organic flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-primary-950">Qual área da vida você quer explorar?</h2>
          <p className="text-warm-500 text-sm leading-relaxed">
            Escolha por onde quer começar. Você pode fazer as outras depois.
          </p>
        </div>

        <div className="space-y-4 stagger-children">
          {jornadas.map((j) => (
            <button
              key={j.tipo}
              onClick={() => iniciarJornada(j.tipo)}
              className={`w-full p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5 backdrop-blur-sm ${j.cor}`}
            >
              <div className="flex items-center gap-4">
                <span className={`flex-shrink-0 w-14 h-14 rounded-2xl ${j.corIconeBg} flex items-center justify-center text-3xl`}>
                  {j.icone}
                </span>
                <div>
                  <h3 className={`font-bold text-lg ${j.corTexto}`}>{j.titulo}</h3>
                  <p className="text-warm-500 text-sm mt-0.5 leading-relaxed">{j.descricao}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push('/professor/historico')}
            className="text-sm text-primary-400 hover:text-primary-600 font-medium transition-colors duration-300 underline underline-offset-4 decoration-primary-200 hover:decoration-primary-400"
          >
            Ver meu histórico de jornadas
          </button>
        </div>
      </div>
    </div>
  );
}
