import type { PosterType, CampaignMode, EnabledFormats } from './types';

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

export type CampaignKind = '50off' | 'friday' | null;

export function getCampaignKind(campaign?: string): CampaignKind {
  if (!campaign) return null;
  const upper = campaign.toUpperCase();
  if (upper === 'ESQUENTA_BLACK' || upper === '50_OFF') return '50off';
  if (upper === 'HAPPY_FRIDAY' || upper === 'BEST_FRIDAY') return 'friday';
  return null;
}

export function doesItemMatchCampaignMode(campaign: string | undefined, mode: CampaignMode = 'regular'): boolean {
  const kind = getCampaignKind(campaign);
  if (mode === 'friday') return kind === 'friday';
  if (mode === '50off') return kind === '50off';
  return kind === null;
}

export function getCampaignModeLabel(mode: CampaignMode = 'regular', campaignBrand?: 'rihappy' | 'pbkids'): string {
  if (mode === 'friday') return campaignBrand === 'pbkids' ? 'Best Friday' : 'Happy Friday';
  if (mode === '50off') return 'Campanha 50%';
  return 'Ofertas Regulares';
}

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
  // Exibido dinamicamente quando o item pertence a uma campanha (50% ou Happy/Best Friday)
  'campanha-a5': {
    id: 'campanha-a5',
    label: 'Campanha A5',
    shortLabel: 'A5',
    caption: '2/folha',
    description: '2 cartazes A5 por folha A4',
    perPage: 2,
    orientation: 'landscape',
    singleDims: { w: 514, h: 680 }, // 13.6cm x 18.0cm
    unit: CARTAZ,
    offerOnly: true,
    visible: false,
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

export function getVisibleFormats(
  modeOrCampaign?: CampaignMode | string,
  enabledFormats?: EnabledFormats,
): PosterFormat[] {
  const isCampaign =
    modeOrCampaign === 'friday' ||
    modeOrCampaign === '50off' ||
    (modeOrCampaign !== 'regular' && getCampaignKind(modeOrCampaign) !== null);

  const showPosters = enabledFormats?.posters !== false;
  const showGondola = enabledFormats?.gondola === true;
  const showVitrine = enabledFormats?.vitrine === true;

  return Object.values(POSTER_FORMATS).filter(f => {
    if (f.id === 'reliquias' || f.id === 'reliquias-a6') return showPosters;
    if (f.id === 'campanha-a5') return showPosters && isCampaign;
    if (f.id === 'etiqueta-oficial') return showGondola;
    if (f.id === 'vitrine') return showVitrine;
    return false;
  });
}

export function getPosterFormat(
  type: PosterType,
  modeOrCampaign?: CampaignMode | string | boolean,
  campaignBrand?: 'rihappy' | 'pbkids',
): PosterFormat {
  const base = POSTER_FORMATS[type] ?? POSTER_FORMATS.reliquias;
  const kind: CampaignKind =
    modeOrCampaign === 'friday' ? 'friday'
      : modeOrCampaign === '50off' ? '50off'
        : modeOrCampaign === 'regular' ? null
          : typeof modeOrCampaign === 'string' ? getCampaignKind(modeOrCampaign)
            : null;

  if (!kind) return base;

  const isFriday = kind === 'friday';
  const isPbKids = campaignBrand === 'pbkids';
  const campaignLabel = isFriday
    ? (isPbKids ? 'Best Friday' : 'Happy Friday')
    : 'Campanha 50% OFF';

  if (type === 'reliquias') {
    return {
      ...base,
      label: `${campaignLabel} A4`,
      description: `${campaignLabel} · 1 cartaz por folha A4`,
      orientation: 'portrait',
      offerOnly: isFriday,
      singleDims: isFriday ? { w: 340, h: 514 } : { w: 514, h: 680 },
    };
  }
  if (type === 'campanha-a5') {
    return {
      ...base,
      label: `${campaignLabel} A5`,
      description: `${campaignLabel} · 2 cartazes A5 por folha A4`,
      orientation: 'landscape',
      offerOnly: isFriday,
      singleDims: isFriday ? { w: 340, h: 514 } : { w: 514, h: 680 },
    };
  }
  if (type === 'reliquias-a6') {
    return {
      ...base,
      label: `${campaignLabel} A6`,
      shortLabel: 'A6',
      caption: '4/folha',
      description: `${campaignLabel} · 4 cartazes A6 Vertical por folha A4`,
      perPage: 4,
      orientation: 'portrait',
      offerOnly: isFriday,
      singleDims: isFriday ? { w: 340, h: 514 } : { w: 514, h: 680 },
    };
  }
  return base;
}

export function isOfferOnlyFormat(type: PosterType, mode?: CampaignMode | boolean): boolean {
  if (mode === '50off' && (type === 'reliquias' || type === 'campanha-a5' || type === 'reliquias-a6')) {
    return false;
  }
  return getPosterFormat(type).offerOnly;
}

export function orientationLabel(
  type: PosterType,
  modeOrCampaign?: CampaignMode | string | boolean,
  campaignBrand?: 'rihappy' | 'pbkids',
): 'Paisagem' | 'Retrato' {
  return getPosterFormat(type, modeOrCampaign, campaignBrand).orientation === 'landscape' ? 'Paisagem' : 'Retrato';
}
