'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Database, Info, Sparkles } from 'lucide-react';

export function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  // Abre automaticamente na primeira visita da sessão
  useEffect(() => {
    const seen = sessionStorage.getItem('disclaimer-seen');
    if (!seen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('disclaimer-seen', '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', border: '1px solid rgba(255,165,0,0.3)' }}
      >
        {/* Barra pulsante de atenção */}
        <div
          className="w-full h-2"
          style={{
            background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />

        <style>{`
          @keyframes shimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 8px 2px rgba(245,158,11,0.4); }
            50%       { box-shadow: 0 0 20px 6px rgba(239,68,68,0.6); }
          }
          @keyframes blink-icon {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.5; transform: scale(1.15); }
          }
          .blink-icon { animation: blink-icon 0.9s ease-in-out infinite; }
          .pulse-border { animation: pulse-glow 1.5s ease-in-out infinite; }
        `}</style>

        {/* Botão fechar */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10 rounded-full p-1 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-5">
          {/* Ícone de alerta piscante */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="blink-icon pulse-border rounded-full p-2.5 shrink-0"
              style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.5)' }}
            >
              <AlertTriangle className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">ATENÇÃO — Leia antes de usar</h2>
              <p className="text-amber-400 text-xs font-semibold tracking-wide uppercase mt-0.5">Ferramenta Não Oficial</p>
            </div>
          </div>

          {/* Aviso de preço */}
          <div
            className="rounded-xl p-4 mb-4 pulse-border"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}
          >
            <div className="flex gap-2.5 items-start">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0 mt-0.5 blink-icon" />
              <div>
                <p className="text-red-300 font-bold text-sm mb-1">⚠️ CONFIRA OS VALORES COM ATENÇÃO REDOBRADA</p>
                <p className="text-red-200 text-xs leading-relaxed">
                  Os preços e descontos são inseridos <strong>manualmente</strong>. Um erro de digitação pode gerar
                  cartazes com valores incorretos, expondo a loja a vendas com
                  <strong> preços abaixo do custo ou descontos indevidos</strong>. Sempre revise o cartaz
                  antes de imprimir.
                </p>
              </div>
            </div>
          </div>

          {/* Sobre a ferramenta */}
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex gap-2.5 items-start">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold text-sm mb-1">Sobre esta ferramenta</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  Criada como <strong className="text-white">paliativo</strong> após mudanças no sistema oficial da empresa.
                  Interface auxiliar à <strong className="text-white">Planilha de Relíquias da Diversão</strong> — com modelos
                  de cartaz simulados via IA e ajustados para uso prático em loja. Layouts desenvolvidos com auxílio de IA
                  para maximizar eficiência visual.
                </p>
              </div>
            </div>
          </div>

          {/* Banco de dados */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex gap-2.5 items-start">
              <Database className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-semibold text-sm mb-1">Banco de dados</p>
                <p className="text-gray-300 text-xs leading-relaxed">
                  O acervo utilizado é o <strong className="text-white">mesmo disponibilizado oficialmente</strong> na
                  Planilha de Relíquias da Diversão, com{' '}
                  <strong className="text-green-400">141.131 produtos cadastrados</strong>.
                  <span className="text-gray-400"> Nenhum dado foi alterado ou adicionado.</span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: 'white',
              boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
            }}
          >
            Entendido — Vou conferir os valores com atenção
          </button>
        </div>
      </div>
    </div>
  );
}
