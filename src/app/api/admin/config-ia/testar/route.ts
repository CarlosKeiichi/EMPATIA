import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import { enviarMensagem } from '@/lib/claude';
import { testarConfigSchema } from '@/lib/validations';

// POST /api/admin/config-ia/testar — testar config com mensagem
export async function POST(req: NextRequest) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  const body = await req.json();
  const parsed = testarConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.errors[0]?.message || 'Dados inválidos' },
      { status: 400 }
    );
  }

  try {
    const resposta = await enviarMensagem(parsed.data.configNome, [
      { role: 'user', content: parsed.data.mensagem },
    ]);

    return NextResponse.json({ resposta });
  } catch (error) {
    console.error('Erro ao testar config:', error);
    return NextResponse.json({ erro: 'Erro ao comunicar com a IA' }, { status: 500 });
  }
}
