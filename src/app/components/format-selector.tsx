'use client';

import type { PosterType, CampaignMode, EnabledFormats } from '@/app/lib/types';
import { getVisibleFormats, getPosterFormat, orientationLabel } from '@/app/lib/poster-formats';
import { cn } from '@/lib/utils';

type FormatSelectorProps = {
  value: PosterType;
  onChange: (type: PosterType) => void;
  className?: string;
  campaignMode?: CampaignMode;
  campaignBrand?: 'rihappy' | 'pbkids';
  enabledFormats?: EnabledFormats;
};

/**
 * Seletor ÚNICO de formato de impressão (antes duplicado em header, formulário e prévia).
 * Segmented control compacto, com atalhos Alt+1..N.
 */
export function FormatSelector({ value, onChange, className, campaignMode = 'regular', campaignBrand, enabledFormats }: FormatSelectorProps) {
  const formats = getVisibleFormats(campaignMode, enabledFormats);
  const current = getPosterFormat(value, campaignMode, campaignBrand);

  const gridColsClass =
    formats.length <= 2 ? 'grid-cols-2' :
    formats.length === 3 ? 'grid-cols-3' :
    formats.length === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Formato
          </span>
          {campaignMode !== 'regular' && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-amber-400 tracking-wider whitespace-nowrap">
              {campaignMode === 'friday'
                ? (campaignBrand === 'pbkids' ? 'Best Friday' : 'Happy Friday')
                : '50% OFF'}
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-semibold text-muted-foreground truncate text-right min-w-0"
          title={`${current.description} · ${orientationLabel(value, campaignMode, campaignBrand)}`}
        >
          {current.caption} · {orientationLabel(value, campaignMode, campaignBrand)}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Formato de impressão"
        className={cn(
          'grid gap-1 p-1 bg-muted rounded-xl border border-border/50 shadow-inner',
          gridColsClass
        )}
      >
        {formats.map((rawF, i) => {
          const f = getPosterFormat(rawF.id, campaignMode, campaignBrand);
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
