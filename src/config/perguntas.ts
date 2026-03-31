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

// Bloco de estresse ocupacional — IPCS (10 perguntas, frequência: Nunca/Às vezes/Frequentemente)
export const perguntasEstresse: PerguntaJornada[] = [
  {
    id: 'est_01',
    bloco: 'estresse_ocupacional',
    texto: 'Tenho me sentido cansado(a) ao acordar para ir trabalhar',
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
    texto: 'Sinto que meu trabalho consome minha energia emocional',
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
    texto: 'Tenho dificuldade para dormir por preocupações com o trabalho',
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
    texto: 'Sinto irritação ou impaciência no ambiente escolar',
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
    texto: 'Tenho pensado em abandonar a profissão',
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
    texto: 'Me sinto emocionalmente esgotado(a) ao final do dia',
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
    texto: 'Sinto dores físicas (cabeça, costas, estômago) relacionadas ao estresse',
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
    texto: 'Sinto que perdi o entusiasmo ou a paixão por ensinar',
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
    texto: 'Tenho a sensação de que não dou conta das demandas',
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
    texto: 'Me sinto desvalorizado(a) como profissional da educação',
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
  // Bloco: Autocuidado (4 perguntas)
  {
    id: 'rel_auto_01',
    bloco: 'autocuidado',
    texto: 'Não costumo considerar minhas necessidades pessoais',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_auto_02',
    bloco: 'autocuidado',
    texto: 'Não encontro tempo para fazer coisas que são importantes para mim',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_auto_03',
    bloco: 'autocuidado',
    texto: 'Não reservo tempo para o lazer ou meus hobbies',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_auto_04',
    bloco: 'autocuidado',
    texto: 'Tendo a me cobrar excessivamente',
    tipo: 'escala_0_10',
  },

  // Bloco: Vínculos Familiares (4 perguntas)
  {
    id: 'rel_vinc_01',
    bloco: 'vinculos_familiares',
    texto: 'Tenho dificuldades no relacionamento com meus pais e irmãos',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_vinc_02',
    bloco: 'vinculos_familiares',
    texto: 'Estou com problemas no meu casamento',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_vinc_03',
    bloco: 'vinculos_familiares',
    texto: 'Estou com problemas com meus filhos',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_vinc_04',
    bloco: 'vinculos_familiares',
    texto: 'Estou com problemas com meu relacionamento amoroso',
    tipo: 'escala_0_10',
  },

  // Bloco: Rede de Apoio (4 perguntas)
  {
    id: 'rel_rede_01',
    bloco: 'rede_apoio',
    texto: 'Não consigo ter boas amizades',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_rede_02',
    bloco: 'rede_apoio',
    texto: 'Não encontro o suporte emocional que eu preciso',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_rede_03',
    bloco: 'rede_apoio',
    texto: 'Não me sinto respeitado nas minhas relações pessoais',
    tipo: 'escala_0_10',
  },
  {
    id: 'rel_rede_04',
    bloco: 'rede_apoio',
    texto: 'Normalmente me frustro com meus relacionamentos',
    tipo: 'escala_0_10',
  },

  // Bloco: Satisfação Geral (escala INVERTIDA: estresse = 10 - resposta)
  {
    id: 'rel_sat_01',
    bloco: 'satisfacao_geral',
    texto: 'De maneira geral, como você avaliaria sua satisfação com seus relacionamentos?',
    tipo: 'escala_0_10',
  },

  // Bloco: Teste de Inteligência Emocional (15 perguntas, escala 1-5)
  {
    id: 'rel_ie_t01',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo identificar o que estou sentindo na maioria das situações',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t02',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Sei reconhecer quando estou ficando irritado(a) antes de reagir',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t03',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo me acalmar quando estou sob pressão',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t04',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo lidar com frustrações sem perder o controle',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t05',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Mantenho a motivação mesmo diante de dificuldades',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t06',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Busco soluções em vez de focar nos problemas',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t07',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Percebo quando alguém ao meu redor está emocionalmente abalado',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t08',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo me colocar no lugar do outro com facilidade',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t09',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Escuto os outros sem interromper ou julgar',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t10',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo expressar meus sentimentos de forma clara e respeitosa',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t11',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Sei resolver conflitos de maneira construtiva',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t12',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo pedir ajuda quando preciso',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t13',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Me adapto bem a mudanças inesperadas',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t14',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Mantenho relações saudáveis com as pessoas importantes para mim',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },
  {
    id: 'rel_ie_t15',
    bloco: 'inteligencia_emocional_teste',
    texto: 'Consigo influenciar positivamente o humor das pessoas ao meu redor',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: '1', label: 'Discordo totalmente' },
      { valor: '2', label: 'Discordo' },
      { valor: '3', label: 'Neutro' },
      { valor: '4', label: 'Concordo' },
      { valor: '5', label: 'Concordo totalmente' },
    ],
  },

  // Bloco: Estilo de Comunicação (5 situações)
  {
    id: 'rel_com_01',
    bloco: 'estilo_comunicacao',
    texto: 'Quando alguém faz algo que me incomoda, eu geralmente:',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'assertivo', label: 'Expresso meu incômodo de forma direta e respeitosa' },
      { valor: 'passivo', label: 'Não digo nada para evitar conflito' },
      { valor: 'agressivo', label: 'Reajo com irritação ou grosseria' },
      { valor: 'passivo_agressivo', label: 'Faço comentários indiretos ou irônicos' },
    ],
  },
  {
    id: 'rel_com_02',
    bloco: 'estilo_comunicacao',
    texto: 'Quando preciso dizer "não" a um pedido:',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'assertivo', label: 'Digo não com clareza e sem culpa' },
      { valor: 'passivo', label: 'Aceito mesmo não querendo' },
      { valor: 'agressivo', label: 'Recuso de forma brusca' },
      { valor: 'passivo_agressivo', label: 'Aceito mas depois não cumpro ou reclamo' },
    ],
  },
  {
    id: 'rel_com_03',
    bloco: 'estilo_comunicacao',
    texto: 'Em uma discussão com alguém próximo:',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'assertivo', label: 'Ouço e expresso meu ponto de vista com calma' },
      { valor: 'passivo', label: 'Cedo para encerrar a discussão' },
      { valor: 'agressivo', label: 'Insisto que estou certo(a) e levanto a voz' },
      { valor: 'passivo_agressivo', label: 'Finjo concordar mas guardo ressentimento' },
    ],
  },
  {
    id: 'rel_com_04',
    bloco: 'estilo_comunicacao',
    texto: 'Quando recebo uma crítica:',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'assertivo', label: 'Avalio se faz sentido e agradeço o feedback' },
      { valor: 'passivo', label: 'Fico em silêncio e me sinto mal' },
      { valor: 'agressivo', label: 'Me defendo imediatamente e contra-ataco' },
      { valor: 'passivo_agressivo', label: 'Aceito na hora mas depois desvalorizo quem criticou' },
    ],
  },
  {
    id: 'rel_com_05',
    bloco: 'estilo_comunicacao',
    texto: 'Quando preciso pedir algo importante:',
    tipo: 'multipla_escolha',
    opcoes: [
      { valor: 'assertivo', label: 'Peço diretamente explicando minha necessidade' },
      { valor: 'passivo', label: 'Dou indiretas esperando que o outro perceba' },
      { valor: 'agressivo', label: 'Exijo o que preciso de forma impaciente' },
      { valor: 'passivo_agressivo', label: 'Faço o pedido com sarcasmo ou culpa' },
    ],
  },

  // Bloco: Burnout Relacional — 10 perguntas, escala 0-3 (Nunca/Às vezes/Frequentemente/Quase sempre). Total máx: 30
  {
    id: 'rel_burn_t01',
    bloco: 'burnout_relacional_teste',
    texto: 'Me sinto exausto só de pensar nas relações no trabalho',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t02',
    bloco: 'burnout_relacional_teste',
    texto: 'Sinto que não sou reconhecido como profissional',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t03',
    bloco: 'burnout_relacional_teste',
    texto: 'Tenho dificuldade de confiar em colegas',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t04',
    bloco: 'burnout_relacional_teste',
    texto: 'Evito conversas com pessoas da equipe',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t05',
    bloco: 'burnout_relacional_teste',
    texto: 'Me sinto sozinho mesmo rodeado de gente',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t06',
    bloco: 'burnout_relacional_teste',
    texto: 'Sinto raiva ao lembrar de certas interações',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t07',
    bloco: 'burnout_relacional_teste',
    texto: 'Prefiro tarefas solitárias a projetos colaborativos',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t08',
    bloco: 'burnout_relacional_teste',
    texto: 'Me culpo por não conseguir ajudar mais os outros',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t09',
    bloco: 'burnout_relacional_teste',
    texto: 'Me pego desejando faltar para não interagir',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
  },
  {
    id: 'rel_burn_t10',
    bloco: 'burnout_relacional_teste',
    texto: 'Sinto que sou apenas "mais um" na instituição',
    tipo: 'frequencia',
    opcoes: [
      { valor: 'nunca', label: 'Nunca' },
      { valor: 'as_vezes', label: 'Às vezes' },
      { valor: 'frequentemente', label: 'Frequentemente' },
      { valor: 'quase_sempre', label: 'Quase sempre' },
    ],
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
