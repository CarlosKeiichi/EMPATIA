import { NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/professores - Admin: listar professores da escola
export async function GET() {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'superadmin')) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({ where: { userId: usuario.userId } });

    const professores = await prisma.professor.findMany({
      where: admin?.escolaId ? { escolaId: admin.escolaId } : {},
      include: {
        user: { select: { nome: true, email: true, criadoEm: true } },
        jornadas: {
          select: { tipo: true, status: true, nivelRisco: true, concluidaEm: true },
          orderBy: { iniciadaEm: 'desc' },
        },
        diagnosticos: {
          select: { perfilEmocional: true, nivelEstresse: true, criadoEm: true },
          orderBy: { criadoEm: 'desc' },
          take: 1,
        },
      },
    });

    // Retorna dados anonimizados (sem email para proteção)
    const resultado = professores.map((p, i) => ({
      id: p.id,
      identificador: `Professor ${i + 1}`,
      genero: p.genero,
      faixaEtaria: p.faixaEtaria,
      totalJornadas: p.jornadas.length,
      jornadasConcluidas: p.jornadas.filter((j) => j.status === 'concluida').length,
      ultimoDiagnostico: p.diagnosticos[0] || null,
      ultimoAcesso: p.jornadas[0]?.concluidaEm || p.user.criadoEm,
    }));

    return NextResponse.json({ professores: resultado });
  } catch (error) {
    console.error('Erro ao listar professores:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
