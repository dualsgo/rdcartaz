export type PosterData = {
  description: string;
  priceFrom: string;
  priceFor: string;
  code: string;       // COD_PRODUTO (SAP)
  ean: string;        // EAN_PRODUTO_UNITARIO
  reference: string;
  paymentOption: 'normal' | 'installment';
  posterSubType: 'offer' | 'normal';
  defectType?: string;
  customDefectReason?: string;
  customDefectDiscount?: number;
  defectNote?: string;
  offerValidityStart?: string; // data de início da oferta (ex: "01/03/2026")
  offerValidity?: string; // data de fim da oferta (ex: "31/03/2026")
  supplier?: string;
  quantity?: number;
  stock?: number;
  campaign?: string;
  category?: string;
};

export type CampaignMode = 'friday' | '50off' | 'regular';

export type EnabledFormats = {
  posters?: boolean; // A4 / A5 / A6 (padrão: true)
  gondola?: boolean; // etiqueta-oficial (padrão: false)
  vitrine?: boolean; // vitrine (padrão: false)
};

export type PosterSettings = {
  maxInstallments: number;
  minInstallmentAmount: number;
  happyFridayEnabled?: boolean;
  campaignBrand?: 'rihappy' | 'pbkids';
  campaignMode?: CampaignMode;
  enabledFormats?: EnabledFormats;
};

export type PosterType = 'reliquias' | 'campanha-a5' | 'reliquias-a6' | 'etiqueta-oficial' | 'aereo' | 'totem' | 'vitrine';


