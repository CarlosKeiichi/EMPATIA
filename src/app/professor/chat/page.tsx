'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

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

export default function ChatPage() {
  const router = useRouter();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carregar nome do usuário
  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => { if (d.nome) setNomeUsuario(d.nome.split(' ')[0]); })
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensagens, carregando]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function enviarMensagem(texto?: string) {
    const msg = texto || input.trim();
    if (!msg || carregando) return;
    setInput('');

    const novaMensagem: Mensagem = { role: 'user', conteudo: msg };
    setMensagens((prev) => [...prev, novaMensagem]);
    setCarregando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversaId,
          mensagem: msg,
          configIA: 'marcia_suporte',
        }),
      });

      const data = await res.json();
      if (data.erro) throw new Error(data.erro);

      if (data.conversaId) setConversaId(data.conversaId);

      setMensagens((prev) => [
        ...prev,
        { role: 'assistant', conteudo: data.resposta },
      ]);
    } catch {
      setMensagens((prev) => [
        ...prev,
        { role: 'assistant', conteudo: 'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?' },
      ]);
    } finally {
      setCarregando(false);
      inputRef.current?.focus();
    }
  }

  // Sugestões rápidas para iniciar conversa
  const sugestoes = [
    { emoji: '😮‍💨', texto: 'Preciso desabafar sobre meu dia' },
    { emoji: '💡', texto: 'Quero dicas de autocuidado' },
    { emoji: '🤔', texto: 'Estou lidando com uma situação difícil' },
    { emoji: '💬', texto: 'Só quero conversar' },
  ];

  return (
    <div className="min-h-screen bg-organic flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-primary-100/40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} />
            <div>
              <h1 className="text-sm font-bold text-primary-800">Márcia</h1>
              <p className="text-[10px] text-primary-400">Sua companheira de jornada</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/professor')}
              className="text-xs text-primary-500 hover:text-primary-700 font-medium px-3 py-1.5 rounded-xl hover:bg-primary-50 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {/* Welcome state */}
        {mensagens.length === 0 && !carregando && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
            <div className="animate-float">
              <Logo size={64} className="mx-auto" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-bold text-primary-800">
                {nomeUsuario ? `Oi, ${nomeUsuario}!` : 'Oi!'}
              </h2>
              <p className="text-sm text-warm-500 leading-relaxed max-w-sm">
                Este é nosso espaço livre de conversa. Pode falar sobre o que quiser — estou aqui para te ouvir.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {sugestoes.map((s) => (
                <button
                  key={s.texto}
                  onClick={() => enviarMensagem(s.texto)}
                  className="flex items-center gap-2 p-3 rounded-2xl border-2 border-primary-100/40 bg-white/70 hover:border-primary-300 hover:bg-primary-50/60 transition-all duration-300 text-left"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-xs font-medium text-primary-600">{s.texto}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {mensagens.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-white/80 backdrop-blur-sm border border-primary-100/40 text-primary-800 rounded-bl-md shadow-warm-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div dangerouslySetInnerHTML={{ __html: formatarMarkdown(msg.conteudo) }} />
              ) : (
                msg.conteudo
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {carregando && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-white/80 backdrop-blur-sm border border-primary-100/40 rounded-2xl rounded-bl-md p-4 shadow-warm-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t border-primary-100/40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <form
            onSubmit={(e) => { e.preventDefault(); enviarMensagem(); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="flex-1 px-4 py-3 rounded-2xl border-2 border-primary-100/40 bg-white/70 text-sm text-primary-800 placeholder:text-primary-300 focus:outline-none focus:border-primary-400 focus:bg-white transition-all duration-300"
              disabled={carregando}
              maxLength={5000}
            />
            <button
              type="submit"
              disabled={!input.trim() || carregando}
              className="px-4 py-3 rounded-2xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
