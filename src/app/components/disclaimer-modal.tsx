'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Database, Info, Sparkles } from 'lucide-react';

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [step, setStep] = useState(1);

  // Abre automaticamente na primeira visita da sessão
  useEffect(() => {
    const seen = sessionStorage.getItem('disclaimer-seen');
    if (!seen) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (open && productCount === null) {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => setProductCount(data.count))
        .catch(() => setProductCount(0));
    }
  }, [open, productCount]);

  const handleClose = () => {
    sessionStorage.setItem('disclaimer-seen', '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex flex-col max-h-[90vh]">
          {/* Barra pulsante */}
          <div
            className="w-full h-1.5 shrink-0"
            style={{
              backgroundImage: step === 1 ? 'linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6)' : 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {step === 1 ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Sparkles className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">RD Cartaz — Relíquias</h2>
                    <p className="text-blue-400 text-[10px] font-black tracking-widest uppercase">Versão de Automação</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-blue-200 font-bold text-xs uppercase">Sobre a ferramenta</p>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          Solução criada para otimizar a consulta e impressão da <strong className="text-white">Planilha de Relíquias</strong>. 
                          Ela permite importar arquivos do <b>Pleno</b> para gerar cartazes automaticamente.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Database className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-green-200 font-bold text-xs uppercase">Base de Dados</p>
                        <p className="text-gray-300 text-[11px] leading-relaxed">
                          Sincronizado com a base oficial, contendo atualmente{' '}
                          <strong className="text-white">
                            {productCount ? productCount.toLocaleString('pt-BR') : '141.989'} itens
                          </strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-amber-200 font-bold text-xs uppercase">Projeto Original</p>
                        <p className="text-gray-300 text-[11px] leading-relaxed italic">
                          Baseado na base de dados oficial (Google Drive) iniciada por Danilo Conrado de Oliveira.
                        </p>
                        <a 
                          href="https://docs.google.com/spreadsheets/d/1pzNpAQQGrRtt1UR5fPjZyZi72O6B2LbBEg9GupK9Z7E/edit?usp=sharing" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-[10px] font-bold underline decoration-dotted mt-1"
                        >
                          Acessar Planilha no Drive
                        </a>
                        <div className="text-[9px] text-gray-500 space-y-0.5 border-t border-white/5 pt-2 mt-1">
                          <p>Criado em: 23/09/2025</p>
                          <p>Última mod: 06/10/2025</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-red-500/20 p-2 rounded-lg border border-red-500/40 pulse-border">
                    <AlertTriangle className="h-6 w-6 text-red-400 blink-icon" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-tight">AVISO CRÍTICO</h2>
                    <p className="text-red-400 text-[10px] font-black tracking-widest uppercase">Segurança Operacional</p>
                  </div>
                </div>

                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <div className="flex gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
                    <p className="text-red-100 font-bold text-sm leading-tight uppercase">
                      Confira os valores com atenção redobrada
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-red-200/80 text-xs leading-relaxed">
                      Os preços e descontos são inseridos <strong>manualmente</strong> ou via importação de planilhas que podem estar desatualizadas.
                    </p>
                    <div className="bg-red-900/40 p-3 rounded-lg border border-red-500/20">
                      <p className="text-white text-xs font-bold leading-relaxed">
                        Um erro pode gerar cartazes com preços abaixo do custo. REVISE TUDO antes de imprimir e colocar na loja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 pt-2 shrink-0 bg-black/20 border-t border-white/5">
            {step === 1 ? (
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-500 shadow-[0_4px_15px_rgba(37,99,235,0.3)]"
              >
                Continuar para Avisos Importantes
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_15px_rgba(220,38,38,0.3)] pulse-border"
              >
                Entendido — Começar a usar
              </button>
            )}
            
            <div className="flex justify-center mt-4 gap-2">
              <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-blue-500' : 'bg-white/20'}`} />
              <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-red-500' : 'bg-white/20'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
