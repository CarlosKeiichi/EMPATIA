/**
 * Seed script: insere perguntas hardcoded no banco Turso.
 * Uso: npx tsx scripts/seed-perguntas.ts
 */

import {
  perguntasTrabalho,
  perguntasEstresse,
  perguntasRelacionamentos,
  perguntasFinancas,
  perguntaEstadoEmocional,
} from '../src/config/perguntas';

const TURSO_HTTP_URL = process.env.TURSO_DATABASE_URL?.replace('libsql://', 'https://');
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN?.replace(/\\n$/, '');

if (!TURSO_HTTP_URL || !TURSO_AUTH_TOKEN) {
  console.error('Defina TURSO_DATABASE_URL e TURSO_AUTH_TOKEN');
  process.exit(1);
}

function cuid() {
  return 'c' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface PerguntaSeed {
  codigo: string;
  jornada: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes: string | null;
  ordem: number;
}

// Montar lista de perguntas com jornada e ordem
const todasPerguntas: PerguntaSeed[] = [];

perguntasTrabalho.forEach((p, i) => {
  todasPerguntas.push({
    codigo: p.id,
    jornada: 'trabalho',
    bloco: p.bloco,
    texto: p.texto,
    tipo: p.tipo,
    opcoes: p.opcoes ? JSON.stringify(p.opcoes) : null,
    ordem: i,
  });
});

perguntasEstresse.forEach((p, i) => {
  todasPerguntas.push({
    codigo: p.id,
    jornada: 'estresse',
    bloco: p.bloco,
    texto: p.texto,
    tipo: p.tipo,
    opcoes: p.opcoes ? JSON.stringify(p.opcoes) : null,
    ordem: i,
  });
});

perguntasRelacionamentos.forEach((p, i) => {
  todasPerguntas.push({
    codigo: p.id,
    jornada: 'relacionamentos',
    bloco: p.bloco,
    texto: p.texto,
    tipo: p.tipo,
    opcoes: p.opcoes ? JSON.stringify(p.opcoes) : null,
    ordem: i,
  });
});

perguntasFinancas.forEach((p, i) => {
  todasPerguntas.push({
    codigo: p.id,
    jornada: 'financas',
    bloco: p.bloco,
    texto: p.texto,
    tipo: p.tipo,
    opcoes: p.opcoes ? JSON.stringify(p.opcoes) : null,
    ordem: i,
  });
});

// Pergunta de estado emocional
todasPerguntas.push({
  codigo: perguntaEstadoEmocional.id,
  jornada: 'contextualizacao',
  bloco: perguntaEstadoEmocional.bloco,
  texto: perguntaEstadoEmocional.texto,
  tipo: perguntaEstadoEmocional.tipo,
  opcoes: perguntaEstadoEmocional.opcoes ? JSON.stringify(perguntaEstadoEmocional.opcoes) : null,
  ordem: 0,
});

async function seed() {
  console.log(`Seeding ${todasPerguntas.length} perguntas...`);

  // Usar INSERT OR REPLACE para idempotência
  const requests = todasPerguntas.map((p) => ({
    type: 'execute' as const,
    stmt: {
      sql: `INSERT OR REPLACE INTO Pergunta (id, codigo, jornada, bloco, texto, tipo, opcoes, ordem, ativa, criadaEm, atualizadaEm)
            VALUES (
              COALESCE((SELECT id FROM Pergunta WHERE codigo = ?1), ?2),
              ?1, ?3, ?4, ?5, ?6, ?7, ?8, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )`,
      args: [
        { type: 'text', value: p.codigo },
        { type: 'text', value: cuid() },
        { type: 'text', value: p.jornada },
        { type: 'text', value: p.bloco },
        { type: 'text', value: p.texto },
        { type: 'text', value: p.tipo },
        p.opcoes ? { type: 'text', value: p.opcoes } : { type: 'null' },
        { type: 'integer', value: String(p.ordem) },
      ],
    },
  }));

  // Turso has a limit per pipeline, batch in groups of 20
  const batchSize = 20;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    if (i + batchSize >= requests.length) {
      batch.push({ type: 'close' as const, stmt: undefined as never });
    }

    const res = await fetch(`${TURSO_HTTP_URL}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURSO_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: batch }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Erro:', data);
      process.exit(1);
    }

    const errors = (data.results || []).filter((r: { type: string }) => r.type === 'error');
    if (errors.length > 0) {
      console.error('Erros no batch:', JSON.stringify(errors, null, 2));
      process.exit(1);
    }

    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} operações OK`);
  }

  console.log(`✅ ${todasPerguntas.length} perguntas inseridas com sucesso!`);
}

seed().catch(console.error);
