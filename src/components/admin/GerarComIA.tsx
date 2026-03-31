'use client';

import { useState, useEffect, useRef } from 'react';

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

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onFechar();
    }
    document.addEventListener('keydown', handleKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onFechar]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFechar}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-gerar-ia-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-[#ece8e1] w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-xl focus:outline-none"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="modal-gerar-ia-title" className="text-[16px] font-bold text-[#2d2a26]">Gerar Perguntas com IA</h3>
            <button onClick={onFechar} aria-label="Fechar" className="p-2 text-[#9a9590] hover:text-[#4a4842] transition-colors">
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
                  'Gerar com IA'
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
                  <div key={p.codigo} className="flex items-start gap-2 p-3 rounded-xl bg-[#faf8f5] border border-[#ece8e1]">
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
