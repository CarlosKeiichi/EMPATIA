# Editor Visual de Jornadas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat question list in `/admin/perguntas` with a visual journey editor — a drag-and-drop vertical trail where pedagogues can see, reorder, and edit the entire journey structure intuitively.

**Architecture:** Single-page rewrite of `/admin/perguntas/page.tsx` split into focused components. Uses `@dnd-kit/core` + `@dnd-kit/sortable` for drag & drop. A new API endpoint `/api/admin/perguntas/gerar` calls Claude to generate questions from natural language descriptions. No schema changes — all data uses existing Pergunta model.

**Tech Stack:** Next.js App Router, React, @dnd-kit (drag & drop), Anthropic Claude API (question generation), existing Prisma Pergunta model, existing admin design system.

---

## File Structure

### New files:
- `src/app/admin/perguntas/page.tsx` — Main page (rewrite), orchestrates layout + state
- `src/components/admin/TrilhaJornada.tsx` — The vertical trail with drag-and-drop blocks
- `src/components/admin/BlocoCard.tsx` — Individual block card in the trail (draggable)
- `src/components/admin/EditorBloco.tsx` — Right panel: edit block questions, add/remove/reorder
- `src/components/admin/GerarComIA.tsx` — Modal for AI-powered question generation
- `src/app/api/admin/perguntas/gerar/route.ts` — API: generate questions with Claude

### Modified files:
- `package.json` — Add @dnd-kit dependencies

### Unchanged (reused as-is):
- `src/app/api/admin/perguntas/route.ts` — existing GET/POST
- `src/app/api/admin/perguntas/[id]/route.ts` — existing PUT/DELETE
- `src/app/api/admin/perguntas/reordenar/route.ts` — existing reorder
- `src/components/AdminLayout.tsx` — wraps the page
- `src/lib/validations.ts` — existing schemas
- `prisma/schema.prisma` — no changes needed

---

## Task 1: Install @dnd-kit dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dnd-kit packages**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Verify install**

```bash
npm ls @dnd-kit/core
```

Expected: `@dnd-kit/core@6.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @dnd-kit for drag and drop"
```

---

## Task 2: Create BlocoCard component

**Files:**
- Create: `src/components/admin/BlocoCard.tsx`

- [ ] **Step 1: Create the BlocoCard component**

This is a single draggable card representing one block/step in the journey trail. It shows the block name, type icon, question count, and active toggle.

```tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Map block names to step types with visual metadata
const TIPOS_ETAPA: Record<string, { icone: string; cor: string; corBg: string; label: string }> = {
  // Conversa (acolhimento/feedback) — blue
  acolhimento: { icone: '💬', cor: 'text-[#1d4ed8]', corBg: 'bg-[#dbeafe]', label: 'Conversa' },
  feedback: { icone: '💬', cor: 'text-[#b45309]', corBg: 'bg-[#fef3c7]', label: 'Feedback' },
  diagnostico: { icone: '📊', cor: 'text-[#166534]', corBg: 'bg-[#dcfce7]', label: 'Diagnóstico' },
  // Blocos de perguntas — green
  lideranca_sistema: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  colegas: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  alunos: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  atividade_docente: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  autocuidado: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  vinculos_familiares: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  rede_apoio: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  satisfacao_geral: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  pressao_financeira: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  endividamento: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  organizacao_financeira: { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco de Perguntas' },
  // Testes psicológicos — purple
  estresse_ocupacional: { icone: '🧪', cor: 'text-[#7c3aed]', corBg: 'bg-[#f3e8ff]', label: 'Teste Psicológico' },
  inteligencia_emocional_teste: { icone: '🧪', cor: 'text-[#7c3aed]', corBg: 'bg-[#f3e8ff]', label: 'Teste Psicológico' },
  estilo_comunicacao: { icone: '🧪', cor: 'text-[#7c3aed]', corBg: 'bg-[#f3e8ff]', label: 'Teste Psicológico' },
  burnout_relacional_teste: { icone: '🧪', cor: 'text-[#7c3aed]', corBg: 'bg-[#f3e8ff]', label: 'Teste Psicológico' },
};

const NOMES_BLOCO: Record<string, string> = {
  lideranca_sistema: 'Liderança e Sistema',
  colegas: 'Colegas',
  alunos: 'Alunos',
  atividade_docente: 'Atividade Docente',
  estresse_ocupacional: 'Estresse Ocupacional (IPCS)',
  autocuidado: 'Autocuidado',
  vinculos_familiares: 'Vínculos Familiares',
  rede_apoio: 'Rede de Apoio',
  satisfacao_geral: 'Satisfação Geral',
  inteligencia_emocional_teste: 'Inteligência Emocional',
  estilo_comunicacao: 'Estilo de Comunicação',
  burnout_relacional_teste: 'Burnout Relacional',
  pressao_financeira: 'Pressão Financeira',
  endividamento: 'Endividamento',
  organizacao_financeira: 'Organização Financeira',
};

function getMetaBloco(bloco: string) {
  return TIPOS_ETAPA[bloco] || { icone: '📋', cor: 'text-[#2d7a5e]', corBg: 'bg-[#e8f5ee]', label: 'Bloco' };
}

interface BlocoCardProps {
  id: string;
  bloco: string;
  qtdPerguntas: number;
  ativo: boolean;
  selecionado: boolean;
  onClick: () => void;
}

export default function BlocoCard({ id, bloco, qtdPerguntas, ativo, selecionado, onClick }: BlocoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = getMetaBloco(bloco);
  const nome = NOMES_BLOCO[bloco] || bloco.replace(/_/g, ' ');

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Connector line */}
      <div className="absolute left-7 -top-3 w-0.5 h-3 bg-[#e0ddd7]" />

      <div
        onClick={onClick}
        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'shadow-lg border-[#2d7a5e] bg-white scale-[1.02] z-10'
            : selecionado
              ? 'border-[#2d7a5e] bg-[#e8f5ee]/50 shadow-sm'
              : 'border-[#ece8e1] bg-white hover:border-[#d5d0c8] hover:shadow-sm'
        } ${!ativo ? 'opacity-40' : ''}`}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#b5b0a8] hover:text-[#9a9590] touch-none"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>

        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${meta.corBg} flex items-center justify-center text-lg`}>
          {meta.icone}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-[#2d2a26] truncate">{nome}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.corBg} ${meta.cor}`}>
              {meta.label}
            </span>
            <span className="text-[11px] text-[#9a9590] font-medium">
              {qtdPerguntas} {qtdPerguntas === 1 ? 'pergunta' : 'perguntas'}
            </span>
          </div>
        </div>

        {/* Arrow indicator */}
        <svg className="flex-shrink-0 w-4 h-4 text-[#b5b0a8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

export { NOMES_BLOCO, getMetaBloco };
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (or only pre-existing ones)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/BlocoCard.tsx
git commit -m "feat: add BlocoCard component for journey trail"
```

---

## Task 3: Create TrilhaJornada component

**Files:**
- Create: `src/components/admin/TrilhaJornada.tsx`

- [ ] **Step 1: Create the TrilhaJornada component**

This renders the vertical trail of blocks with drag-and-drop reordering via @dnd-kit.

```tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import BlocoCard from './BlocoCard';

interface Pergunta {
  id: string;
  codigo: string;
  jornada: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes: string | null;
  ordem: number;
  ativa: boolean;
}

interface BlocoInfo {
  id: string; // block name used as sortable ID
  bloco: string;
  perguntas: Pergunta[];
  ordem: number; // min ordem of questions in this block
}

interface TrilhaJornadaProps {
  perguntas: Pergunta[];
  blocoSelecionado: string | null;
  onSelecionarBloco: (bloco: string) => void;
  onReordenar: (blocos: BlocoInfo[]) => void;
}

