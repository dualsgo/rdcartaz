'use client';

import { X, FileSpreadsheet, ExternalLink, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (mode: 'offer' | 'normal') => void;
}

export function AutomationModal({ isOpen, onClose, onSelectFile }: AutomationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-white border border-blue-100 transform transition-all animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
      >
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Automatizar Cartazes</h2>
              <p className="text-blue-100 text-xs">Importe o relatório de alteração de preço para gerar os cartazes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {/* Passo 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">1</div>
            <div className="space-y-1.5">
              <p className="text-xs text-gray-600 leading-relaxed">
                No <strong className="text-gray-900">PLENO</strong> faça o processo de impressão de alteração de preço. No rodapé, clique em <strong className="text-blue-600">CSV</strong> e salve o arquivo.
              </p>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">2</div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-gray-900 text-sm">Escolha o que deseja gerar:</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Você pode filtrar apenas os produtos em oferta ou gerar as etiquetas normais (brancas) com o novo preço.
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button 
              onClick={() => {
                onClose();
                onSelectFile('offer');
              }}
              className="h-16 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-tight text-xs shadow-lg shadow-amber-100 flex flex-col items-center justify-center gap-1 group py-2"
            >
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Gerar Ofertas</span>
              </div>
              <span className="text-[9px] opacity-80 normal-case font-medium">(Cartaz Amarelo)</span>
            </Button>
            
            <Button 
              onClick={() => {
                onClose();
                onSelectFile('normal');
              }}
              className="h-16 bg-slate-700 hover:bg-slate-800 text-white font-black uppercase tracking-tight text-xs shadow-lg shadow-slate-200 flex flex-col items-center justify-center gap-1 group py-2"
            >
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span>Gerar Etiquetas</span>
              </div>
              <span className="text-[9px] opacity-80 normal-case font-medium">(Branco / S. Oferta)</span>
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
            * Para etiquetas sem oferta, o sistema usará o valor da coluna "Novo Preço".
          </p>
        </div>
      </div>
    </div>
  );
}
