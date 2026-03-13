import { NextRequest, NextResponse } from 'next/server';
import { login, hashSenha } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { loginSchema, registroSchema } from '@/lib/validations';

// POST /api/auth - Login ou Registro
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.acao === 'registro') {
      const parsed = registroSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
          { status: 400 }
        );
      }
      return registrar(parsed.data);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }

    const resultado = await login(parsed.data.email, parsed.data.senha);
    if (!resultado) {
      return NextResponse.json({ erro: 'Email ou senha inválidos' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ user: resultado.user });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Erro no login:', msg, error);
    return NextResponse.json({ erro: 'Erro interno', detalhe: msg }, { status: 500 });
  }
}

// DELETE /api/auth - Logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return NextResponse.json({ ok: true });
}

async function registrar(dados: {
  email: string;
  senha: string;
  nome: string;
  genero?: string;
  faixaEtaria?: string;
  frequenciaAulas?: string;
  escolaId?: string;
}) {
  const existente = await prisma.user.findUnique({ where: { email: dados.email } });
  if (existente) {
    return NextResponse.json({ erro: 'Email já cadastrado' }, { status: 400 });
  }

  const senhaHash = await hashSenha(dados.senha);
  const user = await prisma.user.create({
    data: {
      email: dados.email,
      senha: senhaHash,
      nome: dados.nome,
      role: 'professor',
      professor: {
        create: {
          genero: dados.genero,
          faixaEtaria: dados.faixaEtaria,
          frequenciaAulas: dados.frequenciaAulas,
          escolaId: dados.escolaId || undefined,
        },
      },
    },
  });

  // Auto-login após registro
  const resultado = await login(dados.email, dados.senha);
  if (resultado) {
    const cookieStore = await cookies();
    cookieStore.set('token', resultado.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  }

  return NextResponse.json(
    { user: { id: user.id, email: user.email, role: user.role, nome: user.nome } },
    { status: 201 }
  );
}
