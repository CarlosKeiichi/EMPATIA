import { NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enviarMensagem } from '@/lib/claude';
import { BLOCOS_TESTE } from '@/lib/scoring';

// Cache simples em memória (5 min)
let cache: { data: InsightsResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface InsightsResponse {
  dores: { resumo: string };
  planoAcao: { resumo: string; acoes: string[] };
  beneficios: { resumo: string };
  geradoEm: string;
  baseadoEm: {
    totalProfessores: number;
    totalJornadas: number;
    totalRespostas: number;
  };
}

export async function GET() {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'superadmin')) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Verificar cache
    if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ ...cache.data, fromCache: true });
    }

    // Buscar todos os dados relevantes
    const jornadas = await prisma.jornada.findMany({
      include: {
        respostas: true,
        professor: { include: { user: { select: { nome: true } } } },
        diagnostico: true,
      },
      orderBy: { iniciadaEm: 'desc' },
    });

    const totalProfessores = new Set(jornadas.map((j) => j.professorId)).size;
    const totalJornadas = jornadas.length;
    const totalRespostas = jornadas.reduce((a, j) => a + j.respostas.length, 0);

    if (totalJornadas === 0) {
      return NextResponse.json({
        dores: { resumo: 'Sem jornadas concluídas ainda. As dores aparecerão aqui conforme os professores começarem a usar a plataforma.' },
        planoAcao: {
          resumo: 'Enquanto isso, algumas ações iniciais para engajar os professores:',
          acoes: [
            'Divulgar a plataforma em reunião pedagógica',
            'Criar um canal de escuta direto com a gestão',
            'Agendar rodas de conversa mensais',
          ],
        },
        beneficios: { resumo: 'Plataforma pronta para acolher. Cada jornada trará mais precisão ao acompanhamento do clima escolar.' },
        geradoEm: new Date().toISOString(),
        baseadoEm: { totalProfessores: 0, totalJornadas: 0, totalRespostas: 0 },
      });
    }

    // === CONTEXTO PARA A IA ===

    // 1. Principais dores — respostas com pontuação alta + respostas abertas relevantes
    const respostasAltas = jornadas
      .flatMap((j) => j.respostas.filter((r) => r.pontuacao !== null && r.pontuacao >= 7))
      .slice(0, 30);

    // 2. Textos de respostas abertas de professores em estado crítico
    const textosImpacto = jornadas
      .filter((j) => j.estadoEmocionalFinal === 'D' || j.estadoEmocionalFinal === 'E' || j.estadoEmocionalFinal === 'C')
      .flatMap((j) => j.respostas.filter((r) => r.tipo === 'aberta' && r.valor && r.valor.length >= 10).map((r) => r.valor))
      .slice(0, 50);

    // 3. Estados emocionais finais
    const distribuicaoEstados: Record<string, number> = {};
    for (const j of jornadas) {
      if (j.estadoEmocionalFinal) {
        distribuicaoEstados[j.estadoEmocionalFinal] = (distribuicaoEstados[j.estadoEmocionalFinal] || 0) + 1;
      }
    }

    // 4. IPCS por professor (último)
    const ipcsMap = new Map<string, number>();
    for (const j of jornadas) {
      const ipcs = j.respostas.filter((r) => r.bloco === 'estresse_ocupacional' && r.pontuacao !== null)
        .reduce((a, r) => a + (r.pontuacao ?? 0), 0);
      if (ipcs > 0 && !ipcsMap.has(j.professorId)) ipcsMap.set(j.professorId, ipcs);
    }
    const ipcsMedia = ipcsMap.size > 0 ? Array.from(ipcsMap.values()).reduce((a, b) => a + b, 0) / ipcsMap.size : 0;

    // 5. Média das respostas conversacionais (escala 0-10)
    const pontuacoesConv = jornadas.flatMap((j) =>
      j.respostas.filter((r) => r.pontuacao !== null && !BLOCOS_TESTE.includes(r.bloco)).map((r) => r.pontuacao!)
    );
    const mediaConversacional = pontuacoesConv.length > 0
      ? pontuacoesConv.reduce((a, b) => a + b, 0) / pontuacoesConv.length
      : 0;

    // 6. Jornadas com melhora (IBED positivo)
    let jornadasComMelhora = 0;
    const estadoToNum: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    for (const j of jornadas) {
      if (j.estadoEmocionalInicial && j.estadoEmocionalFinal) {
        const inicial = estadoToNum[j.estadoEmocionalInicial] || 0;
        const final = estadoToNum[j.estadoEmocionalFinal] || 0;
        if (final > inicial) jornadasComMelhora++;
      }
    }
    const percentualMelhora = totalJornadas > 0 ? (jornadasComMelhora / totalJornadas) * 100 : 0;

    // === MONTAR PROMPT ===
    const contexto = `
DADOS DA ESCOLA (agregado anônimo):
- Total de professores ativos: ${totalProfessores}
- Total de jornadas concluídas: ${totalJornadas}
- Total de respostas registradas: ${totalRespostas}

ÍNDICES DE SAÚDE MENTAL:
- IPCS (Índice de Percepção do Estresse) médio: ${ipcsMedia.toFixed(1)}/20 ${ipcsMedia >= 14 ? '(ESTRESSE ELEVADO)' : ipcsMedia >= 7 ? '(RESISTÊNCIA)' : '(SEM SINAIS)'}
- Pontuação média conversacional: ${mediaConversacional.toFixed(1)}/10
- Distribuição de estado emocional final: ${JSON.stringify(distribuicaoEstados)} (A=Fortalecido, B=Esperançoso, C=Em alerta, D=Cansado, E=Sobrecarregado)
- Jornadas com melhora de estado: ${jornadasComMelhora}/${totalJornadas} (${percentualMelhora.toFixed(0)}%)

TOP RESPOSTAS COM PONTUAÇÃO ALTA (≥7) — indicam maior sofrimento:
${respostasAltas.slice(0, 15).map((r) => `- [${r.bloco}] ${r.pergunta}: pontuação ${r.pontuacao}`).join('\n')}

FALAS REAIS DE PROFESSORES EM ESTADO CRÍTICO (extratos):
${textosImpacto.slice(0, 20).map((t) => `- "${t.slice(0, 200)}"`).join('\n')}

Gere um JSON com EXATAMENTE esta estrutura:
{
  "dores": {
    "resumo": "MÁXIMO 2 frases curtas e impactantes. Vá direto ao ponto: o que os professores estão sentindo de mais crítico?"
  },
  "planoAcao": {
    "resumo": "1-2 frases introduzindo o plano.",
    "acoes": ["ação acionável 1", "ação acionável 2", "ação acionável 3", "ação acionável 4"]
  },
  "beneficios": {
    "resumo": "MÁXIMO 2 frases curtas. Como a plataforma está ajudando — cite 1 número de impacto real."
  }
}

REGRAS IMPORTANTES:
- DORES e BENEFÍCIOS: MÁXIMO 2 frases cada, bem resumidas e impactantes
- Plano de ação pode ser mais detalhado (3-4 ações acionáveis)
- Tom empático, direto, sem rodeios
- Cite 1 número real em cada seção quando fizer sentido
- Retorne APENAS o JSON, sem markdown nem texto adicional
`;

    // === CHAMAR IA ===
    let insightsData: Omit<InsightsResponse, 'geradoEm' | 'baseadoEm'>;
    try {
      const resposta = await enviarMensagem('marcia_insights_admin', [
        { role: 'user', content: contexto },
      ]);

      // Extrair JSON (pode vir com ```json ou texto extra)
      const match = resposta.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('JSON não encontrado na resposta');
      insightsData = JSON.parse(match[0]);
    } catch (err) {
      console.error('Erro ao processar resposta da IA:', err);
      // Fallback genérico mas alinhado com a lógica real
      const zonaIpcs = ipcsMedia >= 14 ? 'estresse elevado' : ipcsMedia >= 7 ? 'resistência' : 'estabilidade emocional';
      insightsData = {
        dores: {
          resumo: `Com IPCS médio de ${ipcsMedia.toFixed(1)}/20 (zona de ${zonaIpcs}), os professores mostram sinais claros de sobrecarga emocional e tensões recorrentes nas relações de trabalho.`,
        },
        planoAcao: {
          resumo: `Com base nos dados atuais, recomendo começar esta semana com ações simples e acionáveis:`,
          acoes: [
            'Acolhimento individual com professores em estado crítico',
            'Revisão de carga de trabalho e distribuição de demandas',
            'Criação de canal de escuta ativa entre gestão e docentes',
            'Ações de autocuidado coletivo e pausas intencionais',
          ],
        },
        beneficios: {
          resumo: `${totalRespostas} interações de escuta já registradas, com ${percentualMelhora.toFixed(0)}% das jornadas mostrando evolução emocional positiva.`,
        },
      };
    }

    const payload: InsightsResponse = {
      ...insightsData,
      geradoEm: new Date().toISOString(),
      baseadoEm: { totalProfessores, totalJornadas, totalRespostas },
    };

    cache = { data: payload, timestamp: Date.now() };
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return NextResponse.json({ erro: 'Erro ao gerar insights' }, { status: 500 });
  }
}

// POST — forçar regeneração (limpa cache)
export async function POST() {
  cache = null;
  return GET();
}
