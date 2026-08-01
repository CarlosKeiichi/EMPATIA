import { NextRequest, NextResponse } from 'next/server';
import { verificarSuperadmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';
import { normalizarCodigo } from '@/lib/instituicoes';
import { instituicaoUpdateSchema } from '@/lib/validations';

// PATCH /api/admin/instituicoes/[id] — renomear, trocar código, ativar/desativar
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verificarSuperadmin();
  if ('erro' in auth) return auth.erro;

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = instituicaoUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const existente = await prisma.escola.findUnique({ where: { id } });
    if (!existente) {
      return NextResponse.json({ erro: 'Instituição não encontrada' }, { status: 404 });
    }

    const { nome, cidade, estado, redeEnsino, ativa } = parsed.data;
    const codigo = parsed.data.codigo ? normalizarCodigo(parsed.data.codigo) : undefined;

    if (codigo && codigo !== existente.codigo) {
      const colide = await prisma.escola.findUnique({ where: { codigo } });
      if (colide) {
        return NextResponse.json({ erro: 'Já existe uma instituição com esse código' }, { status: 409 });
      }
    }

    const escola = await prisma.escola.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cidade !== undefined && { cidade }),
        ...(estado !== undefined && { estado }),
        ...(redeEnsino !== undefined && { redeEnsino }),
        ...(ativa !== undefined && { ativa }),
        ...(codigo && { codigo }),
      },
    });

    return NextResponse.json({ instituicao: escola });
  } catch (error) {
    console.error('Erro ao atualizar instituição:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
