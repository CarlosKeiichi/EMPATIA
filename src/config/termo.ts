/**
 * Termo de Uso e Consentimento do professor.
 *
 * A VERSAO é gravada junto de cada aceite. Ao publicar uma versão nova aqui,
 * os aceites antigos continuam apontando para a versão que a pessoa de fato
 * leu — é isso que dá valor probatório ao registro.
 */

export const VERSAO_TERMO = '1.0';

export const TERMO_META = {
  titulo: 'Termo de Uso e Consentimento',
  plataforma: 'EmpatIA · Saúde Mental do Professor',
  subtitulo: `Versão ${VERSAO_TERMO} · Agosto de 2026 · Aplicável ao Piloto Descomplica Faculdade`,
  controlador: 'Instituto Leme de Psicologia',
  cnpj: '55.284.978/0001-14',
  contato: 'Deni_duarte@hotmail.com',
};

/** As 5 linhas do card de resumo, acima dos checkboxes. */
export const RESUMO_CADASTRO = [
  'É gratuito para você — quem contrata é a instituição',
  'A coordenação nunca vê suas respostas individuais',
  'É voluntário e você pode parar quando quiser',
  'Não é tratamento psicológico e não faz diagnóstico',
  'É só pedir e apagamos seus dados',
];

/** Os dois consentimentos. Separados porque a LGPD exige consentimento
 *  específico e destacado para dado de saúde (Art. 11, I). */
export const CONSENTIMENTOS = [
  {
    tipo: 'termos_uso',
    rotulo: 'Li e aceito os Termos de Uso e a Política de Privacidade.',
  },
  {
    tipo: 'dados_saude',
    rotulo:
      'Autorizo o tratamento das minhas informações sobre bem-estar emocional para receber apoio personalizado e para compor relatórios coletivos anonimizados da instituição (LGPD, Art. 11, I).',
  },
] as const;

export type TipoConsentimento = (typeof CONSENTIMENTOS)[number]['tipo'];

export const TIPOS_CONSENTIMENTO: TipoConsentimento[] = CONSENTIMENTOS.map((c) => c.tipo);

export interface SecaoTermo {
  titulo: string;
  paragrafos: string[];
}

export const RESUMO_TERMO: { titulo: string; texto: string }[] = [
  {
    titulo: 'É gratuito para você.',
    texto: 'Quem contrata a plataforma é a instituição. Você não paga nada, hoje nem depois.',
  },
  {
    titulo: 'Sua conversa é sua.',
    texto:
      'A coordenação e a direção nunca veem suas respostas individuais, seu nome ou o que você escreve para a MarcIA. Elas recebem apenas números do grupo, sem identificação.',
  },
  {
    titulo: 'É voluntário.',
    texto:
      'Participar ou não participar não afeta sua avaliação, sua carga horária ou sua relação com a instituição. Você pode parar quando quiser.',
  },
  {
    titulo: 'Não é tratamento psicológico.',
    texto:
      'A MarcIA é uma ferramenta de apoio e autoconhecimento. Não substitui consulta com psicólogo ou médico e não faz diagnóstico.',
  },
  {
    titulo: 'Você manda nos seus dados.',
    texto: 'Pode acessar, corrigir ou apagar tudo a qualquer momento.',
  },
];

