'use client';

import React from 'react';
import { FileStack, PackageOpen, Trash2 } from 'lucide-react';
import type { PosterData, PosterType } from '@/app/lib/types';
import { getPosterFormat } from '@/app/lib/poster-formats';
import { cn } from '@/lib/utils';

/* ─────────────────────────── SheetGlyph ─────────────────────────── */
// Miniatura da folha A4 com os slots na mesma ordem do PageGrid (linha a linha).
function SheetGlyph({ perPage, filled, orientation }: { perPage: number; filled: number; orientation: 'portrait' | 'landscape' }) {
  const cols = perPage >= 4 ? 2 : 1;
  const rows = Math.ceil(perPage / cols);
  const isFull = filled >= perPage;

  return (
    <div
      aria-hidden
      className={cn(
        'shrink-0 grid gap-[2px] p-[3px] rounded-[3px] bg-white border shadow-sm transition-colors',
        orientation === 'portrait' ? 'w-[30px] h-[42px]' : 'w-[42px] h-[30px]',
        isFull ? 'border-emerald-400' : 'border-border'
      )}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {Array.from({ length: perPage }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-[1px] transition-colors duration-300',
            i < filled ? 'bg-emerald-500' : 'bg-muted-foreground/15'
          )}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── SheetOccupancy ─────────────────────────── */
// Ocupação da folha atual, calculada a partir das páginas reais de impressão
// (respeita a regra de não misturar Oferta e Normal na mesma folha).
export function SheetOccupancy({ printPages, posterType }: { printPages: PosterData[][]; posterType: PosterType }) {
  const fmt = getPosterFormat(posterType);
  const perPage = fmt.perPage;
  const totalSheets = printPages.length;
  const filled = totalSheets > 0 ? printPages[totalSheets - 1].length : 0;
  const remaining = Math.max(0, perPage - filled);
  const isFull = totalSheets > 0 && remaining === 0;
  const unit = (n: number) => (n === 1 ? fmt.unit.singular : fmt.unit.plural);
  const sheetsLabel = `${totalSheets} ${totalSheets === 1 ? 'folha' : 'folhas'}`;

  return (
    <div id="sheet-occupancy" className="shrink-0 px-4 py-2.5 border-b bg-card flex items-center gap-3">
      <SheetGlyph perPage={perPage} filled={filled} orientation={fmt.orientation} />
      <div className="min-w-0 flex-1">
        <p className="leading-none flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-black tabular-nums">
            {filled}/{perPage}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground">
            {fmt.unit.plural} na folha{totalSheets > 1 ? ` ${totalSheets}` : ' atual'}
          </span>
          <span className="text-[9px] font-black uppercase bg-muted px-1.5 py-0.5 rounded">{fmt.shortLabel}</span>
        </p>
        <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', isFull ? 'bg-emerald-500' : 'bg-amber-400')}
            style={{ width: `${perPage ? (filled / perPage) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
          {totalSheets === 0
            ? 'Lote vazio'
            : isFull
              ? `Folha completa · ${sheetsLabel}`
              : `Faltam ${remaining} ${unit(remaining)} para completar · ${sheetsLabel}`}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── QueuePanel ─────────────────────────── */
type QueuePanelProps = {
  queue: PosterData[];
  filteredQueue: PosterData[];
  printPages: PosterData[][];
  posterType: PosterType;
  perPage: number;
  selectedIndex: number | null;
  onSelect: (realIndex: number, item: PosterData) => void;
  onRemove: (realIndex: number) => void;
  onUpdateQuantity: (realIndex: number, delta: number) => void;
  onClear: () => void;
  onShowHidden: () => void;
  className?: string;
};

export function QueuePanel({
  queue,
  filteredQueue,
  printPages,
  posterType,
  perPage,
  selectedIndex,
  onSelect,
  onRemove,
  onUpdateQuantity,
  onClear,
  onShowHidden,
  className,
}: QueuePanelProps) {
  const hiddenCount = queue.length - filteredQueue.length;
  const totalUnits = filteredQueue.reduce((acc, item) => acc + (item.quantity || 1), 0);

  return (
    <section aria-label="Lote atual" className={cn('flex flex-col min-h-0 bg-muted/5 overflow-hidden', className)}>
      <div className="shrink-0 px-4 py-2.5 border-b bg-muted/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileStack className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider">Lote Atual</span>
          <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums">
            {filteredQueue.length}
          </span>
          {totalUnits !== filteredQueue.length && (
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
              {totalUnits} un.
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onShowHidden}
              className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 rounded border border-orange-200 hover:bg-orange-100"
              title="Itens filtrados pela importação. Clique para mostrar todos."
            >
              {hiddenCount} OCULTOS
            </button>
          )}
          {queue.length > 0 && (
            <button
              id="clear-queue-button"
              type="button"
              onClick={onClear}
              className="text-[10px] text-destructive hover:underline font-bold uppercase"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      <SheetOccupancy printPages={printPages} posterType={posterType} />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelect(realIndex, item)}
                      onKeyDown={(e) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(realIndex, item); }
                        if (e.key === 'Delete') { e.preventDefault(); onRemove(realIndex); }
                        if (e.key === '+') { e.preventDefault(); onUpdateQuantity(realIndex, 1); }
                        if (e.key === '-') { e.preventDefault(); onUpdateQuantity(realIndex, -1); }
                      }}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 hover:bg-white transition-colors group border-b border-border/30 last:border-b-0 relative cursor-pointer outline-none',
                        'focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        selectedIndex === realIndex && 'bg-primary/5 border-l-2 border-l-primary'
                      )}
                      title="Clique para visualizar · Del remove · +/- altera quantidade"
                    >
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(realIndex);
                        }}
                        className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
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
                          <span className={cn(item.posterSubType === 'offer' ? 'text-orange-600 font-bold' : 'text-blue-600 font-bold')}>
                            {item.posterSubType === 'offer' ? 'OFERTA' : 'NORMAL'}
                          </span>
                          {item.priceFor && (
                            <>
                              <span className="w-1 h-1 bg-border rounded-full" />
                              <span className="font-bold text-foreground">R$ {item.priceFor}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center bg-background border rounded-md p-0.5">
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(realIndex, -1); }}
                          className="w-6 h-6 flex items-center justify-center text-xs hover:bg-muted rounded transition-colors"
                          aria-label="Diminuir quantidade"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-[10px] font-black tabular-nums">{item.quantity || 1}</span>
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => { e.stopPropagation(); onUpdateQuantity(realIndex, 1); }}
                          className="w-6 h-6 flex items-center justify-center text-xs hover:bg-muted rounded transition-colors"
                          aria-label="Aumentar quantidade"
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
    </section>
  );
}
