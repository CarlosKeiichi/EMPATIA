// ============================================
// SISTEMA DE PONTUAÇÃO E INDICADORES
// ============================================

// Cálculo de estresse ocupacional — regras IPCS (contagem de frequências)
export function calcularEstresseOcupacional(respostas: { valor: string }[]): {
  pontuacao: number;
  diagnostico: string;
  nivel: string;
  contagem: { nunca: number; as_vezes: number; frequentemente: number };
} {
  const mapaPontos: Record<string, number> = {
    nunca: 0,
    as_vezes: 1,
    frequentemente: 2,
  };

  const contagem = { nunca: 0, as_vezes: 0, frequentemente: 0 };
  let pontuacao = 0;

  for (const r of respostas) {
    const v = r.valor.toLowerCase();
    pontuacao += mapaPontos[v] ?? 0;
    if (v === 'nunca') contagem.nunca++;
    else if (v === 'as_vezes') contagem.as_vezes++;
    else if (v === 'frequentemente') contagem.frequentemente++;
  }

  let diagnostico: string;
  let nivel: string;

  // Regras IPCS por contagem de frequência
  if (contagem.frequentemente >= 5) {
    diagnostico = 'Estresse ocupacional grave — fase de quase exaustão ou exaustão';
    nivel = 'critico';
  } else if (contagem.frequentemente >= 1) {
    diagnostico = 'Indicadores significativos de estresse — reflita sobre sua percepção frente às demandas';
    nivel = 'elevado';
  } else if (contagem.as_vezes > 5) {
    diagnostico = 'Estágio de resistência — você está lidando com a pressão, mas fique atento';
    nivel = 'moderado';
  } else {
    diagnostico = 'Sem sinais significativos de estresse ocupacional';
    nivel = 'baixo';
  }

  return { pontuacao, diagnostico, nivel, contagem };
}

// Cálculo de burnout relacional — 10 perguntas, escala 0-3 (Nunca/Às vezes/Frequentemente/Quase sempre)
// Total: 0-30 pontos
export function calcularBurnoutRelacional(respostas: { valor: string }[]): {
  pontuacao: number;
  classificacao: string;
  nivel: string;
  contagem: { nunca: number; as_vezes: number; frequentemente: number; quase_sempre: number };
} {
  const mapaPontos: Record<string, number> = {
    nunca: 0,
    as_vezes: 1,
    frequentemente: 2,
    quase_sempre: 3,
  };

  const contagem = { nunca: 0, as_vezes: 0, frequentemente: 0, quase_sempre: 0 };
  let pontuacao = 0;

  for (const r of respostas) {
    const v = r.valor.toLowerCase();
    pontuacao += mapaPontos[v] ?? 0;
    if (v === 'nunca') contagem.nunca++;
    else if (v === 'as_vezes') contagem.as_vezes++;
    else if (v === 'frequentemente') contagem.frequentemente++;
    else if (v === 'quase_sempre') contagem.quase_sempre++;
  }

  let classificacao: string;
  let nivel: string;

  if (pontuacao <= 9) {
    classificacao = 'Baixo risco de burnout relacional';
    nivel = 'baixo';
  } else if (pontuacao <= 18) {
    classificacao = 'Atenção — sinais de desgaste relacional';
    nivel = 'moderado';
  } else if (pontuacao <= 24) {
    classificacao = 'Risco elevado de burnout relacional';
    nivel = 'elevado';
  } else {
    classificacao = 'Alto risco — necessidade de suporte';
    nivel = 'critico';
  }

  return { pontuacao, classificacao, nivel, contagem };
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

// Stopwords em português — palavras comuns que devem ser filtradas da nuvem
const STOPWORDS_PT = new Set([
  'a','o','e','é','de','da','do','das','dos','em','no','na','nos','nas','um','uma','uns','umas',
  'para','por','com','sem','sobre','entre','até','após','ante','desde','que','quem','qual','onde',
  'como','quando','porque','pois','mas','ou','se','já','não','sim','mais','menos','muito','muita',
  'muitos','muitas','pouco','pouca','poucos','poucas','todo','toda','todos','todas','tão','tanto',
  'tanta','tantos','tantas','essa','esse','este','esta','isso','isto','aquele','aquela','aquilo',
  'meu','minha','meus','minhas','seu','sua','seus','suas','teu','tua','teus','tuas','nosso','nossa',
  'nossos','nossas','eu','tu','ele','ela','nós','vós','eles','elas','você','vocês','me','te','se',
  'nos','vos','lhe','lhes','o','a','está','estão','estava','estavam','fui','foi','foram','ser',
  'ter','tem','têm','há','havia','houve','são','seja','estou','estamos','ficar','fica','ficam',
  'dar','deu','dar','fazer','faz','fazem','fazendo','feito','feita','sim','também','só','ainda',
  'então','assim','aqui','ali','lá','depois','antes','sempre','nunca','hoje','ontem','agora','já',
  'bem','mal','vc','vcs','tb','pq','né','ta','tá','to','tô','vai','vou','pra','pro','num','numa',
  'isso','tudo','nada','algo','alguém','ninguém','outro','outra','outros','outras','mesmo','mesma',
  'bastante','realmente','apenas','só','talvez','pode','podem','posso','pode-se','deve','devem',
  'estamos','estava','trabalho','escola','escolar','aula','aulas','docente','professor','professores',
  'minha','meu','às','à','gente','coisa','coisas','jeito','tipo','vezes','vez','dias','dia','tempo',
  'forma','lado','parte','hora','horas','anos','ano','mês','semana','algum','alguma','alguns','algumas',
  'sou','era','eram','vai','vão','fazia','fazem','tinha','tem','teve','tendo','tendo','sendo','ficar',
  'outra','outros','outras','outro','pouco','pouca','poucos','poucas','muito','muita','certo','certa',
  'deles','delas','dele','dela','todo','toda','cada','qualquer','quaisquer','próprio','própria',
  'pra','com','sem','né','tá','ter','ser','estar','foi','são','tô','vou','vai','deu','dá',
]);

function normalizarPalavra(p: string): string {
  return p
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, '')      // remove pontuação
    .trim();
}

