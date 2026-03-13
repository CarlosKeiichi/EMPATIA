import Anthropic from '@anthropic-ai/sdk';
import { prisma } from './db';

// Singleton do cliente Anthropic
let clienteAnthropic: Anthropic | null = null;

function getCliente(): Anthropic {
  if (!clienteAnthropic) {
    clienteAnthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY?.trim(),
    });
  }
  return clienteAnthropic;
}

// Busca configuração da IA no banco (permite editar pelo admin)
export async function getConfigIA(nome: string) {
  const config = await prisma.configuracaoIA.findUnique({ where: { nome } });
  if (!config || !config.ativo) {
    // Fallback para config padrão
    return {
      systemPrompt: 'Você é a Márcia, uma assistente virtual de saúde mental para professores. Seja empática e acolhedora.',
      temperatura: 0.7,
      modelo: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    };
  }
  return {
    systemPrompt: config.systemPrompt,
    temperatura: config.temperatura,
    modelo: config.modelo,
  };
}

// Interface de mensagem
export interface MensagemChat {
  role: 'user' | 'assistant';
  content: string;
}

// Envia mensagem para Claude com configuração específica
export async function enviarMensagem(
  configNome: string,
  mensagens: MensagemChat[],
  contextoExtra?: string
): Promise<string> {
  const cliente = getCliente();
  const config = await getConfigIA(configNome);

  let systemPrompt = config.systemPrompt;
  if (contextoExtra) {
    systemPrompt += `\n\nCONTEXTO ADICIONAL:\n${contextoExtra}`;
  }

  const response = await cliente.messages.create({
    model: config.modelo,
    max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '1024'),
    temperature: config.temperatura,
    system: systemPrompt,
    messages: mensagens.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text || 'Desculpe, não consegui processar sua mensagem.';
}

// Gera diagnóstico usando IA
export async function gerarDiagnostico(
  respostas: { pergunta: string; valor: string; pontuacao: number | null; bloco: string }[],
  estadoInicial: string,
  tipoJornada: string
): Promise<{
  perfilEmocional: string;
  nivelEstresse: string;
  pontosAtencao: string[];
  planoAcao: string;
  resumoIA: string;
}> {
  const cliente = getCliente();
  const config = await getConfigIA('marcia_diagnostico');

  const resumoRespostas = respostas
    .map((r) => `[${r.bloco}] ${r.pergunta}: ${r.valor} (pontuação: ${r.pontuacao ?? 'N/A'})`)
    .join('\n');

  const pontosAltos = respostas
    .filter((r) => r.pontuacao !== null && r.pontuacao >= 7)
    .map((r) => `${r.bloco}: ${r.pergunta} (${r.pontuacao})`)
    .join('\n');

  const prompt = `Analise as respostas deste professor na jornada "${tipoJornada}".

ESTADO EMOCIONAL INICIAL: ${estadoInicial}

RESPOSTAS COMPLETAS:
${resumoRespostas}

PONTOS CRÍTICOS (pontuação ≥ 7):
${pontosAltos || 'Nenhum ponto crítico identificado'}

Responda EXATAMENTE neste formato JSON:
{
  "perfilEmocional": "A, B, C, D ou E (A=Muito fortalecido, B=Esperançoso, C=Em alerta, D=Cansado, E=Sobrecarregado)",
  "nivelEstresse": "baixo, moderado ou elevado",
  "pontosAtencao": ["ponto 1", "ponto 2", "ponto 3"],
  "planoAcao": "texto com recomendações práticas e personalizadas",
  "resumoIA": "texto interpretativo empático sobre o estado do professor"
}`;

  const response = await cliente.messages.create({
    model: config.modelo,
    max_tokens: 2048,
    temperature: 0.5,
    system: config.systemPrompt + '\n\nVocê DEVE responder APENAS com JSON válido, sem texto adicional.',
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const texto = textBlock?.text || '{}';

  try {
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch?.[0] || '{}');
  } catch {
    return {
      perfilEmocional: 'C',
      nivelEstresse: 'moderado',
      pontosAtencao: ['Análise automática indisponível'],
      planoAcao: 'Recomendamos buscar apoio da coordenação pedagógica.',
      resumoIA: 'Não foi possível gerar o resumo automático.',
    };
  }
}

// Gera relatório institucional por IA
export async function gerarRelatorioInstitucional(dadosAgregados: {
  totalProfessores: number;
  distribuicaoEmocional: Record<string, number>;
  mediaEstresse: number;
  topProblemas: string[];
  irpe: number;
}) {
  const cliente = getCliente();

  const response = await cliente.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    temperature: 0.5,
    system: `Você é uma IA especialista em análise de saúde mental escolar.
Gere um relatório interpretativo para gestores escolares baseado nos dados agregados.
Seja objetivo, use linguagem profissional e sugira ações concretas.
Nunca identifique professores individualmente.`,
    messages: [
      {
        role: 'user',
        content: `Dados da escola:
- Total de professores respondentes: ${dadosAgregados.totalProfessores}
- Distribuição emocional: ${JSON.stringify(dadosAgregados.distribuicaoEmocional)}
- Média de estresse (0-20): ${dadosAgregados.mediaEstresse.toFixed(1)}
- Top problemas: ${dadosAgregados.topProblemas.join(', ')}
- IRPE (0-1): ${dadosAgregados.irpe.toFixed(2)}

Gere um relatório com: visão geral, pontos críticos, recomendações e prioridades.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.text || 'Relatório indisponível.';
}
