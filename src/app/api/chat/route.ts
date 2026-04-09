import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { enviarMensagem, MensagemChat } from '@/lib/claude';
import { prisma } from '@/lib/db';
import { chatSchema } from '@/lib/validations';
import { getPerguntasTeste } from '@/lib/perguntas';
import { construirMemoriaMarcia } from '@/lib/memoria';

export const maxDuration = 60;

// POST /api/chat - Enviar mensagem para IA
export async function POST(req: NextRequest) {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { conversaId, mensagem, configIA, contexto } = parsed.data;

    // Buscar ou criar conversa
    let conversa;
    if (conversaId) {
      conversa = await prisma.conversa.findUnique({
        where: { id: conversaId },
        include: { mensagens: { orderBy: { criadaEm: 'asc' } } },
      });
    } else {
      const professor = await prisma.professor.findUnique({ where: { userId: usuario.userId } });
      if (!professor) {
        return NextResponse.json({ erro: 'Professor não encontrado' }, { status: 404 });
      }
      conversa = await prisma.conversa.create({
        data: {
          professorId: professor.id,
          tipo: configIA?.includes('jornada') ? 'jornada' : 'suporte',
        },
        include: { mensagens: true },
      });
    }

    if (!conversa) {
      return NextResponse.json({ erro: 'Conversa não encontrada' }, { status: 404 });
    }

    // Salvar mensagem do professor
    await prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        role: 'user',
        conteudo: mensagem,
      },
    });

    // Montar histórico para a IA
    const historico: MensagemChat[] = conversa.mensagens.map((m: { role: string; conteudo: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.conteudo,
    }));
    historico.push({ role: 'user', content: mensagem });

    // Construir contexto com memória para conversas de suporte
    const configNome = configIA || 'marcia_suporte';
    let contextoFinal = contexto || '';

    if (configNome === 'marcia_suporte') {
      try {
        const professor = await prisma.professor.findUnique({ where: { userId: usuario.userId } });
        if (professor) {
          const memoria = await construirMemoriaMarcia(professor.id);
          if (memoria) {
            contextoFinal = memoria + (contextoFinal ? `\n\n${contextoFinal}` : '');
          }
        }
      } catch (memErr) {
        console.error('Erro ao construir memória (continuando sem):', memErr);
      }
    }

    const resposta = await enviarMensagem(configNome, historico, contextoFinal || undefined);

    // Detectar marcador de teste [INICIAR_TESTE:xxx]
    const testeMatch = resposta.match(/\[INICIAR_TESTE:(\w+)\]/);
    let teste = null;
    let respostaLimpa = resposta;

    if (testeMatch) {
      const testeId = testeMatch[1];
      respostaLimpa = resposta.replace(/\[INICIAR_TESTE:\w+\]/, '').trim();
      const perguntas = getPerguntasTeste(testeId);
      if (perguntas.length > 0) {
        teste = { id: testeId, perguntas };
      }
    }

    // Salvar resposta da IA (sem o marcador)
    await prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        role: 'assistant',
        conteudo: respostaLimpa,
      },
    });

    return NextResponse.json({
      conversaId: conversa.id,
      resposta: respostaLimpa,
      ...(teste && { teste }),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Erro no chat:', errMsg, error);
    return NextResponse.json({ erro: `Erro ao processar mensagem: ${errMsg}` }, { status: 500 });
  }
}
