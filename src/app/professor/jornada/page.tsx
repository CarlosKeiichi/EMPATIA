'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Mensagem {
  role: 'user' | 'assistant';
  conteudo: string;
}

function formatarMarkdown(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul class="list-disc pl-4 my-1">$1</ul>')
    .replace(/\n/g, '<br />');
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
  const [totalPerguntas, setTotalPerguntas] = useState(0);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tipoJornada = typeof window !== 'undefined' ? sessionStorage.getItem('tipoJornada') : 'trabalho';
  const estadoInicial = typeof window !== 'undefined' ? (sessionStorage.getItem('estadoEmocionalInicial') || 'C') : 'C';
  const configIA = `marcia_jornada_${tipoJornada}`;

  const nomesJornada: Record<string, string> = {
    trabalho: 'Trabalho',
    relacionamentos: 'Relacionamentos',
    financas: 'Finanças',
  };

  const coresJornada: Record<string, string> = {
    trabalho: 'bg-primary-500',
    relacionamentos: 'bg-warm-500',
    financas: 'bg-primary-400',
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

  // Buscar nome do usuario
  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => { if (d.nome) setNomeUsuario(d.nome.split(' ')[0]); })
      .catch(() => {});
  }, []);

  // Iniciar jornada
  useEffect(() => {
    iniciarJornada();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function iniciarJornada() {
    try {
      // Verificar se estamos continuando uma jornada aberta
      const jornadaAbertaId = typeof window !== 'undefined' ? sessionStorage.getItem('jornadaAbertaId') : null;

      if (jornadaAbertaId) {
        // Continuando jornada existente — não precisa criar nova
        sessionStorage.removeItem('jornadaAbertaId');
        setJornadaId(jornadaAbertaId);

        const contextoInicial = nomeUsuario
          ? `O nome do professor(a) é ${nomeUsuario}. Ele(a) está retomando uma jornada que havia pausado. Cumprimente e acolha.`
          : 'O professor(a) está retomando uma jornada que havia pausado. Acolha e continue.';
        await enviarParaIA('Olá! Estou retomando minha jornada.', true, contextoInicial);
        return;
      }

      const res = await fetch('/api/jornada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoJornada, estadoEmocionalInicial: estadoInicial }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Jornada já existe — buscar e continuar em vez de redirecionar
          const jornadasRes = await fetch('/api/jornada');
          const jornadasData = await jornadasRes.json();
          const aberta = jornadasData.jornadas?.find((j: { status: string }) => j.status === 'em_andamento');
          if (aberta) {
            setJornadaId(aberta.id);
            const ctx = nomeUsuario
              ? `O nome do professor(a) é ${nomeUsuario}. Ele(a) está retomando uma jornada. Cumprimente e acolha.`
              : 'O professor(a) está retomando uma jornada. Acolha e continue.';
            await enviarParaIA('Olá! Estou retomando minha jornada.', true, ctx);
            return;
          }
          setErroInicio('Erro ao encontrar jornada em andamento.');
          return;
        }
        setErroInicio(data.erro || 'Erro ao iniciar jornada');
        return;
      }

      if (data.jornada) setJornadaId(data.jornada.id);
      if (data.perguntas?.length) setTotalPerguntas(data.perguntas.length);

      // Primeira mensagem da Márcia
      const contextoInicial = nomeUsuario
        ? `O nome do professor(a) é ${nomeUsuario}. Cumprimente pelo nome de forma acolhedora.`
        : '';
      await enviarParaIA('Olá! Estou pronto(a) para começar a jornada.', true, contextoInicial);
    } catch (error) {
      console.error('Erro ao iniciar jornada:', error);
      setErroInicio('Erro de conexão. Tente novamente.');
    }
  }

  async function enviarParaIA(texto: string, primeiraMsg = false, contextoExtra = '') {
    setCarregando(true);

    if (!primeiraMsg) {
      setMensagens((prev) => [...prev, { role: 'user', conteudo: texto }]);
    }

    try {
      const contextoBase = `Jornada: ${tipoJornada}\nEstado emocional inicial: ${estadoInicial}\nEtapa: ${etapaAtual}`;
      const contextoNome = nomeUsuario ? `\nNome do professor(a): ${nomeUsuario}` : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversaId,
          mensagem: texto,
          configIA,
          contexto: contextoBase + contextoNome + (contextoExtra ? `\n${contextoExtra}` : ''),
        }),
      });

      const data = await res.json();
      if (data.conversaId) setConversaId(data.conversaId);

      const textoResposta = data.resposta || data.erro || 'Desculpe, não consegui responder. Tente novamente.';
      setMensagens((prev) => [...prev, { role: 'assistant', conteudo: textoResposta }]);
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

  // Detectar se a ultima mensagem da IA pede escala 0-10
  const ultimaMsgIA = mensagens.filter((m) => m.role === 'assistant').slice(-1)[0];
  const mostrarEscala = ultimaMsgIA && /(?:0\s*a\s*10|escala|nota|pontue|avalie.*número)/i.test(ultimaMsgIA.conteudo);

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

  // Progresso
  const progresso = totalPerguntas > 0
    ? Math.min((respostas.length / totalPerguntas) * 100, 100)
    : 0;

  if (erroInicio) {
    return (
      <div className="min-h-screen bg-organic flex items-center justify-center p-4">
        <div className="text-center space-y-5 animate-fade-in">
          <div className="w-14 h-14 bg-emotion-overwhelm/10 rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-emotion-overwhelm text-xl font-bold">!</span>
          </div>
          <p className="text-warm-600 leading-relaxed">{erroInicio}</p>
          <button onClick={() => router.push('/professor')} className="btn-secondary">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-50">
      {/* Header do chat */}
      <header className="bg-white/70 backdrop-blur-md border-b border-primary-100/40 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-warm-sm">
                <span className="text-sm font-bold text-primary-700">M</span>
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${coresJornada[tipoJornada || 'trabalho']} rounded-full border-2 border-white`} />
            </div>
            <div>
              <h1 className="font-bold text-primary-950 text-sm">Márcia</h1>
              <p className="text-xs text-primary-400 font-medium">
                {nomesJornada[tipoJornada || ''] || 'Trabalho'}
                {totalPerguntas > 0 && respostas.length > 0 && (
                  <span className="ml-1 text-primary-300">· {respostas.length}/{totalPerguntas}</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {respostas.length >= 3 && (
              <button
                onClick={finalizarJornada}
                disabled={finalizando}
                className="text-xs font-semibold bg-primary-50 text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-100 hover:shadow-warm-sm transition-all duration-300 disabled:opacity-50"
              >
                {finalizando ? 'Finalizando...' : 'Finalizar jornada'}
              </button>
            )}
            <button
              onClick={() => router.push('/professor')}
              className="text-xs text-primary-400 hover:text-primary-600 font-medium px-2 py-1.5 transition-colors duration-300"
            >
              Sair
            </button>
          </div>
        </div>
        {/* Barra de progresso */}
        {totalPerguntas > 0 && respostas.length > 0 && (
          <div className="mt-2.5">
            <div className="h-1.5 bg-primary-100/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Mensagens */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5 bg-organic">
        {mensagens.length === 0 && !carregando && (
          <div className="text-center text-primary-300 text-sm py-16 animate-breathe">
            <div className="w-12 h-12 rounded-2xl bg-primary-100/50 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-400 text-lg font-bold">M</span>
            </div>
            Iniciando conversa com a Márcia...
          </div>
        )}

        {mensagens.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mr-2.5 mt-1 flex-shrink-0 shadow-warm-sm">
                <span className="text-xs font-bold text-primary-700">M</span>
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <div className="text-sm leading-relaxed prose-chat" dangerouslySetInnerHTML={{ __html: formatarMarkdown(msg.conteudo) }} />
            </div>
          </div>
        ))}

        {carregando && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mr-2.5 mt-1 flex-shrink-0 shadow-warm-sm">
              <span className="text-xs font-bold text-primary-700">M</span>
            </div>
            <div className="chat-bubble-ai flex gap-1.5 py-4">
              <div className="typing-dot w-2 h-2 bg-primary-300 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-primary-300 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-primary-300 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Escala rápida de 0-10 — condicional */}
      {mostrarEscala && (
        <div className="px-4 pb-2 bg-warm-50 animate-slide-up">
          <div className="flex gap-1.5 justify-center flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => selecionarEscala(n)}
                disabled={carregando}
                className="w-10 h-10 rounded-xl text-xs font-semibold border-2 border-primary-100/60 bg-white/70 backdrop-blur-sm hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 text-primary-600 transition-all duration-300 disabled:opacity-50 hover:shadow-warm-sm"
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] text-primary-300 mt-1.5 font-medium">
            0 = não incomoda · 10 = muito grave
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleEnviar} className="border-t border-primary-100/30 p-4 bg-white/70 backdrop-blur-md sticky bottom-0">
        <div className="flex gap-3">
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
            className="btn-primary px-5 disabled:opacity-50"
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
