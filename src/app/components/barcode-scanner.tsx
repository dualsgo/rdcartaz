'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  scanCount?: number;
}

export function BarcodeScanner({ onScan, onClose, scanCount = 0 }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const lastScannedRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });

  const handleDecoded = useCallback((decodedText: string) => {
    const now = Date.now();
    const { text, time } = lastScannedRef.current;
    
    // Evita bipar o mesmo código múltiplas vezes em menos de 2 segundos
    if (text === decodedText && now - time < 2000) {
      return;
    }
    
    lastScannedRef.current = { text: decodedText, time: now };
    onScan(decodedText);
  }, [onScan]);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const availableCameras = await Html5Qrcode.getCameras();
        setCameras(availableCameras);

        if (availableCameras && availableCameras.length > 0) {
          const defaultIndex = availableCameras.length > 1 ? availableCameras.length - 1 : 0;
          setCurrentCameraIndex(defaultIndex);

          const config = {
            fps: 20,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.0,
            useBarCodeDetectorIfSupported: true,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_128,
            ]
          };

          await html5QrCode.start(
            availableCameras[defaultIndex].id,
            config,
            (decodedText) => {
              handleDecoded(decodedText);
            },
            () => {}
          );
        } else {
          await html5QrCode.start(
            { facingMode: "environment" },
            { 
              fps: 20, 
              qrbox: { width: 280, height: 160 },
              aspectRatio: 1.0,
              useBarCodeDetectorIfSupported: true,
              formatsToSupport: [
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
              ]
            },
            (decodedText) => {
              handleDecoded(decodedText);
            },
            () => {}
          );
        }
        
        setIsInitializing(false);
        setError(null);
      } catch (err: any) {
        console.error("Erro ao iniciar scanner:", err);
        setIsInitializing(false);
        setError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => console.error("Erro ao parar scanner:", err));
      }
    };
  }, [onScan]);

  const handleSwitchCamera = async () => {
    if (!scannerRef.current || cameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setIsInitializing(true);
    
    try {
      await scannerRef.current.stop();
      setCurrentCameraIndex(nextIndex);
      
      await scannerRef.current.start(
        cameras[nextIndex].id,
        {
          fps: 20,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.7777777778,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {}
      );
      setIsInitializing(false);
    } catch (err) {
      console.error("Erro ao trocar câmera:", err);
      setError("Erro ao trocar de câmera.");
      setIsInitializing(false);
    }
  };

  const handleRetry = () => {
    setIsInitializing(true);
    setError(null);
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        window.location.reload(); // Forma bruta mas eficaz de resetar o hardware da câmera no browser
      }).catch(() => {
        window.location.reload();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-[80vh] max-h-[600px]">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Scanner Ao Vivo</h3>
          </div>
          <div className="flex items-center gap-3">
            {cameras.length > 1 && (
              <button 
                onClick={handleSwitchCamera}
                disabled={isInitializing}
                className="text-white/60 hover:text-white transition-colors p-1 flex items-center gap-1 bg-white/5 rounded-md px-2"
              >
                <RefreshCw className={cn("h-4 w-4", isInitializing && "animate-spin")} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Trocar</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-white/40 hover:text-white transition-colors p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

        </div>

        {/* Scanner Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {isInitializing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black gap-3">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Iniciando Câmera...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black p-8 text-center gap-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
              <p className="text-white/80 text-xs leading-relaxed">{error}</p>
              <Button onClick={handleRetry} variant="outline" className="text-white border-white/20">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          )}

          <div id="reader" className="w-full h-full [&>video]:object-cover"></div>
          
          {/* Overlay decorativo (MIRA) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[280px] h-[160px] border-2 border-white/20 rounded-lg relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-sm"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-sm"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-sm"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-sm"></div>
              
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Footer / Info */}
        <div className="p-4 bg-black/60 border-t border-white/5 flex flex-col items-center gap-3">
          {scanCount > 0 && (
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">{scanCount} {scanCount === 1 ? 'etiqueta lida' : 'etiquetas lidas'}</span>
            </div>
          )}
          
          {scanCount === 0 && (
            <p className="text-white/60 text-xs leading-relaxed text-center">
              Escaneamento contínuo ativado. Os itens lidos vão direto para a fila.
            </p>
          )}

          <Button 
            onClick={onClose} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-12"
          >
            Finalizar e Ver Lote
          </Button>
        </div>
      </div>
    </div>
  );
}
