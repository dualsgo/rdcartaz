'use client';

import { useEffect, useRef } from 'react';

export type HotkeyHandler = (e: KeyboardEvent) => void;
export type HotkeyMap = Record<string, HotkeyHandler>;

type Options = {
  /** Desliga todos os atalhos (ex: algum modal controlado pela página está aberto) */
  enabled?: boolean;
  /** Chamado para teclas sem atalho registrado (ex: captura de leitor de código de barras) */
  onUnhandledKey?: HotkeyHandler;
};

/** True se o alvo do evento é um campo onde o usuário digita texto. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function hasOpenDialog(): boolean {
  return !!document.querySelector('[role="dialog"], [role="alertdialog"]');
}

/**
 * Normaliza o evento em uma string como "ctrl+enter", "alt+1", "f2", "escape".
 * Dígitos usam `e.code` para funcionar com Alt em qualquer layout de teclado.
 */
function toCombo(e: KeyboardEvent): string {
  let key = e.key.toLowerCase();
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
  if (digit) key = digit[1];

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.altKey) parts.push('alt');
  if (e.shiftKey && key.length > 1) parts.push('shift');
  parts.push(key);
  return parts.join('+');
}

/**
 * Atalhos globais de teclado. Ficam inativos automaticamente enquanto houver
 * qualquer diálogo aberto (role="dialog"), para não conflitar com modais.
 */
export function useHotkeys(bindings: HotkeyMap, options: Options = {}) {
  const latest = useRef({ bindings, ...options });

  useEffect(() => {
    latest.current = { bindings, ...options };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const { bindings, enabled = true, onUnhandledKey } = latest.current;
      if (e.isComposing || !enabled || hasOpenDialog()) return;

      const fn = bindings[toCombo(e)];
      if (fn) {
        if (e.repeat) { e.preventDefault(); return; }
        fn(e);
        return;
      }
      onUnhandledKey?.(e);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
