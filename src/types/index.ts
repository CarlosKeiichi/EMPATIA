// ============================================
// TIPOS GLOBAIS DA PLATAFORMA
// ============================================

export type Role = 'professor' | 'admin' | 'superadmin';
export type TipoJornada = 'trabalho' | 'relacionamentos' | 'financas';
export type StatusJornada = 'em_andamento' | 'concluida' | 'abandonada';
export type EstadoEmocional = 'A' | 'B' | 'C' | 'D' | 'E';
export type NivelRisco = 'baixo' | 'moderado' | 'elevado' | 'critico';
export type TipoPergunta = 'escala_0_10' | 'multipla_escolha' | 'frequencia' | 'aberta';

export interface UsuarioLogado {
  userId: string;
  email: string;
  role: Role;
  nome: string;
}

export interface PerguntaJornada {
  id: string;
  bloco: string;
  texto: string;
  tipo: TipoPergunta;
  opcoes?: { valor: string; label: string }[];
}

export interface RespostaJornada {
  perguntaId: string;
  bloco: string;
  pergunta: string;
  tipo: TipoPergunta;
  valor: string;
  pontuacao: number | null;
}

export interface DiagnosticoResult {
  perfilEmocional: EstadoEmocional;
  nivelEstresse: string;
  pontosAtencao: string[];
  planoAcao: string;
  resumoIA: string;
}

export interface DadosDashboard {
  totalProfessores: number;
  jornadasConcluidas: number;
  taxaConclusao: number;
  irpe: { valor: number; nivel: string; cor: string };
  distribuicaoEmocional: Record<string, number>;
  radarEstresse: { dimensao: string; valor: number }[];
  topProblemas: string[];
  evolucaoIBED: { mes: string; valor: number }[];
}
