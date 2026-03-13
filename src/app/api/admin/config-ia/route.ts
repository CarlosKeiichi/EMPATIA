import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { configIASchema } from '@/lib/validations';

// GET /api/admin/config-ia — listar todas as configurações
export async function GET() {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const configs = await prisma.configuracaoIA.findMany({
    orderBy: { nome: 'asc' },
  });

  return NextResponse.json({ configs });
}

// POST /api/admin/config-ia — criar nova configuração
export async function POST(req: NextRequest) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const body = await req.json();
  const parsed = configIASchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  const existente = await prisma.configuracaoIA.findUnique({ where: { nome: parsed.data.nome } });
  if (existente) {
    return NextResponse.json({ erro: 'Já existe uma configuração com esse nome' }, { status: 409 });
  }

  const config = await prisma.configuracaoIA.create({
    data: parsed.data,
  });

  return NextResponse.json({ config }, { status: 201 });
}
