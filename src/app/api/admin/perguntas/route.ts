import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { perguntaSchema } from '@/lib/validations';

// GET /api/admin/perguntas — listar todas
export async function GET() {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const perguntas = await prisma.pergunta.findMany({
    orderBy: [{ jornada: 'asc' }, { bloco: 'asc' }, { ordem: 'asc' }],
  });

  return NextResponse.json({ perguntas });
}

// POST /api/admin/perguntas — criar nova
export async function POST(req: NextRequest) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const body = await req.json();
  const parsed = perguntaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  const existente = await prisma.pergunta.findUnique({ where: { codigo: parsed.data.codigo } });
  if (existente) {
    return NextResponse.json({ erro: 'Já existe uma pergunta com esse código' }, { status: 409 });
  }

  const pergunta = await prisma.pergunta.create({
    data: parsed.data,
  });

  return NextResponse.json({ pergunta }, { status: 201 });
}
