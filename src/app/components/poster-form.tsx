'use client';

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Kbd } from '@/components/ui/kbd';
import type { PosterData, PosterType, PosterSettings } from '@/app/lib/types';
import { calculateInstallments } from '@/app/lib/poster-utils';
import { isOfferOnlyFormat } from '@/app/lib/poster-formats';

import { cn, isTouchDevice } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Search, RotateCcw, Info, Camera, Sparkles, ScanBarcode } from 'lucide-react';
import { BarcodeScanner, type ScanStatus } from './barcode-scanner';

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
    // No Desktop, mantemos o comportamento de apagar último dígito.
    // Se o valor inteiro estiver selecionado (ex: após auto-focus), Backspace zera o campo.
    if (e.key === 'Backspace') {
      e.preventDefault();
      const el = e.currentTarget;
      const allSelected = el.value.length > 0 && el.selectionStart === 0 && el.selectionEnd === el.value.length;
      setCents(prev => (allSelected ? 0 : Math.floor(prev / 10)));
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

/** Origem de uma adição automática ao lote */
export type AutoAddSource = 'camera' | 'wedge';

/** API imperativa usada pela página para orquestrar o foco */
export type PosterFormHandle = {
  /** Foca (e seleciona) o campo de busca */
  focusSearch: () => boolean;
  /** Foca o POR se houver produto carregado; senão, a busca */
  focusPrimary: () => void;
};

type PosterFormProps = {
  data: PosterData;
  setData: Dispatch<SetStateAction<PosterData>>;
  posterType: PosterType;
  settings: PosterSettings;

  onLookupStatusChange?: (found: boolean) => void;
  onImportBatch?: () => void;
  sessionProducts?: Record<string, any>;
  /** Retorna true se o item foi de fato adicionado ao lote */
  onAutoAdd?: (data: PosterData, source: AutoAddSource) => boolean;
  /** Disparado com Enter no campo POR (equivale a "Adicionar ao Lote") */
  onSubmit?: () => void;
  /** Leitor USB: adiciona direto ao lote quando o produto já tem preço */
  continuousScan?: boolean;
  onContinuousScanChange?: (value: boolean) => void;
  /** Foca a busca ao montar (ignorado em dispositivos touch) */
  autoFocus?: boolean;
};

/* Leitores de código de barras USB (HID) "digitam" muito mais rápido que um humano. */
const WEDGE_MIN_CHARS = 4;
const WEDGE_MAX_AVG_INTERVAL_MS = 35;

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

/** Foca e seleciona o conteúdo do campo. Respeita fieldsets desabilitados. */
function focusAndSelect(el: HTMLInputElement | null): boolean {
  if (!el || el.matches(':disabled')) return false;
  el.focus();
  el.select();
  return document.activeElement === el;
}

type ProductPayload = {
  description: string; reference: string; ean?: string; code?: string; supplier?: string;
  priceFrom?: string; priceFor?: string;
};

export const PosterForm = forwardRef<PosterFormHandle, PosterFormProps>(function PosterForm(
  {
    data, setData, posterType, settings, onLookupStatusChange, onImportBatch, sessionProducts,
    onAutoAdd, onSubmit, continuousScan = false, onContinuousScanChange, autoFocus = false,
  },
  ref
) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [showScanner, setShowScanner] = useState(false);
  const [sessionScanCount, setSessionScanCount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<{ key: string; description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [pendingFocus, setPendingFocus] = useState<'from' | 'for' | null>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const priceFromRef = useRef<HTMLInputElement>(null);
  const priceForRef = useRef<HTMLInputElement>(null);
  const manualDescRef = useRef<HTMLInputElement>(null);
  const keyTimesRef = useRef<number[]>([]);

  const [scanStatus, setScanStatus] = useState<ScanStatus>(null);
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

  const isOfferType = data.posterSubType === 'offer';
  const isEnabled = lookupStatus === 'found' || isManualMode;

  useEffect(() => {
    setData(prev => ({ ...prev, priceFor: priceFor.display }));
  }, [priceFor.display, setData]);

  useEffect(() => {
    setData(prev => ({ ...prev, priceFrom: priceFrom.display }));
  }, [priceFrom.display, setData]);
  
  // Força o tipo 'oferta' para modelos que não possuem 'preço normal'
  useEffect(() => {
    if (isOfferOnlyFormat(posterType)) {
      setData(prev => ({ ...prev, posterSubType: 'offer' }));
    }
  }, [posterType, setData]);
  
  // Automatização inteligente do parcelamento
  useEffect(() => {
    if (posterType === 'reliquias' || posterType === 'reliquias-a6') {
      setData(prev => ({ ...prev, paymentOption: 'normal' }));
    } else if (['etiqueta-oficial', 'aereo', 'totem'].includes(posterType)) {
      const price = priceFor.cents / 100;
      const { maxInstallments } = calculateInstallments(price, settings);
      if (maxInstallments > 1 && price > 59.99) {
        setData(prev => ({ ...prev, paymentOption: 'installment' }));
      } else {
        setData(prev => ({ ...prev, paymentOption: 'normal' }));
      }
    }
  }, [setData, posterType, priceFor.cents, settings]);

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

  /* ───────────── Gerenciamento de foco ───────────── */

  // Auto-focus na busca ao montar (o formulário é remontado após cada adição ao lote)
  useEffect(() => {
    if (autoFocus && !isTouchDevice()) searchInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Após encontrar o produto, leva o foco ao campo de preço adequado
  useEffect(() => {
    if (!pendingFocus || !isEnabled) return;
    const target = pendingFocus === 'from' && priceFromRef.current ? priceFromRef.current : priceForRef.current;
    focusAndSelect(target);
    setPendingFocus(null);
  }, [pendingFocus, isEnabled, isOfferType]);

  // Ao entrar no modo manual, foca a descrição
  useEffect(() => {
    if (isManualMode) manualDescRef.current?.focus();
  }, [isManualMode]);

  useImperativeHandle(ref, () => ({
    focusSearch: () => focusAndSelect(searchInputRef.current),
    focusPrimary: () => {
      if (isEnabled && focusAndSelect(priceForRef.current)) return;
      focusAndSelect(searchInputRef.current);
    },
  }), [isEnabled]);

  /** Enter avança para o próximo campo navegável ([data-nav]) do formulário */
  const focusNextField = (current: HTMLInputElement) => {
    const fields = Array.from(rootRef.current?.querySelectorAll<HTMLInputElement>('input[data-nav]') ?? [])
      .filter(el => !el.matches(':disabled'));
    const next = fields[fields.indexOf(current) + 1];
    if (next) focusAndSelect(next);
  };

  const handleEnterNext = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      focusNextField(e.currentTarget);
    }
  };

  /* ───────────── Busca ───────────── */

  const fetchSuggestions = useCallback((prefix: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (prefix.length < 2) {
      setSuggestions([]); setActiveSuggestion(-1); return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/produto/suggest?prefix=${encodeURIComponent(prefix)}`);
        const list = await res.json() as { key: string; description: string }[];
        setSuggestions(list);
        setActiveSuggestion(-1);
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
    // Cancela sugestões pendentes para não reabrir o dropdown depois da busca
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setShowSuggestions(false);
    setSuggestions([]);
    setActiveSuggestion(-1);
    const inputType = detectInputType(query);
    setLookupStatus('loading');
    onLookupStatusChange?.(false);

    const buildFoundData = (produto: ProductPayload): PosterData => {
      const hasPriceFrom = !!produto.priceFrom && produto.priceFrom !== '0,00';
      let payOption = data.paymentOption;
      if (posterType === 'etiqueta-oficial') {
        const cents = displayToCents(produto.priceFor ?? '');
        const { maxInstallments } = calculateInstallments(cents / 100, settings);
        if (maxInstallments > 1 && (cents / 100) > 59.99) payOption = 'installment';
        else payOption = 'normal';
      }

      return {
        ...data,
        description: produto.description,
        reference:   produto.reference,
        code:  inputType === 'code' ? query : (produto.code ?? ''),
        ean:   inputType === 'ean'  ? query : (produto.ean  ?? ''),
        supplier: produto.supplier ?? '',
        priceFrom: produto.priceFrom ?? '',
        priceFor:  produto.priceFor  ?? '',
        // Formatos só-oferta (Relíquias/Totem) nunca podem virar "normal",
        // senão o campo DE some e não há como digitá-lo.
        posterSubType: isOfferOnlyFormat(posterType)
          ? 'offer'
          : hasPriceFrom ? 'offer' : (produto.priceFor ? 'normal' : data.posterSubType),
        paymentOption: payOption,
      };
    };

    const applyFound = (produto: ProductPayload): PosterData => {
      const foundData = buildFoundData(produto);
      setData(foundData);
      if (produto.priceFrom) priceFrom.setValue(produto.priceFrom);
      if (produto.priceFor) priceFor.setValue(produto.priceFor);
      setLookupStatus('found');
      onLookupStatusChange?.(true);
      return foundData;
    };

    // 1. Prioridade: Buscar nos dados temporários da sessão
    if (sessionProducts && sessionProducts[query]) {
      return applyFound(sessionProducts[query]);
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

      const produto = await res.json() as ProductPayload;
      return applyFound(produto);
    } catch {
      setLookupStatus('notfound');
      onLookupStatusChange?.(false);
      return null;
    }
  }, [searchValue, setData, onLookupStatusChange, sessionProducts, posterType, priceFrom, priceFor, data, settings]);

  /** Busca + avança o foco (ou adiciona direto ao lote em bipagem contínua) */
  const runLookup = useCallback(async (q: string, fromScanner = false) => {
    const found = await handleLookup(q);
    if (!found) {
      if (fromScanner) playBeep('error');
      return;
    }
    const hasPrice = displayToCents(found.priceFor || '') > 0;

    if (fromScanner) {
      if (continuousScan && hasPrice && onAutoAdd?.(found, 'wedge')) {
        playBeep('success');
        return; // o formulário é remontado e o foco volta para a busca
      }
      playBeep(hasPrice ? 'success' : 'error');
    }

    const needsPriceFrom = found.posterSubType === 'offer' && displayToCents(found.priceFrom || '') === 0;
    setPendingFocus(needsPriceFrom ? 'from' : 'for');
  }, [handleLookup, continuousScan, onAutoAdd]);

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
    const hasPrice = foundData && displayToCents(foundData.priceFor || '') > 0;

    if (foundData && hasPrice) {
      playBeep('success');
      setSessionScanCount(prev => prev + 1);
      setScanStatus({
        type: 'success',
        message: foundData.description,
        timestamp: Date.now()
      });
      if (onAutoAdd) {
        onAutoAdd(foundData, 'camera');
      }
    } else {
      playBeep('error');
      setScanStatus({
        type: 'error',
        message: !foundData ? 'Produto não encontrado' : 'Produto sem preço cadastrado',
        timestamp: Date.now()
      });
    }
  }, [handleLookup, onAutoAdd]);

  /** True se a última sequência digitada veio de um leitor de código de barras */
  const consumeWedgeDetection = () => {
    const t = keyTimesRef.current;
    keyTimesRef.current = [];
    if (t.length < WEDGE_MIN_CHARS) return false;
    return (t[t.length - 1] - t[0]) / (t.length - 1) <= WEDGE_MAX_AVG_INTERVAL_MS;
  };

  const handleSuggestionSelect = (key: string) => {
    setSearchValue(key);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    void runLookup(key);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Registra o ritmo de digitação para detectar leitor USB
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const el = e.currentTarget;
      if (el.selectionStart === 0 && el.selectionEnd === el.value.length) keyTimesRef.current = [];
      keyTimesRef.current.push(performance.now());
      return;
    }

    const hasSuggestions = showSuggestions && suggestions.length > 0;

    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
      setActiveSuggestion(i => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === 'ArrowUp' && hasSuggestions) {
      e.preventDefault();
      setActiveSuggestion(i => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (e.key === 'Escape' && hasSuggestions) {
      // Fecha só o dropdown; sem sugestões, o Esc sobe para o atalho global (limpar)
      e.preventDefault();
      e.stopPropagation();
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) return; // Ctrl+Enter é tratado pelo atalho global
      const fromScanner = consumeWedgeDetection();
      if (!fromScanner && hasSuggestions && activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        handleSuggestionSelect(suggestions[activeSuggestion].key);
        return;
      }
      void runLookup(searchValue, fromScanner);
    }
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

  const suggestionsOpen = showSuggestions && suggestions.length > 0;

  return (
    <div ref={rootRef} className="space-y-3">
      {/* SEÇÃO 1: BUSCA E DADOS DO PRODUTO */}
      <section className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
        <div className="space-y-2" ref={wrapperRef}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label htmlFor="search-code" className="font-bold text-gray-900 uppercase tracking-tight text-sm flex items-center gap-2">
              1. Produto <Kbd>F2</Kbd>
            </Label>
            <div className="flex items-center gap-1.5">
              {isMobileDevice && (
                <button
                  id="open-camera-scanner"
                  type="button"
                  onClick={(e) => { e.preventDefault(); setSessionScanCount(0); setShowScanner(true); }}
                  className="h-9 px-3 text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  SCANNER
                </button>
              )}
              {onImportBatch && (
                <button
                  id="open-automation"
                  type="button"
                  onClick={(e) => { e.preventDefault(); onImportBatch(); }}
                  className="h-9 px-3 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95 rd-pulse-soft hover:scale-[1.02] hover:shadow-md"
                >
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  AUTOMATIZAR
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <Input
              ref={searchInputRef}
              id="search-code"
              value={searchValue}
              onChange={handleSearchChange}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Bipe ou digite o código SAP / EAN"
              inputMode="numeric"
              role="combobox"
              aria-expanded={suggestionsOpen}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={suggestionsOpen && activeSuggestion >= 0 ? `suggestion-${activeSuggestion}` : undefined}
              className={cn(
                'h-12 text-lg font-bold transition-all duration-300 border-2 pr-10',
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
            {suggestionsOpen && (
              <div
                id="search-suggestions"
                role="listbox"
                className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.key}
                    id={`suggestion-${i}`}
                    type="button"
                    role="option"
                    aria-selected={i === activeSuggestion}
                    tabIndex={-1}
                    className={cn(
                      'w-full text-left px-4 py-2.5 border-b last:border-0 flex flex-col',
                      i === activeSuggestion ? 'bg-primary/5' : 'hover:bg-gray-50'
                    )}
                    onMouseEnter={() => setActiveSuggestion(i)}
                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionSelect(s.key); }}
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
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
              id="dismiss-notfound-warning"
              type="button"
              autoFocus={!isTouchDevice()}
              onClick={handleDismissWarning}
              className="w-full bg-amber-900 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-amber-800 shadow-sm focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 outline-none"
            >
              Li e entendi <span className="hidden lg:inline opacity-60 font-mono normal-case">(Enter)</span>
            </button>
          </div>
        )}

        {isManualMode ? (
          <div className="p-4 rounded-xl border bg-blue-50/30 border-blue-100/50 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Preenchimento Manual</span>
              <button 
                type="button"
                onClick={() => { setIsManualMode(false); setLookupStatus('idle'); setSearchValue(''); onLookupStatusChange?.(false); requestAnimationFrame(() => searchInputRef.current?.focus()); }}
                className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1 bg-blue-100/50 rounded"
              >
                Voltar para Busca
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="manual-description" className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                   Descrição Completa <span className="text-red-500 font-black">*</span>
                </Label>
                <Input
                  ref={manualDescRef}
                  id="manual-description"
                  data-nav
                  value={manualDescription}
                  onChange={e => setManualDescription(e.target.value.toUpperCase())}
                  onKeyDown={handleEnterNext}
                  placeholder="EX: BONECA BARBIE SEREIA MATTEL"
                  className="h-10 font-bold uppercase border-blue-200 focus:ring-blue-500 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="manual-code" className="text-[10px] font-bold text-gray-500 uppercase">Cód. SAP</Label>
                <Input
                  id="manual-code"
                  data-nav
                  inputMode="numeric"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handleEnterNext}
                  placeholder="000000"
                  className="h-10 font-mono font-bold border-blue-200"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="manual-ean" className="text-[10px] font-bold text-gray-500 uppercase">EAN</Label>
                <Input
                  id="manual-ean"
                  data-nav
                  inputMode="numeric"
                  value={manualEan}
                  onChange={e => setManualEan(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={handleEnterNext}
                  placeholder="0000000000000"
                  className="h-10 font-mono font-bold border-blue-200"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="manual-reference" className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Referência</Label>
                <Input
                  id="manual-reference"
                  data-nav
                  value={manualReference}
                  onChange={e => setManualReference(e.target.value.toUpperCase())}
                  onKeyDown={handleEnterNext}
                  placeholder="Opcional"
                  className="h-10 border-blue-200"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="manual-supplier" className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Fornecedor</Label>
                <Input
                  id="manual-supplier"
                  data-nav
                  value={manualSupplier}
                  onChange={e => setManualSupplier(e.target.value.toUpperCase())}
                  onKeyDown={handleEnterNext}
                  placeholder="Opcional"
                  className="h-10 uppercase border-blue-200"
                />
              </div>
            </div>

            
            <p className="text-[9px] text-blue-400 font-medium italic text-right">
              * Campos obrigatórios preenchidos liberam o botão "Adicionar ao Lote"
            </p>
          </div>
        ) : lookupStatus === 'found' ? (
          <div className="bg-green-50/50 border border-green-100 px-3 py-2.5 rounded-lg flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-green-700 uppercase tracking-tighter mb-1">Produto Selecionado</p>
              <h3 className="font-bold text-gray-900 truncate uppercase leading-none mb-1 text-sm">{data.description}</h3>
              <p className="text-[10px] text-green-600 font-mono">SAP: {data.code || '-'} | EAN: {data.ean || '-'}</p>
            </div>
            <button 
              type="button"
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

        {/* Bipagem contínua — só faz sentido com leitor USB (desktop) */}
        {onContinuousScanChange && !isMobileDevice && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2">
            <Label htmlFor="continuous-scan" className="flex items-center gap-2 cursor-pointer min-w-0">
              <ScanBarcode className={cn('h-4 w-4 shrink-0', continuousScan ? 'text-emerald-600' : 'text-muted-foreground')} />
              <span className="min-w-0">
                <span className="block text-[11px] font-black uppercase tracking-tight">Bipagem contínua</span>
                <span className="block text-[10px] font-medium text-muted-foreground leading-tight">
                  Leitor USB adiciona direto ao lote quando o produto já tem preço
                </span>
              </span>
            </Label>
            <Switch id="continuous-scan" checked={continuousScan} onCheckedChange={onContinuousScanChange} />
          </div>
        )}
      </section>

      {/* SEÇÃO 2: PREÇOS E AJUSTES */}
      <fieldset 
        className={cn("transition-opacity", !isEnabled && "opacity-40 pointer-events-none")}
        disabled={!isEnabled}
      >
        <section className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
           <div className="flex items-center justify-between flex-wrap gap-2">
             <Label className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                2. Preços
             </Label>
             {!isOfferOnlyFormat(posterType) && (
               <div className="flex bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                 <button
                   type="button"
                   id="subtype-normal"
                   onClick={() => setData(prev => ({ ...prev, posterSubType: 'normal' }))}
                   className={cn(
                     "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                     data.posterSubType === 'normal' ? "bg-white text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                   )}
                 >
                   PREÇO NORMAL
                 </button>
                 <button
                   type="button"
                   id="subtype-offer"
                   onClick={() => setData(prev => ({ ...prev, posterSubType: 'offer' }))}
                   className={cn(
                     "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                     data.posterSubType === 'offer' ? "bg-white text-orange-600 shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                   )}
                 >
                   OFERTA
                 </button>
               </div>
             )}
             {/* Opção de pagamento removida - agora é automática */}
           </div>

           <div className="grid grid-cols-2 gap-3">
              {(isOfferType) && (
                <div className="space-y-1">
                  <Label htmlFor="price-from" className="text-[10px] font-bold text-gray-500 uppercase">Preço Anterior (DE)</Label>
                  <Input
                    ref={priceFromRef}
                    id="price-from"
                    data-nav
                    value={priceFrom.display}
                    onKeyDown={e => { priceFrom.handleKeyDown(e); handleEnterNext(e); }}
                    onChange={priceFrom.handleChange}
                    onFocus={e => { const el = e.currentTarget; requestAnimationFrame(() => el.select()); }}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="R$ 0,00"
                    className="h-12 font-mono text-lg bg-gray-50/50 border-gray-200 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className={cn("space-y-1", !(isOfferType) && "col-span-2")}>
                <Label htmlFor="price-for" className="text-[10px] font-bold text-gray-500 uppercase">Preço Novo (POR)</Label>
                <Input
                  ref={priceForRef}
                  id="price-for"
                  data-nav
                  value={priceFor.display}
                  onKeyDown={e => {
                    priceFor.handleKeyDown(e);
                    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      onSubmit?.();
                    }
                  }}
                  onChange={priceFor.handleChange}
                  onFocus={e => { const el = e.currentTarget; requestAnimationFrame(() => el.select()); }}
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="done"
                  placeholder="R$ 0,00"
                  className="h-12 font-mono text-xl font-black bg-blue-50/10 border-blue-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
           </div>

           <p className="hidden lg:flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
             <Kbd>Enter</Kbd> avança {isOfferType ? 'DE → POR → ' : 'POR → '}adiciona ao lote
           </p>
        </section>
      </fieldset>


      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => { 
            setShowScanner(false); 
            setSessionScanCount(0); 
            setScanStatus(null);
            // Reseta todos os estados do formulário após fechar o scanner
            setSearchValue('');
            priceFrom.reset();
            priceFor.reset();
            setIsManualMode(false);
            setLookupStatus('idle');
            setShowWarning(false);
            setData({
              description: 'DESCRIÇÃO DO PRODUTO',
              priceFrom: '',
              priceFor: '',
              code: '',
              ean: '',
              reference: '',
              paymentOption: 'installment',
              posterSubType: 'offer',
              defectType: 'embalagem_danificada',
              customDefectReason: '',
              customDefectDiscount: 20,
              defectNote: '',
              supplier: '',
              quantity: 1,
            });
          }} 
          scanCount={sessionScanCount}
          scanStatus={scanStatus}
        />
      )}
    </div>
  );
});
