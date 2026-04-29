'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PosterData } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, XCircle, Search, RotateCcw, PlusCircle, Info, AlertTriangle } from 'lucide-react';
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
    if (e.key === 'Backspace') {
      e.preventDefault();
      setCents(prev => Math.floor(prev / 10));
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      setCents(prev => {
        const next = prev * 10 + parseInt(e.key, 10);
        const capped = maxCents !== undefined && next > maxCents ? maxCents : next;
        return capped > 999999 ? prev : capped;
      });
    }
  };

  const reset = useCallback(() => setCents(0), []);
  const setValue = useCallback((val: string) => setCents(displayToCents(val)), []);

  return { display, handleKeyDown, reset, setValue, cents };
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound';

type PosterFormProps = {
  data: PosterData;
  setData: Dispatch<SetStateAction<PosterData>>;
  posterType: 'reliquias' | 'ofertas-imperdiveis' | 'aereo' | 'avaria' | 'etiqueta-oficial' | 'totem';
  onLookupStatusChange?: (found: boolean) => void;
};

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

export function PosterForm({ data, setData, posterType, onLookupStatusChange }: PosterFormProps) {
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<{ key: string; description: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [priceForOverridden, setPriceForOverridden] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [regStatus, setRegStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
    const canInstall = priceFor.cents >= 6000;
    setData(prev => ({
      ...prev,
      paymentOption: canInstall ? 'installment' : 'normal'
    }));
  }, [priceFor.cents, setData]);

  useEffect(() => {
    if (posterType !== 'avaria') return;
    if (priceForOverridden) return;

    const fromCents = priceFrom.cents;
    if (fromCents === 0) {
      priceFor.setValue('');
      return;
    }

    const selectedDefect = defectOptions.find(opt => opt.value === data.defectType);
    let discount = 0;
    if (selectedDefect) {
      discount = selectedDefect.value === 'outro' ? (data.customDefectDiscount ?? 0) : (selectedDefect.discount ?? 0);
    }

    if (discount > 0) {
      const discountedCents = Math.round(fromCents * (1 - discount / 100));
      priceFor.setValue(centsToDisplay(discountedCents));
    } else {
      priceFor.setValue('');
    }
  }, [priceFrom.cents, data.defectType, data.customDefectDiscount, posterType, priceForOverridden, priceFor.setValue]);

  useEffect(() => {
    setPriceForOverridden(false);
  }, [priceFrom.cents, data.defectType, data.customDefectDiscount]);

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

  const handleLookup = useCallback(async (q = searchValue) => {
    const query = q.trim();
    if (query.length < 3) return;
    setShowSuggestions(false);
    setSuggestions([]);
    const inputType = detectInputType(query);
    setLookupStatus('loading');
    onLookupStatusChange?.(false);

    try {
      const res = await fetch(`/api/produto?q=${encodeURIComponent(query)}`);
      if (!res.ok) { 
        setLookupStatus('notfound'); 
        setShowWarning(true);
        onLookupStatusChange?.(false); 
        return; 
      }

      const produto = await res.json() as {
        description: string; reference: string; ean?: string; code?: string; supplier?: string;
      };

      setData(prev => ({
        ...prev,
        description: produto.description,
        reference:   produto.reference,
        code:  inputType === 'code' ? query : (produto.code ?? ''),
        ean:   inputType === 'ean'  ? query : (produto.ean  ?? ''),
        supplier: produto.supplier ?? '',
      }));
      setLookupStatus('found');
      onLookupStatusChange?.(true);
    } catch {
      setLookupStatus('notfound');
      onLookupStatusChange?.(false);
    }
  }, [searchValue, setData, onLookupStatusChange]);

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

  const handleSubTypeChange = (value: string) => {
    setData(prev => ({
      ...prev,
      posterSubType: value as 'offer' | 'normal',
      priceFrom: value === 'normal' ? '' : prev.priceFrom,
    }));
    if (value === 'normal') priceFrom.reset();
  };

  const handleDismissWarning = () => {
    setShowWarning(false);
    setIsManualMode(true);
    // Tenta preencher o SAP ou EAN conforme o que foi pesquisado
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

  const isOfferType = 
    posterType === 'reliquias' || 
    posterType === 'ofertas-imperdiveis' || 
    posterType === 'totem' || 
    ((posterType === 'aereo' || posterType === 'etiqueta-oficial') && data.posterSubType === 'offer');

  const isEnabled = lookupStatus === 'found' || isManualMode;

  return (
    <div className="space-y-4">
      {/* SEÇÃO 1: BUSCA E DADOS DO PRODUTO */}
      <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
        <div className="space-y-1" ref={wrapperRef}>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="search-code" className="font-bold text-gray-900 uppercase tracking-tight text-sm">
              1. Encontrar Produto
            </Label>
            {isManualMode && (
              <button 
                onClick={() => { setIsManualMode(false); setLookupStatus('idle'); setSearchValue(''); }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Remover Manual
              </button>
            )}
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
                'h-12 text-lg font-medium transition-all duration-200',
                lookupStatus === 'found' && 'border-green-500 bg-green-50/10',
                lookupStatus === 'notfound' && 'border-red-300 bg-red-50/10',
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                   Descrição Completa <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={manualDescription}
                  onChange={e => setManualDescription(e.target.value.toUpperCase())}
                  placeholder="EX: BONECA BARBIE SEREIA MATTEL"
                  className="h-11 font-bold uppercase border-blue-200 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  Cód. SAP <span className="text-muted-foreground font-normal">(ou EAN)</span>
                </Label>
                <Input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Código SAP"
                  className="h-10 font-mono border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  EAN <span className="text-muted-foreground font-normal">(ou SAP)</span>
                </Label>
                <Input
                  value={manualEan}
                  onChange={e => setManualEan(e.target.value.replace(/\D/g, ''))}
                  placeholder="Código de Barras"
                  className="h-10 font-mono border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Referência</Label>
                <Input
                  value={manualReference}
                  onChange={e => setManualReference(e.target.value.toUpperCase())}
                  placeholder="Opcional"
                  className="h-10 border-blue-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Fornecedor</Label>
                <Input
                  value={manualSupplier}
                  onChange={e => setManualSupplier(e.target.value.toUpperCase())}
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
           <Label className="font-bold text-gray-900 uppercase tracking-tight text-sm block border-b pb-2">
              2. Preços e Formato
           </Label>

           {(posterType === 'aereo' || posterType === 'etiqueta-oficial') && (
              <div className="inline-flex bg-gray-100 p-1 rounded-lg w-full">
                <button
                  type="button"
                  onClick={() => handleSubTypeChange('normal')}
                  className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all", data.posterSubType === 'normal' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                >
                  Preço Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleSubTypeChange('offer')}
                  className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all", data.posterSubType === 'offer' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                >
                  🔥 Oferta
                </button>
              </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              {(isOfferType || posterType === 'avaria') && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-gray-500 uppercase">Preço Anterior (DE)</Label>
                  <Input
                    value={priceFrom.display}
                    onKeyDown={priceFrom.handleKeyDown}
                    onChange={() => {}}
                    className="h-10 font-mono text-lg bg-gray-50/50"
                  />
                </div>
              )}
              <div className={cn("space-y-1", !(isOfferType || posterType === 'avaria') && "col-span-2")}>
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Preço Novo (POR)</Label>
                <Input
                  value={priceFor.display}
                  onKeyDown={e => { if(posterType==='avaria') setPriceForOverridden(true); priceFor.handleKeyDown(e); }}
                  onChange={() => {}}
                  className="h-10 font-mono text-xl font-black bg-blue-50/10 border-blue-200"
                />
              </div>
           </div>

           <div className="flex items-center gap-4 pt-2">
              <div className="flex-1 space-y-2">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Quantidade</Label>
                <div className="flex items-center h-10">
                  <button onClick={() => setData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))} className="w-10 h-full border rounded-l-lg bg-gray-50 active:bg-gray-200">-</button>
                  <Input 
                    value={data.quantity} 
                    onChange={e => setData(prev => ({ ...prev, quantity: parseInt(e.target.value.replace(/\D/g, '')) || 1 }))}
                    className="h-full text-center border-x-0 rounded-none font-bold min-w-0"
                  />
                  <button onClick={() => setData(prev => ({ ...prev, quantity: Math.min(99, (prev.quantity || 1) + 1) }))} className="w-10 h-full border rounded-r-lg bg-gray-50 active:bg-gray-200">+</button>
                </div>
              </div>

              <div className="flex-1 pt-6">
                <div className={cn(
                  "h-10 flex items-center justify-center rounded-lg border px-3 text-[10px] font-bold uppercase transition-all",
                  data.paymentOption === 'installment' ? "bg-gray-900 text-white border-gray-900 shadow-sm" : "bg-gray-50 text-gray-400 border-gray-100"
                )}>
                  {data.paymentOption === 'installment' ? 'Parcelamento Ativo' : 'Somente À Vista'}
                </div>
              </div>
           </div>
        </div>
      </fieldset>

      {/* SEÇÃO 3: DETALHES DA AVARIA (Específico para o tipo Avaria) */}
      {posterType === 'avaria' && (
        <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="flex items-center gap-2 border-b pb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <Label className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                3. Detalhes da Avaria
              </Label>
           </div>
           
           <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Motivo da Avaria</Label>
                <Select 
                  value={data.defectType} 
                  onValueChange={(v) => setData(prev => ({ ...prev, defectType: v }))}
                >
                  <SelectTrigger className="h-11 bg-gray-50/50">
                    <SelectValue placeholder="Selecione o motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {defectOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label} {opt.discount ? `(${opt.discount}% OFF)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {data.defectType === 'outro' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">Descrever Motivo</Label>
                    <Input 
                      value={data.customDefectReason || ''} 
                      onChange={e => setData(prev => ({ ...prev, customDefectReason: e.target.value.toUpperCase() }))}
                      placeholder="EX: VIDRO RACHADO"
                      className="h-10 font-bold uppercase border-amber-200 focus:ring-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-500 uppercase">% Desconto</Label>
                    <Input 
                      type="number"
                      value={data.customDefectDiscount || ''} 
                      onChange={e => setData(prev => ({ ...prev, customDefectDiscount: parseInt(e.target.value) || 0 }))}
                      placeholder="Ex: 15"
                      className="h-10 border-amber-200 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-500 uppercase">Observação Complementar</Label>
                <Input 
                  value={data.defectNote || ''} 
                  onChange={e => setData(prev => ({ ...prev, defectNote: e.target.value.toUpperCase() }))}
                  placeholder="EX: VENDIDO NO ESTADO / SEM TROCA"
                  className="h-10 font-medium uppercase border-gray-200"
                />
                <p className="text-[9px] text-muted-foreground italic leading-tight">
                  Aparecerá logo abaixo do motivo no cartaz. Use para informações cruciais sobre o estado do item.
                </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
