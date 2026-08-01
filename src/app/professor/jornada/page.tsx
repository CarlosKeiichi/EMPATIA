'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Mensagem {
  role: 'user' | 'assistant';
  conteudo: string;
}

interface PerguntaTeste {
  id: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes?: { valor: string; label: string }[];
}

interface TesteAtivo {
  id: string;
  perguntas: PerguntaTeste[];
  perguntaAtual: number;
  respostas: { perguntaId: string; bloco: string; pergunta: string; tipo: string; valor: string; pontuacao: number | null }[];
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
  const [testeAtivo, setTesteAtivo] = useState<TesteAtivo | null>(null);
  const [testesCompletados, setTestesCompletados] = useState<Set<string>>(new Set());
  const [avisoTeste, setAvisoTeste] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const TESTES_OBRIGATORIOS: Record<string, string[]> = {
    trabalho: ['estresse_ocupacional'],
    relacionamentos: ['inteligencia_emocional_teste', 'estilo_comunicacao', 'burnout_relacional_teste'],
    financas: [],
  };

  const NOMES_TESTE: Record<string, string> = {
    estresse_ocupacional: 'Estresse Ocupacional (IPCS)',
    inteligencia_emocional_teste: 'Inteligência Emocional',
    estilo_comunicacao: 'Estilo de Comunicação',
    burnout_relacional_teste: 'Burnout Relacional',
  };

  const tipoJornada = typeof window !== 'undefined' ? sessionStorage.getItem('tipoJornada') : 'trabalho';
  const estadoInicial = typeof window !== 'undefined' ? (sessionStorage.getItem('estadoEmocionalInicial') || 'C') : 'C';
  const configIA = `marcia_jornada_${tipoJornada}`;

  const testesPendentes = (TESTES_OBRIGATORIOS[tipoJornada || ''] || []).filter(
    (t) => !testesCompletados.has(t)
  );

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

