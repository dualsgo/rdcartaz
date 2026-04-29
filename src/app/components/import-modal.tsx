'use client';

import { CheckCircle2, Loader2, X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImportModalProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  count: number;
  onClose: () => void;
}

export function ImportModal({ status, count, onClose }: ImportModalProps) {
  if (status === 'idle') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className={cn(
          "relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-white border transform transition-all animate-in zoom-in-95 duration-300",
          status === 'error' ? 'border-red-200' : 'border-blue-100'
        )}
      >
        <div className="p-8 flex flex-col items-center text-center">
          {status === 'processing' && (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 relative">
                <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                <div className="absolute inset-0 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Processando Arquivo</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Estamos analisando sua planilha e filtrando a melhor oferta...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Importação Concluída!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Encontramos <span className="font-bold text-green-600">{count} oferta</span> ativa e elas já foram adicionadas ao seu lote.
              </p>
              <Button 
                onClick={onClose} 
                className="mt-6 w-full bg-green-600 hover:bg-green-700 font-bold"
              >
                Visualizar Lote
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ops! Nada encontrado</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Não localizamos nenhuma oferta válida neste arquivo. Verifique se as colunas e preços promocionais estão corretos.
              </p>
              <Button 
                onClick={onClose} 
                variant="outline"
                className="mt-6 w-full border-red-200 text-red-600 hover:bg-red-50 font-bold"
              >
                Tentar Novamente
              </Button>
            </>
          )}
        </div>

        {status !== 'processing' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
