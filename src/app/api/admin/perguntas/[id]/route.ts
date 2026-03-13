import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { perguntaSchema } from '@/lib/validations';

// PUT /api/admin/perguntas/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const { id } = await params;
  const body = await req.json();
  const parsed = perguntaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  const pergunta = await prisma.pergunta.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ pergunta });
}

// DELETE /api/admin/perguntas/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const { id } = await params;
  await prisma.pergunta.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
