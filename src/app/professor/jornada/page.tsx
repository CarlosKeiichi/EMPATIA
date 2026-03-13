'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogoMini } from '@/components/Logo';

interface Mensagem {
  role: 'user' | 'assistant';
  conteudo: string;
}

export default function JornadaPage() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [jornadaId, setJornadaId] = useState<string | null>(null);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>[]>([]);
  const [erroInicio, setErroInicio] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tipoJornada = typeof window !== 'undefined' ? sessionStorage.getItem('tipoJornada') : 'trabalho';
  const estadoInicial = typeof window !== 'undefined' ? sessionStorage.getItem('estadoEmocionalInicial') : 'C';
  const configIA = `marcia_jornada_${tipoJornada}`;

  const nomesJornada: Record<string, string> = {
    trabalho: 'Trabalho',
    relacionamentos: 'Relacionamentos',
    financas: 'Finanças',
  };

  const coresJornada: Record<string, string> = {
    trabalho: 'bg-blue-500',
    relacionamentos: 'bg-amber-500',
    financas: 'bg-emerald-500',
  };

  // Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [mensagens, carregando]);

  // Focus no input quando parar de carregar
  useEffect(() => {
    if (!carregando) inputRef.current?.focus();
  }, [carregando]);

  // Iniciar jornada
  useEffect(() => {
    iniciarJornada();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarJornada() {
    try {
      const res = await fetch('/api/jornada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoJornada, estadoEmocionalInicial: estadoInicial }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErroInicio('Você já tem uma jornada em andamento. Redirecionando...');
          setTimeout(() => router.push('/professor'), 2000);
          return;
        }
        setErroInicio(data.erro || 'Erro ao iniciar jornada');
        return;
      }

      if (data.jornada) setJornadaId(data.jornada.id);

      // Primeira mensagem da Márcia
      await enviarParaIA('Olá! Estou pronto(a) para começar a jornada.', true);
    } catch (error) {
      console.error('Erro ao iniciar jornada:', error);
      setErroInicio('Erro de conexão. Tente novamente.');
    }
  }

  async function enviarParaIA(texto: string, primeiraMsg = false) {
    setCarregando(true);

    if (!primeiraMsg) {
      setMensagens((prev) => [...prev, { role: 'user', conteudo: texto }]);
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversaId,
          mensagem: texto,
          configIA,
          contexto: `Jornada: ${tipoJornada}\nEstado emocional inicial: ${estadoInicial}\nEtapa: ${etapaAtual}`,
        }),
      });

      const data = await res.json();
      if (data.conversaId) setConversaId(data.conversaId);

      setMensagens((prev) => [...prev, { role: 'assistant', conteudo: data.resposta }]);
      setEtapaAtual((e) => e + 1);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setMensagens((prev) => [
        ...prev,
        { role: 'assistant', conteudo: 'Desculpe, tive um problema. Pode tentar novamente?' },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || carregando) return;

    const texto = input.trim();
    setInput('');

    setRespostas((prev) => [
      ...prev,
      { etapa: String(etapaAtual), valor: texto, bloco: tipoJornada || '' },
    ]);

    enviarParaIA(texto);
  }

  function selecionarEscala(valor: number) {
    if (carregando) return;
    const texto = String(valor);
    setRespostas((prev) => [
      ...prev,
      { etapa: String(etapaAtual), valor: texto, bloco: tipoJornada || '' },
    ]);
    enviarParaIA(texto);
  }

  async function finalizarJornada() {
    if (finalizando) return;
    setFinalizando(true);

    try {
      const res = await fetch('/api/jornada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jornadaId,
          respostas: respostas.map((r, i) => ({
            perguntaId: `pergunta_${i}`,
            bloco: r.bloco,
            pergunta: `Pergunta ${i + 1}`,
            tipo: 'aberta',
            valor: r.valor,
            pontuacao: isNaN(Number(r.valor)) ? null : Number(r.valor),
          })),
          finalizar: true,
        }),
      });

      const data = await res.json();
      if (data.diagnostico) {
        sessionStorage.setItem('diagnostico', JSON.stringify(data.diagnostico));
        router.push('/professor/diagnostico');
      }
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      setFinalizando(false);
    }
  }

  if (erroInicio) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-500 text-xl">!</span>
          </div>
          <p className="text-gray-600">{erroInicio}</p>
          <button onClick={() => router.push('/professor')} className="btn-secondary">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header do chat */}
      <header className="border-b border-gray-100 px-4 py-3 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <LogoMini size={32} />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${coresJornada[tipoJornada || 'trabalho']} rounded-full border-2 border-white`} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm">Márcia</h1>
            <p className="text-xs text-gray-400">
              Jornada: {nomesJornada[tipoJornada || ''] || 'Trabalho'}
              {etapaAtual > 0 && <span className="ml-1 text-gray-300">· Etapa {etapaAtual}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {respostas.length >= 3 && (
            <button
              onClick={finalizarJornada}
              disabled={finalizando}
              className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition disabled:opacity-50"
            >
              {finalizando ? 'Finalizando...' : 'Finalizar jornada'}
            </button>
          )}
          <button
            onClick={() => router.push('/professor')}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Mensagens */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {mensagens.length === 0 && !carregando && (
          <div className="text-center text-gray-400 text-sm py-12">
            Iniciando conversa com a Márcia...
          </div>
        )}

        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <span className="text-xs font-medium text-primary-700">M</span>
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.conteudo}</p>
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <span className="text-xs font-medium text-primary-700">M</span>
            </div>
            <div className="chat-bubble-ai flex gap-1 py-4">
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Escala rápida de 0-10 */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 justify-center flex-wrap">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => selecionarEscala(n)}
              disabled={carregando}
              className="w-9 h-9 rounded-lg text-xs font-medium border border-gray-200 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition disabled:opacity-50"
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-1">
          0 = não incomoda · 10 = muito grave
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleEnviar} className="border-t border-gray-100 p-4 bg-white sticky bottom-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="input flex-1 text-sm"
            placeholder="Digite sua resposta..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={carregando}
          />
          <button
            type="submit"
            disabled={carregando || !input.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
