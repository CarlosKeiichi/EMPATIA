'use client';

import { useEffect, useRef } from 'react';
import { TERMO_META, RESUMO_TERMO, SECOES_TERMO } from '@/config/termo';

interface TermoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export default function TermoModal({ aberto, onFechar }: TermoModalProps) {
  const caixaRef = useRef<HTMLDivElement>(null);

  // Esc fecha, e o fundo trava para a pagina nao rolar atras do modal.
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    caixaRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={TERMO_META.titulo}
    >
      <div className="absolute inset-0 bg-warm-900/40 backdrop-blur-[2px]" onClick={onFechar} />

      <div
        ref={caixaRef}
        tabIndex={-1}
        className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col outline-none animate-slide-up"
      >
        {/* Cabecalho fixo */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b border-warm-200">
          <div className="min-w-0">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-wide">
              {TERMO_META.plataforma}
            </p>
            <h2 className="text-xl font-bold text-warm-800 mt-1">{TERMO_META.titulo}</h2>
            <p className="text-warm-500 text-xs mt-1">{TERMO_META.subtitulo}</p>
          </div>
          <button
            onClick={onFechar}
            aria-label="Fechar"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-warm-500 hover:bg-warm-100 hover:text-warm-700 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteudo rolavel */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          <section>
            <h3 className="font-bold text-warm-800 mb-3">Resumo — o que você precisa saber</h3>
            <ul className="space-y-2.5">
              {RESUMO_TERMO.map((item) => (
                <li key={item.titulo} className="flex gap-2.5 text-sm text-warm-600 leading-relaxed">
                  <span className="text-primary-600 font-bold shrink-0">✓</span>
                  <span>
                    <strong className="text-warm-800">{item.titulo}</strong> {item.texto}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <div className="h-px bg-warm-200" />

          {SECOES_TERMO.map((secao) => (
            <section key={secao.titulo}>
              <h3 className="font-bold text-warm-800 mb-2">{secao.titulo}</h3>
              <div className="space-y-2">
                {secao.paragrafos.map((p, i) => (
                  <p key={i} className="text-sm text-warm-600 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <p className="text-xs text-warm-400 pt-2">
            {TERMO_META.controlador} · CNPJ {TERMO_META.cnpj} · {TERMO_META.contato}
          </p>
        </div>

        {/* Rodape fixo */}
        <div className="px-6 sm:px-8 py-4 border-t border-warm-200">
          <button onClick={onFechar} className="btn-primary w-full">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
