import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calcularIRPE,
  calcularDistribuicaoEmocional,
  calcularRadarEstresse,
  extrairTopProblemas,
  calcularIBED,
} from '@/lib/scoring';

// GET /api/dashboard - Dados do dashboard administrativo
export async function GET(req: NextRequest) {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario || (usuario.role !== 'admin' && usuario.role !== 'superadmin')) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    // Buscar escola do admin
    const admin = await prisma.admin.findUnique({ where: { userId: usuario.userId } });
    const escolaId = admin?.escolaId || req.nextUrl.searchParams.get('escolaId');

    // Buscar jornadas concluídas
    const filtro = escolaId
      ? { status: 'concluida', professor: { escolaId } }
      : { status: 'concluida' as const };

    const jornadas = await prisma.jornada.findMany({
      where: filtro,
      include: {
        respostas: true,
        diagnostico: true,
        professor: true,
      },
    });

    const totalProfessores = new Set(jornadas.map((j) => j.professorId)).size;
    const jornadasConcluidas = jornadas.length;

    // Distribuição emocional
    const estadosFinais = jornadas
      .map((j) => j.estadoEmocionalFinal)
      .filter(Boolean) as string[];
    const distribuicaoEmocional = calcularDistribuicaoEmocional(estadosFinais);

    // Radar de estresse (agregado)
    const todasRespostas = jornadas.flatMap((j) =>
      j.respostas.map((r) => ({ bloco: r.bloco, pontuacao: r.pontuacao }))
    );
    const radarEstresse = calcularRadarEstresse(todasRespostas);

    // Top problemas
    const respostasComPergunta = jornadas.flatMap((j) =>
      j.respostas.map((r) => ({
        bloco: r.bloco,
        pergunta: r.pergunta,
        pontuacao: r.pontuacao,
      }))
    );
    const topProblemas = extrairTopProblemas(respostasComPergunta);

    // IBED médio
    const ibedValues = jornadas
      .filter((j) => j.estadoEmocionalInicial && j.estadoEmocionalFinal)
      .map((j) => calcularIBED(j.estadoEmocionalInicial!, j.estadoEmocionalFinal!).valor);
    const ibedMedio = ibedValues.length > 0
      ? ibedValues.reduce((a, b) => a + b, 0) / ibedValues.length
      : 0.5;

    // Estresse médio normalizado
    const pontuacoes = jornadas.map((j) => j.pontuacaoTotal ?? 0);
    const estresseMedio = pontuacoes.length > 0
      ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length / 20 // normalizar para 0-1
      : 0;

    // Percentual de docentes em estado crítico (D ou E)
    const criticos = estadosFinais.filter((e) => e === 'D' || e === 'E').length;
    const percentualCriticos = totalProfessores > 0 ? criticos / totalProfessores : 0;

    // IRPE
    const irpe = calcularIRPE({
      ibed: ibedMedio,
      estresseMedio,
      impactoCategorias: radarEstresse.length > 0
        ? radarEstresse.reduce((a, b) => a + b.valor, 0) / radarEstresse.length / 10
        : 0,
      percentualCriticos,
    });

    // Contadores da escola
    const totalProfessoresEscola = escolaId
      ? await prisma.professor.count({ where: { escolaId } })
      : await prisma.professor.count();

    const taxaConclusao = totalProfessoresEscola > 0
      ? totalProfessores / totalProfessoresEscola
      : 0;

    return NextResponse.json({
      totalProfessores,
      totalProfessoresEscola,
      jornadasConcluidas,
      taxaConclusao,
      irpe,
      distribuicaoEmocional,
      radarEstresse,
      topProblemas,
      ibedMedio,
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
