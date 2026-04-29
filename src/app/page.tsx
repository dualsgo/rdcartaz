'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PosterForm } from '@/app/components/poster-form';
import { PosterPreview } from '@/app/components/poster-preview';
import { DisclaimerModal } from '@/app/components/disclaimer-modal';
import { AboutPanel } from '@/app/components/about-panel';
import { DatabasePanel } from '@/app/components/database-panel';
import { SettingsDialog } from '@/app/components/settings-dialog';
import { ImportModal } from '@/app/components/import-modal';
import type { PosterData, PosterSettings, PosterType } from '@/app/lib/types';
import { parseProductCSV, parseProductExcel } from '@/app/lib/poster-utils';
import { Printer, Plus, Trash2, FileStack, PackageOpen, Info, Database, Upload, Edit3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// The PosterType definition was moved to '@/app/lib/types'
// type PosterType = 'reliquias' | 'ofertas-imperdiveis' | 'aereo' | 'avaria' | 'etiqueta' | 'totem' | 'leve-pague-a4' | 'leve-pague-a6' | 'combo-a4' | 'combo-a6';

const PER_PAGE: Record<PosterType, number> = {
  reliquias: 4,
};

// Dimensões do cartaz individual para o preview (px)
const SINGLE_DIMS: Record<PosterType, { w: number; h: number }> = {
  reliquias:            { w: 491, h: 340 },
};

// Orientação de impressão por tipo de cartaz
const POSTER_ORIENTATION: Record<PosterType, 'portrait' | 'landscape'> = {
  reliquias:            'landscape',
};

const initialPosterData = (): PosterData => ({
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

/* ─────────────────────────── SinglePosterPreview ─────────────────────────── */
// Mostra um cartaz individual em fundo cinza (simulação de papel).
function SinglePosterPreview({
  data,
  posterType,
  isReady,
  settings,
}: {
  data: PosterData;
  posterType: PosterType;
  isReady: boolean;
  settings: PosterSettings;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);
  
  // Safety check to prevent crash if dimensions are missing
  const dims = SINGLE_DIMS[posterType] || { w: 491, h: 340 };
  const { w, h } = dims;

  useEffect(() => {
    // Recalcula escala quando o tipo muda ou dimensões mudam
    setReady(false);

    const outer = outerRef.current;
    if (!outer) return;

    const apply = () => {
      const cw = outer.clientWidth;
      const ch = outer.clientHeight;
      if (cw === 0 || ch === 0) return;
      setScale(Math.min(cw / w, ch / h) * 0.88);
      setReady(true);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [posterType, w, h]);

  // O outerRef SEMPRE existe no DOM para que o ResizeObserver funcione.
  // O conteúdo interno muda conforme isReady.
  return (
    <div
      ref={outerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#b0b8c4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {!isReady ? (
        <div
          className="flex flex-col items-center justify-center gap-3 text-muted-foreground p-6"
          style={{ backgroundColor: 'transparent' }}
        >
          <PackageOpen className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">Busque um produto para ver o cartaz</p>
          <p className="text-xs opacity-60 text-center">Use o campo de busca ao lado para localizar ou cadastrar o produto</p>
        </div>
      ) : (
        <div
          style={{
            width: `${w}px`,
            height: `${h}px`,
            flexShrink: 0,
            transformOrigin: 'center center',
            transform: `scale(${scale})`,
            visibility: ready ? 'visible' : 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 8px 32px -4px rgb(0 0 0 / 0.35)',
            overflow: 'hidden',
          }}
        >
          {posterType === 'reliquias' && <PosterPreview {...data} isImperdiveis={false} settings={settings} />}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── PagePreview (Scaled Batch) ─────────────────── */
function PagePreview({ 
  items, 
  posterType, 
  perPage, 
  settings 
}: { 
  items: PosterData[]; 
  posterType: PosterType; 
  perPage: number; 
  settings: PosterSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const totalPages = Math.ceil(items.length / perPage);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      // Base A4 landscape: 297mm. 1mm ~ 3.78px
      const targetW = 297 * 3.78;
      const newScale = (width / targetW) * 0.9;
      setScale(Math.max(0.2, newScale));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-muted/40 overflow-y-auto custom-scrollbar p-8">
      <div className="flex flex-col items-center gap-12 pb-12">
        {Array.from({ length: totalPages }).map((_, idx) => (
          <div key={idx} className="relative group">
            {/* Page Number Badge */}
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded shadow-sm opacity-60 group-hover:opacity-100 transition-opacity">
              PÁGINA {idx + 1} DE {totalPages}
            </div>
            
            <div 
              className="bg-white shadow-2xl origin-top shrink-0"
              style={{ 
                width: '297mm', 
                height: '210mm',
                transform: `scale(${scale})`,
                marginBottom: `calc(210mm * (${scale} - 1))` // Compensa o espaço vazio deixado pelo scale
              }}
            >
              <PageGrid 
                items={items.slice(idx * perPage, (idx + 1) * perPage)} 
                posterType={posterType} 
                perPage={perPage} 
                settings={settings} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── renderPageGrid ──────────────────────────────── */
function PageGrid({
  items,
  posterType,
  perPage,
  settings
}: {
  items: PosterData[];
  posterType: PosterType;
  perPage: number;
  settings: PosterSettings;
}) {
  const empties = Array.from({ length: perPage - items.length });


  // reliquias, ofertas-imperdiveis, avaria
  return (
    <div style={{
      display: 'grid',
      // Divide a "área util" (após as margens do papel de 1.5cm vert e 1.2cm horiz)
      // exatamente ao meio, criando 4 containers idênticos.
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)',
      width: '100%',
      height: '100%',
      padding: '1.5cm 1.2cm',  // Margens externas (Padrão A4 limpo)
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      {items.map((d: PosterData, i: number) => (
        // Cada slot tem 100% da sua metade do papel (Aprox 13.x cm por 9cm)
        <div key={i} style={{
          width: '100%',
          height: '100%',
          // O espaço em branco QUE SEPARA um painel do outro fisicamente:
          // Como as margens encostam, o top de um cartaz respira pro limite
          // e o bottom respira pro mesmo limite.
          paddingTop: '0.4cm',
          paddingBottom: '0.4cm',
          paddingLeft: '0.4cm',
          paddingRight: '0.4cm',
          boxSizing: 'border-box',
        }}>
          {/* O Cartaz real, posicionado nos limites do seu padding interno */}
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <PosterPreview {...(d as PosterData)} isImperdiveis={false} settings={settings} />
          </div>
        </div>
      ))}
      {empties.map((_, i: number) => <div key={`e${i}`} />)}
    </div>
  );
}

/* ─────────────────────────── Home ───────────────────────────────────────── */
export default function Home() {
  const [posterType, setPosterType] = useState<PosterType>('reliquias');
  const [queue, setQueue] = useState<PosterData[]>([]);
  const [currentPoster, setCurrentPoster] = useState<PosterData>(initialPosterData());
  const [isProductReady, setIsProductReady] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [previewMode, setPreviewMode] = useState<'single' | 'page'>('single');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [queueFilter, setQueueFilter] = useState<'all' | 'offer' | 'normal'>('all');
  const [settings, setSettings] = useState<PosterSettings>({
    maxInstallments: 6,
    minInstallmentAmount: 29.99,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('poster-settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveSettings = (newSettings: PosterSettings) => {
    setSettings(newSettings);
    localStorage.setItem('poster-settings', JSON.stringify(newSettings));
  };

  const perPage    = PER_PAGE[posterType as PosterType] || 4;
  
  const filteredQueue = useMemo(() => {
    if (queueFilter === 'all') return queue;
    return queue.filter(item => {
      const isOfferType = item.posterSubType === 'offer';
      return queueFilter === 'offer' ? isOfferType : !isOfferType;
    });
  }, [queue, queueFilter]);

  // Expande a fila considerando as quantidades de cada item para impressão
  const expandedQueue = useMemo(() => {
    const result: PosterData[] = [];
    filteredQueue.forEach(item => {
      const q = item.quantity || 1;
      for (let i = 0; i < q; i++) {
        result.push(item);
      }
    });
    return result;
  }, [filteredQueue]);

  const totalPages = expandedQueue.length > 0 ? Math.ceil(expandedQueue.length / perPage) : 0;

  // Update print CSS immediately when poster type changes
  useEffect(() => {
    const styleId = 'print-page-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const o = POSTER_ORIENTATION[posterType as PosterType] || 'landscape';
    style.innerHTML = `
      @media print {
        @page { size: A4 ${o}; margin: 0 !important; }
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
          width: ${o === 'landscape' ? '297mm' : '210mm'} !important;
          height: ${o === 'landscape' ? '210mm' : '297mm'} !important;
          overflow: hidden !important;
        }
        .print-page {
          width: ${o === 'landscape' ? '297mm' : '210mm'} !important;
          height: ${o === 'landscape' ? '210mm' : '297mm'} !important;
          overflow: hidden !important;
          position: relative !important;
          font-size: 16px !important; /* Base para em/rem no papel */
        }
      }
    `;
  }, [posterType]);

  const handlePosterTypeChange = (newType: PosterType) => {
    setPosterType(newType);
    setQueue([]);
    setCurrentPoster({
      ...initialPosterData(),
      posterSubType: ['reliquias', 'ofertas-imperdiveis', 'avaria', 'etiqueta-oficial'].includes(newType) ? 'offer' : 'normal',
    });
    setIsProductReady(false);
    setFormKey((k: number) => k + 1);
  };

  const handleAddToQueue = () => {
    if (!isProductReady) return;
    // Sempre adiciona como 1 item único no lote, a quantidade é editada na lista
    setQueue((prev: PosterData[]) => [...prev, { ...currentPoster, quantity: 1 }]);
    setCurrentPoster({
      ...initialPosterData(),
      posterSubType: currentPoster.posterSubType,
      paymentOption: currentPoster.paymentOption,
      defectType: currentPoster.defectType,
      customDefectDiscount: currentPoster.customDefectDiscount,
      quantity: 1
    });
    setIsProductReady(false);
    setFormKey((k: number) => k + 1);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setQueue((prev: PosterData[]) => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, Math.min(99, (item.quantity || 1) + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev: PosterData[]) => prev.filter((_: PosterData, i: number) => i !== index));
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xls') || file.name.endsWith('.xlsx');
    const reader = new FileReader();

    reader.onload = (event) => {
      setImportStatus('processing');

      // Pequeno atraso artificial para dar peso à animação de processamento
      setTimeout(() => {
        let imported: any[] = [];
        
        if (isExcel) {
          const buffer = event.target?.result as ArrayBuffer;
          imported = parseProductExcel(buffer);
        } else {
          const content = event.target?.result as string;
          imported = parseProductCSV(content);
        }

        const onlyOffers = imported.filter((item: any) => item.posterSubType === 'offer');

        if (onlyOffers.length > 0) {
          setQueue(prev => [...prev, ...onlyOffers]);
          setQueueFilter('offer');
          setImportCount(onlyOffers.length);
          setImportStatus('success');
          setPreviewMode('page'); // Muda para ver a página inteira após importar
        } else {
          setImportStatus('error');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 800);
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'ISO-8859-1'); // Comum em CSVs do Excel Brasil
    }
  };

  /* Print content: one div per page, each with page-break */
  const renderPrintContent = () => {
    if (expandedQueue.length === 0) return null;
    const orientation = POSTER_ORIENTATION[posterType as PosterType];
    return Array.from({ length: totalPages }).map((_, pageIdx: number) => {
      const pageItems = expandedQueue.slice(pageIdx * perPage, (pageIdx + 1) * perPage);
      return (
        <div
          key={pageIdx}
          className="print-page bg-white"
          style={{
            width:          orientation === 'landscape' ? '297mm'  : '210mm',
            height:         orientation === 'landscape' ? '210mm'  : '297mm',
            pageBreakAfter: pageIdx < totalPages - 1    ? 'always' : 'auto',
            breakAfter:     pageIdx < totalPages - 1    ? 'page'   : 'auto',
          }}
        >
          <PageGrid items={pageItems} posterType={posterType as PosterType} perPage={perPage} settings={settings} />
        </div>
      );
    });
  };

  const orientation = POSTER_ORIENTATION[posterType as PosterType];

  const typeOptions = [
    { id: 'reliquias',             label: 'Relíquias'          },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground md:h-screen md:overflow-hidden print:w-full print:h-auto print:min-h-0 print:block">

      {/* Modais */}
      <DisclaimerModal />
      <AboutPanel open={showAbout} onClose={() => setShowAbout(false)} />
      <DatabasePanel open={showDatabase} onClose={() => setShowDatabase(false)} />

      {/* ── Header ── */}
      <header className="no-print shrink-0 px-4 py-3 border-b bg-card">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P%</span>
            </div>
            <h1 className="font-headline text-2xl font-bold uppercase">RD CARTAZ - Cartazes Relíquias da Diversão</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between">
            {/* Mobile select */}

            {/* Desktop button group */}
            <div className="hidden md:flex bg-muted p-1 rounded-lg">
               <span className="px-3 py-1.5 rounded-md text-[13px] font-semibold bg-background text-foreground shadow-sm">
                 Modelo: Relíquias
               </span>
            </div>
              <AboutPanel open={showAbout} onClose={() => setShowAbout(false)} />
              <button
                onClick={() => setShowAbout(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border/50 hover:border-border"
                title="Sobre esta ferramenta"
              >
                <Info className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sobre</span>
              </button>
              <SettingsDialog 
                settings={settings} 
                onSave={saveSettings} 
                onOpenDatabase={() => setShowDatabase(true)} 
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".csv, .xls, .xlsx"
                className="hidden"
              />
              <Button
                onClick={() => window.print()}
                disabled={queue.length === 0}
                className="transition-transform active:scale-95"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir{queue.length > 0 ? ` (${totalPages}p)` : ''}
              </Button>
          </div>
        </div>
      </header>

      {/* ── Print output (hidden on screen) ── */}
      <div className="print-container" style={{ display: 'none' }}>
        {renderPrintContent()}
      </div>

      {/* ── Main ── */}
      <main className="no-print flex-1 flex flex-col min-h-0 md:overflow-hidden pb-[70px] md:pb-0">
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 min-h-0">

          {/* ── Left: Form + Add + Queue ── */}
          <div className={cn(
            "flex-none md:flex-auto md:col-span-5 lg:col-span-4 flex flex-col border-r border-border bg-muted/10 md:min-h-0 h-full overflow-x-hidden",
            activeTab !== 'edit' && "hidden md:flex"
          )}>
            <div className="flex-1 md:overflow-y-auto overflow-y-visible overflow-x-hidden px-4 pt-4 min-h-0 custom-scrollbar">
              <div className="pb-12 space-y-3">

                <PosterForm
                  key={`form-${formKey}`}
                  data={currentPoster}
                  setData={setCurrentPoster}
                  posterType={posterType}
                  onLookupStatusChange={setIsProductReady}
                  onImportBatch={() => fileInputRef.current?.click()}
                />

                {/* ── Add to queue button ── */}
                <Button
                  onClick={handleAddToQueue}
                  disabled={!isProductReady}
                  className={cn(
                    'w-full h-12 text-base font-semibold gap-2 transition-all',
                    isProductReady && 'ring-2 ring-primary/40 shadow-md'
                  )}
                >
                  <Plus className="h-5 w-5" />
                  Adicionar ao Lote
                </Button>

                {/* ── Queue list ── */}
                {queue.length > 0 && (
                  <div className="rounded-lg border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <FileStack className="h-4 w-4 text-primary" />
                        {queue.length} cartaz{queue.length !== 1 ? 'es' : ''} &middot; {totalPages} página{totalPages !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => setQueue([])}
                        className="text-xs text-destructive hover:underline font-medium"
                      >
                        Limpar tudo
                      </button>
                    </div>

                    {/* Filter label (simplified) */}
                    <div className="flex border-b bg-muted/10 px-3 py-1.5 items-center justify-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Somente Oferta Ativa
                      </span>
                    </div>

                    <div className="divide-y divide-border/50">
                      {queue.map((item: PosterData, index: number) => (
                        <div key={index} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-900 truncate uppercase leading-none mb-1">
                              {item.description}
                            </p>
                            <p className="text-[9px] text-muted-foreground font-mono">
                              {item.code} | {item.priceFor}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Controle de Quantidade */}
                            <div className="flex items-center border rounded-md overflow-hidden bg-background h-7">
                              <button 
                                onClick={() => handleUpdateQuantity(index, -1)}
                                className="px-2 h-full hover:bg-muted transition-colors border-r text-xs font-bold"
                              >
                                -
                              </button>
                              <div className="px-2 min-w-[20px] text-center text-[10px] font-black text-primary">
                                {item.quantity || 1}
                              </div>
                              <button 
                                onClick={() => handleUpdateQuantity(index, 1)}
                                className="px-2 h-full hover:bg-muted transition-colors border-l text-xs font-bold"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveFromQueue(index)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                              title="Remover"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Right: Single poster preview ── */}
          <div className={cn(
            "md:col-span-7 lg:col-span-8 flex flex-col p-4 gap-2 md:overflow-hidden bg-muted/20 border-b border-border md:border-b-0 h-full md:h-full",
            activeTab !== 'preview' && "hidden md:flex"
          )}>
            <div className="flex items-center justify-between shrink-0 mb-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Visualização
              </p>
              <div className="flex bg-background border rounded-md p-0.5">
                <button 
                  onClick={() => setPreviewMode('single')}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded transition-all",
                    previewMode === 'single' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Individual
                </button>
                <button 
                  onClick={() => setPreviewMode('page')}
                  disabled={queue.length === 0}
                  className={cn(
                    "px-3 py-1 text-[10px] font-bold rounded transition-all",
                    previewMode === 'page' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    queue.length === 0 && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Página
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative border rounded border-border overflow-hidden bg-white/50">
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                {previewMode === 'single' ? (
                  <SinglePosterPreview
                    data={currentPoster}
                    posterType={posterType}
                    isReady={isProductReady}
                    settings={settings}
                  />
                ) : (
                  <PagePreview
                    items={expandedQueue}
                    posterType={posterType}
                    perPage={perPage}
                    settings={settings}
                  />
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center shrink-0">
              {queue.length === 0
                ? 'Preencha o formulário e clique em "Adicionar ao Lote".'
                : `Lote: ${queue.length} cartaz${queue.length !== 1 ? 'es' : ''} → ${totalPages} página${totalPages !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </main>

      {/* ── Mobile Navigation Tabs ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-background border-t border-border flex items-center px-6 gap-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('edit')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
            activeTab === 'edit' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'edit' ? "bg-primary/10" : ""
          )}>
            <Edit3 className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Editar</span>
        </button>
        
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
            activeTab === 'preview' ? "text-primary" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "p-2 rounded-xl transition-all",
            activeTab === 'preview' ? "bg-primary/10" : ""
          )}>
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Prévia</span>
        </button>
      </div>
      {/* Modal de Feedback de Importação */}
      <ImportModal 
        status={importStatus} 
        count={importCount} 
        onClose={() => setImportStatus('idle')} 
      />
    </div>
  );
}
