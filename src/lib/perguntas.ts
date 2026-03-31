import { prisma } from './db';
import { PerguntaJornada } from '@/types';
import {
  getPerguntasPorJornada as getPerguntasHardcoded,
  perguntasEstresse,
  perguntasRelacionamentos,
} from '@/config/perguntas';

/**
 * Busca perguntas do banco de dados por tipo de jornada.
 * Fallback para perguntas hardcoded se o banco não tiver dados.
 */
export async function getPerguntasPorJornadaDB(tipo: string): Promise<PerguntaJornada[]> {
  try {
    // Mapear tipo para jornadas no banco
    const jornadas = tipo === 'trabalho' ? ['trabalho', 'estresse'] : [tipo];

    const perguntasDB = await prisma.pergunta.findMany({
      where: {
        jornada: { in: jornadas },
        ativa: true,
      },
      orderBy: [{ jornada: 'asc' }, { ordem: 'asc' }],
    });

    if (perguntasDB.length === 0) {
      return getPerguntasHardcoded(tipo);
    }

    return perguntasDB.map((p) => ({
      id: p.codigo,
      bloco: p.bloco,
      texto: p.texto,
      tipo: p.tipo as PerguntaJornada['tipo'],
      opcoes: p.opcoes ? JSON.parse(p.opcoes) : undefined,
    }));
  } catch (error) {
    console.error('Erro ao buscar perguntas do banco, usando fallback:', error);
    return getPerguntasHardcoded(tipo);
  }
}

/**
 * Busca perguntas de um teste específico pelo ID do bloco.
 * Testes válidos: estresse_ocupacional, inteligencia_emocional_teste,
 * estilo_comunicacao, burnout_relacional_teste
 */
export function getPerguntasTeste(testeId: string): PerguntaJornada[] {
  if (testeId === 'estresse_ocupacional') {
    return perguntasEstresse;
  }
  // Testes que são blocos dentro de perguntasRelacionamentos
  const blocosTeste = ['inteligencia_emocional_teste', 'estilo_comunicacao', 'burnout_relacional_teste'];
  if (blocosTeste.includes(testeId)) {
    return perguntasRelacionamentos.filter((p) => p.bloco === testeId);
  }
  return [];
}
