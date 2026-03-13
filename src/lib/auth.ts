import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-troque-em-producao');

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  nome: string;
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export async function criarToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verificarToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getUsuarioLogado(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verificarToken(token);
}

export async function login(email: string, senha: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.ativo) return null;

  const senhaValida = await verificarSenha(senha, user.senha);
  if (!senhaValida) return null;

  const token = await criarToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    nome: user.nome,
  });

  return { token, user: { id: user.id, email: user.email, role: user.role, nome: user.nome } };
}
