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
        <button
          role="switch"
          aria-checked={pergunta.ativa}
          aria-label={`${pergunta.ativa ? 'Desativar' : 'Ativar'} pergunta`}
          onClick={() => onToggle(pergunta)}
          className={`w-7 h-4 rounded-full transition-all duration-200 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2d7a5e] focus:ring-offset-1 ${
            pergunta.ativa ? 'bg-[#2d7a5e]' : 'bg-[#d5d0c8]'
          }`}
        >
          <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${
            pergunta.ativa ? 'left-3.5' : 'left-0.5'
          }`} />
        </button>
        <button onClick={() => onExcluir(pergunta.id)} aria-label="Excluir pergunta" className="p-2 text-[#d5d0c8] hover:text-[#dc6b6b] transition-colors">
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
          Gerar com IA
        </button>
      </div>

      {mostrarIA && (
        <GerarComIA bloco={bloco} onConfirmar={confirmarPerguntasIA} onFechar={() => setMostrarIA(false)} />
      )}
    </div>
  );
}
