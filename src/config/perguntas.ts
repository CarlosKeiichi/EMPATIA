import { PerguntaJornada } from '@/types';

// ============================================
// PERGUNTAS DA JORNADA DE TRABALHO
// ============================================

export const perguntasTrabalho: PerguntaJornada[] = [
  // Bloco: Liderança e Sistema
  {
    id: 'trab_lid_01',
    bloco: 'lideranca_sistema',
    texto: 'Demandas excessivas vindas da gestão escolar',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_lid_02',
    bloco: 'lideranca_sistema',
    texto: 'Falta de reconhecimento pelo seu trabalho',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_lid_03',
    bloco: 'lideranca_sistema',
    texto: 'Falta de apoio institucional quando você precisa',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_lid_04',
    bloco: 'lideranca_sistema',
    texto: 'Pressão por resultados sem os recursos necessários',
    tipo: 'escala_0_10',
  },

  // Bloco: Colegas
  {
    id: 'trab_col_01',
    bloco: 'colegas',
    texto: 'Falta de cooperação entre colegas de trabalho',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_col_02',
    bloco: 'colegas',
    texto: 'Sensação de isolamento no ambiente escolar',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_col_03',
    bloco: 'colegas',
    texto: 'Ambiente competitivo ou hostil entre professores',
    tipo: 'escala_0_10',
  },

  // Bloco: Alunos
  {
    id: 'trab_alu_01',
    bloco: 'alunos',
    texto: 'Indisciplina dos alunos em sala de aula',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_alu_02',
    bloco: 'alunos',
    texto: 'Desinteresse dos alunos pelo conteúdo',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_alu_03',
    bloco: 'alunos',
    texto: 'Situações de desrespeito ou agressividade',
    tipo: 'escala_0_10',
  },

  // Bloco: Atividade Docente
  {
    id: 'trab_atv_01',
    bloco: 'atividade_docente',
    texto: 'Sobrecarga de trabalho e acúmulo de tarefas',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_atv_02',
    bloco: 'atividade_docente',
    texto: 'Falta de organização e planejamento no trabalho',
    tipo: 'escala_0_10',
  },
  {
    id: 'trab_atv_03',
    bloco: 'atividade_docente',
    texto: 'Desmotivação com a profissão',
    tipo: 'escala_0_10',
  },
];

// Bloco de estresse ocupacional (frequência)
export const perguntasEstresse: PerguntaJornada[] = [
  {
    id: 'est_01',
    bloco: 'estresse_ocupacional',
    texto: 'Segunda-feira me dá desânimo',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_02',
    bloco: 'estresse_ocupacional',
    texto: 'Meu entusiasmo pelo trabalho está baixo',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_03',
    bloco: 'estresse_ocupacional',
    texto: 'Me sinto irritado no trabalho',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_04',
    bloco: 'estresse_ocupacional',
    texto: 'Sinto ansiedade no ambiente escolar',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_05',
    bloco: 'estresse_ocupacional',
    texto: 'Tenho dificuldade para dormir por preocupações com o trabalho',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_06',
    bloco: 'estresse_ocupacional',
    texto: 'Sinto que perdi a paixão por ensinar',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_07',
    bloco: 'estresse_ocupacional',
    texto: 'Me sinto emocionalmente esgotado ao final do dia',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_08',
    bloco: 'estresse_ocupacional',
    texto: 'Tenho pensado em abandonar a profissão',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_09',
    bloco: 'estresse_ocupacional',
    texto: 'Sinto dores no corpo relacionadas ao estresse',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
  {
    id: 'est_10',
    bloco: 'estresse_ocupacional',
    texto: 'Me sinto desvalorizado como profissional',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
    ],
  },
];

// ============================================
// PERGUNTAS DA JORNADA DE RELACIONAMENTOS
// ============================================

