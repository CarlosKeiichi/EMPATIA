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
      ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length / 20
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

    // === NOVAS METRICAS ===

    // Duracao media (em minutos)
    const duracoes = jornadas
      .filter((j) => j.concluidaEm && j.iniciadaEm)
      .map((j) => {
        const inicio = new Date(j.iniciadaEm).getTime();
        const fim = new Date(j.concluidaEm!).getTime();
        return (fim - inicio) / (1000 * 60);
      })
      .filter((d) => d > 0 && d < 180); // filtrar outliers (>3h)
    const duracaoMedia = duracoes.length > 0
      ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
      : 0;

    // Taxa retorno 7d: professores que fizeram >1 jornada com intervalo <=7 dias
    const jornadasPorProfessor = new Map<string, Date[]>();
    jornadas.forEach((j) => {
      const datas = jornadasPorProfessor.get(j.professorId) || [];
      datas.push(new Date(j.concluidaEm || j.iniciadaEm));
      jornadasPorProfessor.set(j.professorId, datas);
    });
    let retornantes7d = 0;
    jornadasPorProfessor.forEach((datas) => {
      if (datas.length < 2) return;
      datas.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < datas.length; i++) {
        const diff = (datas[i].getTime() - datas[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (diff <= 7) { retornantes7d++; break; }
      }
    });
    const taxaRetorno7d = totalProfessores > 0 ? retornantes7d / totalProfessores : 0;

    // Taxa abandono: jornadas em_andamento iniciadas ha mais de 24h
    const filtroAbandono = escolaId
      ? { professor: { escolaId } }
      : {};
    const todasJornadas = await prisma.jornada.findMany({
      where: filtroAbandono,
      select: { status: true, iniciadaEm: true },
    });
    const agora = Date.now();
    const abandonadas = todasJornadas.filter(
      (j) => j.status === 'em_andamento' && (agora - new Date(j.iniciadaEm).getTime()) > 24 * 60 * 60 * 1000
    ).length;
    const taxaAbandono = todasJornadas.length > 0 ? abandonadas / todasJornadas.length : 0;

    // Tendencia de conclusao (ultimas 8 semanas)
    const tendenciaConclusao: { semana: string; taxa: number; total: number }[] = [];
    const hoje = new Date();
    for (let i = 7; i >= 0; i--) {
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - (i * 7 + 6));
      inicioSemana.setHours(0, 0, 0, 0);
      const fimSemana = new Date(hoje);
      fimSemana.setDate(hoje.getDate() - i * 7);
      fimSemana.setHours(23, 59, 59, 999);

      const jornadasSemana = todasJornadas.filter((j) => {
        const d = new Date(j.iniciadaEm).getTime();
        return d >= inicioSemana.getTime() && d <= fimSemana.getTime();
      });
      const concluidasSemana = jornadasSemana.filter((j) => j.status === 'concluida').length;
      const totalSemana = jornadasSemana.length;

      tendenciaConclusao.push({
        semana: `${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1}`,
        taxa: totalSemana > 0 ? concluidasSemana / totalSemana : 0,
        total: totalSemana,
      });
    }

    // === ALERTAS ===
    const alertas: { tipo: 'critico' | 'aviso'; mensagem: string }[] = [];

    if (irpe.valor > 0.8) {
      alertas.push({ tipo: 'critico', mensagem: `IRPE crítico (${irpe.valor.toFixed(2)}) — risco elevado de esgotamento no corpo docente` });
    } else if (irpe.valor > 0.6) {
      alertas.push({ tipo: 'aviso', mensagem: `IRPE em alerta (${irpe.valor.toFixed(2)}) — atenção ao bem-estar dos professores` });
    }

    if (percentualCriticos > 0.3) {
      alertas.push({
        tipo: percentualCriticos > 0.5 ? 'critico' : 'aviso',
        mensagem: `${(percentualCriticos * 100).toFixed(0)}% dos professores em estado emocional crítico (cansado ou sobrecarregado)`,
      });
    }

    if (taxaAbandono > 0.3) {
      alertas.push({ tipo: 'aviso', mensagem: `Taxa de abandono alta (${(taxaAbandono * 100).toFixed(0)}%) — considere simplificar as jornadas` });
    }

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
      // Novas metricas
      duracaoMedia,
      taxaRetorno7d,
      taxaAbandono,
      tendenciaConclusao,
      alertas,
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
