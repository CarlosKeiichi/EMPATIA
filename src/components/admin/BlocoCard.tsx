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
          onClick={(e) => e.stopPropagation()}
          aria-label="Arrastar bloco"
          className="flex-shrink-0 cursor-grab active:cursor-grabbing text-[#b5b0a8] hover:text-[#9a9590] touch-none p-1"
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