export default function TrilhaJornada({
  perguntas,
  blocoSelecionado,
  onSelecionarBloco,
  onReordenar,
}: TrilhaJornadaProps) {
  // Group questions by block, ordered by min ordem
  const blocosMap = new Map<string, Pergunta[]>();
  for (const p of perguntas) {
    const arr = blocosMap.get(p.bloco) || [];
    arr.push(p);
    blocosMap.set(p.bloco, arr);
  }

  const blocos: BlocoInfo[] = Array.from(blocosMap.entries())
    .map(([bloco, pergs]) => ({
      id: bloco,
      bloco,
      perguntas: pergs.sort((a, b) => a.ordem - b.ordem),
      ordem: Math.min(...pergs.map((p) => p.ordem)),
    }))
    .sort((a, b) => a.ordem - b.ordem);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocos.findIndex((b) => b.id === active.id);
    const newIndex = blocos.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(blocos, oldIndex, newIndex);

    onReordenar(reordered);
  }

  return (
    <div className="space-y-1">
      {/* Trail header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-[#2d7a5e]" />
        <span className="text-[12px] font-bold text-[#9a9590] uppercase tracking-wider">Início da Jornada</span>
      </div>

      {/* Sortable blocks */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocos.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1 ml-1">
            {blocos.map((b) => (
              <BlocoCard
                key={b.id}
                id={b.id}
                bloco={b.bloco}
                qtdPerguntas={b.perguntas.length}
                ativo={b.perguntas.some((p) => p.ativa)}
                selecionado={blocoSelecionado === b.bloco}
                onClick={() => onSelecionarBloco(b.bloco)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Trail footer */}
      <div className="flex items-center gap-3 mt-4 pt-2">
        <div className="w-3 h-3 rounded-full border-2 border-[#2d7a5e] bg-white" />
        <span className="text-[12px] font-bold text-[#9a9590] uppercase tracking-wider">Diagnóstico Final</span>
      </div>
    </div>
  );
}

export type { Pergunta, BlocoInfo };
```

- [ ] **Step 2: Verify file compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/TrilhaJornada.tsx
git commit -m "feat: add TrilhaJornada drag-and-drop trail component"
```

---

## Task 4: Create GerarComIA component + API endpoint

**Files:**
- Create: `src/components/admin/GerarComIA.tsx`
- Create: `src/app/api/admin/perguntas/gerar/route.ts`

- [ ] **Step 1: Create the API endpoint**

```typescript
// src/app/api/admin/perguntas/gerar/route.ts
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
```

- [ ] **Step 2: Create the GerarComIA modal component**

```tsx
// src/components/admin/GerarComIA.tsx
'use client';

import { useState } from 'react';

interface PerguntaGerada {
  codigo: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes: string | null;
}

interface GerarComIAProps {
  bloco: string;
  onConfirmar: (perguntas: PerguntaGerada[]) => void;
  onFechar: () => void;
}

export default function GerarComIA({ bloco, onConfirmar, onFechar }: GerarComIAProps) {
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('escala_0_10');
  const [quantidade, setQuantidade] = useState(5);
  const [gerando, setGerando] = useState(false);
  const [preview, setPreview] = useState<PerguntaGerada[]>([]);
  const [erro, setErro] = useState('');

  async function gerar() {
    if (!descricao.trim()) return;
    setGerando(true);
    setErro('');

    try {
      const res = await fetch('/api/admin/perguntas/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao, bloco, tipo, quantidade }),
      });
      const data = await res.json();
      if (data.erro) {
        setErro(data.erro);
      } else {
        setPreview(data.perguntas || []);
      }
    } catch {
      setErro('Erro de conexão');
    } finally {
      setGerando(false);
    }
  }

  function removerPergunta(index: number) {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  }

  function editarTexto(index: number, novoTexto: string) {
    setPreview((prev) => prev.map((p, i) => (i === index ? { ...p, texto: novoTexto } : p)));
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-[#ece8e1] w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-[#2d2a26]">Gerar Perguntas com IA</h3>
            <button onClick={onFechar} className="text-[#9a9590] hover:text-[#4a4842] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {preview.length === 0 ? (
            <>
              <div>
                <label className="block text-[11px] font-bold text-[#4a4842] mb-1.5 uppercase tracking-wider">
                  Descreva as perguntas que precisa
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] min-h-[100px] resize-y focus:outline-none focus:border-[#2d7a5e] transition-colors"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: 5 perguntas sobre autoestima profissional do professor, focando em reconhecimento e valorização"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#4a4842] mb-1.5 uppercase tracking-wider">Tipo</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e]"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="escala_0_10">Escala 0-10</option>
                    <option value="multipla_escolha">Múltipla Escolha</option>
                    <option value="frequencia">Frequência</option>
                    <option value="aberta">Aberta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4a4842] mb-1.5 uppercase tracking-wider">Quantidade</label>
                  <select
                    className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-[#faf8f5] text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e]"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  >
                    {[3, 5, 7, 10].map((n) => (
                      <option key={n} value={n}>{n} perguntas</option>
                    ))}
                  </select>
                </div>
              </div>

              {erro && <p className="text-[12px] text-[#dc6b6b] font-medium">{erro}</p>}

              <button
                onClick={gerar}
                disabled={gerando || !descricao.trim()}
                className="w-full py-3 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {gerando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gerando...
                  </>
                ) : (
                  '✨ Gerar com IA'
                )}
              </button>
            </>
          ) : (
            <>
              <p className="text-[12px] text-[#9a9590] font-medium">
                {preview.length} perguntas geradas. Edite o texto se necessário e confirme.
              </p>

              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {preview.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-[#faf8f5] border border-[#ece8e1]">
                    <span className="text-[11px] font-bold text-[#9a9590] mt-2 flex-shrink-0 w-5">{i + 1}.</span>
                    <textarea
                      className="flex-1 bg-transparent text-[13px] text-[#2d2a26] resize-none border-none outline-none min-h-[40px]"
                      value={p.texto}
                      onChange={(e) => editarTexto(i, e.target.value)}
                    />
                    <button
                      onClick={() => removerPergunta(i)}
                      className="flex-shrink-0 text-[#d5d0c8] hover:text-[#dc6b6b] transition-colors mt-1"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onConfirmar(preview)}
                  className="flex-1 py-2.5 bg-[#2d7a5e] text-white text-[13px] font-bold rounded-xl hover:bg-[#24674f] transition-colors"
                >
                  Adicionar {preview.length} perguntas
                </button>
                <button
                  onClick={() => setPreview([])}
                  className="px-4 py-2.5 text-[13px] text-[#9a9590] hover:text-[#4a4842] font-semibold transition-colors"
                >
                  Refazer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify files compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/GerarComIA.tsx src/app/api/admin/perguntas/gerar/route.ts
git commit -m "feat: add AI-powered question generation modal and API"
```

---

## Task 5: Create EditorBloco component

**Files:**
- Create: `src/components/admin/EditorBloco.tsx`

- [ ] **Step 1: Create the EditorBloco component**

The right-panel editor that shows when a block is selected. Displays all questions in that block, allows editing, reordering (drag within block), adding, and deleting. Also has the "Gerar com IA" button.

```tsx
'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NOMES_BLOCO, getMetaBloco } from './BlocoCard';
import GerarComIA from './GerarComIA';

interface Pergunta {
  id: string;
  codigo: string;
  jornada: string;
  bloco: string;
  texto: string;
  tipo: string;
  opcoes: string | null;
  ordem: number;
  ativa: boolean;
}

const TIPOS_BADGE: Record<string, string> = {
  escala_0_10: 'bg-[#dbeafe] text-[#1d4ed8]',
  multipla_escolha: 'bg-[#f3e8ff] text-[#7c3aed]',
  frequencia: 'bg-[#ffedd5] text-[#c2410c]',
  aberta: 'bg-[#e8f5ee] text-[#2d7a5e]',
};

// Sortable question row inside the editor
function PerguntaRow({
  pergunta,
  onEditar,
  onToggle,
  onExcluir,
}: {
  pergunta: Pergunta;
  onEditar: (p: Pergunta) => void;
  onToggle: (p: Pergunta) => void;
  onExcluir: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pergunta.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-200 ${
        isDragging ? 'bg-[#e8f5ee] shadow-md z-10' : 'bg-[#faf8f5] hover:bg-[#f5f3ef]'
      } ${!pergunta.ativa ? 'opacity-40' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#d5d0c8] hover:text-[#9a9590] touch-none"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditar(pergunta)}>
        <p className="text-[12px] text-[#2d2a26] font-medium leading-snug">{pergunta.texto}</p>
        <span className={`inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${TIPOS_BADGE[pergunta.tipo] || ''}`}>
          {pergunta.tipo.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div
          onClick={() => onToggle(pergunta)}
          className={`w-7 h-4 rounded-full transition-all duration-200 relative cursor-pointer ${
            pergunta.ativa ? 'bg-[#2d7a5e]' : 'bg-[#d5d0c8]'
          }`}
        >
          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${
            pergunta.ativa ? 'left-3.5' : 'left-0.5'
          }`} />
        </div>
        <button onClick={() => onExcluir(pergunta.id)} className="text-[#d5d0c8] hover:text-[#dc6b6b] transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface EditorBlocoProps {
  bloco: string;
  jornada: string;
  perguntas: Pergunta[];
  onFechar: () => void;
  onRecarregar: () => void;
}

export default function EditorBloco({ bloco, jornada, perguntas, onFechar, onRecarregar }: EditorBlocoProps) {
  const [editandoPergunta, setEditandoPergunta] = useState<Pergunta | null>(null);
  const [formTexto, setFormTexto] = useState('');
  const [formTipo, setFormTipo] = useState('escala_0_10');
  const [formOpcoes, setFormOpcoes] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mostrarIA, setMostrarIA] = useState(false);
  const [criandoNova, setCriandoNova] = useState(false);

  const meta = getMetaBloco(bloco);
  const nome = NOMES_BLOCO[bloco] || bloco.replace(/_/g, ' ');
  const perguntasOrdenadas = [...perguntas].sort((a, b) => a.ordem - b.ordem);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function abrirEdicao(p: Pergunta) {
    setEditandoPergunta(p);
    setFormTexto(p.texto);
    setFormTipo(p.tipo);
    setFormOpcoes(p.opcoes || '');
    setCriandoNova(false);
  }

  function abrirNova() {
    setEditandoPergunta(null);
    setFormTexto('');
    setFormTipo('escala_0_10');
    setFormOpcoes('');
    setCriandoNova(true);
  }

  async function salvarPergunta() {
    setSalvando(true);
    try {
      if (editandoPergunta) {
        await fetch(`/api/admin/perguntas/${editandoPergunta.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: formTexto, tipo: formTipo, opcoes: formOpcoes || null }),
        });
      } else {
        const codigo = `${bloco.substring(0, 4)}_${Date.now().toString(36)}`;
        await fetch('/api/admin/perguntas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo,
            jornada,
            bloco,
            texto: formTexto,
            tipo: formTipo,
            opcoes: formOpcoes || null,
            ordem: perguntas.length,
            ativa: true,
          }),
        });
      }
      setEditandoPergunta(null);
      setCriandoNova(false);
      onRecarregar();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSalvando(false);
    }
  }

  async function toggleAtiva(p: Pergunta) {
    await fetch(`/api/admin/perguntas/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativa: !p.ativa }),
    });
    onRecarregar();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta pergunta?')) return;
    await fetch(`/api/admin/perguntas/${id}`, { method: 'DELETE' });
    if (editandoPergunta?.id === id) {
      setEditandoPergunta(null);
      setCriandoNova(false);
    }
    onRecarregar();
  }

  async function handleDragEndPerguntas(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = perguntasOrdenadas.findIndex((p) => p.id === active.id);
    const newIndex = perguntasOrdenadas.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(perguntasOrdenadas, oldIndex, newIndex);

    const itens = reordered.map((p, i) => ({ id: p.id, ordem: i }));
    await fetch('/api/admin/perguntas/reordenar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
    onRecarregar();
  }

  async function confirmarPerguntasIA(perguntasGeradas: { codigo: string; bloco: string; texto: string; tipo: string; opcoes: string | null }[]) {
    for (let i = 0; i < perguntasGeradas.length; i++) {
      const p = perguntasGeradas[i];
      await fetch('/api/admin/perguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: `${p.codigo}_${Date.now().toString(36)}_${i}`,
          jornada,
          bloco,
          texto: p.texto,
          tipo: p.tipo,
          opcoes: p.opcoes,
          ordem: perguntas.length + i,
          ativa: true,
        }),
      });
    }
    setMostrarIA(false);
    onRecarregar();
  }

  return (
    <div className="bg-white rounded-2xl border border-[#ece8e1] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#ece8e1]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${meta.corBg} flex items-center justify-center text-sm`}>
              {meta.icone}
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#2d2a26]">{nome}</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.corBg} ${meta.cor}`}>
                {meta.label}
              </span>
            </div>
          </div>
          <button onClick={onFechar} className="text-[#9a9590] hover:text-[#4a4842] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="p-4 space-y-1.5 max-h-[50vh] overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndPerguntas}>
          <SortableContext items={perguntasOrdenadas.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {perguntasOrdenadas.map((p) => (
              <PerguntaRow key={p.id} pergunta={p} onEditar={abrirEdicao} onToggle={toggleAtiva} onExcluir={excluir} />
            ))}
          </SortableContext>
        </DndContext>

        {perguntasOrdenadas.length === 0 && (
          <p className="text-center text-[12px] text-[#9a9590] py-6">Nenhuma pergunta neste bloco.</p>
        )}
      </div>

      {/* Inline edit form */}
      {(editandoPergunta || criandoNova) && (
        <div className="p-4 border-t border-[#ece8e1] bg-[#faf8f5] space-y-3">
          <h4 className="text-[12px] font-bold text-[#4a4842] uppercase tracking-wider">
            {editandoPergunta ? 'Editar Pergunta' : 'Nova Pergunta'}
          </h4>
          <textarea
            className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-white text-[13px] text-[#2d2a26] min-h-[60px] resize-y focus:outline-none focus:border-[#2d7a5e]"
            value={formTexto}
            onChange={(e) => setFormTexto(e.target.value)}
            placeholder="Texto da pergunta..."
          />
          <select
            className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-white text-[13px] text-[#2d2a26] focus:outline-none focus:border-[#2d7a5e]"
            value={formTipo}
            onChange={(e) => setFormTipo(e.target.value)}
          >
            <option value="escala_0_10">Escala 0-10</option>
            <option value="multipla_escolha">Múltipla Escolha</option>
            <option value="frequencia">Frequência</option>
            <option value="aberta">Aberta</option>
          </select>
          {(formTipo === 'multipla_escolha' || formTipo === 'frequencia') && (
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-[#ece8e1] bg-white text-[12px] text-[#2d2a26] min-h-[40px] resize-y font-mono focus:outline-none focus:border-[#2d7a5e]"
              value={formOpcoes}
              onChange={(e) => setFormOpcoes(e.target.value)}
              placeholder='[{"valor":"sim","label":"Sim"}]'
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={salvarPergunta}
              disabled={salvando || !formTexto.trim()}
              className="px-4 py-2 bg-[#2d7a5e] text-white text-[12px] font-bold rounded-xl hover:bg-[#24674f] transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditandoPergunta(null); setCriandoNova(false); }}
              className="px-3 py-2 text-[12px] text-[#9a9590] hover:text-[#4a4842] font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 border-t border-[#ece8e1] flex gap-2">
        <button
          onClick={abrirNova}
          className="flex-1 py-2.5 bg-[#2d7a5e] text-white text-[12px] font-bold rounded-xl hover:bg-[#24674f] transition-colors"
        >
          + Pergunta
        </button>
        <button
          onClick={() => setMostrarIA(true)}
          className="flex-1 py-2.5 bg-[#f3e8ff] text-[#7c3aed] text-[12px] font-bold rounded-xl hover:bg-[#ede0ff] transition-colors"
        >
          ✨ Gerar com IA
        </button>
      </div>

      {mostrarIA && (
        <GerarComIA bloco={bloco} onConfirmar={confirmarPerguntasIA} onFechar={() => setMostrarIA(false)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify files compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/EditorBloco.tsx
git commit -m "feat: add EditorBloco right-panel question editor"
```

---

## Task 6: Rewrite the perguntas page

**Files:**
- Modify: `src/app/admin/perguntas/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite page.tsx with trail layout**

```tsx
'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import TrilhaJornada, { Pergunta, BlocoInfo } from '@/components/admin/TrilhaJornada';
import EditorBloco from '@/components/admin/EditorBloco';

const JORNADAS = [
  { id: 'trabalho', label: 'Trabalho', icone: '🏫', descricao: 'Impacto emocional da atividade docente' },
  { id: 'relacionamentos', label: 'Relacionamentos', icone: '💛', descricao: 'Relações pessoais e inteligência emocional' },
  { id: 'financas', label: 'Finanças', icone: '💰', descricao: 'Situação financeira e bem-estar' },
];

// Map jornada types to include estresse block
const JORNADA_FILTROS: Record<string, string[]> = {
  trabalho: ['trabalho', 'estresse'],
  relacionamentos: ['relacionamentos'],
  financas: ['financas'],
};

export default function PerguntasPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [jornadaAtiva, setJornadaAtiva] = useState('trabalho');
  const [blocoSelecionado, setBlocoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    carregarPerguntas();
  }, []);

  async function carregarPerguntas() {
    try {
      const res = await fetch('/api/admin/perguntas');
      const data = await res.json();
      setPerguntas(data.perguntas || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  }

  const filtros = JORNADA_FILTROS[jornadaAtiva] || [jornadaAtiva];
  const perguntasFiltradas = perguntas.filter((p) => filtros.includes(p.jornada));
  const perguntasBloco = blocoSelecionado
    ? perguntasFiltradas.filter((p) => p.bloco === blocoSelecionado)
    : [];

  async function handleReordenarBlocos(blocos: BlocoInfo[]) {
    // Reassign ordem values: each block's questions get sequential values
    const itens: { id: string; ordem: number }[] = [];
    let ordemBase = 0;

    for (const bloco of blocos) {
      for (let i = 0; i < bloco.perguntas.length; i++) {
        itens.push({ id: bloco.perguntas[i].id, ordem: ordemBase + i });
      }
      ordemBase += bloco.perguntas.length;
    }

    // Optimistically update local state
    const novasPerguntas = [...perguntas];
    for (const item of itens) {
      const p = novasPerguntas.find((q) => q.id === item.id);
      if (p) p.ordem = item.ordem;
    }
    setPerguntas(novasPerguntas);

    // Persist to server
    await fetch('/api/admin/perguntas/reordenar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itens }),
    });
  }

  const jornadaInfo = JORNADAS.find((j) => j.id === jornadaAtiva);
  const totalPerguntas = perguntasFiltradas.length;
  const totalAtivas = perguntasFiltradas.filter((p) => p.ativa).length;

  if (carregando) {
    return (
      <AdminLayout titulo="Editor de Jornadas" subtitulo="Visualize e edite a trilha de cada jornada">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#2d7a5e] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#9a9590] text-sm font-medium">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titulo="Editor de Jornadas" subtitulo="Visualize e edite a trilha de cada jornada">
      {/* Journey tabs */}
      <div className="flex gap-2 mb-6">
        {JORNADAS.map((j) => {
          const count = perguntas.filter((p) => (JORNADA_FILTROS[j.id] || [j.id]).includes(p.jornada)).length;
          const isActive = jornadaAtiva === j.id;
          return (
            <button
              key={j.id}
              onClick={() => { setJornadaAtiva(j.id); setBlocoSelecionado(null); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-[#2d7a5e] bg-[#e8f5ee]/50 shadow-sm'
                  : 'border-[#ece8e1] bg-white hover:border-[#d5d0c8] hover:shadow-sm'
              }`}
            >
              <span className="text-xl">{j.icone}</span>
              <div className="text-left">
                <p className={`text-[13px] font-bold ${isActive ? 'text-[#2d7a5e]' : 'text-[#4a4842]'}`}>
                  {j.label}
                </p>
                <p className="text-[10px] text-[#9a9590] font-medium">{count} perguntas</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Journey info bar */}
      <div className="bg-white rounded-2xl border border-[#ece8e1] p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{jornadaInfo?.icone}</span>
          <div>
            <h2 className="text-[15px] font-bold text-[#2d2a26]">Jornada: {jornadaInfo?.label}</h2>
            <p className="text-[12px] text-[#9a9590]">{jornadaInfo?.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="text-[#9a9590]">
            <strong className="text-[#2d2a26]">{totalPerguntas}</strong> perguntas
          </span>
          <span className="text-[#9a9590]">
            <strong className="text-[#2d7a5e]">{totalAtivas}</strong> ativas
          </span>
        </div>
      </div>

      {/* Main layout: trail + editor */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Trail (left panel — 3 cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#ece8e1] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[13px] font-bold text-[#4a4842] uppercase tracking-wider">
                Trilha da Jornada
              </h3>
              <p className="text-[11px] text-[#b5b0a8]">Arraste os blocos para reordenar</p>
            </div>

            <TrilhaJornada
              perguntas={perguntasFiltradas}
              blocoSelecionado={blocoSelecionado}
              onSelecionarBloco={(b) => setBlocoSelecionado(b === blocoSelecionado ? null : b)}
              onReordenar={handleReordenarBlocos}
            />
          </div>
        </div>

        {/* Editor (right panel — 2 cols) */}
        <div className="lg:col-span-2">
          {blocoSelecionado ? (
            <EditorBloco
              bloco={blocoSelecionado}
              jornada={filtros.find((f) =>
                perguntasFiltradas.some((p) => p.bloco === blocoSelecionado && p.jornada === f)
              ) || jornadaAtiva}
              perguntas={perguntasBloco}
              onFechar={() => setBlocoSelecionado(null)}
              onRecarregar={carregarPerguntas}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#ece8e1] p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#f5f3ef] flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b5b0a8" strokeWidth="1.5">
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[14px] font-bold text-[#4a4842] mb-1">Selecione um bloco</p>
              <p className="text-[12px] text-[#9a9590] leading-relaxed">
                Clique em um bloco na trilha para ver e editar suas perguntas.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npx next build 2>&1 | tail -20
```

Expected: Build succeeds with no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/perguntas/page.tsx
git commit -m "feat: rewrite perguntas page as visual journey trail editor"
```

---

## Task 7: Visual verification and polish

- [ ] **Step 1: Start dev server and navigate to /admin/perguntas**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin/perguntas` (log in as admin@escola.com / admin123)

- [ ] **Step 2: Verify trail renders correctly**

Check:
- 3 journey tabs render with correct icons and counts
- Each journey shows its blocks in a vertical trail with connector lines
- Blocks show correct icons (📋 for question blocks, 🧪 for tests)
- Block cards show question counts
- "Início da Jornada" and "Diagnóstico Final" markers visible

- [ ] **Step 3: Verify drag and drop works**

- Drag a block up or down in the trail
- Verify the order persists after page reload
- Verify no console errors during drag

- [ ] **Step 4: Verify editor panel works**

- Click a block → right panel opens with questions
- Edit a question text → save → verify it persists
- Toggle a question active/inactive
- Add a new question manually
- Delete a question
- Reorder questions within a block via drag

- [ ] **Step 5: Verify AI generation works**

- Click "✨ Gerar com IA" in the editor
- Type a description and click generate
- Verify preview shows generated questions
- Edit a question text in preview
- Confirm → verify questions are added to the block

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete visual journey trail editor with drag-and-drop and AI generation"
```
