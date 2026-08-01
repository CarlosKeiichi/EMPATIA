import { NextResponse } from 'next/server';
import { getUsuarioLogado, TokenPayload } from './auth';

/**
 * Verifica se o usuário logado é admin ou superadmin.
 * Retorna o payload do token ou uma NextResponse de erro.
 */
export async function verificarAdmin(): Promise<
  { usuario: TokenPayload } | { erro: NextResponse }
> {
  const usuario = await getUsuarioLogado();
  if (!usuario) {
    return { erro: NextResponse.json({ erro: 'Não autorizado' }, { status: 401 }) };
  }
  if (usuario.role !== 'admin' && usuario.role !== 'superadmin') {
    return { erro: NextResponse.json({ erro: 'Acesso negado' }, { status: 403 }) };
  }
  return { usuario };
}

/**
 * Verifica se o usuário logado é superadmin.
 * Gerir instituições é privilégio da equipe EmpatIA — um admin de instituição
 * não pode criar outras nem enxergar as métricas delas.
 */
export async function verificarSuperadmin(): Promise<
  { usuario: TokenPayload } | { erro: NextResponse }
> {
  const usuario = await getUsuarioLogado();
  if (!usuario) {
    return { erro: NextResponse.json({ erro: 'Não autorizado' }, { status: 401 }) };
  }
  if (usuario.role !== 'superadmin') {
    return { erro: NextResponse.json({ erro: 'Acesso negado' }, { status: 403 }) };
  }
  return { usuario };
}
