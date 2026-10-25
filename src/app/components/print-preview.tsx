'use client';

/**
 * Componentes de prévia/impressão extraídos de page.tsx sem alteração de lógica.
 * `PageGrid` é usado tanto na prévia quanto na saída de impressão real.
 */

import React, { useState, useEffect, useRef } from 'react';
import { PackageOpen } from 'lucide-react';
import { PosterPreview } from '@/app/components/poster-preview';
import { PosterPreviewEtiquetaOficial } from '@/app/components/poster-preview-etiqueta-oficial';
import { PosterPreviewVitrine } from '@/app/components/poster-preview-vitrine';
import { PosterPreviewAereo } from '@/app/components/poster-preview-aereo';
import { PosterPreviewTotem } from '@/app/components/poster-preview-totem';
import type { PosterData, PosterSettings, PosterType } from '@/app/lib/types';
import { POSTER_FORMATS } from '@/app/lib/poster-formats';
import { cn } from '@/lib/utils';

/* ─────────────────────────── SinglePosterPreview ─────────────────────────── */
// Mostra um cartaz individual em fundo cinza (simulação de papel).
export function SinglePosterPreview({
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
  const dims = POSTER_FORMATS[posterType]?.singleDims || { w: 491, h: 340 };
  const { w, h } = dims;

  // Para o aéreo, o preview mostra apenas a área de conteúdo (75%),
  // ocultando o espaço em branco do topo sem alterar a impressão.
  const blankFraction  = posterType === 'aereo' ? 0.22 : 0;
  const previewH       = Math.round(h * (1 - blankFraction));
  const blankOffsetPx  = Math.round(h * blankFraction);

  useEffect(() => {
    // Recalcula escala quando o tipo muda ou dimensões mudam
    setReady(false);

    const outer = outerRef.current;
    if (!outer) return;

    const apply = () => {
      const cw = outer.clientWidth;
      const ch = outer.clientHeight;
      if (cw === 0 || ch === 0) return;
      setScale(Math.min(cw / w, ch / previewH) * 0.96);

      setReady(true);
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(outer);
    return () => ro.disconnect();
  }, [posterType, w, h, previewH]);

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
            height: `${previewH}px`,
            flexShrink: 0,
            transformOrigin: 'center center',
            transform: `scale(${scale})`,
            visibility: ready ? 'visible' : 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 8px 32px -4px rgb(0 0 0 / 0.35)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Cartaz deslocado para cima para esconder o branco inicial */}
          <div style={{ marginTop: blankOffsetPx > 0 ? `-${blankOffsetPx}px` : undefined, width: '100%', height: `${h}px` }}>
            {posterType === 'reliquias' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '13.6cm', height: '9.0cm' }}>
                  <PosterPreview {...data} isImperdiveis={false} settings={settings} />
                </div>
              </div>
            )}
            {posterType === 'reliquias-a6' && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '13.6cm', height: '9.0cm', transform: 'scale(0.95)', transformOrigin: 'center center' }}>
                  <PosterPreview {...data} isImperdiveis={false} settings={settings} />
                </div>
              </div>
            )}
            {posterType === 'etiqueta-oficial' && <PosterPreviewEtiquetaOficial {...data} settings={settings} />}
            {posterType === 'vitrine' && <PosterPreviewVitrine {...data} settings={settings} />}
            {posterType === 'aereo' && <PosterPreviewAereo {...data} settings={settings} />}
            {posterType === 'totem' && <PosterPreviewTotem {...data} settings={settings} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── PagePreview (Scaled Batch) ─────────────────── */
export function PagePreview({ 
  pages, 
  posterType, 
  perPage, 
  settings 
}: { 
  pages: PosterData[][]; 
  posterType: PosterType; 
  perPage: number; 
  settings: PosterSettings;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const totalPages = pages.length;
  const orientation = POSTER_FORMATS[posterType]?.orientation || 'landscape';
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
        {pages.map((pageItems, idx) => (
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
                items={pageItems} 
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
export function PageGrid({
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
  const pageBgClass = 'bg-white';
  const allSlots = Array.from({ length: perPage }).map((_, i) => items[i] || null);
  const isPortrait = posterType !== 'reliquias' && posterType !== 'reliquias-a6';

  // Overlay das perfurações físicas do papel (sempre 16 gôndolas de ponta a ponta + margens)
  const renderPerforations = () => {
    if (isPortrait) {
      return (
        <div className="absolute inset-0 pointer-events-none print:hidden z-50">
          {/* Margens (bordas destacáveis) */}
          <div className="absolute top-0 bottom-0 left-[16mm] border-l border-dashed border-black/40" />
          <div className="absolute top-0 bottom-0 right-[14mm] border-r border-dashed border-black/40" />
          <div className="absolute left-0 right-0 top-[14.2mm] border-t border-dashed border-black/40" />
          <div className="absolute left-0 right-0 bottom-[10.8mm] border-b border-dashed border-black/40" />
          
          {/* Linha vertical central */}
          <div className="absolute top-0 bottom-0 left-[106mm] border-l border-dashed border-black/40" />
          
          {/* 7 Linhas horizontais centrais */}
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="absolute left-0 right-0 border-t border-dashed border-black/40" style={{ top: `${14.2 + 34 * i}mm` }} />
          ))}
        </div>
      );
    } else {
      return (
        <div className="absolute inset-0 pointer-events-none print:hidden z-50">
          {/* Margens (bordas destacáveis rotacionadas) */}
          <div className="absolute left-0 right-0 top-[16mm] border-t border-dashed border-black/40" />
          <div className="absolute left-0 right-0 bottom-[14mm] border-b border-dashed border-black/40" />
          <div className="absolute top-0 bottom-0 left-[14.2mm] border-l border-dashed border-black/40" />
          <div className="absolute top-0 bottom-0 right-[10.8mm] border-r border-dashed border-black/40" />

          {/* Linha horizontal central */}
          <div className="absolute left-0 right-0 top-[106mm] border-t border-dashed border-black/40" />
          
          {/* 7 Linhas verticais centrais */}
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="absolute top-0 bottom-0 border-l border-dashed border-black/40" style={{ left: `${14.2 + 34 * i}mm` }} />
          ))}
        </div>
      );
    }
  };

  if (posterType === 'aereo') {
    return (
      <div 
        className={cn("w-full h-full relative", pageBgClass)}
        style={{ 
        display: 'grid', 
        gridTemplateColumns: '174mm', 
        gridTemplateRows: 'repeat(2, 131mm)', 
        gap: '5mm', 
        justifyContent: 'center',
        alignContent: 'start',
        paddingTop: '15mm', 
        paddingBottom: '11mm', 
        paddingLeft: '13mm', 
        paddingRight: '13mm', 
        boxSizing: 'border-box', 
      }}>
        {allSlots.map((d, i) => (
          <div 
            key={i} 
            className="relative flex items-center justify-center box-border overflow-hidden print:border-none"
            style={{ width: '174mm', height: '131mm' }}
          >
            {d ? (
              <div style={{ width: '174mm', height: '131mm' }}>
                <PosterPreviewAereo {...d} settings={settings} />
              </div>
            ) : (
              <div style={{ width: '174mm', height: '131mm', backgroundColor: 'transparent' }} />
            )}
          </div>
        ))}
        {renderPerforations()}
      </div>
    );
  }

  if (posterType === 'totem') {
    return (
      <div className={cn("w-full h-full pt-[0.3cm] relative", pageBgClass)}>
        {items[0] && <PosterPreviewTotem {...items[0]} settings={settings} />}
        {renderPerforations()}
      </div>
    );
  }

  if (posterType === 'etiqueta-oficial' || posterType === 'vitrine') {
    return (
      <div 
        className={cn("w-full h-full relative", pageBgClass)}
        style={{ 
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
        boxSizing: 'border-box', 
      }}>
        {allSlots.map((d, i) => (
          <div 
            key={i} 
            className="relative overflow-hidden pt-[1mm] box-border print:border-none"
            style={{ width: '90mm', height: '34.0mm' }}
          >
            {d && (
              posterType === 'vitrine' 
                ? <PosterPreviewVitrine {...d} settings={settings} /> 
                : <PosterPreviewEtiquetaOficial {...d} settings={settings} />
            )}
          </div>
        ))}
        {renderPerforations()}
      </div>
    );
  }

  // Relíquias A4 (Folha Inteira - 1 cartaz por folha A4 paisagem)
  if (posterType === 'reliquias') {
    const d = items[0];
    return (
      <div 
        className={cn("w-full h-full relative flex items-center justify-center overflow-hidden", pageBgClass)}
        style={{
          width: '297mm',
          height: '210mm',
          boxSizing: 'border-box',
        }}
      >
        {d && (
          <div 
            style={{ 
              width: '13.6cm', 
              height: '9.0cm', 
              transform: 'scale(2)', 
              transformOrigin: 'center center',
              flexShrink: 0,
            }}
          >
            <PosterPreview {...d} isImperdiveis={false} settings={settings} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn("w-full h-full relative", pageBgClass)}
      style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 13.6cm)',
      gridTemplateRows: 'repeat(2, 9.0cm)',
      justifyContent: 'center',
      alignContent: 'center',
      paddingTop: '16mm',
      paddingBottom: '14mm',
      paddingLeft: '14.2mm',
      paddingRight: '10.8mm',
      boxSizing: 'border-box',
    }}>
      {allSlots.map((d, i) => (
        <div 
          key={i} 
          className="flex items-center justify-center overflow-hidden box-border print:border-none"
          style={{ width: '13.6cm', height: '9.0cm' }}
        >
          {d && (
            <div 
              style={{ 
                width: '13.6cm', 
                height: '9.0cm', 
                transform: 'scale(0.95)', 
                transformOrigin: 'center center', 
                overflow: 'hidden' 
              }}
            >
              <PosterPreview {...d} isImperdiveis={false} settings={settings} />
            </div>
          )}
        </div>
      ))}
      {renderPerforations()}
    </div>
  );
}
