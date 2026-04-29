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
};

export type PosterSettings = {
  maxInstallments: number;
  minInstallmentAmount: number;
};

export type PosterType = 
  | 'reliquias' 
  | 'ofertas-imperdiveis' 
  | 'aereo' 
  | 'avaria' 
  | 'etiqueta-oficial'
  | 'totem';
