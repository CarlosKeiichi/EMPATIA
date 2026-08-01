/**
 * Setup do código de instituição.
 *
 *   npx tsx prisma/setup-instituicoes.ts
 *
 * Idempotente — pode rodar quantas vezes quiser. Faz três coisas:
 *   1. Dá um código às escolas que ainda não têm (as pré-existentes)
 *   2. Cria a instituição Descomplica com o código dela
 *   3. Garante um superadmin, único papel que gerencia instituições
 *
 * A senha do superadmin vem de SUPERADMIN_SENHA. Sem ela, o script gera uma
 * aleatória e imprime — trocar depois é responsabilidade de quem rodou.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

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
  const bytes = randomBytes(tamanho);
  return Array.from(bytes)
    .map((b) => ALFABETO[b % ALFABETO.length])
    .join('');
}

async function codigoLivre(nome: string): Promise<string> {
  const base = slug(nome) || 'INSTITUICAO';
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const candidato = `${base}-${sufixo()}`;
    const existe = await prisma.escola.findUnique({ where: { codigo: candidato } });
    if (!existe) return candidato;
  }
  throw new Error(`Não consegui gerar um código livre para "${nome}"`);
}

async function main() {
  // 1. Backfill — escolas antigas sem código
  const semCodigo = await prisma.escola.findMany({ where: { codigo: null } });
  for (const escola of semCodigo) {
    const codigo = await codigoLivre(escola.nome);
    await prisma.escola.update({ where: { id: escola.id }, data: { codigo } });
    console.log(`🔑 ${escola.nome} → ${codigo}`);
  }
  if (semCodigo.length === 0) console.log('🔑 Nenhuma escola sem código.');

  // 2. Descomplica
  let descomplica = await prisma.escola.findFirst({ where: { nome: 'Descomplica' } });
  if (!descomplica) {
    descomplica = await prisma.escola.create({
      data: { nome: 'Descomplica', codigo: await codigoLivre('Descomplica'), ativa: true },
    });
    console.log(`🏫 Descomplica criada → ${descomplica.codigo}`);
  } else {
    if (!descomplica.codigo) {
      descomplica = await prisma.escola.update({
        where: { id: descomplica.id },
        data: { codigo: await codigoLivre('Descomplica') },
      });
    }
    console.log(`🏫 Descomplica já existia → ${descomplica.codigo}`);
  }

  // 3. Superadmin
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@empatia.app';
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    if (existente.role !== 'superadmin') {
      await prisma.user.update({ where: { id: existente.id }, data: { role: 'superadmin' } });
      console.log(`👤 ${email} promovido a superadmin`);
    } else {
      console.log(`👤 Superadmin já existe: ${email}`);
    }
  } else {
    const senha = process.env.SUPERADMIN_SENHA || randomBytes(9).toString('base64url');
    await prisma.user.create({
      data: {
        email,
        senha: await bcrypt.hash(senha, 10),
        nome: 'Equipe EmpatIA',
        role: 'superadmin',
        // Sem escolaId: o superadmin enxerga todas as instituições.
        admin: { create: { cargo: 'Superadmin' } },
      },
    });
    console.log(`👤 Superadmin criado: ${email}`);
    if (!process.env.SUPERADMIN_SENHA) {
      console.log(`🔐 Senha gerada: ${senha}   ← troque depois de entrar`);
    }
  }

  console.log(`\n🔗 Link de convite da Descomplica:`);
  console.log(`   /cadastro?codigo=${descomplica.codigo}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
