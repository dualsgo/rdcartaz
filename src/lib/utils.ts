import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * True quando o ponteiro principal é "grosso" (celular/tablet).
 * Usado para NÃO aplicar auto-focus, evitando abrir o teclado virtual sem o usuário pedir.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(pointer: coarse)").matches
}