export const SECOES_TERMO: SecaoTermo[] = [
  {
    titulo: '1. Quem somos',
    paragrafos: [
      'A plataforma EmpatIA é operada pelo Instituto Leme de Psicologia, CNPJ 55.284.978/0001-14, controlador dos dados nos termos da Lei nº 13.709/2018 (LGPD).',
    ],
  },
  {
    titulo: '2. O que coletamos',
    paragrafos: [
      'Dados de cadastro (nome, e-mail institucional e código da instituição); estado emocional que você informa; suas respostas às jornadas estruturadas; o conteúdo das suas conversas com a MarcIA; e dados de uso (data, duração e jornadas concluídas).',
    ],
  },
  {
    titulo: '3. Para que usamos',
    paragrafos: [
      '(a) gerar seus resumos, recomendações e histórico pessoal dentro da plataforma;',
      '(b) compor indicadores agregados e anonimizados que integram o relatório de riscos psicossociais da instituição, exigido pela NR-1 (Portaria MTE nº 1.419/2024);',
      '(c) aperfeiçoar a plataforma e o conteúdo oferecido.',
    ],
  },
  {
    titulo: '4. O que a instituição vê — e o que não vê',
    paragrafos: [
      'A instituição NÃO tem acesso a: seu nome associado a respostas, ao texto das suas conversas, aos seus resumos individuais ou ao seu histórico pessoal.',
      'A instituição recebe percentuais e médias do grupo. Nenhum recorte com menos de 7 respondentes é exibido, justamente para impedir identificação indireta.',
      'E o que a EmpatIA vê: a equipe da EmpatIA não lê o conteúdo das suas conversas com a MarcIA. O único caso em que uma pessoa da EmpatIA é informada individualmente está descrito no item 6 (situação de risco à vida) — e, ainda assim, sem acesso ao conteúdo da conversa.',
    ],
  },
  {
    titulo: '5. Natureza do serviço',
    paragrafos: [
      'A EmpatIA é uma ferramenta de psicoeducação e autoconhecimento. Não constitui atendimento psicológico, psicoterapia ou serviço médico; não realiza diagnóstico; não prescreve tratamento.',
      'O conteúdo tem curadoria científica da psicóloga responsável Msc. Marcia Toledo Duarte, CRP 08/09580.',
    ],
  },
  {
    titulo: '6. Situações de risco à vida',
    paragrafos: [
      'A MarcIA não é um serviço de emergência e não substitui atendimento imediato.',
      'Se você mencionar risco à sua vida, a MarcIA apresentará imediatamente canais de apoio: CVV 188 e SAMU 192.',
      'Nesse caso, a psicóloga responsável da EmpatIA é informada de que você acionou o apoio — recebendo apenas seu nome, seu e-mail e a data. Ela NÃO tem acesso ao conteúdo da sua conversa.',
      'Esse registro fica em área restrita, acessível exclusivamente à equipe responsável da EmpatIA (Instituto Leme de Psicologia), e existe para que possamos oferecer acompanhamento, não para controle ou avaliação.',
      "Em situação de risco grave e iminente à vida, a EmpatIA poderá acionar serviços de emergência, com fundamento no Art. 7º, VII e no Art. 11, II, 'f' da LGPD, que autorizam o tratamento de dados para proteção da vida e da incolumidade física do titular.",
      'A instituição de ensino não é informada em nenhuma hipótese — nem do acionamento, nem do seu nome, nem de qualquer contagem.',
      'Se você estiver passando por um momento difícil: CVV — 188 (24 horas, gratuito e sigiloso). Emergência — SAMU 192. CAPS mais próximo da sua região.',
    ],
  },
  {
    titulo: '7. Voluntariedade',
    paragrafos: [
      'A participação é livre. A recusa em participar ou a interrupção a qualquer momento não gera qualquer consequência funcional, disciplinar ou avaliativa.',
    ],
  },
  {
    titulo: '8. Seus direitos (LGPD, Art. 18)',
    paragrafos: [
      'Você pode, a qualquer momento e sem justificativa: confirmar a existência de tratamento; acessar seus dados; corrigi-los; solicitar anonimização ou eliminação; solicitar portabilidade; obter informação sobre compartilhamento; e revogar o consentimento.',
      'Basta escrever para Deni_duarte@hotmail.com. O prazo de resposta é de até 15 dias.',
      'A revogação do consentimento encerra seu acesso e elimina seus dados individuais. Os indicadores agregados já anonimizados permanecem, por não permitirem sua identificação.',
    ],
  },
  {
    titulo: '9. Segurança e retenção',
    paragrafos: [
      'Seus dados são armazenados com controle de acesso e transmitidos de forma criptografada. O prazo de retenção é de 24 meses após o último acesso, ou até a revogação do consentimento, o que ocorrer primeiro.',
    ],
  },
  {
    titulo: '10. Compartilhamento',
    paragrafos: [
      'Não vendemos, cedemos ou comercializamos seus dados. O processamento conversacional utiliza provedor de tecnologia de inteligência artificial contratado, sujeito a obrigações contratuais de confidencialidade e segurança da informação.',
    ],
  },
  {
    titulo: '11. Idade mínima',
    paragrafos: ['O uso da plataforma é restrito a maiores de 18 anos.'],
  },
  {
    titulo: '12. Alterações',
    paragrafos: [
      'Alterações materiais neste Termo serão comunicadas por e-mail com 15 dias de antecedência.',
    ],
  },
];
