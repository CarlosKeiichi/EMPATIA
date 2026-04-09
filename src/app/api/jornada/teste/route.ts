import { NextRequest, NextResponse } from 'next/server';
import { getUsuarioLogado } from '@/lib/auth';
import { getPerguntasTeste } from '@/lib/perguntas';

// GET /api/jornada/teste?id=estresse_ocupacional — retorna perguntas de um teste
export async function GET(req: NextRequest) {
  const usuario = await getUsuarioLogado();
  if (!usuario) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ erro: 'id do teste é obrigatório' }, { status: 400 });
  }

  const perguntas = getPerguntasTeste(id);
  if (perguntas.length === 0) {
    return NextResponse.json({ erro: 'Teste não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ id, perguntas });
}
