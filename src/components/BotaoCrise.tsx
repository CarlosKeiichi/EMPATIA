'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function BotaoCrise() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const naJornada = pathname === '/professor/jornada';

  return (
    <>
      {/* Botao flutuante */}
      <button
        onClick={() => setAberto(true)}
        className={`fixed ${naJornada ? 'bottom-20' : 'bottom-6'} right-6 z-50 flex items-center gap-2 bg-[#c94040] hover:bg-[#b53535] text-white pl-3.5 pr-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group print:hidden`}
        aria-label="Preciso de ajuda agora"
      >
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <span className="text-sm font-semibold hidden sm:inline">Preciso de ajuda</span>
      </button>

      {/* Modal */}
      {aberto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAberto(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#c94040]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c94040]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-[#2d2a26]">Você não está sozinho(a)</h2>
              <p className="text-sm text-[#7a7570] mt-2 leading-relaxed">
                Se você está passando por um momento difícil, existem pessoas prontas para te ajudar agora mesmo.
              </p>
            </div>

            {/* Recursos */}
            <div className="space-y-3">
              <a
                href="tel:188"
                className="flex items-center gap-4 p-4 bg-[#fef2f2] rounded-2xl border border-[#fcd5d5] hover:bg-[#fee2e2] transition-colors"
              >
                <div className="w-12 h-12 bg-[#c94040] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-[#2d2a26] text-sm">CVV — Ligue 188</p>
                  <p className="text-xs text-[#7a7570]">24 horas, gratuito, sigilo garantido</p>
                </div>
              </a>

              <a
                href="tel:192"
                className="flex items-center gap-4 p-4 bg-[#fff7ed] rounded-2xl border border-[#fed7aa] hover:bg-[#ffedd5] transition-colors"
              >
                <div className="w-12 h-12 bg-[#ea580c] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.98L13.75 4a2 2 0 00-3.5 0L3.32 16.02A2 2 0 005.07 19z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-[#2d2a26] text-sm">SAMU — Ligue 192</p>
                  <p className="text-xs text-[#7a7570]">Emergências médicas</p>
                </div>
              </a>

              <div className="flex items-center gap-4 p-4 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0]">
                <div className="w-12 h-12 bg-[#16a34a] text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-[#2d2a26] text-sm">CAPS</p>
                  <p className="text-xs text-[#7a7570]">Procure o Centro de Atenção Psicossocial mais próximo da sua cidade</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAberto(false)}
              className="w-full mt-6 py-3 text-sm font-semibold text-[#7a7570] hover:text-[#2d2a26] transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