  // Instruções de teste para o contexto da IA
  const instrucoesTeste = `
TESTES PSICOLÓGICOS ESTRUTURADOS:
Você pode convidar o professor a realizar testes psicológicos durante a conversa. Para isso, inclua o marcador [INICIAR_TESTE:id_do_teste] na sua resposta.

Testes disponíveis por jornada:
- Jornada "trabalho": [INICIAR_TESTE:estresse_ocupacional] (10 perguntas sobre estresse no trabalho)
- Jornada "relacionamentos":
  - [INICIAR_TESTE:inteligencia_emocional_teste] (15 perguntas sobre inteligência emocional)
  - [INICIAR_TESTE:estilo_comunicacao] (5 situações sobre estilo de comunicação)
  - [INICIAR_TESTE:burnout_relacional_teste] (10 perguntas sobre burnout relacional)

QUANDO usar testes:
- Na jornada "trabalho": convide para o teste de estresse ocupacional após explorar as dimensões de trabalho (após 4-6 trocas de mensagens)
- Na jornada "relacionamentos": convide para os testes após explorar autocuidado e relações (IE primeiro, depois comunicação, depois burnout)
- Use transições naturais e acolhedoras. Exemplo: "Agora eu gostaria de te convidar para um pequeno exercício..."

IMPORTANTE:
- Inclua apenas UM marcador por mensagem
- O sistema cuida da apresentação das perguntas — você NÃO precisa listar as perguntas
- Após o teste, você receberá os resultados e deve oferecer feedback acolhedor`;

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
          contexto: contextoBase + contextoNome + instrucoesTeste + (contextoExtra ? `\n${contextoExtra}` : ''),
        }),
      });

      const data = await res.json();
      if (data.conversaId) setConversaId(data.conversaId);

      const textoResposta = data.resposta || data.erro || 'Desculpe, não consegui responder. Tente novamente.';
      setMensagens((prev) => [...prev, { role: 'assistant', conteudo: textoResposta }]);
      setEtapaAtual((e) => e + 1);

      // Se a API retornou um teste, ativar modo teste
      if (data.teste) {
        setTesteAtivo({
          id: data.teste.id,
          perguntas: data.teste.perguntas,
          perguntaAtual: 0,
          respostas: [],
        });
      }
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

  // Responder pergunta do teste
  function responderTeste(valor: string, pontuacao: number | null) {
    if (!testeAtivo) return;
    const pergunta = testeAtivo.perguntas[testeAtivo.perguntaAtual];

    const novaResposta = {
      perguntaId: pergunta.id,
      bloco: pergunta.bloco,
      pergunta: pergunta.texto,
      tipo: pergunta.tipo,
      valor,
      pontuacao,
    };

    const novasRespostas = [...testeAtivo.respostas, novaResposta];
    const proximaPergunta = testeAtivo.perguntaAtual + 1;

    if (proximaPergunta >= testeAtivo.perguntas.length) {
      // Teste concluído — salvar respostas e enviar resultado para Márcia
      setTestesCompletados((prev) => new Set([...prev, testeAtivo.id]));
      setTesteAtivo(null);
      finalizarTeste(testeAtivo.id, novasRespostas);
    } else {
      setTesteAtivo({
        ...testeAtivo,
        perguntaAtual: proximaPergunta,
        respostas: novasRespostas,
      });
    }
  }

  async function finalizarTeste(
    testeId: string,
    respostasTeste: { perguntaId: string; bloco: string; pergunta: string; tipo: string; valor: string; pontuacao: number | null }[]
  ) {
    // Salvar respostas do teste na jornada
    if (jornadaId) {
      try {
        await fetch('/api/jornada', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jornadaId,
            respostas: respostasTeste,
            finalizar: false,
          }),
        });
      } catch (error) {
        console.error('Erro ao salvar respostas do teste:', error);
      }
    }

    // NÃO adicionar respostas de teste ao state local —
    // elas já foram salvas no banco via PUT acima.
    // Evita duplicação ao finalizar jornada.

    // Montar resumo para Márcia
    const resumo = respostasTeste
      .map((r) => `${r.pergunta}: ${r.valor}`)
      .join('\n');

    const nomesTeste: Record<string, string> = {
      estresse_ocupacional: 'Estresse Ocupacional (IPCS)',
      inteligencia_emocional_teste: 'Inteligência Emocional',
      estilo_comunicacao: 'Estilo de Comunicação',
      burnout_relacional_teste: 'Burnout Relacional',
    };

    enviarParaIA(
      `Concluí o teste de ${nomesTeste[testeId] || testeId}.`,
      false,
      `RESULTADO DO TESTE "${nomesTeste[testeId] || testeId}":\n${resumo}\n\nDê feedback acolhedor sobre os resultados. Não repita as perguntas. Interprete de forma empática e construtiva. Depois, continue a jornada naturalmente.`
    );
  }

  // Detectar se a ultima mensagem da IA pede escala 0-10
  const ultimaMsgIA = mensagens.filter((m) => m.role === 'assistant').slice(-1)[0];
  const mostrarEscala = !testeAtivo && ultimaMsgIA && /(?:0\s*a\s*10|escala|nota|pontue|avalie.*número)/i.test(ultimaMsgIA.conteudo);

  async function iniciarTestePendente() {
    if (testesPendentes.length === 0 || testeAtivo) return;
    const testeId = testesPendentes[0];
    try {
      const res = await fetch(`/api/jornada/teste?id=${testeId}`);
      const data = await res.json();
      if (data.perguntas?.length > 0) {
        setAvisoTeste('');
        setTesteAtivo({
          id: data.id,
          perguntas: data.perguntas,
          perguntaAtual: 0,
          respostas: [],
        });
        setMensagens((prev) => [
          ...prev,
          { role: 'assistant', conteudo: `Antes de finalizar, vamos completar o teste de **${NOMES_TESTE[testeId] || testeId}**. Responda as perguntas abaixo.` },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar teste:', error);
    }
  }

  async function finalizarJornada() {
    if (finalizando) return;

    // Verificar testes obrigatórios
    if (testesPendentes.length > 0) {
      const nomes = testesPendentes.map((t) => NOMES_TESTE[t] || t).join(', ');
      setAvisoTeste(`Complete os testes obrigatorios antes de finalizar: ${nomes}`);
      iniciarTestePendente();
      return;
    }

    setFinalizando(true);

    try {
      // Respostas de testes estruturados já foram salvas via finalizarTeste.
      // Aqui enviamos apenas respostas conversacionais (escala 0-10 + texto livre).
      const respostasConversacionais = respostas
        .filter((r) => r.valor.trim() !== '')
        .map((r, i) => ({
          perguntaId: `chat_${i}`,
          bloco: tipoJornada || 'geral',
          pergunta: `Resposta conversacional ${i + 1}`,
          tipo: 'aberta' as const,
          valor: r.valor,
          pontuacao: isNaN(Number(r.valor)) ? null : Number(r.valor),
        }));

      const res = await fetch('/api/jornada', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jornadaId,
          respostas: respostasConversacionais.length > 0 ? respostasConversacionais : [{ perguntaId: 'finalizar', bloco: tipoJornada || 'geral', pergunta: 'Finalização', tipo: 'aberta', valor: 'finalizar', pontuacao: null }],
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

      {/* Aviso de testes pendentes */}
      {avisoTeste && (
        <div className="mx-4 mt-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-[13px] text-amber-800 font-semibold animate-slide-up">
          {avisoTeste}
        </div>
      )}

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

      {/* Modo Teste — perguntas estruturadas com botões */}
      {testeAtivo && (
        <div className="px-4 py-4 bg-white/90 backdrop-blur-md border-t border-primary-100/40 animate-slide-up">
          {/* Progresso do teste */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-primary-500 tracking-wide uppercase">
              {testeAtivo.id === 'estresse_ocupacional' && 'Teste de Estresse'}
              {testeAtivo.id === 'inteligencia_emocional_teste' && 'Inteligência Emocional'}
              {testeAtivo.id === 'estilo_comunicacao' && 'Estilo de Comunicação'}
              {testeAtivo.id === 'burnout_relacional_teste' && 'Burnout Relacional'}
            </p>
            <span className="text-xs text-primary-400 font-medium">
              {testeAtivo.perguntaAtual + 1} de {testeAtivo.perguntas.length}
            </span>
          </div>

          {/* Barra de progresso do teste */}
          <div className="h-1.5 bg-primary-100/60 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((testeAtivo.perguntaAtual) / testeAtivo.perguntas.length) * 100}%` }}
            />
          </div>

          {/* Pergunta atual */}
          <p className="text-sm font-medium text-primary-900 mb-4 leading-relaxed">
            {testeAtivo.perguntas[testeAtivo.perguntaAtual].texto}
          </p>

          {/* Opções como botões */}
          <div className="space-y-2">
            {testeAtivo.perguntas[testeAtivo.perguntaAtual].opcoes?.map((opcao) => {
              // Calcular pontuação baseado no tipo
              let pontuacao: number | null = null;
              const tipo = testeAtivo.perguntas[testeAtivo.perguntaAtual].tipo;
              if (tipo === 'frequencia') {
                const mapFreq: Record<string, number> = { nunca: 0, as_vezes: 1, frequentemente: 2, quase_sempre: 3 };
                pontuacao = mapFreq[opcao.valor] ?? null;
              } else if (tipo === 'multipla_escolha') {
                pontuacao = parseInt(opcao.valor) || null;
              }

              return (
                <button
                  key={opcao.valor}
                  onClick={() => responderTeste(opcao.valor, pontuacao)}
                  className="w-full p-3 rounded-xl border-2 border-primary-100/60 bg-white/80 hover:bg-primary-50 hover:border-primary-300 text-sm text-primary-700 font-medium text-left transition-all duration-200 hover:shadow-warm-sm"
                >
                  {opcao.label}
                </button>
              );
            })}

            {/* Fallback para perguntas sem opções (escala) */}
            {!testeAtivo.perguntas[testeAtivo.perguntaAtual].opcoes && (
              <div className="flex gap-1.5 justify-center flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => responderTeste(String(n), n)}
                    className="w-10 h-10 rounded-xl text-xs font-semibold border-2 border-primary-100/60 bg-white/70 hover:bg-primary-50 hover:border-primary-300 text-primary-600 transition-all duration-200"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Escala rápida de 0-10 — condicional */}
      {!testeAtivo && mostrarEscala && (
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

      {/* Input — oculto durante modo teste */}
      {!testeAtivo && (
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
      )}
    </div>
  );
}
