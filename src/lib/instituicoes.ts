import { prisma } from './db';

// Caracteres do sufixo aleatorio — sem 0/O e 1/I, que confundem quem dita o codigo por telefone
const ALFABETO_SUFIXO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Normaliza um codigo para comparacao e gravacao.
 * O SQLite via Prisma nao suporta `mode: 'insensitive'`, entao a unica forma de
 * o codigo funcionar em minusculas e comparar sempre em maiuscula.
 */
export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase();
}

/** Slug do nome da instituicao: "Descomplica Educação" -> "DESCOMPLICA-EDUCACAO" */
export function slugCodigo(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

function sufixoAleatorio(tamanho = 4): string {
  let saida = '';
  const bytes = new Uint8Array(tamanho);
  crypto.getRandomValues(bytes);
  for (const b of bytes) saida += ALFABETO_SUFIXO[b % ALFABETO_SUFIXO.length];
  return saida;
}

/**
 * Sugere um codigo a partir do nome: "Descomplica" -> "DESCOMPLICA-7K2M".
 * O sufixo existe para o codigo nao ser adivinhavel — sem ele qualquer um chuta
 * o nome da instituicao e entra no pool de metricas dela.
 */
export function sugerirCodigo(nome: string): string {
  const base = slugCodigo(nome) || 'INSTITUICAO';
  return `${base}-${sufixoAleatorio()}`;
}

export type ResultadoValidacao =
  | { valida: true; escolaId: string; nome: string }
  | { valida: false; erro: string };

/**
 * Resolve um codigo para uma instituicao. Usado tanto pelo endpoint publico de
 * validacao quanto pelo registro — o registro NUNCA confia no escolaId do client.
 */
export async function resolverCodigo(codigo: string): Promise<ResultadoValidacao> {
  const normalizado = normalizarCodigo(codigo);
  if (!normalizado) {
    return { valida: false, erro: 'Informe o código da sua instituição.' };
  }

  const escola = await prisma.escola.findUnique({
    where: { codigo: normalizado },
    select: { id: true, nome: true, ativa: true },
  });

  if (!escola) {
    return { valida: false, erro: 'Código não encontrado. Confira com a sua instituição.' };
  }

  if (!escola.ativa) {
    return { valida: false, erro: 'Este código não está mais ativo.' };
  }

  return { valida: true, escolaId: escola.id, nome: escola.nome };
}
