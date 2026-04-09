import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calcularIRPE,
  calcularIRPR,
  calcularDistribuicaoEmocional,
  calcularRadarEstresse,
  extrairTopProblemas,
  calcularIBED,
  calcularBurnoutRelacional,
  calcularInteligenciaEmocional,
  calcularEstiloComunicacao,
  BLOCOS_TESTE,
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

    // Filtro por jornada (query param)
    const jornadaFiltro = req.nextUrl.searchParams.get('jornada'); // 'trabalho' | 'relacionamentos' | 'financas' | null

    // Filtros demográficos
    const generoFiltro = req.nextUrl.searchParams.get('genero');
    const faixaEtariaFiltro = req.nextUrl.searchParams.get('faixaEtaria');
    const frequenciaFiltro = req.nextUrl.searchParams.get('frequenciaAulas');
    const funcaoEnsinoFiltro = req.nextUrl.searchParams.get('funcaoEnsino');

    // Buscar jornadas concluídas
    const filtro: Record<string, unknown> = { status: 'concluida' };
    const filtroProfessor: Record<string, unknown> = {};
    if (escolaId) filtroProfessor.escolaId = escolaId;
    if (generoFiltro) filtroProfessor.genero = generoFiltro;
    if (faixaEtariaFiltro) filtroProfessor.faixaEtaria = faixaEtariaFiltro;
    if (frequenciaFiltro) filtroProfessor.frequenciaAulas = frequenciaFiltro;
    if (funcaoEnsinoFiltro) filtroProfessor.funcaoEnsino = funcaoEnsinoFiltro;
    if (Object.keys(filtroProfessor).length > 0) filtro.professor = filtroProfessor;
    if (jornadaFiltro) filtro.tipo = jornadaFiltro;

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
      .map((j) => calcularIBED(j.estadoEmocionalInicial!, j.estadoEmocionalFinal!));
    const ibedMedio = ibedValues.length > 0
      ? ibedValues.reduce((a, b) => a + b.valor, 0) / ibedValues.length
      : 0.5;
    const ibedDiferencaMedia = ibedValues.length > 0
      ? ibedValues.reduce((a, b) => a + b.diferenca, 0) / ibedValues.length
      : 0;

    // Estresse médio normalizado (0-1)
    // Usar média das respostas conversacionais (0-10), excluindo testes estruturados
    const respostasConversacionais = jornadas.flatMap((j) =>
      j.respostas
        .filter((r) => r.pontuacao !== null && !BLOCOS_TESTE.includes(r.bloco))
        .map((r) => r.pontuacao!)
    );
    const estresseMedio = respostasConversacionais.length > 0
      ? respostasConversacionais.reduce((a, b) => a + b, 0) / respostasConversacionais.length / 10
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
      .filter((d) => d > 0 && d < 180);
    const duracaoMedia = duracoes.length > 0
      ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
      : 0;

    // Taxa retorno 7d
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

    // Taxa abandono
    const filtroAbandono: Record<string, unknown> = {};
    if (Object.keys(filtroProfessor).length > 0) filtroAbandono.professor = filtroProfessor;
    if (jornadaFiltro) filtroAbandono.tipo = jornadaFiltro;
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

    // === DADOS ESPECÍFICOS DE RELACIONAMENTOS ===
    let irpr = null;
    let ieMedia = null;
    let distribuicaoEstiloComunicacao: Record<string, number> | null = null;
    let percentualBurnoutElevado = null;

    if (!jornadaFiltro || jornadaFiltro === 'relacionamentos') {
      // Filtrar jornadas de relacionamentos
      const jornadasRel = jornadaFiltro === 'relacionamentos'
        ? jornadas
        : jornadas.filter((j) => j.tipo === 'relacionamentos');

      if (jornadasRel.length > 0) {
        // Inteligência Emocional — respostas do bloco inteligencia_emocional_teste
        const ieRespostas = jornadasRel.flatMap((j) =>
          j.respostas
            .filter((r) => r.bloco === 'inteligencia_emocional_teste')
            .map((r) => parseInt(r.valor) || 0)
        );

        // IE por jornada (soma das 15 respostas)
        const iePorJornada: number[] = [];
        for (const j of jornadasRel) {
          const respostasIE = j.respostas
            .filter((r) => r.bloco === 'inteligencia_emocional_teste')
            .map((r) => parseInt(r.valor) || 0);
          if (respostasIE.length > 0) {
            iePorJornada.push(respostasIE.reduce((a, b) => a + b, 0));
          }
        }
        const ieMediaVal = iePorJornada.length > 0
          ? iePorJornada.reduce((a, b) => a + b, 0) / iePorJornada.length
          : 45; // default média
        const ieResult = calcularInteligenciaEmocional(Math.round(ieMediaVal));
        ieMedia = { ...ieResult, media: ieMediaVal };

        // Estilo de Comunicação
        const comRespostas = jornadasRel.flatMap((j) =>
          j.respostas
            .filter((r) => r.bloco === 'estilo_comunicacao')
            .map((r) => r.valor)
        );
        if (comRespostas.length > 0) {
          const estiloResult = calcularEstiloComunicacao(comRespostas);
          distribuicaoEstiloComunicacao = estiloResult.distribuicao;
        }

        // Burnout Relacional
        const burnoutPorJornada: number[] = [];
        for (const j of jornadasRel) {
          const respostasBurnout = j.respostas
            .filter((r) => r.bloco === 'burnout_relacional_teste')
            .map((r) => r.pontuacao ?? 0);
          if (respostasBurnout.length > 0) {
            burnoutPorJornada.push(respostasBurnout.reduce((a, b) => a + b, 0));
          }
        }
        const burnoutElevados = burnoutPorJornada.filter((p) => p > 18).length;
        percentualBurnoutElevado = burnoutPorJornada.length > 0
          ? burnoutElevados / burnoutPorJornada.length
          : 0;

        // Calcular estresse normalizado para relacionamentos
        const respostasRelEstresse = jornadasRel.flatMap((j) =>
          j.respostas
            .filter((r) => ['autocuidado', 'vinculos_familiares', 'rede_apoio', 'satisfacao_geral'].includes(r.bloco))
            .map((r) => r.pontuacao ?? 0)
        );
        const estresseRelNorm = respostasRelEstresse.length > 0
          ? respostasRelEstresse.reduce((a, b) => a + b, 0) / respostasRelEstresse.length / 10
          : 0;

        // % não assertivo e % passivo predominante
        const totalRel = jornadasRel.length;
        let naoAssertivos = 0;
        let passivoPredominante = 0;
        for (const j of jornadasRel) {
          const respostasCom = j.respostas
            .filter((r) => r.bloco === 'estilo_comunicacao')
            .map((r) => r.valor);
          if (respostasCom.length > 0) {
            const estilo = calcularEstiloComunicacao(respostasCom);
            if (estilo.predominante !== 'assertivo') naoAssertivos++;
            if (estilo.predominante === 'passivo') passivoPredominante++;
          }
        }

        // IRPR
        irpr = calcularIRPR({
          ieNormalizada: (ieMediaVal - 15) / 60, // normalizar 15-75 para 0-1
          estresseNormalizado: estresseRelNorm,
          percentualNaoAssertivo: totalRel > 0 ? naoAssertivos / totalRel : 0,
          percentualPassivoPredominante: totalRel > 0 ? passivoPredominante / totalRel : 0,
        });
      }
    }

    // === ALERTAS ===
    const alertas: { tipo: 'critico' | 'aviso'; mensagem: string }[] = [];

    if (irpe.valor > 0.8) {
      alertas.push({ tipo: 'critico', mensagem: `IRPE crítico (${irpe.valor.toFixed(2)}) — risco elevado de esgotamento no corpo docente` });
    } else if (irpe.valor > 0.6) {
      alertas.push({ tipo: 'aviso', mensagem: `IRPE em alerta (${irpe.valor.toFixed(2)}) — atenção ao bem-estar dos professores` });
    }

    if (irpr && irpr.valor > 0.8) {
      alertas.push({ tipo: 'critico', mensagem: `IRPR crítico (${irpr.valor.toFixed(2)}) — risco relacional elevado` });
    } else if (irpr && irpr.valor > 0.6) {
      alertas.push({ tipo: 'aviso', mensagem: `IRPR em alerta (${irpr.valor.toFixed(2)}) — atenção às relações interpessoais` });
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
      ibedDiferencaMedia,
      duracaoMedia,
      taxaRetorno7d,
      taxaAbandono,
      tendenciaConclusao,
      alertas,
      // Dados de relacionamentos
      irpr,
      ieMedia,
      distribuicaoEstiloComunicacao,
      percentualBurnoutElevado,
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
