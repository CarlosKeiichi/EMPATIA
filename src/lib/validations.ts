import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres'),
  acao: z.enum(['login', 'registro']).optional(),
});

export const registroSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  acao: z.literal('registro'),
  genero: z.string().optional(),
  faixaEtaria: z.string().optional(),
  frequenciaAulas: z.string().optional(),
  escolaId: z.string().optional(),
});

export const chatSchema = z.object({
  conversaId: z.string().optional().nullable(),
  mensagem: z.string().min(1, 'Mensagem não pode ser vazia').max(5000, 'Mensagem muito longa'),
  configIA: z.string().optional(),
  contexto: z.string().optional(),
});

export const criarJornadaSchema = z.object({
  tipo: z.enum(['trabalho', 'relacionamentos', 'financas'], {
    errorMap: () => ({ message: 'Tipo de jornada inválido' }),
  }),
  estadoEmocionalInicial: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
});

export const respostaSchema = z.object({
  perguntaId: z.string(),
  bloco: z.string(),
  pergunta: z.string(),
  tipo: z.string(),
  valor: z.string(),
  pontuacao: z.number().nullable(),
});

export const finalizarJornadaSchema = z.object({
  jornadaId: z.string().min(1, 'ID da jornada é obrigatório'),
  respostas: z.array(respostaSchema).min(1, 'Pelo menos uma resposta é necessária'),
  estadoEmocionalFinal: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
  finalizar: z.boolean().optional(),
});

// ============================================
// SCHEMAS ADMIN
// ============================================

export const configIASchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  systemPrompt: z.string().min(10, 'Prompt deve ter pelo menos 10 caracteres'),
  temperatura: z.number().min(0).max(2).default(0.7),
  modelo: z.string().min(1, 'Modelo é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
});

export const perguntaSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  jornada: z.string().min(1, 'Jornada é obrigatória'),
  bloco: z.string().min(1, 'Bloco é obrigatório'),
  texto: z.string().min(3, 'Texto deve ter pelo menos 3 caracteres'),
  tipo: z.enum(['escala_0_10', 'multipla_escolha', 'frequencia', 'aberta']),
  opcoes: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
  ativa: z.boolean().default(true),
});

export const reordenarSchema = z.object({
  itens: z.array(
    z.object({
      id: z.string(),
      ordem: z.number().int(),
    })
  ),
});

export const testarConfigSchema = z.object({
  configNome: z.string().min(1, 'Nome da configuração é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória').max(2000),
});
