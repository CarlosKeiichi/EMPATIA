// ============================================
// SISTEMA DE PONTUAÇÃO E INDICADORES
// ============================================

// Cálculo de estresse ocupacional (Jornada Trabalho)
export function calcularEstresseOcupacional(respostas: { valor: string }[]): {
  pontuacao: number;
  diagnostico: string;
  nivel: string;
} {
  // Mapeia frequência para pontos
  const mapaPontos: Record<string, number> = {
    nunca: 0,
    as_vezes: 1,
    frequentemente: 2,
  };

  const pontuacao = respostas.reduce((total, r) => {
    return total + (mapaPontos[r.valor] ?? 0);
  }, 0);

  let diagnostico: string;
  let nivel: string;

  if (pontuacao <= 6) {
    diagnostico = 'Sem sinais significativos de estresse ocupacional';
    nivel = 'baixo';
  } else if (pontuacao <= 12) {
    diagnostico = 'Estágio de resistência - sinais moderados de estresse';
    nivel = 'moderado';
  } else {
    diagnostico = 'Estresse elevado - atenção necessária';
    nivel = 'elevado';
  }

  return { pontuacao, diagnostico, nivel };
}

// Cálculo de burnout relacional (Jornada Relacionamentos)
export function calcularBurnoutRelacional(pontuacaoTotal: number): {
  classificacao: string;
  nivel: string;
} {
  if (pontuacaoTotal <= 9) return { classificacao: 'Baixo risco de burnout relacional', nivel: 'baixo' };
  if (pontuacaoTotal <= 18) return { classificacao: 'Atenção - sinais de desgaste relacional', nivel: 'moderado' };
  if (pontuacaoTotal <= 24) return { classificacao: 'Risco elevado de burnout relacional', nivel: 'elevado' };
  return { classificacao: 'Alto risco - necessidade de suporte', nivel: 'critico' };
}

// IRPE — Índice de Risco Psicossocial Escolar
export function calcularIRPE(dados: {
  ibed: number; // 0-1 (índice de bem-estar docente)
  estresseMedio: number; // 0-1 (normalizado)
  impactoCategorias: number; // 0-1 (média de impacto por categoria)
  percentualCriticos: number; // 0-1 (% docentes em estado crítico)
}): {
  valor: number;
  nivel: string;
  cor: string;
} {
  const irpe =
    (1 - dados.ibed) * 0.3 +
    dados.estresseMedio * 0.3 +
    dados.impactoCategorias * 0.3 +
    dados.percentualCriticos * 0.1;

  const valorFinal = Math.max(0, Math.min(1, irpe));

  let nivel: string;
  let cor: string;

  if (valorFinal < 0.3) {
    nivel = 'baixo';
    cor = '#22c55e'; // verde
  } else if (valorFinal < 0.6) {
    nivel = 'moderado';
    cor = '#f59e0b'; // amarelo
  } else if (valorFinal < 0.8) {
    nivel = 'alto';
    cor = '#f97316'; // laranja
  } else {
    nivel = 'crítico';
    cor = '#ef4444'; // vermelho
  }

  return { valor: valorFinal, nivel, cor };
}

// IBED — Índice de Bem-Estar Docente (escala 1-5)
export function calcularIBED(estadoInicial: string, estadoFinal: string): {
  valorInicial: number;
  valorFinal: number;
  diferenca: number;
  evolucao: string;
  valor: number; // mantém compatibilidade (valorFinal normalizado 0-1)
} {
  const mapaEstados: Record<string, number> = {
    A: 5, // Muito fortalecido
    B: 4, // Consciente e esperançoso
    C: 3, // Em equilíbrio, mas em alerta
    D: 2, // Cansado
    E: 1, // Sobrecarregado
  };

  const valorInicial = mapaEstados[estadoInicial] ?? 3;
  const valorFinal = mapaEstados[estadoFinal] ?? 3;
  const diferenca = valorFinal - valorInicial; // -4 a +4

  let evolucao: string;
  if (diferenca > 0) {
    evolucao = 'positiva';
  } else if (diferenca < 0) {
    evolucao = 'regressão';
  } else {
    evolucao = 'estabilidade';
  }

  return {
    valorInicial,
    valorFinal,
    diferenca,
    evolucao,
    valor: (valorFinal - 1) / 4, // normalizado 0-1 para compatibilidade com IRPE
  };
}

// IRPR — Índice Relacional de Professores e Rede
export function calcularIRPR(dados: {
  ieNormalizada: number; // 0-1 (inteligência emocional normalizada)
  estresseNormalizado: number; // 0-1
  percentualNaoAssertivo: number; // 0-1
  percentualPassivoPredominante: number; // 0-1
}): {
  valor: number;
  nivel: string;
  cor: string;
} {
  const irpr =
    (1 - dados.ieNormalizada) * 0.3 +
    dados.estresseNormalizado * 0.3 +
    dados.percentualNaoAssertivo * 0.3 +
    dados.percentualPassivoPredominante * 0.1;

  const valorFinal = Math.max(0, Math.min(1, irpr));

  let nivel: string;
  let cor: string;

  if (valorFinal < 0.3) {
    nivel = 'baixo';
    cor = '#22c55e';
  } else if (valorFinal < 0.6) {
    nivel = 'moderado';
    cor = '#f59e0b';
  } else if (valorFinal < 0.8) {
    nivel = 'alto';
    cor = '#f97316';
  } else {
    nivel = 'crítico';
    cor = '#ef4444';
  }

  return { valor: valorFinal, nivel, cor };
}

