'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PosterData, PosterType } from '@/app/lib/types';

import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Search, RotateCcw, PlusCircle, Info, AlertTriangle, Camera, Sparkles } from 'lucide-react';
import { BarcodeScanner } from './barcode-scanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function centsToDisplay(cents: number): string {
  if (cents === 0) return '';
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayToCents(display: string): number {
  const digits = display.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

function useCurrencyInput(initial: string, maxCents?: number) {
  const [cents, setCents] = useState(() => displayToCents(initial));

  useEffect(() => {
    if (maxCents !== undefined && cents > maxCents) {
      setCents(maxCents);
    }
  }, [maxCents, cents]);

  const display = centsToDisplay(cents);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // No Desktop, mantemos o comportamento de apagar último dígito
    if (e.key === 'Backspace') {
      e.preventDefault();
      setCents(prev => Math.floor(prev / 10));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    const next = digits ? parseInt(digits, 10) : 0;
    
    // Limite de segurança (9.999,99 - 6 dígitos)
    if (next > 999999) return;
    
    setCents(next);
  };

  const reset = useCallback(() => setCents(0), []);
  const setValue = useCallback((val: string) => setCents(displayToCents(val)), []);

  return { display, handleKeyDown, handleChange, reset, setValue, cents };
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound';

type PosterFormProps = {
  data: PosterData;
  setData: Dispatch<SetStateAction<PosterData>>;
  posterType: PosterType;

  onLookupStatusChange?: (found: boolean) => void;
  onImportBatch?: () => void;
  sessionProducts?: Record<string, any>;
  onAutoAdd?: (data: PosterData) => void;
};

function playBeep(type: 'success' | 'error') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.error("Audio beep failed", e);
  }
}

function detectInputType(value: string): 'ean' | 'code' {
  return value.replace(/\D/g, '').length >= 8 ? 'ean' : 'code';
}

const defectOptions = [
  { value: 'embalagem_danificada', label: 'Embalagem Danificada', discount: 20 },
  { value: 'marcas_de_uso', label: 'Marcas de Uso', discount: 30 },
  { value: 'pelucia_suja', label: 'Pelúcia Suja', discount: 40 },
  { value: 'peca_faltando', label: 'Peça Faltando', discount: 50 },
  { value: 'outro', label: 'Outro (descrever)', discount: null },
];

