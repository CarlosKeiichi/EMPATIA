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

// IBED — Índice de Bem-Estar Docente
export function calcularIBED(estadoInicial: string, estadoFinal: string): {
  valor: number;
  evolucao: string;
} {
  const mapaEstados: Record<string, number> = {
    A: 1.0, // Muito fortalecido
    B: 0.75, // Esperançoso
    C: 0.5, // Em alerta
    D: 0.25, // Cansado
    E: 0.0, // Sobrecarregado
  };

  const inicial = mapaEstados[estadoInicial] ?? 0.5;
  const final_ = mapaEstados[estadoFinal] ?? 0.5;

  const valor = final_;
  let evolucao: string;

  if (final_ > inicial) {
    evolucao = 'positiva';
  } else if (final_ < inicial) {
    evolucao = 'regressão';
  } else {
    evolucao = 'estabilidade';
  }

  return { valor, evolucao };
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
    relacoes_interpessoais: 'Relações',
    inteligencia_emocional: 'Intelig. Emocional',
    burnout_relacional: 'Burnout Relacional',
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