// Inteligência Emocional — 15 questões, escala 1-5 (total 15-75)
export function calcularInteligenciaEmocional(pontuacaoTotal: number): {
  pontuacao: number;
  classificacao: string;
  nivel: string;
} {
  let classificacao: string;
  let nivel: string;

  if (pontuacaoTotal <= 34) {
    classificacao = 'Baixa inteligência emocional';
    nivel = 'baixa';
  } else if (pontuacaoTotal <= 54) {
    classificacao = 'Inteligência emocional média';
    nivel = 'media';
  } else {
    classificacao = 'Alta inteligência emocional';
    nivel = 'alta';
  }

  return { pontuacao: pontuacaoTotal, classificacao, nivel };
}

// Estilo de Comunicação — 5 situações, 4 estilos possíveis
export function calcularEstiloComunicacao(respostas: string[]): {
  predominante: string;
  distribuicao: Record<string, number>;
} {
  const estilos = ['assertivo', 'passivo', 'agressivo', 'passivo_agressivo'];
  const distribuicao: Record<string, number> = {};
  for (const e of estilos) distribuicao[e] = 0;

  for (const r of respostas) {
    const estilo = r.toLowerCase().replace('-', '_');
    if (distribuicao[estilo] !== undefined) {
      distribuicao[estilo]++;
    }
  }

  let predominante = 'assertivo';
  let max = 0;
  for (const [estilo, count] of Object.entries(distribuicao)) {
    if (count > max) {
      max = count;
      predominante = estilo;
    }
  }

  return { predominante, distribuicao };
}

// Extrai top problemas das respostas
export function extrairTopProblemas(
  respostas: { bloco: string; pergunta: string; pontuacao: number | null }[],
  limite = 5
): string[] {
  return respostas
    .filter((r) => r.pontuacao !== null && r.pontuacao >= 7)
    .sort((a, b) => (b.pontuacao ?? 0) - (a.pontuacao ?? 0))
    .slice(0, limite)
    .map((r) => r.pergunta);
}

// Calcula radar de estresse por dimensão
export function calcularRadarEstresse(
  respostas: { bloco: string; pontuacao: number | null }[]
): { dimensao: string; valor: number }[] {
  const grupos: Record<string, number[]> = {};

  for (const r of respostas) {
    if (r.pontuacao === null) continue;
    if (!grupos[r.bloco]) grupos[r.bloco] = [];
    grupos[r.bloco].push(r.pontuacao);
  }

  return Object.entries(grupos).map(([dimensao, valores]) => ({
    dimensao: formatarNomeBloco(dimensao),
    valor: valores.reduce((a, b) => a + b, 0) / valores.length,
  }));
}

function formatarNomeBloco(bloco: string): string {
  const mapa: Record<string, string> = {
    lideranca_sistema: 'Liderança/Sistema',
    colegas: 'Colegas',
    alunos: 'Alunos',
    atividade_docente: 'Atividade Docente',
    autocuidado: 'Autocuidado',
    vinculos_familiares: 'Vínculos Familiares',
    rede_apoio: 'Rede de Apoio',
    satisfacao_geral: 'Satisfação Geral',
    relacoes_interpessoais: 'Relações',
    inteligencia_emocional: 'Intelig. Emocional',
    inteligencia_emocional_teste: 'IE (Teste)',
    burnout_relacional: 'Burnout Relacional',
    burnout_relacional_teste: 'Burnout Relacional',
    estilo_comunicacao: 'Estilo Comunicação',
    comunicacao: 'Comunicação',
    pressao_financeira: 'Pressão Financeira',
    organizacao_financeira: 'Organização',
    endividamento: 'Endividamento',
  };
  return mapa[bloco] || bloco;
}

// Distribuição emocional para dashboard
export function calcularDistribuicaoEmocional(
  estados: string[]
): Record<string, number> {
  const mapa: Record<string, string> = {
    A: 'Fortalecido',
    B: 'Esperançoso',
    C: 'Em alerta',
    D: 'Cansado',
    E: 'Sobrecarregado',
  };

  const contagem: Record<string, number> = {
    Fortalecido: 0,
    Esperançoso: 0,
    'Em alerta': 0,
    Cansado: 0,
    Sobrecarregado: 0,
  };

  for (const estado of estados) {
    const nome = mapa[estado] || 'Em alerta';
    contagem[nome]++;
  }

  return contagem;
}
