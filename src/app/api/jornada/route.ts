import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { gerarDiagnostico } from '@/lib/claude';
import { calcularEstresseOcupacional } from '@/lib/scoring';
import { prisma } from '@/lib/db';
import { getPerguntasPorJornada } from '@/config/perguntas';
import { criarJornadaSchema, finalizarJornadaSchema } from '@/lib/validations';

// GET /api/jornada - Listar jornadas do professor
export async function GET() {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const professor = await prisma.professor.findUnique({ where: { userId: usuario.userId } });
    if (!professor) {
      return NextResponse.json({ erro: 'Professor não encontrado' }, { status: 404 });
    }

    const jornadas = await prisma.jornada.findMany({
      where: { professorId: professor.id },
      include: { diagnostico: true },
      orderBy: { iniciadaEm: 'desc' },
    });

    return NextResponse.json({ jornadas });
  } catch (error) {
    console.error('Erro ao listar jornadas:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/jornada - Criar nova jornada
export async function POST(req: NextRequest) {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = criarJornadaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const professor = await prisma.professor.findUnique({ where: { userId: usuario.userId } });
    if (!professor) {
      return NextResponse.json({ erro: 'Professor não encontrado' }, { status: 404 });
    }

    // Verificar se já existe jornada em andamento
    const jornadaAberta = await prisma.jornada.findFirst({
      where: { professorId: professor.id, status: 'em_andamento' },
    });
    if (jornadaAberta) {
      return NextResponse.json(
        { erro: 'Você já tem uma jornada em andamento. Finalize-a antes de iniciar outra.' },
        { status: 409 }
      );
    }

    const jornada = await prisma.jornada.create({
      data: {
        professorId: professor.id,
        tipo: parsed.data.tipo,
        estadoEmocionalInicial: parsed.data.estadoEmocionalInicial,
      },
    });

    const perguntas = getPerguntasPorJornada(parsed.data.tipo);

    return NextResponse.json({ jornada, perguntas });
  } catch (error) {
    console.error('Erro ao criar jornada:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// PUT /api/jornada - Salvar respostas e finalizar
export async function PUT(req: NextRequest) {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = finalizarJornadaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { jornadaId, respostas, estadoEmocionalFinal, finalizar } = parsed.data;

    const jornada = await prisma.jornada.findUnique({ where: { id: jornadaId } });
    if (!jornada) {
      return NextResponse.json({ erro: 'Jornada não encontrada' }, { status: 404 });
    }

    // Salvar respostas
    for (const resp of respostas) {
      await prisma.resposta.create({
        data: {
          jornadaId,
          bloco: resp.bloco,
          perguntaId: resp.perguntaId,
          pergunta: resp.pergunta,
          tipo: resp.tipo,
          valor: resp.valor,
          pontuacao: resp.pontuacao,
        },
      });
    }

    if (finalizar) {
      let nivelRisco = 'moderado';
      let pontuacaoTotal = 0;

      if (jornada.tipo === 'trabalho') {
        const respostasEstresse = respostas.filter((r) => r.bloco === 'estresse_ocupacional');
        const resultado = calcularEstresseOcupacional(respostasEstresse);
        nivelRisco = resultado.nivel;
        pontuacaoTotal = resultado.pontuacao;
      } else {
        pontuacaoTotal = respostas.reduce((t, r) => t + (r.pontuacao ?? 0), 0);
      }

      // Gerar diagnóstico com IA
      const diagnosticoIA = await gerarDiagnostico(
        respostas,
        jornada.estadoEmocionalInicial || 'C',
        jornada.tipo
      );

      await prisma.jornada.update({
        where: { id: jornadaId },
        data: {
          status: 'concluida',
          estadoEmocionalFinal: estadoEmocionalFinal || diagnosticoIA.perfilEmocional,
          pontuacaoTotal,
          nivelRisco,
          concluidaEm: new Date(),
        },
      });

      const diagnostico = await prisma.diagnostico.create({
        data: {
          professorId: jornada.professorId,
          jornadaId,
          perfilEmocional: diagnosticoIA.perfilEmocional,
          nivelEstresse: diagnosticoIA.nivelEstresse,
          pontosAtencao: JSON.stringify(diagnosticoIA.pontosAtencao),
          planoAcao: diagnosticoIA.planoAcao,
          resumoIA: diagnosticoIA.resumoIA,
        },
      });

      return NextResponse.json({ jornada: { ...jornada, status: 'concluida' }, diagnostico });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao salvar jornada:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
