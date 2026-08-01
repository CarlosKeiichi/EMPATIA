import { NextRequest, NextResponse } from 'next/server';
import { resolverCodigo } from '@/lib/instituicoes';

// GET /api/instituicoes/validar?codigo=X — publico, usado pela tela de cadastro
// para confirmar a instituicao antes da pessoa preencher o resto do formulario.
export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get('codigo') || '';

  try {
    const resultado = await resolverCodigo(codigo);

    if (!resultado.valida) {
      return NextResponse.json({ valida: false, erro: resultado.erro });
    }

    // Devolve so o nome — o escolaId nao interessa ao client e nao e usado no registro.
    return NextResponse.json({ valida: true, nome: resultado.nome });
  } catch (error) {
    console.error('Erro ao validar código:', error);
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 });
  }
}
