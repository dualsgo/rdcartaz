'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileStack, 
  PackageOpen, 
  Trash2, 
  SlidersHorizontal, 
  ArrowDownUp, 
  Package, 
  Building2, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Tag
} from 'lucide-react';
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
  queueSort?: 'stock-desc' | 'stock-asc' | 'discount-desc' | 'price-asc' | 'price-desc' | 'name-asc' | 'none';
  onSortChange?: (sort: string) => void;
  supplierFilter?: string;
  onSupplierFilterChange?: (supplier: string) => void;
  stockFilter?: 'all' | 'with-stock' | 'no-stock';
  onStockFilterChange?: (stock: string) => void;
  priceRangeFilter?: 'all' | 'under-50' | '50-100' | 'over-100';
  onPriceRangeFilterChange?: (range: string) => void;
  availableSuppliers?: string[];
  hasStockData?: boolean;
  onResetFilters?: () => void;
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
  queueSort = 'stock-desc',
  onSortChange,
  supplierFilter = 'all',
  onSupplierFilterChange,
  stockFilter = 'all',
  onStockFilterChange,
  priceRangeFilter = 'all',
  onPriceRangeFilterChange,
  availableSuppliers = [],
  hasStockData = false,
  onResetFilters,
  className,
}: QueuePanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const hiddenCount = queue.length - filteredQueue.length;
  const totalUnits = filteredQueue.reduce((acc, item) => acc + (item.quantity || 1), 0);

  // Conta fornecedores no lote completo
  const supplierCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    queue.forEach(item => {
      if (item.supplier) {
        counts[item.supplier] = (counts[item.supplier] || 0) + 1;
      }
    });
    return counts;
  }, [queue]);

  const hasActiveFilters = 
    supplierFilter !== 'all' || 
    stockFilter !== 'all' || 
    priceRangeFilter !== 'all' ||
    queueSort !== 'stock-desc';

  return (
    <section aria-label="Lote atual" className={cn('flex flex-col min-h-0 bg-muted/5 overflow-hidden', className)}>
      {/* ── Top Bar do Lote ── */}
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
          {queue.length > 0 && (
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-all",
                showFilters || hasActiveFilters
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
              title="Abrir submenu de filtros e ordenação por estoque/fornecedor"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
              {showFilters ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
            </button>
          )}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onShowHidden}
              className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 hover:bg-orange-100"
              title="Itens ocultados pelos filtros. Clique para mostrar todos."
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

      {/* ── Submenu de Ordenação e Filtros Inteligentes (Estoque, Fornecedor, Preço) ── */}
      {showFilters && queue.length > 0 && (
        <div className="shrink-0 p-3 bg-muted/40 border-b border-border/60 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowDownUp className="h-3 w-3 text-primary" />
              Ordenar Lote
            </span>
            {hasActiveFilters && onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-[9px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 underline"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Resetar Filtros
              </button>
            )}
          </div>

          {/* Seletor de Ordenação */}
          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={queueSort}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="col-span-2 h-7 px-2 text-[11px] font-bold bg-background border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="stock-desc">📦 Maior Estoque (Prioritário)</option>
              <option value="stock-asc">📦 Menor Estoque</option>
              <option value="discount-desc">🏷️ Maior Desconto (%)</option>
              <option value="price-asc">💰 Menor Preço (POR)</option>
              <option value="price-desc">💰 Maior Preço (POR)</option>
              <option value="name-asc">🔤 Descrição (A-Z)</option>
              <option value="none">⏱️ Ordem Original do Arquivo</option>
            </select>
          </div>

          {/* Filtro por Fornecedor (se houver fornecedores mapeados) */}
          {availableSuppliers.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-primary" />
                Fornecedor
              </span>
              <select
                value={supplierFilter}
                onChange={(e) => onSupplierFilterChange?.(e.target.value)}
                className="w-full h-7 px-2 text-[11px] font-bold bg-background border rounded-md text-foreground focus:ring-1 focus:ring-primary outline-none truncate"
              >
                <option value="all">Todos os Fornecedores ({queue.length})</option>
                {availableSuppliers.map(sup => (
                  <option key={sup} value={sup}>
                    {sup} ({supplierCounts[sup] || 0})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtros Rápidos de Estoque e Faixa de Preço */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
            {/* Estoque */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Package className="h-2.5 w-2.5" />
                Estoque
              </span>
              <select
                value={stockFilter}
                onChange={(e) => onStockFilterChange?.(e.target.value)}
                className="w-full h-6 px-1.5 text-[10px] font-semibold bg-background border rounded text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">Todos</option>
                <option value="with-stock">Com Estoque (&gt;0)</option>
                <option value="no-stock">Sem Estoque (0 un)</option>
              </select>
            </div>

            {/* Faixa de Preço */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Tag className="h-2.5 w-2.5" />
                Preço POR
              </span>
              <select
                value={priceRangeFilter}
                onChange={(e) => onPriceRangeFilterChange?.(e.target.value)}
                className="w-full h-6 px-1.5 text-[10px] font-semibold bg-background border rounded text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">Todos</option>
                <option value="under-50">Até R$ 50</option>
                <option value="50-100">R$ 50 a R$ 100</option>
                <option value="over-100">Acima de R$ 100</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <SheetOccupancy printPages={printPages} posterType={posterType} />

      {/* ── Lista de Itens do Lote ── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredQueue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
            <PackageOpen className="h-10 w-10 mb-2" />
            <p className="text-xs font-medium uppercase tracking-tighter">
              {queue.length > 0 ? 'Nenhum item compatível com os filtros' : 'O lote está vazio'}
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

                        <p className="text-[9px] text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
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

                        {/* Badges de Estoque e Fornecedor */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {item.stock !== undefined && item.stock !== null && (
                            <span
                              className={cn(
                                "text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 tabular-nums",
                                item.stock > 0 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              )}
                              title={`Estoque disponível no relatório: ${item.stock} unidades`}
                            >
                              <Package className="h-2.5 w-2.5 shrink-0" />
                              {item.stock} un
                            </span>
                          )}
                          {item.supplier && (
                            <span 
                              className="text-[9px] text-muted-foreground truncate max-w-[140px]" 
                              title={`Fornecedor: ${item.supplier}`}
                            >
                              🏢 {item.supplier}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Controle de Quantidade */}
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
