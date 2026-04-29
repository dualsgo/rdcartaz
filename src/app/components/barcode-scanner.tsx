'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Configuração do scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ]
    };

    scannerRef.current = new Html5QrcodeScanner("reader", config, false);

    scannerRef.current.render(
      (decodedText) => {
        // Sucesso no scan
        if (scannerRef.current) {
          scannerRef.current.clear().then(() => {
            onScan(decodedText);
          }).catch(err => {
            console.error("Erro ao limpar scanner:", err);
            onScan(decodedText);
          });
        }
      },
      (errorMessage) => {
        // Ignoramos erros de 'não encontrou código no frame' para não poluir o console
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Erro ao destruir scanner:", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scanner de Código</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative aspect-square md:aspect-video bg-black flex items-center justify-center overflow-hidden">
          <div id="reader" className="w-full"></div>
          
          {/* Overlay decorativo */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
            <div className="w-full h-full border-2 border-blue-500/30 rounded-lg relative">
              {/* Cantos destacados */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
              
              {/* Linha de scan animada */}
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Footer / Info */}
        <div className="p-6 text-center">
          <p className="text-white/60 text-xs leading-relaxed">
            Aponte a câmera para o <strong className="text-white">código de barras</strong> do produto.<br/>
            Mantenha o código centralizado e bem iluminado.
          </p>
          
          {error && (
            <p className="mt-4 text-red-400 text-[10px] font-bold uppercase">{error}</p>
          )}

          <Button 
            variant="ghost" 
            onClick={onClose}
            className="mt-6 text-white/40 hover:text-white hover:bg-white/5 text-[10px] uppercase font-bold tracking-widest"
          >
            Cancelar Scanner
          </Button>
        </div>
      </div>
    </div>
  );
}
