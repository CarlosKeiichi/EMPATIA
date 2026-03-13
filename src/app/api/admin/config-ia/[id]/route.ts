import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { configIASchema } from '@/lib/validations';

// GET /api/admin/config-ia/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const { id } = await params;
  const config = await prisma.configuracaoIA.findUnique({ where: { id } });
  if (!config) {
    return NextResponse.json({ erro: 'Configuração não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ config });
}

// PUT /api/admin/config-ia/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const { id } = await params;
  const body = await req.json();
  const parsed = configIASchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  const config = await prisma.configuracaoIA.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ config });
}

// DELETE /api/admin/config-ia/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const { id } = await params;
  await prisma.configuracaoIA.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