export function extrairNuvemPalavras(
  entradas: string[] | { texto: string; peso: number }[],
  limite = 40,
  minTamanho = 3,
): { texto: string; contagem: number }[] {
  const contagem = new Map<string, { original: string; count: number }>();

  // Normalizar entrada: aceitar string[] ou { texto, peso }[]
  const normalizado = (entradas as Array<string | { texto: string; peso: number }>).map((e) =>
    typeof e === 'string' ? { texto: e, peso: 1 } : e
  );

  for (const { texto, peso } of normalizado) {
    if (!texto) continue;
    // Split por espaços e pontuação
    const palavras = texto.split(/[\s,.\-;:!?()\[\]"'\/\\]+/);
    for (const p of palavras) {
      const norm = normalizarPalavra(p);
      if (!norm || norm.length < minTamanho) continue;
      if (STOPWORDS_PT.has(norm)) continue;
      if (/^\d+$/.test(norm)) continue; // só números
      const existing = contagem.get(norm);
      if (existing) {
        existing.count += peso;
      } else {
        // Guardar forma original com acentos para exibição (primeira ocorrência em minúsculo)
        contagem.set(norm, { original: p.toLowerCase().replace(/[^\p{L}0-9\-]/gu, ''), count: peso });
      }
    }
  }

  return Array.from(contagem.values())
    .filter((v) => v.count >= 2) // mínimo de 2 (com peso)
    .sort((a, b) => b.count - a.count)
    .slice(0, limite)
    .map((v) => ({ texto: v.original || '', contagem: v.count }))
    .filter((v) => v.texto.length >= minTamanho);
}

// Escala máxima por bloco (para normalização ao radar 0-10)
// null = categórico, excluir do radar
const ESCALA_MAX_BLOCO: Record<string, number | null> = {
  estresse_ocupacional: 2,          // frequência: nunca=0, às_vezes=1, frequentemente=2
  burnout_relacional_teste: 3,      // frequência: nunca=0..quase_sempre=3
  inteligencia_emocional_teste: 5,  // likert 1-5
  estilo_comunicacao: null,         // categórico — excluir do radar
};
// Todos os outros blocos (conversacionais) usam escala 0-10

// Blocos de teste estruturado (excluídos do radar de estresse por dimensão)
export const BLOCOS_TESTE = [
  'estresse_ocupacional',
  'burnout_relacional_teste',
  'inteligencia_emocional_teste',
  'estilo_comunicacao',
];

// Calcula radar de estresse por dimensão (normalizado 0-10)
export function calcularRadarEstresse(
  respostas: { bloco: string; pontuacao: number | null }[],
  incluirTestes = false
): { dimensao: string; valor: number }[] {
  const grupos: Record<string, number[]> = {};

  for (const r of respostas) {
    if (r.pontuacao === null) continue;
    // Por padrão, excluir blocos de teste estruturado do radar
    if (!incluirTestes && BLOCOS_TESTE.includes(r.bloco)) continue;
    if (!grupos[r.bloco]) grupos[r.bloco] = [];
    grupos[r.bloco].push(r.pontuacao);
  }

  return Object.entries(grupos)
    .filter(([bloco]) => {
      // Excluir blocos categóricos (escalaMax === null) do radar
      const escala = ESCALA_MAX_BLOCO[bloco];
      return escala !== null;
    })
    .map(([bloco, valores]) => {
      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      const escalaMax = ESCALA_MAX_BLOCO[bloco];
      // Normalizar para 0-10 se o bloco tem escala diferente de 10
      const valorNorm = escalaMax != null && escalaMax !== 10
        ? Math.min(10, (media / escalaMax) * 10)
        : Math.min(10, media);
      return {
        dimensao: formatarNomeBloco(bloco),
        valor: Math.round(valorNorm * 10) / 10,
      };
    });
}

function formatarNomeBloco(bloco: string): string {
  const mapa: Record<string, string> = {
    lideranca_sistema: 'Relações no ambiente escolar',
    colegas: 'Relação com os colegas',
    alunos: 'Relação com os alunos',
    atividade_docente: 'Atividade docente',
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
    relacionamentos: 'Relacionamentos',
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
