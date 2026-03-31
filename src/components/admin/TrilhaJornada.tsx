'use client';

import { useMemo } from 'react';
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
  // Group questions by block, ordered by min ordem (memoized)
  const blocos = useMemo(() => {
    const blocosMap = new Map<string, Pergunta[]>();
    for (const p of perguntas) {
      const arr = blocosMap.get(p.bloco) || [];
      arr.push(p);
      blocosMap.set(p.bloco, arr);
    }
    return Array.from(blocosMap.entries())
      .map(([bloco, pergs]) => ({
        id: bloco,
        bloco,
        perguntas: pergs.sort((a, b) => a.ordem - b.ordem),
        ordem: Math.min(...pergs.map((p) => p.ordem)),
      }))
      .sort((a, b) => a.ordem - b.ordem);
  }, [perguntas]);

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
