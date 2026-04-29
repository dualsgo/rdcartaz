import React from 'react';
import { cn } from '@/lib/utils';
import { BarcodeSAP } from './barcode-sap';
import { BarcodeEAN } from './barcode-ean';
import type { PosterData } from '@/app/lib/types';
import { parsePrice, formatCurrency, calculateInstallments, truncateDescription } from '@/app/lib/poster-utils';

export function PosterPreviewEtiqueta({
  description,
  priceFrom,
  priceFor,
  code,
  ean,
  reference,
  paymentOption,
  posterSubType,
  supplier,
  settings,
}: PosterData & { settings: PosterSettings }) {
  const valDe = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  // Limite de 30 caracteres conforme solicitado pelo usuário
  const displayDescription = truncateDescription(description, 30);

  const isOffer = posterSubType === 'offer';
  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  // Ajuste proporcional das fontes (Reduzido em 20% para caber no novo layout fixo)
  let priceFontSize = '42px';
  let decimalFontSize = '18px';
  let currencyFontSize = '10px';
  let installmentFontSize = '10px';
  let offerPriceFontSize = '44px';
  
  if (porInteger.length >= 6) {
    priceFontSize = '28px';
    decimalFontSize = '11px';
    currencyFontSize = '8px';
    installmentFontSize = '8px';
    offerPriceFontSize = '30px';
  } else if (porInteger.length === 5) {
    priceFontSize = '34px';
    decimalFontSize = '14px';
    currencyFontSize = '9px';
    installmentFontSize = '9px';
    offerPriceFontSize = '36px';
  } else if (porInteger.length === 4) {
    offerPriceFontSize = '40px';
  }

  return (    <div className="w-full h-full bg-white text-black font-body overflow-hidden relative flex flex-col justify-center box-border px-[1mm] py-[1.5mm]">
      {/* Etiqueta 91x33.8mm - High Tolerance Center */}
      <div className="flex w-full h-full relative items-center">
        {/* Esquerda: Black Block with text OFERTAS (Somente se for tipo oferta) */}
        {isOffer && (
          <div className="w-[8%] h-[98%] bg-black text-white flex flex-col justify-center items-center shrink-0 rounded-sm">
              <span className="font-headline font-black text-[11px] leading-none text-center uppercase tracking-wider" style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
                  OFERTAS
              </span>
          </div>
        )}

        {/* Lado Direito Inteiro: Nome em cima, Preços em baixo */}
        <div className={cn("flex-1 px-2 flex flex-col h-full justify-between overflow-hidden pr-[19mm]", isOffer ? "pl-2" : "pl-4")}>
          
          {/* TOPO: Descrição */}
          <h2 className={cn("font-headline font-bold text-[14px] leading-[0.9] uppercase overflow-hidden w-full max-h-[1.9em] shrink-0 pb-1", !isOffer && "text-center text-black")}>
            {displayDescription}
          </h2>

          {/* MEIO: Container de Preços */}
          <div className={cn("flex-1 flex min-h-0 items-center", isOffer ? "flex-row justify-start gap-1" : "flex-col justify-center")}>
            
            {/* SEÇÃO DE (Apenas Oferta) */}
            {isOffer && (
              <div className={cn("transition-opacity flex items-center shrink-0", hasDiscount ? 'opacity-100' : 'opacity-0')}>
                <span className="font-headline font-black uppercase tracking-tighter text-[10px] leading-none mr-1">DE:</span>
                <span className="font-headline font-black leading-[0.75] tracking-[-0.05em] line-through decoration-[0.5mm] inline-block origin-left scale-x-90 whitespace-nowrap" style={{ fontSize: `calc(${offerPriceFontSize} * 0.8)` }}>
                  R$ {formatCurrency(valDe)}
                </span>
              </div>
            )}

            {/* SEÇÃO POR */}
            <div className={cn("flex min-w-0 items-center", isOffer ? "flex-row justify-start" : "flex-col items-center")}>
              {isOffer && <span className="font-headline font-black uppercase tracking-tighter text-[10px] leading-none shrink-0 mr-1">POR:</span>}
              <div className="flex items-end">
                {!isOffer && <span className="font-headline font-black self-start mt-1 mr-0.5 text-[17px]">R$</span>}

                {/* Centro: Inteiro e Decimais (Mesmo Tamanho e Comprimido) */}
                <span className="font-headline font-black leading-[0.75] tracking-[-0.05em] inline-block origin-left scale-x-90" style={{ fontSize: isOffer ? offerPriceFontSize : priceFontSize }}>
                  R$ {formatCurrency(valPor)}
                </span>

                {/* Info un. - Aproximado do centavo */}
                {isOffer && (
                  <div className="flex flex-col items-start ml-[-2mm] shrink-0 pb-1 text-black">
                    <span className="font-bold whitespace-nowrap leading-none mt-0.5" style={{ fontSize: '7.5px' }}>
                      un.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ZONA DE PARCELAMENTO (ESPAÇO RESERVADO) */}
          <div className="shrink-0 w-full flex flex-col items-center justify-center min-h-[7mm] mb-1">
             {hasInstallments ? (
                <div className={cn(
                  "px-3 py-[2.5px] rounded-full flex items-center justify-center border",
                  isOffer ? "bg-black text-white border-black" : "bg-white text-black border-black/20"
                )}>
                  <span className="font-headline font-bold leading-none whitespace-nowrap text-[10px] tracking-tight">
                    Parcelamento em até {maxInstallments}x de R$ {formatCurrency(installmentValue)}
                  </span>
                </div>
             ) : (
                <div className="h-[7mm]" /> /* Espaço reservado vazio */
             )}
          </div>

          {/* RODAPÉ: Fornecedor e Info Complementar */}
          <div className="w-full flex flex-col items-center shrink-0 pt-1">
             {!isOffer && (
               <div className="flex items-center gap-2 mb-0.5 shrink-0">
                  <span className="font-bold whitespace-nowrap text-black text-[7.5px]">un.</span>
               </div>
             )}
             {supplier && (
                <div className="text-[7.5px] text-black font-black uppercase tracking-[0.15em] text-center w-full truncate">
                  {supplier}
                </div>
              )}
          </div>
        </div>

        {/* CÓDIGO DE BARRAS VERTICAL (EAN ou SAP) - Posição compactada à direita */}
        {ean && ean.length >= 12 ? (
          <div className="absolute right-[1mm] top-0 bottom-0 w-[18.2mm] flex items-center justify-center">
             <div className="rotate-90 origin-center whitespace-nowrap">
                <BarcodeEAN 
                  value={ean} 
                  height="12mm" 
                  width="28mm" 
                  showText={false} 
                />
             </div>
          </div>
        ) : code ? (
          <div className="absolute right-[1mm] top-0 bottom-0 w-[18.2mm] flex items-center justify-center">
             <BarcodeSAP 
               value={code} 
               orientation="vertical"
               height="28mm" 
               width="12mm" 
             />
          </div>
        ) : null}

        {/* Blocos Verticais de Códigos - Posição compactada à direita extremo */}
        <div className="absolute right-[0.5mm] top-0 bottom-0 flex flex-row-reverse items-center gap-0 text-[6.5pt] text-black font-mono leading-none font-bold">
          {/* Coluna: SAP e REF */}
          <div className="flex flex-col justify-center items-center h-full w-[4mm] overflow-hidden">
              <div className="rotate-90 whitespace-nowrap truncate max-w-[28mm]">
                {code ? `SAP: ${code}` : ''} {reference ? ` | ${reference}` : ''}
              </div>
          </div>
          {/* Coluna: EAN */}
          <div className="flex flex-col justify-center items-center h-full w-[3.5mm] overflow-hidden">
              <div className="rotate-90 whitespace-nowrap truncate max-w-[28mm]">
                {ean ? `EAN: ${ean}` : ''}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
