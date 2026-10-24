import * as React from 'react';
import { cn } from '@/lib/utils';

/** Dica visual de atalho de teclado. Oculta em telas < lg (touch/mobile). */
export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        'hidden lg:inline-flex items-center h-[18px] px-1.5 rounded border border-border bg-muted',
        'font-mono text-[10px] font-semibold leading-none text-muted-foreground normal-case tracking-normal',
        'shadow-[inset_0_-1px_0_hsl(var(--border))]',
        className
      )}
    >
      {children}
    </kbd>
  );
}
