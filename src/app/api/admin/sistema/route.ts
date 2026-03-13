import { NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { prisma } from '@/lib/db';

// GET /api/admin/sistema — informações do sistema
export async function GET() {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const [
    totalProfessores,
    totalEscolas,
    totalJornadas,
    totalDiagnosticos,
    configsAtivas,
    totalConfigs,
    perguntasTrabalho,
    perguntasRelacionamentos,
    perguntasFinancas,
    perguntasEstresse,
    totalPerguntas,
  ] = await Promise.all([
    prisma.professor.count(),
    prisma.escola.count(),
    prisma.jornada.count(),
    prisma.diagnostico.count(),
    prisma.configuracaoIA.count({ where: { ativo: true } }),
    prisma.configuracaoIA.count(),
    prisma.pergunta.count({ where: { jornada: 'trabalho', ativa: true } }),
    prisma.pergunta.count({ where: { jornada: 'relacionamentos', ativa: true } }),
    prisma.pergunta.count({ where: { jornada: 'financas', ativa: true } }),
    prisma.pergunta.count({ where: { jornada: 'estresse', ativa: true } }),
    prisma.pergunta.count(),
  ]);

  return NextResponse.json({
    banco: {
      status: 'online',
      tipo: process.env.TURSO_DATABASE_URL ? 'Turso (libSQL)' : 'SQLite local',
    },
    totais: {
      professores: totalProfessores,
      escolas: totalEscolas,
      jornadas: totalJornadas,
      diagnosticos: totalDiagnosticos,
    },
    ia: {
      modelo: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      configsAtivas,
      totalConfigs,
    },
    perguntas: {
      total: totalPerguntas,
      trabalho: perguntasTrabalho,
      relacionamentos: perguntasRelacionamentos,
      financas: perguntasFinancas,
      estresse: perguntasEstresse,
    },
  });
}
