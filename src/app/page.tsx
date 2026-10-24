'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PosterForm, type PosterFormHandle, type AutoAddSource } from '@/app/components/poster-form';
import { SinglePosterPreview, PagePreview, PageGrid } from '@/app/components/print-preview';
import { FormatSelector } from '@/app/components/format-selector';
import { QueuePanel } from '@/app/components/queue-panel';
import { DisclaimerModal } from '@/app/components/disclaimer-modal';
import { AboutPanel } from '@/app/components/about-panel';
import { DatabasePanel } from '@/app/components/database-panel';
import { SettingsDialog } from '@/app/components/settings-dialog';
import { ImportModal } from '@/app/components/import-modal';
import { AutomationModal } from '@/app/components/automation-modal';
import { SecurityModal } from '@/app/components/security-modal';
import type { PosterData, PosterSettings, PosterType } from '@/app/lib/types';
import { POSTER_FORMATS, VISIBLE_FORMATS, getPosterFormat } from '@/app/lib/poster-formats';
import { parseProductCSV, parseProductExcel, parsePrice } from '@/app/lib/poster-utils';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { Kbd } from '@/components/ui/kbd';

import { Printer, Plus, FileStack, PackageOpen, Info, Database, Edit3, LayoutGrid, FileDown, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

export default function Home() {
  const [posterType, setPosterType] = useState<PosterType>('reliquias');
  const [queue, setQueue] = useState<PosterData[]>([]);
  const [currentPoster, setCurrentPoster] = useState<PosterData>(initialPosterData());
  const [isProductReady, setIsProductReady] = useState(false);
  const [selectedQueueIndex, setSelectedQueueIndex] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [showAbout, setShowAbout] = useState(false);
  const [showDatabase, setShowDatabase] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [previewMode, setPreviewMode] = useState<'single' | 'page'>('single');
  const [activeTab, setActiveTab] = useState<'edit' | 'queue' | 'preview'>('edit');
  const [showAutomation, setShowAutomation] = useState(false);
  const [importMode, setImportMode] = useState<'offer' | 'normal'>('offer');
  const [showAddSuccess, setShowAddSuccess] = useState(false);
  const [continuousScan, setContinuousScan] = useState(false);

  const [queueFilter, setQueueFilter] = useState<'all' | 'offer' | 'normal'>('all');
  const [settings, setSettings] = useState<PosterSettings>({
    maxInstallments: 10,
    minInstallmentAmount: 29.99,
  });

  const [sessionProducts, setSessionProducts] = useState<Record<string, any>>({});
  const hasSessionData = Object.keys(sessionProducts).length > 0;
  const [hasOldQueue, setHasOldQueue] = useState(false);
  const isInitialMount = useRef(true);
  const formRef = useRef<PosterFormHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [securityModal, setSecurityModal] = useState<{
    isOpen: boolean;
    type: 'error' | 'warning';
    title: string;
    message: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  // Load settings, queue and preferences
  useEffect(() => {
    const savedSettings = localStorage.getItem('poster-settings-v2');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch { /* ignore */ }
    } else {
      const oldSettings = localStorage.getItem('poster-settings');
      let newMax = 10;
      if (oldSettings) {
        try {
          const parsed = JSON.parse(oldSettings);
          if (parsed.maxInstallments === 10) newMax = 10;
          else if (parsed.maxInstallments === 6) newMax = 10;
        } catch { /* ignore */ }
      }
      const initialSettings = { maxInstallments: newMax, minInstallmentAmount: 29.99 };
      setSettings(initialSettings);
      localStorage.setItem('poster-settings-v2', JSON.stringify(initialSettings));
    }

    const savedQueue = localStorage.getItem('poster-queue');
    if (savedQueue) {
      try { 
        const parsedQueue = JSON.parse(savedQueue);
        if (parsedQueue.length > 0) {
          const lastUpdate = Number(localStorage.getItem('poster-queue-updated') || 0);
          if (Date.now() - lastUpdate > 1000 * 60 * 5) { // 5 minutes
            setHasOldQueue(true);
          }
        }
        setQueue(parsedQueue); 
      } catch { /* ignore */ }
    }

    const savedScanMode = localStorage.getItem('poster-continuous-scan');
    if (savedScanMode !== null) {
      setContinuousScan(savedScanMode === 'true');
    }
  }, []);

  const handleContinuousScanChange = (val: boolean) => {
    setContinuousScan(val);
    localStorage.setItem('poster-continuous-scan', String(val));
  };

  // Monitora edição do formulário para voltar ao modo individual
  const lastResetRef = useRef<string>(JSON.stringify(initialPosterData()));
  useEffect(() => {
    const currentStr = JSON.stringify(currentPoster);
    if (currentStr !== lastResetRef.current) {
      setPreviewMode('single');
    }
  }, [currentPoster]);

  // Salva a fila sempre que for alterada
  useEffect(() => {
    localStorage.setItem('poster-queue', JSON.stringify(queue));
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      localStorage.setItem('poster-queue-updated', Date.now().toString());
    }
  }, [queue]);

  const saveSettings = (newSettings: PosterSettings) => {
    setSettings(newSettings);
    localStorage.setItem('poster-settings', JSON.stringify(newSettings));
    localStorage.setItem('poster-settings-v2', JSON.stringify(newSettings));
  };

  const handleImportSessionData = (items: any[]) => {
    const map: Record<string, any> = {};
    items.forEach(item => {
      if (item.code) map[item.code] = item;
      if (item.ean) map[item.ean] = item;
    });
    setSessionProducts(map);
  };

  const handleClearSessionData = () => {
    setSessionProducts({});
  };

  const currentFormat = getPosterFormat(posterType);
  const perPage = currentFormat.perPage;
  const orientation = currentFormat.orientation;

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

  // Agrupa os itens em páginas garantindo que não misture oferta e normal na mesma página
  const printPages = useMemo(() => {
    const pages: PosterData[][] = [];
    let currentPage: PosterData[] = [];
    
    expandedQueue.forEach(item => {
      if (currentPage.length === perPage) {
        pages.push(currentPage);
        currentPage = [];
      }
      
      if (currentPage.length > 0) {
        const isCurrentOffer = currentPage[0].posterSubType === 'offer';
        const isItemOffer = item.posterSubType === 'offer';
        if (isCurrentOffer !== isItemOffer) {
          pages.push(currentPage);
          currentPage = [];
        }
      }
      
      currentPage.push(item);
    });
    
    if (currentPage.length > 0) {
      pages.push(currentPage);
    }
    
    return pages;
  }, [expandedQueue, perPage]);

  const totalPages = printPages.length;

  // Atualiza o CSS de impressão dinamicamente quando o formato muda
  useEffect(() => {
    const styleId = 'print-page-style';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const o = orientation;
    style.innerHTML = `
      @media print {
        @page { size: A4 ${o}; margin: 0 !important; }
        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          margin: 0 !important;
          padding: 0 !important;
          width: ${o === 'landscape' ? '297mm' : '210mm'} !important;
          background: white !important;
        }
        .print-page {
          width: ${o === 'landscape' ? '297mm' : '210mm'} !important;
          height: ${o === 'landscape' ? '210mm' : '297mm'} !important;
          overflow: hidden !important;
          position: relative !important;
          display: block !important;
          background: white !important;
        }
        .print-page:not(:last-child) {
          page-break-after: always !important;
          break-after: page !important;
        }
      }
    `;
  }, [orientation]);

  const handlePosterTypeChange = (newType: PosterType) => {
    setPosterType(newType);
    if (isProductReady || (currentPoster.description && currentPoster.description !== 'DESCRIÇÃO DO PRODUTO')) {
      const format = getPosterFormat(newType);
      setCurrentPoster(prev => ({
        ...prev,
        posterSubType: format.offerOnly ? 'offer' : prev.posterSubType,
      }));
    }
  };

  const handlePrint = useCallback(() => {
    if (queue.length === 0 && !isProductReady) return;

    const executePrint = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateStr = `${day}${month}${year}`;
      const filename = `cartazes${dateStr}`;

      const originalTitle = document.title;
      document.title = filename;
      
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = originalTitle;
        }, 500);
      }, 150);
    };

    const orientationLabel = orientation === 'landscape' ? 'PAISAGEM' : 'RETRATO';

    setSecurityModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirme os ajustes de impressão',
      message: `Para o cartaz sair no tamanho correto, você PRECISA CONFERIR se nas configurações de impressão/PDF a MARGEM e a ESCALA estão em "PADRÃO" (100%) e o FORMATO está em "${orientationLabel}".`,
      confirmText: 'CONFIRMAR E IMPRIMIR',
      cancelText: 'CANCELAR',
      onConfirm: () => {
        setSecurityModal(prev => ({ ...prev, isOpen: false }));
        executePrint();
      }
    });
  }, [queue.length, isProductReady, orientation]);

  const proceedAddToQueue = useCallback((dataToAdd?: PosterData, clearFirst: boolean = false): boolean => {
    const poster = dataToAdd || currentPoster;
    setQueue((prev: PosterData[]) => {
      const baseQueue = clearFirst ? [] : prev;
      return [...baseQueue, { ...poster, quantity: 1 }];
    });
    
    // Reseta o formulário preservando algumas preferências do usuário
    const resetData = {
      ...initialPosterData(),
      posterSubType: poster.posterSubType,
      paymentOption: poster.paymentOption,
      defectType: poster.defectType,
      customDefectDiscount: poster.customDefectDiscount,
      quantity: 1
    };
    
    lastResetRef.current = JSON.stringify(resetData);
    setCurrentPoster(resetData);
    setIsProductReady(false);
    setSelectedQueueIndex(null);
    setPreviewMode('page');
    
    // Remonta o formulário para renovar o ciclo e aplicar auto-focus na busca
    if (!dataToAdd) {
      setFormKey((k: number) => k + 1);
    }

    setShowAddSuccess(true);
    setTimeout(() => setShowAddSuccess(false), 1500);
    return true;
  }, [currentPoster]);

  const checkOldQueueAndProceed = useCallback((dataToAdd?: PosterData) => {
    const lastUpdate = Number(localStorage.getItem('poster-queue-updated') || Date.now());
    const isStale = (Date.now() - lastUpdate) > 1000 * 60 * 5; // 5 minutos

    if (queue.length > 0 && (hasOldQueue || isStale)) {
      setSecurityModal({
        isOpen: true,
        type: 'warning',
        title: 'Cartazes Antigos na Lista',
        message: 'Detectamos que já existem cartazes na sua lista. Você deseja adicionar este novo cartaz junto com os antigos ou limpar a lista anterior?',
        confirmText: 'LIMPAR E ADICIONAR',
        cancelText: 'MANTER E ADICIONAR',
        onConfirm: () => {
          setSecurityModal(prev => ({ ...prev, isOpen: false }));
          setHasOldQueue(false);
          proceedAddToQueue(dataToAdd, true);
        },
        onCancel: () => {
          setSecurityModal(prev => ({ ...prev, isOpen: false }));
          setHasOldQueue(false);
          proceedAddToQueue(dataToAdd, false);
        }
      });
      return false;
    }
    proceedAddToQueue(dataToAdd);
    return true;
  }, [queue.length, hasOldQueue, proceedAddToQueue]);

  const handleAddToQueue = useCallback(() => {
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
          confirmText: 'CONFIRMAR PREÇO',
          cancelText: 'CORRIGIR',
          onConfirm: () => {
            setSecurityModal(prev => ({ ...prev, isOpen: false }));
            checkOldQueueAndProceed();
          }
        });
        return;
      }
    }

    checkOldQueueAndProceed();
  }, [isProductReady, currentPoster, checkOldQueueAndProceed]);

  // Handler para adição automática disparada pelo leitor de código de barras ou scanner
  const handleAutoAdd = useCallback((data: PosterData, source: AutoAddSource): boolean => {
    const valPor = parsePrice(data.priceFor);
    if (valPor <= 0) return false;
    return checkOldQueueAndProceed(data);
  }, [checkOldQueueAndProceed]);

  // Atalhos Globais de Teclado (F2, Alt+1..4, Ctrl+Enter, Ctrl+P, Escape)
  const hotkeys = useMemo(() => {
    const map: Record<string, (e: KeyboardEvent) => void> = {
      f2: (e) => {
        e.preventDefault();
        formRef.current?.focusSearch();
      },
      'ctrl+enter': (e) => {
        e.preventDefault();
        if (isProductReady) handleAddToQueue();
      },
      'ctrl+p': (e) => {
        e.preventDefault();
        handlePrint();
      },
      escape: (e) => {
        if (selectedQueueIndex !== null) {
          e.preventDefault();
          setSelectedQueueIndex(null);
          setCurrentPoster(initialPosterData());
          setIsProductReady(false);
          formRef.current?.focusSearch();
        } else if (isProductReady) {
          e.preventDefault();
          setCurrentPoster(initialPosterData());
          setIsProductReady(false);
          setFormKey(k => k + 1);
        }
      },
    };

    // Alt+1 até Alt+N para trocar formato de impressão
    VISIBLE_FORMATS.forEach((fmt, idx) => {
      map[`alt+${idx + 1}`] = (e) => {
        e.preventDefault();
        handlePosterTypeChange(fmt.id);
      };
    });

    return map;
  }, [isProductReady, handleAddToQueue, handlePrint, selectedQueueIndex]);

  useHotkeys(hotkeys, { enabled: !securityModal.isOpen && !showAbout && !showDatabase && !showAutomation });

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

      setTimeout(async () => {
        try {
          let imported: any[] = [];
          
          if (isExcel) {
            const buffer = event.target?.result as ArrayBuffer;
            imported = parseProductExcel(buffer, settings);
          } else {
            const content = event.target?.result as string;
            imported = parseProductCSV(content, settings);
          }

          let filtered: any[] = [];
          if (importMode === 'offer') {
            filtered = imported.filter((item: any) => item.posterSubType === 'offer');
            // Se o arquivo tiver apenas produtos sem preço DE, carrega todos como ofertas
            if (filtered.length === 0 && imported.length > 0) {
              filtered = imported;
            }
          } else {
            filtered = imported.filter((item: any) => item.posterSubType === 'normal');
            // Se o operador escolheu "Gerar Etiquetas (Branco)", mas o relatório era de promoções,
            // converte para preço normal usando o preço final (POR) para gerar as etiquetas de gôndola brancas
            if (filtered.length === 0 && imported.length > 0) {
              filtered = imported.map((item: any) => ({
                ...item,
                posterSubType: 'normal',
                priceFrom: '',
              }));
            }
          }

          if (filtered.length > 0) {
            const keysToLookup = Array.from(new Set(filtered.map(item => item.code || item.ean).filter(Boolean)));
            if (keysToLookup.length > 0) {
              const res = await fetch('/api/produto/bulk-lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keys: keysToLookup })
              });
              
              if (res.ok) {
                const data = await res.json();
                if (data.results) {
                  filtered = filtered.map(item => {
                    const dbItem = data.results[item.code] || data.results[item.ean];
                    if (dbItem) {
                      return {
                        ...item,
                        supplier: item.supplier || dbItem.supplier || '',
                        reference: item.reference || dbItem.reference || '',
                        description: item.description && item.description.length > 2 ? item.description : (dbItem.description || item.description),
                      };
                    }
                    return item;
                  });
                }
              }
            }

            const proceedImport = (clearFirst: boolean) => {
              setQueue(prev => clearFirst ? [...filtered] : [...prev, ...filtered]);
              setQueueFilter(importMode === 'offer' ? 'offer' : 'normal');
              setImportCount(filtered.length);
              setImportStatus('success');
              setPreviewMode('page'); 
              
              if (importMode === 'normal' && (posterType === 'reliquias' || posterType === 'reliquias-a6')) {
                setPosterType('etiqueta-oficial');
              }
            };

            const lastUpdate = Number(localStorage.getItem('poster-queue-updated') || Date.now());
            const isStale = (Date.now() - lastUpdate) > 1000 * 60 * 5;

            if (queue.length > 0 && (hasOldQueue || isStale)) {
              setSecurityModal({
                isOpen: true,
                type: 'warning',
                title: 'Cartazes Antigos na Lista',
                message: 'Detectamos que já existem cartazes na sua lista. Você deseja adicionar este novo lote junto com os antigos ou limpar a lista anterior?',
                confirmText: 'LIMPAR E ADICIONAR',
                cancelText: 'MANTER E ADICIONAR',
                onConfirm: () => {
                  setSecurityModal(prev => ({ ...prev, isOpen: false }));
                  setHasOldQueue(false);
                  proceedImport(true);
                },
                onCancel: () => {
                  setSecurityModal(prev => ({ ...prev, isOpen: false }));
                  setHasOldQueue(false);
                  proceedImport(false);
                }
              });
            } else {
              proceedImport(false);
            }
          } else {
            setImportStatus('error');
          }
        } catch (e) {
          console.error(e);
          setImportStatus('error');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      }, 100);
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file, 'ISO-8859-1');
    }
  };

  const renderPrintContent = () => {
    const pagesToPrint = printPages.length > 0 ? printPages : (isProductReady ? [[currentPoster]] : []);
    if (pagesToPrint.length === 0) return null;

    return pagesToPrint.map((pageItems, pageIdx: number) => (
      <div
        key={pageIdx}
        className="print-page bg-white"
        style={{
          width:          orientation === 'landscape' ? '297mm'  : '210mm',
          height:         orientation === 'landscape' ? '210mm'  : '297mm',
          pageBreakAfter: pageIdx < pagesToPrint.length - 1 ? 'always' : 'auto',
          breakAfter:     pageIdx < pagesToPrint.length - 1 ? 'page'   : 'auto',
        }}
      >
        <PageGrid items={pageItems} posterType={posterType} perPage={perPage} settings={settings} />
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background text-foreground font-sans selection:bg-primary selection:text-white overscroll-none print:block print:h-auto print:min-h-0">
      
      {/* Modais da Aplicação */}
      <DisclaimerModal />
      <AboutPanel open={showAbout} onClose={() => setShowAbout(false)} />
      <DatabasePanel 
        open={showDatabase} 
        onClose={() => setShowDatabase(false)} 
        onImportSessionData={handleImportSessionData}
        onClearSessionData={handleClearSessionData}
        hasSessionData={hasSessionData}
      />
      <AutomationModal 
        isOpen={showAutomation} 
        onClose={() => setShowAutomation(false)} 
        onSelectFile={(mode) => {
          setImportMode(mode);
          fileInputRef.current?.click();
        }} 
      />
      <SecurityModal 
        {...securityModal} 
        onClose={() => setSecurityModal(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* ── HEADER COMPACTO E LIMPO (SEM SELETOR REDUNDANTE) ── */}
      <header className="no-print shrink-0 px-4 py-2.5 border-b bg-card z-20">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-primary-foreground font-black text-sm tracking-tighter">RD</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-headline text-base sm:text-lg font-black uppercase tracking-tight leading-none truncate">
                RD CARTAZ
              </h1>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:inline">
                Relíquias da Diversão
              </span>
            </div>
            {hasSessionData && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md animate-pulse shrink-0 ml-1">
                <Database className="h-3 w-3 text-blue-500" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">Sessão Ativa</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border"
              title="Sobre esta ferramenta"
            >
              <Info className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sobre</span>
            </button>
            <SettingsDialog 
              settings={settings} 
              onSave={saveSettings} 
              onOpenDatabase={() => setShowDatabase(true)} 
              onImportSessionData={handleImportSessionData}
              onClearSessionData={handleClearSessionData}
              hasSessionData={hasSessionData}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".csv, .xls, .xlsx"
              className="hidden"
            />
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={queue.length === 0 && !isProductReady}
                className="h-9 px-3 text-xs font-bold transition-transform active:scale-95"
              >
                <FileDown className="mr-1.5 h-3.5 w-3.5" />
                Salvar PDF
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={queue.length === 0 && !isProductReady}
                className="h-9 px-3.5 text-xs font-black uppercase tracking-wider transition-transform active:scale-95 shadow-sm"
              >
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Imprimir {totalPages > 0 ? `(${totalPages}p)` : (isProductReady ? '(1p)' : '')}
                <Kbd className="ml-2 hidden lg:inline-flex bg-primary-foreground/20 text-primary-foreground border-white/20 shadow-none">
                  Ctrl+P
                </Kbd>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Print output (oculto na tela, visível na impressão física) ── */}
      <div className="print-container" style={{ display: 'none' }}>
        {renderPrintContent()}
      </div>

      {/* ── MAIN WORKSPACE (SPLIT-SCREEN RESPONSIVO) ── */}
      <main className="no-print flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 h-full overflow-hidden">

          {/* ══════════ COLUNA 1: FORMULÁRIO DE INPUT & CONTROLE ══════════ */}
          <aside className={cn(
            "w-full lg:w-[390px] xl:w-[410px] shrink-0 flex flex-col border-r border-border bg-card lg:min-h-0 h-full overflow-hidden z-10",
            activeTab !== 'edit' && "hidden lg:flex"
          )}>
            {/* Seletor Único de Formato integrado ao painel de controle */}
            <div className="shrink-0 p-4 pb-2 border-b bg-muted/10">
              <FormatSelector 
                value={posterType} 
                onChange={handlePosterTypeChange} 
              />
            </div>

            {/* Conteúdo rolável do formulário de produto e preços */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              <PosterForm
                ref={formRef}
                key={`form-${formKey}`}
                data={currentPoster}
                setData={setCurrentPoster}
                posterType={posterType}
                settings={settings}
                onLookupStatusChange={setIsProductReady}
                onImportBatch={() => setShowAutomation(true)}
                sessionProducts={sessionProducts}
                onAutoAdd={handleAutoAdd}
                onSubmit={handleAddToQueue}
                continuousScan={continuousScan}
                onContinuousScanChange={handleContinuousScanChange}
                autoFocus={true}
              />
            </div>

            {/* Botão de Adicionar fixo no rodapé do painel de input */}
            <div className="shrink-0 p-4 pt-2 border-t bg-card">
              <Button
                id="add-to-queue-btn"
                onClick={handleAddToQueue}
                disabled={!isProductReady || showAddSuccess}
                className={cn(
                  'w-full h-13 text-sm font-black uppercase tracking-wider gap-2 transition-all shadow-md',
                  showAddSuccess 
                    ? 'bg-emerald-600 hover:bg-emerald-600 scale-[1.01] shadow-emerald-200' 
                    : isProductReady 
                      ? 'bg-primary hover:bg-primary/90 shadow-primary/20 scale-[1.01]' 
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {showAddSuccess ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 animate-in zoom-in duration-300" />
                    Adicionado ao Lote!
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    <span>Adicionar ao Lote</span>
                    <Kbd className="ml-auto hidden lg:inline-flex bg-primary-foreground/20 text-primary-foreground border-white/20 shadow-none">
                      Ctrl+Enter
                    </Kbd>
                  </>
                )}
              </Button>
            </div>
          </aside>

          {/* ══════════ COLUNA 2: LOTE ATUAL (DESKTOP >= 1280px OU ABA MOBILE) ══════════ */}
          {/* Em telas XL (>= 1280px), o lote fica como coluna dedicada no meio */}
          <div className={cn(
            "w-full xl:w-[340px] shrink-0 border-r border-border bg-muted/5 min-h-0 h-full overflow-hidden",
            activeTab === 'queue' ? "flex flex-col" : "hidden xl:flex xl:flex-col"
          )}>
            <QueuePanel
              queue={queue}
              filteredQueue={filteredQueue}
              printPages={printPages}
              posterType={posterType}
              perPage={perPage}
              selectedIndex={selectedQueueIndex}
              onSelect={(realIdx, item) => {
                setSelectedQueueIndex(realIdx);
                setCurrentPoster({ ...item });
                setIsProductReady(true);
                setPreviewMode('single');
              }}
              onRemove={handleRemoveFromQueue}
              onUpdateQuantity={handleUpdateQuantity}
              onClear={() => setQueue([])}
              onShowHidden={() => setQueueFilter('all')}
              className="h-full"
            />
          </div>

          {/* ══════════ COLUNA 3: PRÉVIA EM TEMPO REAL (+ LOTE EM TELAS 1024-1279px) ══════════ */}
          <div className={cn(
            "flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-muted/20",
            activeTab !== 'preview' && "hidden lg:flex"
          )}>
            {/* Área superior: Visualizador do Cartaz / Página */}
            <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-2 overflow-hidden">
              <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    Visualização em Tempo Real
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-muted p-1 rounded-xl shadow-inner border border-border/50">
                    <button 
                      onClick={() => setPreviewMode('single')}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                        previewMode === 'single' ? "bg-background text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                      )}
                    >
                      INDIVIDUAL
                    </button>
                    <button 
                      onClick={() => setPreviewMode('page')}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black rounded-lg transition-all",
                        previewMode === 'page' ? "bg-background text-primary shadow-sm scale-105" : "text-muted-foreground hover:bg-black/5"
                      )}
                    >
                      PÁGINA COMPLETA
                    </button>
                  </div>
                </div>
              </div>

              {/* Viewport da Prévia */}
              <div className="flex-1 min-h-0 relative border rounded-xl border-border/50 overflow-hidden bg-white shadow-inner">
                <div className="absolute inset-0">
                  {previewMode === 'single' ? (
                    <SinglePosterPreview
                      data={isProductReady ? currentPoster : (selectedQueueIndex !== null && queue[selectedQueueIndex] ? queue[selectedQueueIndex] : (queue.length > 0 ? queue[queue.length - 1] : currentPoster))}
                      posterType={posterType}
                      isReady={isProductReady || queue.length > 0}
                      settings={settings}
                    />
                  ) : (
                    <PagePreview
                      pages={printPages.length > 0 ? printPages : (isProductReady ? [[currentPoster]] : [])}
                      posterType={posterType}
                      perPage={perPage}
                      settings={settings}
                    />
                  )}
                </div>
              </div>

              {/* Rodapé da Prévia com status */}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 py-1">
                {queue.length > 0 ? (
                  <>
                    <span>Total: {queue.length} {queue.length === 1 ? 'Item' : 'Itens'}</span>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span>
                      Impressão: {totalPages} {totalPages === 1 ? 'Folha' : 'Folhas'}
                      {` (${currentFormat.caption})`}
                    </span>
                  </>
                ) : isProductReady ? (
                  <span className="text-primary bg-primary/10 px-3 py-0.5 rounded-full">
                    {currentFormat.description}
                  </span>
                ) : null}
              </div>

              {/* Mobile Save Button & Instruções */}
              {(queue.length > 0 || isProductReady) && (
                <div className="lg:hidden space-y-2.5 mt-1">
                  <Button
                    onClick={handlePrint}
                    disabled={queue.length === 0 && !isProductReady}
                    className="w-full h-13 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    <FileDown className="h-5 w-5" />
                    Salvar PDF para Imprimir {totalPages > 0 ? `(${totalPages}p)` : ''}
                  </Button>
                  
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2.5">
                    <Info className="h-4 w-4 text-blue-700 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-800 leading-snug">
                      Ao clicar em <b>Salvar PDF</b>, o arquivo será baixado no seu celular. Para imprimir, envie este arquivo para o WhatsApp ou E-mail da loja.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Em telas intermediárias (1024px a 1279px), o Lote aparece acoplado na parte inferior da coluna da direita */}
            <div className="hidden lg:flex xl:hidden h-[240px] border-t border-border flex-col min-h-0 bg-card">
              <QueuePanel
                queue={queue}
                filteredQueue={filteredQueue}
                printPages={printPages}
                posterType={posterType}
                perPage={perPage}
                selectedIndex={selectedQueueIndex}
                onSelect={(realIdx, item) => {
                  setSelectedQueueIndex(realIdx);
                  setCurrentPoster({ ...item });
                  setIsProductReady(true);
                  setPreviewMode('single');
                }}
                onRemove={handleRemoveFromQueue}
                onUpdateQuantity={handleUpdateQuantity}
                onClear={() => setQueue([])}
                onShowHidden={() => setQueueFilter('all')}
                className="h-full"
              />
            </div>
          </div>

        </div>
      </main>

      {/* ── BARRA DE NAVEGAÇÃO INFERIOR (EXCLUSIVA MOBILE < 1024px) ── */}
      <nav aria-label="Navegação mobile" className="lg:hidden sticky bottom-0 left-0 right-0 h-[68px] bg-white border-t border-border z-[100] flex items-center justify-around px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] shrink-0">
        <button
          type="button"
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
          type="button"
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
          type="button"
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
      </nav>

      {/* Modal de Feedback de Importação em Lote */}
      <ImportModal 
        status={importStatus} 
        mode={importMode}
        count={importCount} 
        onClose={() => setImportStatus('idle')} 
      />
    </div>
  );
}
