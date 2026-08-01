/**
 * Migração do código de instituição no banco de produção (Turso).
 *
 *   npx tsx prisma/turso-migrate-instituicoes.ts <arquivo.env> [--apply]
 *
 * Sem --apply roda em modo ensaio: mostra o que faria e não escreve nada.
 *
 * É aditiva e idempotente:
 *   1. ALTER TABLE Escola ADD COLUMN codigo  (se ainda não existir)
 *   2. CREATE UNIQUE INDEX Escola_codigo_key (se ainda não existir)
 *   3. Dá código às escolas sem código
 *   4. Cria a Descomplica
 *   5. Cria o superadmin
 *
 * Não apaga nem altera nenhum dado existente.
 */
import { createClient, type Client } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function carregarEnv(arquivo: string) {
  for (const linha of readFileSync(arquivo, 'utf-8').split('\n')) {
    const m = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

function slug(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
}

function sufixo(tamanho = 4): string {
  return Array.from(randomBytes(tamanho))
    .map((b) => ALFABETO[b % ALFABETO.length])
    .join('');
}

// cuid-like: o schema usa @default(cuid()), mas aqui inserimos por SQL cru.
function id(): string {
  return 'c' + Date.now().toString(36) + randomBytes(8).toString('hex').slice(0, 16);
}

async function codigoLivre(db: Client, nome: string): Promise<string> {
  const base = slug(nome) || 'INSTITUICAO';
  for (let i = 0; i < 10; i++) {
    const candidato = `${base}-${sufixo()}`;
    const r = await db.execute({ sql: 'SELECT 1 FROM Escola WHERE codigo = ?', args: [candidato] });
    if (r.rows.length === 0) return candidato;
  }
  throw new Error(`Não consegui gerar código livre para "${nome}"`);
}

async function main() {
  const envFile = process.argv[2];
  const apply = process.argv.includes('--apply');
  if (!envFile) throw new Error('Uso: tsx prisma/turso-migrate-instituicoes.ts <arquivo.env> [--apply]');

  carregarEnv(envFile);
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL!.trim(),
    authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
  });

  console.log(apply ? '=== APLICANDO ===' : '=== ENSAIO (nada será escrito) ===\n');

  // Snapshot de segurança antes de qualquer escrita
  if (apply) {
    const snap: Record<string, unknown[]> = {};
    for (const t of ['Escola', 'User', 'Professor', 'Admin']) {
      const r = await db.execute(`SELECT * FROM "${t}"`);
      snap[t] = r.rows.map((row) => Object.fromEntries(r.columns.map((c, i) => [c, row[i]])));
    }
    const destino = `${envFile}.snapshot.json`;
    writeFileSync(destino, JSON.stringify(snap, null, 2), { mode: 0o600 });
    console.log(`📦 Snapshot salvo em ${destino}\n`);
  }

  // 1. Coluna
  const cols = await db.execute('PRAGMA table_info(Escola)');
  const temCodigo = cols.rows.some((r) => r[1] === 'codigo');
  if (temCodigo) {
    console.log('1. coluna codigo — já existe');
  } else if (apply) {
    await db.execute('ALTER TABLE "Escola" ADD COLUMN "codigo" TEXT');
    console.log('1. coluna codigo — CRIADA');
  } else {
    console.log('1. coluna codigo — seria criada');
  }

  // 2. Índice
  const idx = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='index' AND name='Escola_codigo_key'"
  );
  if (idx.rows.length > 0) {
    console.log('2. índice único — já existe');
  } else if (apply) {
    await db.execute('CREATE UNIQUE INDEX "Escola_codigo_key" ON "Escola"("codigo")');
    console.log('2. índice único — CRIADO');
  } else {
    console.log('2. índice único — seria criado');
  }

  // 3. Backfill
  if (temCodigo || apply) {
    const semCodigo = await db.execute('SELECT id, nome FROM Escola WHERE codigo IS NULL');
    if (semCodigo.rows.length === 0) {
      console.log('3. backfill — nenhuma escola sem código');
    }
    for (const row of semCodigo.rows) {
      const nome = String(row[1]);
      if (apply) {
        const codigo = await codigoLivre(db, nome);
        await db.execute({ sql: 'UPDATE Escola SET codigo = ? WHERE id = ?', args: [codigo, row[0] as string] });
        console.log(`3. backfill — ${nome} → ${codigo}`);
      } else {
        console.log(`3. backfill — ${nome} receberia um código`);
      }
    }
  } else {
    console.log('3. backfill — depende da coluna');
  }

  // 4. Descomplica
  // Em ensaio a coluna ainda não existe, então só a consultamos quando ela existe de fato.
  const colunaPronta = temCodigo || apply;
  const existe = await db.execute({
    sql: `SELECT id${colunaPronta ? ', codigo' : ''} FROM Escola WHERE nome = ?`,
    args: ['Descomplica'],
  });
  let codigoDescomplica = colunaPronta ? (existe.rows[0]?.[1] as string | undefined) : undefined;
  if (existe.rows.length > 0) {
    console.log(`4. Descomplica — já existe (${codigoDescomplica ?? 'sem código'})`);
  } else if (apply) {
    codigoDescomplica = await codigoLivre(db, 'Descomplica');
    await db.execute({
      sql: 'INSERT INTO Escola (id, nome, codigo, ativa, criadoEm) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
      args: [id(), 'Descomplica', codigoDescomplica],
    });
    console.log(`4. Descomplica — CRIADA → ${codigoDescomplica}`);
  } else {
    console.log('4. Descomplica — seria criada');
  }

  // 5. Superadmin
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@empatia.app';
  const jaTem = await db.execute({ sql: 'SELECT id, role FROM User WHERE email = ?', args: [email] });
  if (jaTem.rows.length > 0) {
    console.log(`5. superadmin — ${email} já existe (role=${jaTem.rows[0][1]})`);
  } else if (apply) {
    const senha = process.env.SUPERADMIN_SENHA || randomBytes(9).toString('base64url');
    const userId = id();
    await db.execute({
      sql: 'INSERT INTO User (id, email, senha, nome, role, ativo, criadoEm) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
      args: [userId, email, await bcrypt.hash(senha, 10), 'Equipe EmpatIA', 'superadmin'],
    });
    await db.execute({
      sql: 'INSERT INTO Admin (id, userId, cargo, criadoEm) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      args: [id(), userId, 'Superadmin'],
    });
    console.log(`5. superadmin — CRIADO: ${email}`);
    if (!process.env.SUPERADMIN_SENHA) console.log(`   🔐 senha: ${senha}   ← troque depois de entrar`);
  } else {
    console.log(`5. superadmin — ${email} seria criado`);
  }

  if (codigoDescomplica) {
    console.log(`\n🔗 https://empatia-eight.vercel.app/cadastro?codigo=${codigoDescomplica}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
