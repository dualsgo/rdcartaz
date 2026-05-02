'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { BarcodeEAN } from './barcode-ean';
import { BarcodeSAP } from './barcode-sap';
import type { PosterData, PosterSettings } from '@/app/lib/types';
import { parsePrice, formatCurrency, calculateInstallments, truncateDescription } from '@/app/lib/poster-utils';

export function PosterPreviewEtiquetaOficial({
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

  const isOffer = posterSubType === 'offer';
  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;

  const displayDescription = truncateDescription(description, 30);

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  let mainPriceSize = hasInstallments ? '24px' : '31.2px';
  let dePriceSize = hasInstallments ? '24px' : '31.2px';
  let labelSize = hasInstallments ? '10px' : '13px';
  let unSize = hasInstallments ? '7.6px' : '9.9px';

  return (
    <div className="w-full h-full bg-white text-black font-montserrat overflow-hidden relative flex box-border p-[2.1mm]">
      {/* Container de compressão (95% para segurança) */}
      <div className="w-full h-full flex flex-row" style={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
        
        {/* LADO ESQUERDO: Área Comercial */}
        <div className="flex-1 flex flex-col justify-between pr-2 h-full min-w-0 overflow-hidden">
          
          {/* 1. DESCRIÇÃO */}
          <div className="shrink-0">
            <h2 className="font-bold text-[15px] leading-[1.1] uppercase tracking-tighter overflow-hidden line-clamp-2 text-left origin-left scale-x-[0.98]">
              {displayDescription}
            </h2>
          </div>

          {/* 2. ÁREA DE PREÇO: Ajustada para ocupar apenas o espaço restante, com respiro para equidistância */}
          <div className="flex flex-col justify-center flex-1 py-2 overflow-hidden min-h-0 min-w-0">
            <div className="flex items-center w-full justify-start">
                 {isOffer && valDe > 0 ? (
                  <div className={cn("flex w-full gap-8", !hasInstallments ? "flex-row justify-center" : "flex-row justify-start items-center gap-4")}>
                      {/* SEÇÃO DE: */}
                      <div className={cn("flex", !hasInstallments ? "flex-col items-center" : "items-start gap-0.5")}>
                         <div className="flex flex-row items-baseline gap-0.5 leading-none shrink-0">
                            <span className="font-bold uppercase" style={{ fontSize: labelSize }}>De:</span>
                             <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                         </div>
                          <div className="flex items-baseline leading-none relative origin-left scale-x-[0.85]">
                           <span className="font-bold tracking-normal whitespace-nowrap leading-none" style={{ fontSize: dePriceSize }}>
                               {deInteger},{deDecimal}
                           </span>
                           {/* Barra inclinada */}
                           <div className="absolute inset-x-[-1mm] top-[45%] h-[0.3mm] bg-black -rotate-[12deg] pointer-events-none" />
                         </div>
                      </div>

                      {/* SEÇÃO POR: */}
                      <div className={cn("flex", !hasInstallments ? "flex-col items-center" : "items-start gap-1")}>
                         <div className="flex flex-row items-baseline gap-0.5 leading-none shrink-0">
                            <span className="font-bold uppercase" style={{ fontSize: labelSize }}>Por:</span>
                             <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                         </div>
                          <div className="flex items-baseline leading-none flex-nowrap origin-left scale-x-[0.85]">
                             <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                                <div className="flex items-baseline leading-none">
                                   <span className="font-bold ml-0.5" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                                   <div className="relative inline-block">
                                      <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                                      <span className="font-normal uppercase absolute top-full mt-[0.2mm] right-0" style={{ fontSize: unSize }}>UN</span>
                                   </div>
                                </div>
                          </div>
                      </div>
                   </div>
               ) : (
                   <div className={cn("flex w-full overflow-hidden", !hasInstallments ? "flex-col items-center justify-center" : "items-start gap-1 justify-start")}>
                        <div className={cn("flex items-baseline shrink-0", !hasInstallments ? "mb-1" : "mt-1 mr-1")}>
                           <span className="font-bold uppercase leading-none tracking-normal mr-1" style={{ fontSize: labelSize }}>Preço à Vista:</span>
                           <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                        </div>
                        <div className="flex items-baseline leading-none flex-nowrap origin-left scale-x-[0.85]">
                           <span className="font-bold tracking-normal" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                              <div className="flex items-baseline leading-none">
                                 <span className="font-bold ml-0.5" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                                 <div className="relative inline-block">
                                    <span className="font-bold tracking-normal" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                                    <span className="font-normal uppercase absolute top-full mt-[0.2mm] right-0" style={{ fontSize: unSize }}>UN</span>
                                 </div>
                              </div>
                        </div>
                   </div>
               )}
            </div>
          </div>

          {/* 3. PREÇO PARCELADO (ESPAÇO RESERVADO) */}
          <div className="shrink-0 mb-1 min-h-[1mm] flex flex-col justify-center">
            {hasInstallments && (
              <div className="border-[0.2mm] border-black rounded-[1mm] px-1 py-0.5 flex flex-col justify-center min-h-[4mm] w-full">
                  <div className="flex items-center justify-center gap-10">
                    <div className="flex flex-col items-center border-black/20 pr-2">
                       <span className="text-[10.5px] font-bold leading-none tracking-tighter">{maxInstallments}X</span>
                       <span className="text-[5.25px] font-bold leading-none uppercase mt-0.5">Sem Juros</span>
                    </div>
                    <div className="flex items-start gap-0.5">
                       <span className="font-bold leading-none self-start mt-[0.5mm]" style={{ fontSize: '7.5px' }}>R$</span>
                       <span className="font-bold leading-none tracking-tighter" style={{ fontSize: '15px' }}>{formatCurrency(installmentValue)}</span>
                    </div>
                  </div>
              </div>
            )}
          </div>

          {/* 4. RODAPÉ - REF (Esquerda) e Fornecedor | CÓD (Direita) */}
          <div className="shrink-0 pt-1 flex items-center justify-between mt-auto overflow-hidden h-[4mm] text-[5.25px] font-normal uppercase w-full">
             <div className="min-w-0 flex-1 text-left truncate pr-2">
               {reference && `REF: ${reference}`}
             </div>
             <div className="shrink-0 text-right whitespace-nowrap">
               {supplier ? `${truncateDescription(supplier, 25)} | ` : ''}CÓD: {code}
             </div>
          </div>
        </div>

        {/* LADO DIREITO: Código de Barras (Coluna Fixa com Padding Interno) */}
        <div className="w-[15%] flex-none flex flex-col items-center justify-center h-full">
          {ean && ean.length >= 12 ? (
            <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center w-[25mm]">
               {/* NUMERAÇÃO NA BORDA */}
               <div className="w-full flex justify-center mb-0">
                  <span className="text-[5.25px] text-black tracking-tighter inline-block rotate-180 font-normal">{ean}</span>
               </div>
               {/* BARRAS ABAIXO DA NUMERAÇÃO */}
               <BarcodeEAN value={ean} height="10mm" width="25mm" showText={false} />
            </div>
          ) : code ? (
            <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center w-[30mm]">
               {/* NUMERAÇÃO NA BORDA (SAP) */}
               <div className="w-full flex justify-center mb-0">
                  <span className="text-[5.25px] text-black tracking-tighter inline-block rotate-180 font-normal">{code}</span>
               </div>
               {/* BARRAS SAP */}
               <BarcodeSAP value={code} height="10mm" width="25mm" />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
