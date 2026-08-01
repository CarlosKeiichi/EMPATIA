import { NextRequest, NextResponse } from 'next/server';
import { verificarSuperadmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { normalizarCodigo, sugerirCodigo } from '@/lib/instituicoes';
import { instituicaoSchema } from '@/lib/validations';

// GET /api/admin/instituicoes — lista com contadores de uso
export async function GET() {
  const auth = await verificarSuperadmin();
  if ('erro' in auth) return auth.erro;

  try {
    const escolas = await prisma.escola.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        codigo: true,
        cidade: true,
        estado: true,
        ativa: true,
        criadoEm: true,
        _count: { select: { professores: true } },
      },
    });

    // Jornadas concluidas por instituicao — uma agregacao so, em vez de N queries.
    const jornadas = await prisma.jornada.findMany({
      where: { status: 'concluida' },
      select: { professor: { select: { escolaId: true } } },
    });
    const concluidasPorEscola = new Map<string, number>();
    for (const j of jornadas) {
      const id = j.professor.escolaId;
      if (!id) continue;
      concluidasPorEscola.set(id, (concluidasPorEscola.get(id) || 0) + 1);
    }

    return NextResponse.json({
      instituicoes: escolas.map((e) => ({
        id: e.id,
        nome: e.nome,
        codigo: e.codigo,
        cidade: e.cidade,
        estado: e.estado,
        ativa: e.ativa,
        criadoEm: e.criadoEm,
        professores: e._count.professores,
        jornadasConcluidas: concluidasPorEscola.get(e.id) || 0,
      })),
    });
  } catch (error) {
    console.error('Erro ao listar instituições:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/admin/instituicoes — cria instituição com código
export async function POST(req: NextRequest) {
  const auth = await verificarSuperadmin();
  if ('erro' in auth) return auth.erro;

  try {
    const body = await req.json();
    const parsed = instituicaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const { nome, cidade, estado, redeEnsino } = parsed.data;
    const codigo = parsed.data.codigo
      ? normalizarCodigo(parsed.data.codigo)
      : sugerirCodigo(nome);

    const jaExiste = await prisma.escola.findUnique({ where: { codigo } });
    if (jaExiste) {
      return NextResponse.json({ erro: 'Já existe uma instituição com esse código' }, { status: 409 });
    }

    const escola = await prisma.escola.create({
      data: { nome, codigo, cidade, estado, redeEnsino },
    });

    return NextResponse.json({ instituicao: escola }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar instituição:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
