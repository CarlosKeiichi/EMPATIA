import { NextRequest, NextResponse } from 'next/server';
import { login, hashSenha, getUsuarioLogado } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { loginSchema, registroSchema } from '@/lib/validations';
import { resolverCodigo } from '@/lib/instituicoes';

// GET /api/auth - Dados do usuario logado (inclui dados demográficos para professores)
export async function GET() {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario) {
      return NextResponse.json({ erro: 'Nao autorizado' }, { status: 401 });
    }

    let demografico: { genero: string | null; faixaEtaria: string | null; frequenciaAulas: string | null; funcaoEnsino: string | null } | null = null;
    if (usuario.role === 'professor') {
      const professor = await prisma.professor.findFirst({
        where: { userId: usuario.userId },
        select: { genero: true, faixaEtaria: true, frequenciaAulas: true, funcaoEnsino: true },
      });
      demografico = professor || null;
    }

    return NextResponse.json({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      ...(demografico && { demografico }),
    });
  } catch {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/auth - Atualizar dados demográficos do professor
export async function PATCH(req: NextRequest) {
  try {
    const usuario = await getUsuarioLogado();
    if (!usuario || usuario.role !== 'professor') {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { genero, faixaEtaria, frequenciaAulas, funcaoEnsino } = body;

    const professor = await prisma.professor.findFirst({
      where: { userId: usuario.userId },
    });
    if (!professor) {
      return NextResponse.json({ erro: 'Professor não encontrado' }, { status: 404 });
    }

    await prisma.professor.update({
      where: { id: professor.id },
      data: {
        ...(genero && { genero }),
        ...(faixaEtaria && { faixaEtaria }),
        ...(frequenciaAulas && { frequenciaAulas }),
        ...(funcaoEnsino && { funcaoEnsino }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar dados demográficos:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}

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
    console.error('Erro no login:', error instanceof Error ? error.message : error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
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
  funcaoEnsino?: string;
  codigo: string;
}) {
  // Revalida o codigo no servidor. O client manda o codigo, nunca o escolaId.
  const instituicao = await resolverCodigo(dados.codigo);
  if (!instituicao.valida) {
    return NextResponse.json({ erro: instituicao.erro }, { status: 400 });
  }

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
          funcaoEnsino: dados.funcaoEnsino,
          escolaId: instituicao.escolaId,
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
