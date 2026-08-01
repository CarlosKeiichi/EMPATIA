/**
 * Inspeção somente-leitura do banco de produção (Turso).
 *   npx tsx prisma/turso-inspect.ts
 */
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

function carregarEnv(arquivo: string) {
  for (const linha of readFileSync(arquivo, 'utf-8').split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const valor = m[2].replace(/^["']|["']$/g, '').trim();
    if (!process.env[m[1]]) process.env[m[1]] = valor;
  }
}

// Aceita um arquivo de env por argumento — use o baixado com `vercel env pull`,
// porque o .env.production.local commitado localmente pode estar com token vencido.
carregarEnv(process.argv[2] || '.env.production.local');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!.trim(),
  authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
});

async function main() {
  const schema = await db.execute(
    "SELECT sql FROM sqlite_master WHERE name = 'Escola' AND type = 'table'"
  );
  console.log('=== schema da Escola ===');
  console.log(schema.rows[0]?.sql ?? '(tabela não existe)');

  const indices = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='Escola'"
  );
  console.log('\n=== índices ===');
  console.log(indices.rows.map((r) => r.name).join(', ') || '(nenhum)');

  console.log('\n=== volume ===');
  for (const t of ['Escola', 'User', 'Professor', 'Admin', 'Jornada', 'Diagnostico', 'Conversa']) {
    try {
      const r = await db.execute(`SELECT COUNT(*) AS n FROM "${t}"`);
      console.log(`${t.padEnd(12)} ${r.rows[0].n}`);
    } catch {
      console.log(`${t.padEnd(12)} (tabela ausente)`);
    }
  }

  console.log('\n=== escolas ===');
  const escolas = await db.execute('SELECT id, nome, ativa FROM Escola');
  for (const e of escolas.rows) console.log(`${e.id}  ${e.nome}  ativa=${e.ativa}`);

  console.log('\n=== papéis ===');
  const roles = await db.execute('SELECT role, COUNT(*) AS n FROM User GROUP BY role');
  for (const r of roles.rows) console.log(`${r.role}: ${r.n}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
