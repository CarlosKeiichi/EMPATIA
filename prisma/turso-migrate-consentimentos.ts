/**
 * Cria a tabela Consentimento no banco de produção (Turso).
 *
 *   npx tsx prisma/turso-migrate-consentimentos.ts <arquivo.env> [--apply]
 *
 * Sem --apply é ensaio. Puramente aditivo: cria tabela e índice se não
 * existirem, e não toca em nenhum dado existente.
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const [envFile] = process.argv.slice(2);
const apply = process.argv.includes('--apply');
if (!envFile) throw new Error('Uso: tsx prisma/turso-migrate-consentimentos.ts <arquivo.env> [--apply]');

for (const linha of readFileSync(envFile, 'utf-8').split('\n')) {
  const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!.trim(),
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

const CRIAR_TABELA = `CREATE TABLE "Consentimento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "professorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "versao" TEXT NOT NULL,
    "aceitoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadoEm" DATETIME,
    "origem" TEXT NOT NULL DEFAULT 'cadastro',
    CONSTRAINT "Consentimento_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
)`;

const CRIAR_INDICE =
  'CREATE INDEX "Consentimento_professorId_tipo_idx" ON "Consentimento"("professorId", "tipo")';

(async () => {
  console.log(apply ? '=== APLICANDO ===\n' : '=== ENSAIO (nada será escrito) ===\n');

  const tabela = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='Consentimento'"
  );
  if (tabela.rows.length > 0) {
    console.log('1. tabela Consentimento — já existe');
  } else if (apply) {
    await db.execute(CRIAR_TABELA);
    console.log('1. tabela Consentimento — CRIADA');
  } else {
    console.log('1. tabela Consentimento — seria criada');
  }

  const indice = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name='Consentimento_professorId_tipo_idx'"
  );
  if (indice.rows.length > 0) {
    console.log('2. índice — já existe');
  } else if (apply) {
    await db.execute(CRIAR_INDICE);
    console.log('2. índice — CRIADO');
  } else {
    console.log('2. índice — seria criado');
  }

  if (apply) {
    const n = await db.execute('SELECT COUNT(*) AS n FROM Consentimento');
    const semConsentimento = await db.execute(
      'SELECT COUNT(*) AS n FROM Professor p WHERE NOT EXISTS (SELECT 1 FROM Consentimento c WHERE c.professorId = p.id)'
    );
    console.log(`\nconsentimentos registrados: ${n.rows[0].n}`);
    console.log(`professores sem consentimento (anteriores à mudança): ${semConsentimento.rows[0].n}`);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
