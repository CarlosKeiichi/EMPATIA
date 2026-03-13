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
