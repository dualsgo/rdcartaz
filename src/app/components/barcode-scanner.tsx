'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ScanStatus = {
  type: 'success' | 'error';
  message: string;
  timestamp: number;
} | null;

interface BarcodeScannerProps {
  onScan: (decodedText: string) => Promise<void> | void;
  onClose: () => void;
  scanCount?: number;
  scanStatus?: ScanStatus;
}

export function BarcodeScanner({ onScan, onClose, scanCount = 0, scanStatus }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Efeito para mostrar feedback temporário
  useEffect(() => {
    if (scanStatus) {
      setShowFeedback(true);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setShowFeedback(false), 2000);
    }
  }, [scanStatus]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const lastScannedRef = useRef<{ text: string, time: number }>({ text: '', time: 0 });
  const isProcessingRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const handleDecoded = useCallback(async (decodedText: string) => {
    const now = Date.now();
    
    if (isProcessingRef.current) return;
    
    const { text, time } = lastScannedRef.current;
    
    // 1. Bloqueio global: No mínimo 1.5 segundos entre QUALQUER leitura (mesmo que seja código diferente)
    // Isso evita o colapso por "ruído" ou múltiplas detecções rápidas
    if (now - time < 1500) return;

    // 2. Bloqueio específico: Evita bipar o mesmo código múltiplas vezes em menos de 3 segundos
    if (text === decodedText && now - time < 3000) {
      return;
    }
    
    isProcessingRef.current = true;
    setIsLocked(true);
    lastScannedRef.current = { text: decodedText, time: now };
    
    try {
      await onScan(decodedText);
    } finally {
      // Mantém bloqueado por mais 1s após processar para o usuário respirar e ver o feedback
      setTimeout(() => {
        isProcessingRef.current = false;
        setIsLocked(false);
      }, 1000);
    }
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
            <div className={cn(
              "w-[280px] h-[160px] border-2 rounded-lg relative transition-colors duration-300",
              isLocked ? "border-white/10" : "border-white/20"
            )}>
              <div className={cn("absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-sm transition-colors", isLocked ? "border-gray-600" : "border-blue-500")}></div>
              <div className={cn("absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-sm transition-colors", isLocked ? "border-gray-600" : "border-blue-500")}></div>
              <div className={cn("absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-sm transition-colors", isLocked ? "border-gray-600" : "border-blue-500")}></div>
              <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-sm transition-colors", isLocked ? "border-gray-600" : "border-blue-500")}></div>
              
              {!isLocked && (
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse"></div>
              )}
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Feedback de Leitura */}
          {showFeedback && scanStatus && (
            <div className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200",
              scanStatus.type === 'success' ? "bg-green-500/40" : "bg-red-500/60"
            )}>
              <div className="bg-black/80 p-6 rounded-2xl flex flex-col items-center gap-3 border border-white/20 shadow-2xl">
                {scanStatus.type === 'success' ? (
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-500" />
                )}
                <span className="text-white font-black uppercase tracking-widest text-lg">
                  {scanStatus.type === 'success' ? 'LIDO!' : 'FALHOU!'}
                </span>
                <span className="text-white/70 text-[10px] font-bold uppercase tracking-tight">
                  {scanStatus.message}
                </span>
              </div>
            </div>
          )}
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