export const perguntasRelacionamentos: PerguntaJornada[] = [
  // Autocuidado emocional
  {
    id: 'rel_auto_01',
    bloco: 'autocuidado',
    texto: 'Não considero minhas necessidades pessoais como prioridade',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_auto_02',
    bloco: 'autocuidado',
    texto: 'Não tenho tempo para lazer ou atividades prazerosas',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_auto_03',
    bloco: 'autocuidado',
    texto: 'Me cobro excessivamente em tudo o que faço',
    tipo: 'escala_0_10',
  },

  // Relações interpessoais
  {
    id: 'rel_inter_01',
    bloco: 'relacoes_interpessoais',
    texto: 'Dificuldade nos relacionamentos familiares',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_inter_02',
    bloco: 'relacoes_interpessoais',
    texto: 'Falta de apoio emocional das pessoas próximas',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_inter_03',
    bloco: 'relacoes_interpessoais',
    texto: 'Conflitos no relacionamento amoroso',
    tipo: 'escala_0_10',
  },

  // Inteligência emocional
  {
    id: 'rel_ie_01',
    bloco: 'inteligencia_emocional',
    texto: 'Como você avalia sua capacidade de reconhecer seus próprios sentimentos?',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_ie_02',
    bloco: 'inteligencia_emocional',
    texto: 'Como você avalia sua capacidade de controlar impulsos emocionais?',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_ie_03',
    bloco: 'inteligencia_emocional',
    texto: 'Como você avalia sua empatia com as pessoas ao redor?',
    tipo: 'escala_0_10',
  },

  // Burnout relacional
  {
    id: 'rel_burn_01',
    bloco: 'burnout_relacional',
    texto: 'Sinto que cuido de todos, menos de mim',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_burn_02',
    bloco: 'burnout_relacional',
    texto: 'Me sinto emocionalmente esgotado(a) nos meus relacionamentos',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_burn_03',
    bloco: 'burnout_relacional',
    texto: 'Evito interações sociais porque me sinto exausto(a)',
    tipo: 'escala_0_10',
  },
];

// ============================================
// PERGUNTAS DA JORNADA DE FINANÇAS
// ============================================

export const perguntasFinancas: PerguntaJornada[] = [
  {
    id: 'fin_01',
    bloco: 'pressao_financeira',
    texto: 'Pressão por não conseguir pagar todas as contas em dia',
    tipo: 'escala_0_10',
  },
  {
    id: 'fin_02',
    bloco: 'pressao_financeira',
    texto: 'Ansiedade por não ter reserva financeira para emergências',
    tipo: 'escala_0_10',
  },
  {
    id: 'fin_03',
    bloco: 'endividamento',
    texto: 'Nível de preocupação com dívidas atuais',
    tipo: 'escala_0_10',
  },
  {
    id: 'fin_04',
    bloco: 'endividamento',
    texto: 'Impacto emocional de precisar de renda extra',
    tipo: 'escala_0_10',
  },
  {
    id: 'fin_05',
    bloco: 'organizacao_financeira',
    texto: 'Você tem um planejamento financeiro mensal?',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'sim_detalhado', label: 'Sim, detalhado' },
      { valor: 'sim_basico', label: 'Sim, básico' },
      { valor: 'nao', label: 'Não tenho' },
      { valor: 'tentei_desisti', label: 'Já tentei mas desisti' },
    ],
  },
  {
    id: 'fin_06',
    bloco: 'organizacao_financeira',
    texto: 'Sinto que a situação financeira afeta minha saúde mental',
    tipo: 'escala_0_10',
  },
];

// Pergunta inicial de estado emocional
export const perguntaEstadoEmocional: PerguntaJornada = {
  id: 'estado_emocional',
  bloco: 'contextualizacao',
  texto: 'Em relação à sua saúde emocional como educador, você se sente:',
  tipo: 'multipla_escolha',
  opcoes: [
    { valor: 'A', label: 'Muito fortalecido(a)' },
    { valor: 'B', label: 'Esperançoso(a)' },
    { valor: 'C', label: 'Em alerta' },
    { valor: 'D', label: 'Cansado(a)' },
    { valor: 'E', label: 'Sobrecarregado(a)' },
  ],
};

// Função helper para pegar perguntas por jornada
export function getPerguntasPorJornada(tipo: string): PerguntaJornada[] {
  switch (tipo) {
    case 'trabalho':
      return [...perguntasTrabalho, ...perguntasEstresse];
    case 'relacionamentos':
      return perguntasRelacionamentos;
    case 'financas':
      return perguntasFinancas;
    default:
      return [];
  }
}
