import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { enviarMensagem, MensagemChat } from '@/lib/claude';
import { prisma } from '@/lib/db';
import { chatSchema } from '@/lib/validations';

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

    // Enviar para Claude
    const configNome = configIA || 'marcia_suporte';
    const resposta = await enviarMensagem(configNome, historico, contexto);

    // Salvar resposta da IA
    await prisma.mensagem.create({
      data: {
        conversaId: conversa.id,
        role: 'assistant',
        conteudo: resposta,
      },
    });

    return NextResponse.json({
      conversaId: conversa.id,
      resposta,
    });
  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ erro: 'Erro ao processar mensagem' }, { status: 500 });
  }
}
