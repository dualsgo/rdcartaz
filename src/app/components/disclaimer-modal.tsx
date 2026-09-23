'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Scissors, Printer, ExternalLink, ArrowRight } from 'lucide-react';

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Abre automaticamente na primeira visita da sessão
  useEffect(() => {
    const seen = sessionStorage.getItem('disclaimer-seen-v3');
    if (!seen) {
      setOpen(true);
    }
  }, []);

  // Fechar com a tecla ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleClose = () => {
    sessionStorage.setItem('disclaimer-seen-v3', '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* Botão Fechar X */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 text-white/60 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 focus:outline-none"
          title="Fechar aviso"
          aria-label="Fechar aviso"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col max-h-[90vh]">
          {/* Barra gradiente pulsante */}
          <div
            className="w-full h-1.5 shrink-0"
            style={{
              backgroundImage: step === 1 ? 'linear-gradient(90deg, #f59e0b, #ec4899, #3b82f6)' : 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {step === 1 ? (
              /* PASSO 1: AVISO PRIMÁRIO SOBRE SERRILHA, IMPRESSÃO E SISTEMA OFICIAL */
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pr-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/40">
                    <Scissors className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tight">
                      Aviso Importante: Recortes
                    </h2>
                    <p className="text-amber-400 text-[10px] font-black tracking-widest uppercase">
                      Folhas Serrilhadas & Sistema Oficial
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Bloco 1: Recortes Irregulares */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase">
                      <Scissors className="h-3.5 w-3.5 shrink-0" />
                      <span>Folhas serrilhadas com cortes sem padrão</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Devido aos <strong>diferentes formatos de recorte (sem padrão e irregulares)</strong> das folhas serrilhadas fornecidas às lojas, os cartazes podem sair <strong>desalinhados com os picotes físicos</strong>.
                    </p>
                  </div>

                  {/* Bloco 2: O problema NÃO é a impressora */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase">
                      <Printer className="h-3.5 w-3.5 shrink-0" />
                      <span>O problema NÃO é a impressora</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Caso a impressão saia fora do picote, <strong className="text-white">o problema NÃO é a impressora da loja</strong>. Trata-se da diferença entre a configuração padrão e as <strong>margens/bordas físicas da folha serrilhada</strong>, que variam conforme o lote recebido.
                    </p>
                  </div>

                  {/* Bloco 3: Use com moderação e priorize o oficial */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span>Use com moderação — Priorize o Oficial</span>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Esta é uma ferramenta de contingência/apoio para a planilha de relíquias. Use com moderação e <strong>priorize sempre o sistema oficial da rede</strong>:
                    </p>
                    <a
                      href="https://rihappy.pricefy.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 transition-all font-mono text-xs font-bold group"
                    >
                      <span className="truncate">https://rihappy.pricefy.com.br</span>
                      <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* PASSO 2: AVISO CRÍTICO DE PREÇOS */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 pr-1">
                <div className="flex items-center gap-3 mb-1">
                  <div className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/40">
                    <AlertTriangle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tight">
                      Aviso Crítico de Preços
                    </h2>
                    <p className="text-red-400 text-[10px] font-black tracking-widest uppercase">
                      Segurança Operacional no PDV
                    </p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <div className="flex gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-100 font-bold text-sm leading-tight uppercase">
                      Confira os valores com atenção redobrada
                    </p>
                  </div>
                  
                  <div className="space-y-2.5">
                    <p className="text-red-200/90 text-xs leading-relaxed">
                      Os preços e descontos inseridos manualmente ou via importação devem ser <strong>conferidos antes de expor na loja</strong>.
                    </p>
                    <div className="bg-red-900/50 p-3 rounded-lg border border-red-500/30">
                      <p className="text-white text-xs font-bold leading-relaxed">
                        Um erro de digitação pode gerar cartazes com valores abaixo do custo. REVISE TUDO antes de imprimir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 pt-3 shrink-0 bg-black/25 border-t border-white/5">
            {step === 1 ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 bg-amber-500 hover:bg-amber-400 text-black shadow-[0_4px_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
                >
                  <span>Continuar para Revisão de Preços</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-1.5 text-center text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Pular e Começar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.3)] font-bold"
              >
                Entendido — Começar a Usar
              </button>
            )}
            
            <div className="flex justify-center mt-3 gap-2">
              <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-amber-500' : 'bg-white/20'}`} />
              <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-red-500' : 'bg-white/20'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
