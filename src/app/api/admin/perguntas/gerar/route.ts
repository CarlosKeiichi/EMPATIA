import { NextRequest, NextResponse } from 'next/server';
import { verificarAdmin } from '@/lib/admin-guard';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

// POST /api/admin/perguntas/gerar — Generate questions with AI
export async function POST(req: NextRequest) {
  const auth = await verificarAdmin();
  if ('erro' in auth) return auth.erro;

  try {
    const { descricao, bloco, tipo, quantidade } = await req.json();

    if (!descricao || !bloco || !tipo) {
      return NextResponse.json({ erro: 'Campos obrigatórios: descricao, bloco, tipo' }, { status: 400 });
    }

    const cliente = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY?.trim() });

    const opcoesInstrucao = tipo === 'frequencia'
      ? 'Cada pergunta deve ter opcoes JSON: [{"valor":"nunca","label":"Nunca"},{"valor":"as_vezes","label":"Às vezes"},{"valor":"frequentemente","label":"Frequentemente"}]'
      : tipo === 'multipla_escolha'
        ? 'Inclua opcoes JSON com array de {valor, label} adequado ao contexto da pergunta.'
        : 'Não inclua campo opcoes (null).';

    const response = await cliente.messages.create({
      model: (process.env.CLAUDE_MODEL || 'claude-sonnet-4-6').trim(),
      max_tokens: 2048,
      temperature: 0.7,
      system: `Você é um especialista em psicologia educacional. Gere perguntas para instrumentos de avaliação de saúde mental de professores.
Responda APENAS com um JSON array válido, sem texto adicional.`,
      messages: [
        {
          role: 'user',
          content: `Gere ${quantidade || 5} perguntas para o bloco "${bloco}" com tipo "${tipo}".

Descrição do que o administrador quer: ${descricao}

${opcoesInstrucao}

Formato EXATO de cada item do array:
{
  "codigo": "${bloco.substring(0, 4)}_gen_XX",
  "bloco": "${bloco}",
  "texto": "texto da pergunta",
  "tipo": "${tipo}",
  "opcoes": null ou JSON string do array de opcoes
}

Responda APENAS com o JSON array.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const texto = textBlock?.text || '[]';

    const jsonMatch = texto.match(/\[[\s\S]*\]/);
    const perguntas = JSON.parse(jsonMatch?.[0] || '[]');

    return NextResponse.json({ perguntas });
  } catch (error) {
    console.error('Erro ao gerar perguntas:', error);
    return NextResponse.json({ erro: 'Erro ao gerar perguntas com IA' }, { status: 500 });
  }
}