export function PosterForm({ data, setData, posterType, onLookupStatusChange, onImportBatch, sessionProducts, onAutoAdd }: PosterFormProps) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [showScanner, setShowScanner] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<{ key: string; description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceForOverridden, setPriceForOverridden] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [regStatus, setRegStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      // iPad Pro (M1/M2) se comporta como Macintosh mas tem touch
      const isIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
      return isMobileUA || isIPad;
    };
    setIsMobileDevice(checkMobile());
  }, []);

  const [showWarning, setShowWarning] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualDescription, setManualDescription] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [manualEan, setManualEan] = useState('');
  const [manualReference, setManualReference] = useState('');
  const [manualSupplier, setManualSupplier] = useState('');

  const priceFrom = useCurrencyInput(data.priceFrom);
  const maxForCents = priceFrom.cents > 0 ? priceFrom.cents : undefined;
  const priceFor  = useCurrencyInput(data.priceFor, maxForCents);

  useEffect(() => {
    setData(prev => ({ ...prev, priceFor: priceFor.display }));
  }, [priceFor.display, setData]);

  useEffect(() => {
    setData(prev => ({ ...prev, priceFrom: priceFrom.display }));
  }, [priceFrom.display, setData]);
  
  // Automatização inteligente do parcelamento
  useEffect(() => {
    if (posterType === 'reliquias') {
      setData(prev => ({ ...prev, paymentOption: 'normal' }));
    } else if (posterType === 'etiqueta-oficial') {
      if (priceFor.cents > 5999) {
        setData(prev => ({ ...prev, paymentOption: 'installment' }));
      } else {
        setData(prev => ({ ...prev, paymentOption: 'normal' }));
      }
    }
  }, [setData, posterType, priceFor.cents]);




  // Validação para habilitar o botão "Adicionar ao Lote" no modo manual
  useEffect(() => {
    if (isManualMode) {
      const hasDescription = manualDescription.trim().length >= 2;
      const hasCodeOrEan = manualCode.trim().length >= 3 || manualEan.trim().length >= 3;
      const isValid = hasDescription && hasCodeOrEan;
      
      onLookupStatusChange?.(isValid);
      
      if (isValid) {
        setData(prev => ({
          ...prev,
          description: manualDescription.trim().toUpperCase(),
          code: manualCode.trim(),
          ean: manualEan.trim(),
          reference: manualReference.trim(),
          supplier: manualSupplier.trim().toUpperCase(),
        }));
      }
    }
  }, [isManualMode, manualDescription, manualCode, manualEan, manualReference, manualSupplier, onLookupStatusChange, setData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((prefix: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (prefix.length < 2) {
      setSuggestions([]); return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/produto/suggest?prefix=${encodeURIComponent(prefix)}`);
        const list = await res.json() as { key: string; description: string }[];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch { /* silencioso */ }
    }, 200);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchValue(v);
    setLookupStatus('idle');
    setIsManualMode(false);
    setShowWarning(false);
    fetchSuggestions(v);
  };

  const handleLookup = useCallback(async (q = searchValue): Promise<PosterData | null> => {
    const query = q.trim();
    if (query.length < 3) return null;
    setShowSuggestions(false);
    setSuggestions([]);
    const inputType = detectInputType(query);
    setLookupStatus('loading');
    onLookupStatusChange?.(false);

    let foundData: PosterData | null = null;

    // 1. Prioridade: Buscar nos dados temporários da sessão
    if (sessionProducts && sessionProducts[query]) {
      const produto = sessionProducts[query];
      setData(prev => {
        const hasPriceFrom = !!produto.priceFrom && produto.priceFrom !== '0,00';
        let payOption = prev.paymentOption;
        if (posterType === 'etiqueta-oficial') {
          const cents = displayToCents(produto.priceFor ?? '');
          if (cents > 5999) payOption = 'installment';
          else payOption = 'normal';
        }

        foundData = {
          ...prev,
          description: produto.description,
          reference:   produto.reference,
          code:  inputType === 'code' ? query : (produto.code ?? ''),
          ean:   inputType === 'ean'  ? query : (produto.ean  ?? ''),
          supplier: produto.supplier ?? '',
          priceFrom: produto.priceFrom ?? '',
          priceFor:  produto.priceFor  ?? '',
          posterSubType: hasPriceFrom ? 'offer' : (produto.priceFor ? 'normal' : prev.posterSubType),
          paymentOption: payOption,
        };
        return foundData;
      });
      if (produto.priceFrom) priceFrom.setValue(produto.priceFrom);
      if (produto.priceFor) priceFor.setValue(produto.priceFor);
      
      setLookupStatus('found');
      onLookupStatusChange?.(true);
      return foundData;
    }

    // 2. Fallback: Buscar no Banco de Dados via API
    try {
      const res = await fetch(`/api/produto?q=${encodeURIComponent(query)}`);
      if (!res.ok) { 
        setLookupStatus('notfound'); 
        setShowWarning(true);
        onLookupStatusChange?.(false); 
        return null; 
      }

      const produto = await res.json() as {
        description: string; reference: string; ean?: string; code?: string; supplier?: string;
        priceFrom?: string; priceFor?: string;
      };

      setData(prev => {
        const hasPriceFrom = !!produto.priceFrom && produto.priceFrom !== '0,00';
        let payOption = prev.paymentOption;
        if (posterType === 'etiqueta-oficial') {
          const cents = displayToCents(produto.priceFor ?? '');
          if (cents > 5999) payOption = 'installment';
          else payOption = 'normal';
        }

        foundData = {
          ...prev,
          description: produto.description,
          reference:   produto.reference,
          code:  inputType === 'code' ? query : (produto.code ?? ''),
          ean:   inputType === 'ean'  ? query : (produto.ean  ?? ''),
          supplier: produto.supplier ?? '',
          priceFrom: produto.priceFrom ?? '',
          priceFor:  produto.priceFor  ?? '',
          posterSubType: hasPriceFrom ? 'offer' : (produto.priceFor ? 'normal' : prev.posterSubType),
          paymentOption: payOption,
        };
        return foundData;
      });

      if (produto.priceFrom) priceFrom.setValue(produto.priceFrom);
      if (produto.priceFor) priceFor.setValue(produto.priceFor);

      setLookupStatus('found');
      onLookupStatusChange?.(true);
      return foundData;
    } catch {
      setLookupStatus('notfound');
      onLookupStatusChange?.(false);
      return null;
    }
  }, [searchValue, setData, onLookupStatusChange, sessionProducts, posterType, priceFrom, priceFor]);

  const handleScan = useCallback(async (code: string) => {
    if (code.length >= 10) {
      setManualEan(code);
      setManualCode('');
    } else {
      setManualCode(code);
      setManualEan('');
    }
    // Para bipar em lote, não fechamos o scanner
    setSearchValue(code);
    
    const foundData = await handleLookup(code);
    if (foundData) {
      playBeep('success');
      if (onAutoAdd) {
        onAutoAdd(foundData);
      }
    } else {
      playBeep('error');
      setShowScanner(false);
    }
  }, [handleLookup, onAutoAdd]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLookup(); }
    if (e.key === 'Escape') { setShowSuggestions(false); }
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      wrapperRef.current?.querySelector<HTMLButtonElement>('[data-suggestion]')?.focus();
    }
  };

  const handleSuggestionSelect = (key: string) => {
    setSearchValue(key);
    setSuggestions([]);
    setShowSuggestions(false);
    handleLookup(key);
  };

  const handleDismissWarning = () => {
    setShowWarning(false);
    setIsManualMode(true);
    const query = searchValue.trim();
    if (detectInputType(query) === 'code') setManualCode(query);
    else setManualEan(query);
  };

  const statusIcon = {
    idle:     <Search className="h-4 w-4 text-muted-foreground" />,
    loading:  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    found:    <CheckCircle2 className="h-4 w-4 text-green-500" />,
    notfound: <XCircle className="h-4 w-4 text-destructive" />,
  }[lookupStatus];

  const isOfferType = data.posterSubType === 'offer';

  const isEnabled = lookupStatus === 'found' || isManualMode;

  return (
    <div className="space-y-4">
      {/* SEÇÃO 1: BUSCA E DADOS DO PRODUTO */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="space-y-1" ref={wrapperRef}>
          <div className="flex flex-col gap-2 mb-3">
            <Label htmlFor="search-code" className="font-bold text-gray-900 uppercase tracking-tight text-sm">
              1. Encontrar Produto
            </Label>
            <div className="flex items-center gap-2">
              {isMobileDevice && (
                <button
                  onClick={(e) => { e.preventDefault(); setShowScanner(true); }}
                  className="h-10 flex-1 px-4 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  SCANNER
                </button>
              )}
              {onImportBatch && (
                <div className="flex-1 relative group">
                  <style>{`
                    @keyframes pulse-soft {
                      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
                      50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
                    }
                    .btn-animate-pulse {
                      animation: pulse-soft 2s infinite;
                    }
                  `}</style>
                  <button 
                    onClick={(e) => { e.preventDefault(); onImportBatch(); }}
                    className="w-full h-10 px-4 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 btn-animate-pulse group-hover:scale-[1.02] group-hover:shadow-md"
                  >
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    AUTOMATIZAR
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="relative">
            <Input
              id="search-code"
              value={searchValue}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Digite o código SAP ou EAN..."
              className={cn(
                'h-14 text-lg font-bold transition-all duration-300 border-2',
                lookupStatus === 'found' && 'border-green-500 bg-green-50/20 shadow-[0_0_0_1px_rgba(34,197,94,0.1)]',
                lookupStatus === 'notfound' && 'border-red-300 bg-red-50/20',
                lookupStatus === 'idle' && 'focus:border-primary shadow-sm'
              )}
              autoComplete="off"
              disabled={isManualMode}
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              {!isManualMode && statusIcon}
              {isManualMode && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
            </span>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {suggestions.map((s, i) => (
                  <button
                    key={s.key}
                    data-suggestion
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 flex flex-col"
                    onMouseDown={() => handleSuggestionSelect(s.key)}
                  >
                    <span className="font-bold text-gray-900">{s.key}</span>
                    <span className="text-xs text-gray-500 uppercase truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {showWarning && (
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Info className="h-5 w-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-amber-900 uppercase text-xs tracking-tight">Produto não encontrado</h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Este código não está na nossa base de dados. Você precisará digitar as informações manualmente. 
                  <span className="font-bold underline"> Preencha com atenção</span> para evitar erros e prejuízos no PDV.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissWarning}
              className="w-full bg-amber-900 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-amber-800 shadow-sm"
            >
              Li e entendi
            </button>
          </div>
        )}

        {isManualMode ? (
          <div className="p-5 rounded-xl border bg-blue-50/30 border-blue-100/50 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-2">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Preenchimento Manual</span>
              <button 
                onClick={() => { setIsManualMode(false); setLookupStatus('idle'); setSearchValue(''); onLookupStatusChange?.(false); }}
                className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1 bg-blue-100/50 rounded"
              >
                Voltar para Busca
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                   Descrição Completa <span className="text-red-500 font-black">*</span>
                </Label>
                <Input
                  value={manualDescription}
                  onChange={e => setManualDescription(e.target.value.toUpperCase())}
                  placeholder="EX: BONECA BARBIE SEREIA MATTEL"
                  className="h-12 font-bold uppercase border-blue-200 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Cód. SAP</Label>
                <Input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="h-12 font-mono font-bold border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">EAN</Label>
                <Input
                  value={manualEan}
                  onChange={e => setManualEan(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000000000000"
                  className="h-12 font-mono font-bold border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Referência</Label>
                <Input
                  value={manualReference}
                  onChange={e => setManualReference(e.target.value.toUpperCase())}
                  placeholder="Opcional"
                  className="h-12 border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fornecedor</Label>
                <Input
                  value={manualSupplier}
                  onChange={e => setManualSupplier(e.target.value.toUpperCase())}
                  placeholder="Opcional"
                  className="h-12 uppercase border-blue-200"
                />
              </div>
            </div>

            
            <p className="text-[9px] text-blue-400 font-medium italic text-right">
              * Campos obrigatórios preenchidos liberam o botão "Adicionar ao Lote"
            </p>
          </div>
        ) : lookupStatus === 'found' ? (
          <div className="bg-green-50/50 border border-green-100 p-4 rounded-lg flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-green-700 uppercase tracking-tighter mb-1">Produto Selecionado</p>
              <h3 className="font-bold text-gray-900 truncate uppercase leading-none mb-1 text-sm">{data.description}</h3>
              <p className="text-[10px] text-green-600 font-mono">SAP: {data.code || '-'} | EAN: {data.ean || '-'}</p>
            </div>
            <button 
              onClick={() => { 
                setIsManualMode(true); 
                setManualDescription(data.description); 
                setManualCode(data.code || ''); 
                setManualEan(data.ean || ''); 
                setManualSupplier(data.supplier || ''); 
                setManualReference(data.reference || ''); 
              }}
              className="ml-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-md transition-colors"
              title="Editar Manualmente"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* SEÇÃO 2: PREÇOS E AJUSTES */}
      <fieldset 
        className={cn("space-y-4", !isEnabled && "opacity-40 pointer-events-none")}
        disabled={!isEnabled}
      >
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-5">
           <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
             <Label className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                2. Preços e Formato
             </Label>
             <div className="flex flex-wrap gap-3">
               {posterType !== 'reliquias' && (
                 <div className="flex bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                   <button
                     onClick={() => setData(prev => ({ ...prev, posterSubType: 'normal' }))}
                     className={cn(
                       "px-4 py-2 text-[10px] font-black rounded-lg transition-all",
                       data.posterSubType === 'normal' ? "bg-white text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                     )}
                   >
                     PREÇO NORMAL
                   </button>
                   <button
                     onClick={() => setData(prev => ({ ...prev, posterSubType: 'offer' }))}
                     className={cn(
                       "px-4 py-2 text-[10px] font-black rounded-lg transition-all",
                       data.posterSubType === 'offer' ? "bg-white text-orange-600 shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                     )}
                   >
                     OFERTA
                   </button>
                 </div>
               )}
               {posterType !== 'reliquias' && (
                 <div className="flex bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                   <button
                     onClick={() => setData(prev => ({ ...prev, paymentOption: 'normal' }))}
                     className={cn(
                       "px-4 py-2 text-[10px] font-black rounded-lg transition-all",
                       data.paymentOption === 'normal' ? "bg-white text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                     )}
                   >
                     À VISTA
                   </button>
                   <button
                     onClick={() => setData(prev => ({ ...prev, paymentOption: 'installment' }))}
                     className={cn(
                       "px-4 py-2 text-[10px] font-black rounded-lg transition-all",
                       data.paymentOption === 'installment' ? "bg-white text-blue-600 shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                     )}
                   >
                     PARCELADO
                   </button>
                 </div>
               )}
             </div>

           </div>

           <div className="grid grid-cols-2 gap-4">

              {(isOfferType) && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">Preço Anterior (DE)</Label>
                  <Input
                    value={priceFrom.display}
                    onKeyDown={priceFrom.handleKeyDown}
                    onChange={priceFrom.handleChange}
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    className="h-12 font-mono text-lg bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className={cn("space-y-1", !(isOfferType) && "col-span-2")}>
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Preço Novo (POR)</Label>
                <Input
                  value={priceFor.display}
                  onKeyDown={e => { priceFor.handleKeyDown(e); }}
                  onChange={priceFor.handleChange}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  className="h-12 font-mono text-xl font-black bg-blue-50/10 border-blue-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
           </div>


        </div>
      </fieldset>


      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
}
