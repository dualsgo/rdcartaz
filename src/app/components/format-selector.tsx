'use client';

import type { PosterType } from '@/app/lib/types';
import { VISIBLE_FORMATS, getPosterFormat, orientationLabel } from '@/app/lib/poster-formats';
import { cn } from '@/lib/utils';

type FormatSelectorProps = {
  value: PosterType;
  onChange: (type: PosterType) => void;
  className?: string;
};

/**
 * Seletor ÚNICO de formato de impressão (antes duplicado em header, formulário e prévia).
 * Segmented control compacto, com atalhos Alt+1..N.
 */
export function FormatSelector({ value, onChange, className }: FormatSelectorProps) {
  const current = getPosterFormat(value);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Formato
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground truncate" title={current.description}>
          {current.description} · {orientationLabel(value)}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Formato de impressão"
        className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-xl border border-border/50 shadow-inner"
      >
        {VISIBLE_FORMATS.map((f, i) => {
          const active = value === f.id;
          return (
            <button
              key={f.id}
              id={`format-${f.id}`}
              type="button"
              role="radio"
              aria-checked={active}
              title={`${f.label} — ${f.description} (Alt+${i + 1})`}
              onClick={() => onChange(f.id)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg px-1 py-1.5 leading-tight',
                'transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'bg-background text-primary shadow-sm ring-1 ring-black/5'
                  : 'text-muted-foreground hover:bg-black/5 hover:text-foreground'
              )}
            >
              <span className="text-[11px] font-black uppercase tracking-tight whitespace-nowrap">{f.shortLabel}</span>
              <span className="text-[9px] font-medium opacity-70 whitespace-nowrap">{f.caption}</span>
              <span aria-hidden className="hidden lg:block absolute top-0.5 right-1 text-[8px] font-mono opacity-40">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
