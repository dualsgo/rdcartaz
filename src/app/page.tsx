'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PosterForm } from '@/app/components/poster-form';
import { PosterPreview } from '@/app/components/poster-preview';
import { PosterPreviewEtiquetaOficial } from '@/app/components/poster-preview-etiqueta-oficial';

import { DisclaimerModal } from '@/app/components/disclaimer-modal';

import { AboutPanel } from '@/app/components/about-panel';
import { DatabasePanel } from '@/app/components/database-panel';
import { SettingsDialog } from '@/app/components/settings-dialog';
import { ImportModal } from '@/app/components/import-modal';
import { AutomationModal } from '@/app/components/automation-modal';
import { SecurityModal } from '@/app/components/security-modal';
import type { PosterData, PosterSettings, PosterType } from '@/app/lib/types';


import { parseProductCSV, parseProductExcel, parsePrice } from '@/app/lib/poster-utils';

import { Printer, Plus, Trash2, FileStack, PackageOpen, Info, Database, Upload, Edit3, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// The PosterType definition was moved to '@/app/lib/types'
// type PosterType = 'reliquias' | 'ofertas-imperdiveis' | 'aereo' | 'avaria' | 'etiqueta' | 'totem' | 'leve-pague-a4' | 'leve-pague-a6' | 'combo-a4' | 'combo-a6';

const PER_PAGE: Record<PosterType, number> = {
  reliquias: 4,
  'etiqueta-oficial': 16,
};



// Dimensões do cartaz individual para o preview (px)
const SINGLE_DIMS: Record<PosterType, { w: number; h: number }> = {
  reliquias:            { w: 491, h: 340 },
  'etiqueta-oficial':   { w: 340, h: 128 }, // 90mm x 34mm
};



// Orientação de impressão por tipo de cartaz
const POSTER_ORIENTATION: Record<PosterType, 'portrait' | 'landscape'> = {
  reliquias:            'landscape',
  'etiqueta-oficial':   'portrait',
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
      setScale(Math.min(cw / w, ch / h) * 0.96);

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
          {posterType === 'etiqueta-oficial' && <PosterPreviewEtiquetaOficial {...data} settings={settings} />}


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
  const orientation = POSTER_ORIENTATION[posterType] || 'landscape';
  const isPortrait = orientation === 'portrait';
  const targetW = (isPortrait ? 210 : 297) * 3.78;
  const targetH = (isPortrait ? 297 : 210) * 3.78;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const newScale = Math.min(width / targetW, height / targetH) * 0.95;
      setScale(Math.max(0.1, newScale));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [targetW, targetH]);



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
                width: isPortrait ? '210mm' : '297mm', 
                height: isPortrait ? '297mm' : '210mm',
                transform: `scale(${scale})`,
                marginBottom: `calc(${isPortrait ? '297mm' : '210mm'} * (${scale} - 1))` // Compensa o espaço vazio deixado pelo scale
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

  if (posterType === 'etiqueta-oficial') {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '90mm 90mm', 
        gridTemplateRows: 'repeat(8, 34.0mm)',
        columnGap: '0', 
        rowGap: '0',
        justifyContent: 'center',
        paddingTop: '14.2mm', 
        paddingBottom: '10.8mm', 
        paddingLeft: '16mm', 
        paddingRight: '14mm', 
        width: '100%', 
        height: '100%', 
        boxSizing: 'border-box', 
        backgroundColor: 'white'
      }}>
        {items.map((d: PosterData, i: number) => (
          <div 
            key={i} 
            style={{ 
              width: '90mm', 
              height: '34.0mm', 
              overflow: 'hidden',
              paddingTop: '1mm',
              boxSizing: 'border-box'
            }}
          >
            <PosterPreviewEtiquetaOficial {...d} settings={settings} />
          </div>
        ))}
        {empties.map((_, i: number) => (
          <div 
            key={`e${i}`} 
            style={{ 
              width: '90mm', 
              height: '34.0mm', 
              paddingTop: '1mm',
              boxSizing: 'border-box'
            }}
          />
        ))}
      </div>
    );
  }


  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)',
      width: '100%',
      height: '100%',
      padding: '1.5cm 1.2cm',
      boxSizing: 'border-box',
      backgroundColor: 'white'
    }}>
      {items.map((d: PosterData, i: number) => (
        <div key={i} style={{
          width: '100%',
          height: '100%',
          paddingTop: '0.4cm',
          paddingBottom: '0.4cm',
          paddingLeft: '0.4cm',
          paddingRight: '0.4cm',
          boxSizing: 'border-box',
        }}>
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
  const [activeTab, setActiveTab] = useState<'edit' | 'queue' | 'preview'>('edit');
  const [showAutomation, setShowAutomation] = useState(false);
  const [showAddSuccess, setShowAddSuccess] = useState(false);

  const [queueFilter, setQueueFilter] = useState<'all' | 'offer' | 'normal'>('all');
  const [settings, setSettings] = useState<PosterSettings>({
    maxInstallments: 6,
    minInstallmentAmount: 29.99,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    type: 'error' | 'warning';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });


  // Load settings and queue
  useEffect(() => {
    const savedSettings = localStorage.getItem('poster-settings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch { /* ignore */ }
    }
    const savedQueue = localStorage.getItem('poster-queue');
    if (savedQueue) {
      try { setQueue(JSON.parse(savedQueue)); } catch { /* ignore */ }
    }
  }, []);

  // Monitora edição do formulário para voltar ao modo individual
  // Ignora o reset inicial ou reset após adicionar
  const lastResetRef = useRef<string>(JSON.stringify(initialPosterData()));
  useEffect(() => {
    const currentStr = JSON.stringify(currentPoster);
    if (currentStr !== lastResetRef.current) {
      setPreviewMode('single');
    }
  }, [currentPoster]);

  // Save queue whenever it changes
  useEffect(() => {
    localStorage.setItem('poster-queue', JSON.stringify(queue));
  }, [queue]);



  const saveSettings = (newSettings: PosterSettings) => {
    setSettings(newSettings);
    localStorage.setItem('poster-settings', JSON.stringify(newSettings));
  };

  const perPage    = PER_PAGE[posterType as PosterType] || 4;
  
  const filteredQueue = useMemo(() => {
    let result = queue;
    
    // Filtro automático: Relíquias só aceita Ofertas
    if (posterType === 'reliquias') {
      result = result.filter(item => item.posterSubType === 'offer');
    }

    if (queueFilter === 'all') return result;
    return result.filter(item => {
      const isOfferType = item.posterSubType === 'offer';
      return queueFilter === 'offer' ? isOfferType : !isOfferType;
    });
  }, [queue, queueFilter, posterType]);


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
    const resetData = {
      ...initialPosterData(),
      posterSubType: ['reliquias', 'etiqueta-oficial'].includes(newType) ? 'offer' : 'normal',
    };
    lastResetRef.current = JSON.stringify(resetData);
    setCurrentPoster(resetData);
    setIsProductReady(false);
    setFormKey((k: number) => k + 1);
  };



  const handleAddToQueue = () => {
    if (!isProductReady) return;

    const valDe = parsePrice(currentPoster.priceFrom);
    const valPor = parsePrice(currentPoster.priceFor);

    // 1. Bloqueio de Preço Zero
    if (valPor <= 0) {
      setSecurityModal({
        isOpen: true,
        type: 'error',
        title: 'Preço Inválido',
        message: 'O preço de venda não pode ser zero ou negativo. Por favor, verifique o valor digitado.',
      });
      return;
    }

    // 2. Bloqueio de Desconto de 100% (ou mais)
    if (currentPoster.posterSubType === 'offer' && valDe > 0) {
      const discount = (valDe - valPor) / valDe;
      
      if (discount >= 1) {
        setSecurityModal({
          isOpen: true,
          type: 'error',
          title: 'Desconto Inválido',
          message: 'O sistema não permite cartazes com 100% ou mais de desconto. Verifique os preços DE e POR.',
        });
        return;
      }

      // 3. Alerta de Desconto Alto (> 80%)
      if (discount > 0.8) {
        setSecurityModal({
          isOpen: true,
          type: 'warning',
          title: 'Desconto Muito Alto',
          message: `Este produto está com um desconto de ${Math.round(discount * 100)}%. Você confirma que o preço final de R$ ${currentPoster.priceFor} está correto?`,
          onConfirm: () => {
            setSecurityModal(prev => ({ ...prev, isOpen: false }));
            proceedAddToQueue();
          }
        });
        return;
      }
    }

    proceedAddToQueue();
  };

  const proceedAddToQueue = () => {
    setQueue((prev: PosterData[]) => [...prev, { ...currentPoster, quantity: 1 }]);
    
    // Reseta o formulário preservando algumas preferências do usuário
    const resetData = {
      ...initialPosterData(),
      posterSubType: currentPoster.posterSubType,
      paymentOption: currentPoster.paymentOption,
      defectType: currentPoster.defectType,
      customDefectDiscount: currentPoster.customDefectDiscount,
      quantity: 1
    };
    
    lastResetRef.current = JSON.stringify(resetData);
    setCurrentPoster(resetData);
    setIsProductReady(false);
    setPreviewMode('page'); // Muda automático para a visão da página ao adicionar
    setFormKey((k: number) => k + 1);

    // Feedback de sucesso no botão
    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 1500);
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
    { id: 'etiqueta-oficial',      label: 'Gôndola Oficial'    },
  ] as const;



  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary selection:text-white overscroll-none print:block print:h-auto print:min-h-0">


      {/* Modais */}
      <DisclaimerModal />
      <AboutPanel open={showAbout} onClose={() => setShowAbout(false)} />
      <DatabasePanel open={showDatabase} onClose={() => setShowDatabase(false)} />
      <AutomationModal 
        isOpen={showAutomation} 
        onClose={() => setShowAutomation(false)} 
        onSelectFile={() => fileInputRef.current?.click()} 
      />

      <SecurityModal 
        {...securityModal} 
        onClose={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* ── Header ── */}
      <header className="no-print shrink-0 px-4 py-3 border-b bg-card">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P%</span>
            </div>
            <h1 className="font-headline text-lg sm:text-2xl font-bold uppercase truncate max-w-[200px] sm:max-w-none">
              <span className="sm:hidden">RD CARTAZ</span>
              <span className="hidden sm:inline">RD CARTAZ - Cartazes Relíquias da Diversão</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between">
            {/* Mobile select */}

            {/* Desktop button group */}
            <div className="flex bg-muted p-1 rounded-xl gap-1 shadow-inner">
               {typeOptions.map(opt => (
                 <button
                   key={opt.id}
                   onClick={() => handlePosterTypeChange(opt.id as PosterType)}
                   className={cn(
                     'px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 whitespace-nowrap',
                     posterType === opt.id
                       ? 'bg-background text-primary shadow-sm scale-[1.02]'
                       : 'text-muted-foreground hover:bg-black/5'
                   )}
                 >
                   {opt.label}
                 </button>
               ))}
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
                className="transition-transform active:scale-95 px-3 sm:px-4"
              >
                <Printer className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Imprimir</span>
                {queue.length > 0 ? ` (${totalPages}p)` : ''}
              </Button>
          </div>
        </div>
      </header>

      {/* ── Print output (hidden on screen) ── */}
      <div className="print-container" style={{ display: 'none' }}>
        {renderPrintContent()}
      </div>

      {/* ── Main Area ── */}
      <main className="no-print flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 min-h-0 h-full overflow-hidden">


          {/* ── COLUMN 1: FORM (EDIT) ── */}
          <div className={cn(
            "lg:col-span-3 flex flex-col border-r border-border bg-card lg:min-h-0 h-full overflow-hidden",
            activeTab !== 'edit' && "hidden lg:flex"
          )}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">

              <div className="space-y-4">
                <PosterForm
                  key={`form-${formKey}`}
                  data={currentPoster}
                  setData={setCurrentPoster}
                  posterType={posterType}
                  onLookupStatusChange={setIsProductReady}
                  onImportBatch={() => setShowAutomation(true)}
                />

                <Button
                  onClick={handleAddToQueue}
                  disabled={!isProductReady || showAddSuccess}
                  className={cn(
                    'w-full h-14 text-base font-black uppercase tracking-widest gap-2 transition-all shadow-lg',
                    showAddSuccess 
                      ? 'bg-green-600 hover:bg-green-600 scale-[1.02] shadow-green-200' 
                      : isProductReady 
                        ? 'bg-primary hover:bg-primary/90 shadow-primary/20 scale-[1.01]' 
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {showAddSuccess ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 animate-in zoom-in duration-300" />
                      Adicionado!
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6" />
                      Adicionar ao Lote
                    </>
                  )}
                </Button>

              </div>
            </div>
          </div>

          {/* ── COLUMN 2: QUEUE (LOTE) ── */}
          <div className={cn(
            "lg:col-span-3 flex flex-col border-r border-border bg-muted/5 lg:min-h-0 h-full overflow-hidden",
            activeTab !== 'queue' && "hidden lg:flex"
          )}>

            <div className="shrink-0 px-4 py-3 border-b bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileStack className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider">Lote Atual</span>
                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {filteredQueue.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {queue.length > filteredQueue.length && (
                  <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 rounded border border-orange-200" title="Itens 'Preço Normal' estão ocultos neste modelo">
                    {queue.length - filteredQueue.length} OCULTOS
                  </span>
                )}
                {queue.length > 0 && (
                  <button
                    onClick={() => setQueue([])}
                    className="text-[10px] text-destructive hover:underline font-bold uppercase"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredQueue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <PackageOpen className="h-10 w-10 mb-2" />
                  <p className="text-xs font-medium uppercase tracking-tighter">
                    {queue.length > 0 ? 'Nenhum item compatível' : 'O lote está vazio'}
                  </p>
                </div>
              ) : (
                <div className="pb-4">
                  {(() => {
                    let currentPos = 0;
                    let lastPage = 0;
                    
                    return filteredQueue.map((item: PosterData, index: number) => {
                      const realIndex = queue.indexOf(item);
                      const startPage = Math.floor(currentPos / perPage) + 1;
                      const endPage = Math.floor((currentPos + (item.quantity || 1) - 1) / perPage) + 1;
                      const showHeader = startPage !== lastPage;
                      lastPage = startPage;
                      
                      currentPos += (item.quantity || 1);
                      
                      return (
                        <React.Fragment key={index}>
                          {showHeader && (
                            <div className="bg-muted/30 px-4 py-1.5 border-y border-border/50 sticky top-0 z-10 backdrop-blur-sm">
                              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Página {startPage}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white transition-colors group border-b border-border/30 last:border-b-0 relative">
                            <button
                              onClick={() => handleRemoveFromQueue(realIndex)}
                              className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-[11px] font-bold text-gray-900 truncate uppercase leading-none">
                                  {item.description}
                                </p>
                                {startPage !== endPage && (
                                  <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded border border-blue-100 whitespace-nowrap">
                                    PAG {startPage}-{endPage}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground font-mono flex items-center gap-2">
                                <span>{item.code}</span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span className={cn(item.posterSubType === 'offer' ? "text-orange-600 font-bold" : "text-blue-600 font-bold")}>
                                  {item.posterSubType === 'offer' ? 'OFERTA' : 'NORMAL'}
                                </span>
                              </p>
                            </div>
                            
                            <div className="shrink-0 flex items-center bg-background border rounded-md p-0.5">
                              <button 
                                onClick={() => handleUpdateQuantity(realIndex, -1)}
                                className="w-6 h-6 flex items-center justify-center text-xs hover:bg-muted rounded transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-[10px] font-black">{item.quantity || 1}</span>
                              <button 
                                onClick={() => handleUpdateQuantity(realIndex, 1)}
                                className="w-6 h-6 flex items-center justify-center text-xs hover:bg-muted rounded transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
              )}
            </div>


          </div>

          {/* ── COLUMN 3: PREVIEW ── */}
          <div className={cn(
            "lg:col-span-6 flex flex-col p-2 sm:p-4 gap-2 lg:overflow-hidden bg-muted/20 h-full",
            activeTab !== 'preview' && "hidden lg:flex"
          )}>
            <div className="flex items-center justify-between shrink-0 mb-1">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Visualização de Impressão
                </p>
              </div>
              <div className="flex bg-muted p-1 rounded-xl shadow-inner">
                <button 
                  onClick={() => setPreviewMode('single')}
                  className={cn(
                    "px-5 py-2 text-[10px] font-black rounded-lg transition-all",
                    previewMode === 'single' ? "bg-background text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                  )}
                >
                  INDIVIDUAL
                </button>
                <button 
                  onClick={() => setPreviewMode('page')}
                  disabled={queue.length === 0}
                  className={cn(
                    "px-5 py-2 text-[10px] font-black rounded-lg transition-all",
                    previewMode === 'page' ? "bg-background text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5",
                    queue.length === 0 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  PÁGINA COMPLETA
                </button>
              </div>

            </div>

            <div className="flex-1 min-h-0 relative border rounded-xl border-border/50 overflow-hidden bg-white shadow-inner">
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

            <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 py-2">
               {queue.length > 0 && (
                 <>
                   <span>Total: {queue.length} Itens</span>
                   <span className="w-1 h-1 bg-border rounded-full" />
                   <span>Impressão: {totalPages} {totalPages === 1 ? 'Página' : 'Páginas'}</span>
                 </>
               )}
            </div>
          </div>

        </div>
      </main>

      <div className="lg:hidden sticky bottom-0 left-0 right-0 h-[70px] bg-white border-t border-border z-[100] flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0">

        <button
          onClick={() => setActiveTab('edit')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
            activeTab === 'edit' ? "text-primary translate-y-[-2px]" : "text-muted-foreground opacity-60"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-all",
            activeTab === 'edit' ? "bg-primary/10" : ""
          )}>
            <Edit3 className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Editar</span>
        </button>

        <button
          onClick={() => setActiveTab('queue')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
            activeTab === 'queue' ? "text-primary translate-y-[-2px]" : "text-muted-foreground opacity-60"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-all relative",
            activeTab === 'queue' ? "bg-primary/10" : ""
          )}>
            <FileStack className="h-5 w-5" />
            {queue.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-2 ring-white">
                {queue.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Lote</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-200",
            activeTab === 'preview' ? "text-primary translate-y-[-2px]" : "text-muted-foreground opacity-60"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-all",
            activeTab === 'preview' ? "bg-primary/10" : ""
          )}>
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Prévia</span>
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
