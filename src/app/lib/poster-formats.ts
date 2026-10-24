import type { PosterType } from './types';

/**
 * Fonte única de verdade para os formatos de impressão.
 * Substitui as constantes antes espalhadas em page.tsx / poster-form.tsx
 * (PER_PAGE, POSTER_ORIENTATION, SINGLE_DIMS, typeOptions e labels hardcoded).
 */
export type PosterFormat = {
  id: PosterType;
  /** Nome completo exibido em títulos e badges */
  label: string;
  /** Nome curto usado no seletor compacto */
  shortLabel: string;
  /** Legenda curta (ex: "4/folha") */
  caption: string;
  /** Descrição longa (tooltip / cabeçalho) */
  description: string;
  /** Quantidade de cartazes/etiquetas por folha A4 */
  perPage: number;
  orientation: 'portrait' | 'landscape';
  /** Dimensões do cartaz individual para o preview (px) */
  singleDims: { w: number; h: number };
  unit: { singular: string; plural: string };
  /** Formatos que não possuem "preço normal" (sempre oferta) */
  offerOnly: boolean;
  /** Formatos ocultos não aparecem no seletor */
  visible: boolean;
};

const CARTAZ = { singular: 'cartaz', plural: 'cartazes' };
const ETIQUETA = { singular: 'etiqueta', plural: 'etiquetas' };

// A ordem de declaração define a ordem no seletor e os atalhos Alt+1..N
export const POSTER_FORMATS: Record<PosterType, PosterFormat> = {
  reliquias: {
    id: 'reliquias',
    label: 'Relíquias A4',
    shortLabel: 'A4',
    caption: '1/folha',
    description: 'Folha inteira · 1 cartaz por folha A4',
    perPage: 1,
    orientation: 'landscape',
    singleDims: { w: 514, h: 340 },
    unit: CARTAZ,
    offerOnly: true,
    visible: true,
  },
  'reliquias-a6': {
    id: 'reliquias-a6',
    label: 'Relíquias A6',
    shortLabel: 'A6',
    caption: '4/folha',
    description: '4 cartazes por folha A4',
    perPage: 4,
    orientation: 'landscape',
    singleDims: { w: 514, h: 340 },
    unit: CARTAZ,
    offerOnly: true,
    visible: true,
  },
  'etiqueta-oficial': {
    id: 'etiqueta-oficial',
    label: 'Gôndola',
    shortLabel: 'Gôndola',
    caption: '16/folha',
    description: '16 etiquetas por folha A4 (90×34mm)',
    perPage: 16,
    orientation: 'portrait',
    singleDims: { w: 340, h: 128 }, // 90mm x 34mm
    unit: ETIQUETA,
    offerOnly: false,
    visible: true,
  },
  vitrine: {
    id: 'vitrine',
    label: 'Vitrine',
    shortLabel: 'Vitrine',
    caption: '16/folha',
    description: '16 etiquetas por folha A4 (90×34mm)',
    perPage: 16,
    orientation: 'portrait',
    singleDims: { w: 340, h: 128 }, // 90mm x 34mm
    unit: ETIQUETA,
    offerOnly: false,
    visible: true,
  },
  // OCULTO - não exibir para usuários
  aereo: {
    id: 'aereo',
    label: 'Aéreo',
    shortLabel: 'Aéreo',
    caption: '2/folha',
    description: '2 cartazes por folha A4',
    perPage: 2,
    orientation: 'portrait',
    singleDims: { w: 660, h: 496 }, // 174mm x 131mm @ 96dpi (4 linhas de gôndola)
    unit: CARTAZ,
    offerOnly: false,
    visible: false,
  },
  // OCULTO - não exibir para usuários
  totem: {
    id: 'totem',
    label: 'Totem',
    shortLabel: 'Totem',
    caption: '1/folha',
    description: '1 cartaz por folha A4',
    perPage: 1,
    orientation: 'portrait',
    singleDims: { w: 794, h: 1123 }, // A4 @ 96dpi
    unit: CARTAZ,
    offerOnly: true,
    visible: false,
  },
};

export const VISIBLE_FORMATS: PosterFormat[] = Object.values(POSTER_FORMATS).filter(f => f.visible);

export function getPosterFormat(type: PosterType): PosterFormat {
  return POSTER_FORMATS[type] ?? POSTER_FORMATS.reliquias;
}

export function isOfferOnlyFormat(type: PosterType): boolean {
  return getPosterFormat(type).offerOnly;
}

export function orientationLabel(type: PosterType): 'Paisagem' | 'Retrato' {
  return getPosterFormat(type).orientation === 'landscape' ? 'Paisagem' : 'Retrato';
}
