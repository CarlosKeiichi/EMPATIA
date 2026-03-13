import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { reordenarSchema } from '@/lib/validations';

// PUT /api/admin/perguntas/reordenar — reordenar perguntas em batch
export async function PUT(req: NextRequest) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const body = await req.json();
  const parsed = reordenarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  for (const item of parsed.data.itens) {
    await prisma.pergunta.update({
      where: { id: item.id },
      data: { ordem: item.ordem },
    });
  }

  return NextResponse.json({ ok: true });
}
