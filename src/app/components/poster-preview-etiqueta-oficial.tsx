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

  const isRegular = !isOffer;
  
  // Tamanhos calculados
  // Aumento de ~35% no preço para etiquetas regulares (31.2 -> 42.1)
  // Aumento de ~17.5% na label (13 -> 15.3)
  const mainPriceSize = isRegular 
    ? (hasInstallments ? '36px' : '42.1px')
    : (hasInstallments ? '22.4px' : '25.4px');
    
  const dePriceSize = hasInstallments ? '22.4px' : '25.4px';
  
  const labelSize = isRegular
    ? (hasInstallments ? '9.5px' : '11px')
    : (hasInstallments ? '7.7px' : '8.9px');
    
  const unSize = isRegular
    ? (hasInstallments ? '9px' : '10px')
    : (hasInstallments ? '6.1px' : '6.8px');

  return (
    <div className={cn("w-full h-full text-black font-gotham overflow-hidden relative flex box-border p-[2.1mm]", isOffer ? 'bg-[#FFF200] print:!bg-white' : 'bg-white')}>
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

          {/* 2. ÁREA DE PREÇO: Centralizada no espaço restante */}
          <div className="flex-1 flex flex-col justify-center min-h-0 min-w-0">
            <div className="flex items-center w-full justify-start">
                 {isOffer && valDe > 0 ? (
                  <div className="flex w-full items-center justify-between">
                      {/* SEÇÃO DE: */}
                      <div className="flex w-[48%] justify-start">
                         <div className={cn("flex", !hasInstallments ? "flex-col items-start" : "items-start gap-0.5")}>
                            <div className={cn("flex leading-none shrink-0", hasInstallments ? "flex-col items-start gap-0.5" : "flex-row items-baseline gap-0.5")}>
                               <span className="font-bold uppercase" style={{ fontSize: labelSize }}>De:</span>
                                <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                            </div>
                             <div className="flex items-baseline leading-none relative">
                              <span className="font-bold tracking-tighter whitespace-nowrap leading-none" style={{ fontSize: dePriceSize }}>
                                  {deInteger},{deDecimal}
                              </span>
                              {/* Barra inclinada */}
                              <div className="absolute inset-x-[-1mm] top-[45%] h-[0.3mm] bg-black -rotate-[12deg] pointer-events-none" />
                            </div>
                         </div>
                      </div>

                      {/* ESPAÇO CENTRAL */}
                      <div className="w-[4%] shrink-0" />

                      {/* SEÇÃO POR: */}
                      <div className="flex w-[48%] justify-start">
                         <div className={cn("flex", !hasInstallments ? "flex-col items-start" : "items-start gap-1")}>
                            <div className={cn("flex leading-none shrink-0", hasInstallments ? "flex-col items-start gap-0.5" : "flex-row items-baseline gap-0.5")}>
                               <span className="font-bold uppercase" style={{ fontSize: labelSize }}>Por:</span>
                                <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                            </div>
                             <div className={cn("flex items-baseline leading-none flex-nowrap", !isRegular && !hasInstallments && "flex-1 justify-start")}>
                                <span className={cn("font-bold leading-none", !isRegular ? "tracking-tighter" : "tracking-normal")} style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                                   <div className="flex items-baseline leading-none">
                                      <span className={cn("font-bold ml-0.5", !isRegular ? "tracking-tighter" : "tracking-normal")} style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                                    <div className="flex items-baseline leading-none">
                                       <span className={cn("font-bold leading-none", !isRegular ? "tracking-tighter" : "tracking-normal")} style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                                       <span className="font-bold uppercase ml-1" style={{ fontSize: unSize }}>UN</span>
                                    </div>
                                   </div>
                             </div>
                         </div>
                      </div>
                   </div>
               ) : (
                    <div className={cn("flex w-full", !hasInstallments ? "flex-row items-baseline justify-center gap-1" : "flex-row items-center w-full")}>
                         <div className={cn("flex shrink-0", !hasInstallments ? "items-baseline" : "flex-col items-start justify-center gap-0.5")}>
                           {hasInstallments && (
                               <span className="font-bold uppercase leading-none tracking-normal" style={{ fontSize: labelSize }}>Preço à Vista:</span>
                            )}
                           <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                        </div>
                        <div className={cn("flex items-baseline leading-none flex-nowrap origin-left", !hasInstallments ? "" : "flex-1 justify-center", isRegular ? "scale-x-[0.95]" : "scale-x-[0.85]")}>
                           <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                              <div className="flex items-baseline leading-none">
                                 <span className="font-bold ml-0.5 leading-none" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                                 <div className="flex items-baseline leading-none">
                                    <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                                    <span className="font-bold uppercase ml-1" style={{ fontSize: unSize }}>UN</span>
                                 </div>
                              </div>
                        </div>
                   </div>
               )}
            </div>
          </div>

          {/* 3. PREÇO PARCELADO: Posicionado logo acima do rodapé */}
          {hasInstallments && (
            <div className="shrink-0 border-[0.2mm] border-black rounded-[1mm] px-1 py-0.5 flex flex-col justify-center min-h-[4.6mm] w-full">
                <div className="flex items-center justify-center gap-10">
                  <div className="flex flex-col items-center border-black/20 pr-2">
                     <span className="text-[12px] font-bold leading-none tracking-tighter">{maxInstallments}X</span>
                     <span className="text-[6px] font-normal leading-none uppercase mt-0.5">Sem Juros</span>
                  </div>
                  <div className="flex items-start gap-0.5">
                     <span className="font-normal leading-none self-start mt-[0.5mm]" style={{ fontSize: '8.6px' }}>R$</span>
                     <span className="font-bold leading-none tracking-tighter" style={{ fontSize: '17.2px' }}>{formatCurrency(installmentValue)}</span>
                  </div>
                </div>
            </div>
          )}

          {/* 4. RODAPÉ - REF (Esquerda) e Fornecedor | CÓD (Direita) */}
          <div className="shrink-0 flex items-center justify-between mt-auto overflow-hidden h-[5mm] text-[8.4px] font-normal uppercase w-full">
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
                  <span className="text-[8.4px] text-black tracking-tighter inline-block rotate-180 font-normal">{ean}</span>
               </div>
               {/* BARRAS ABAIXO DA NUMERAÇÃO */}
               <BarcodeEAN value={ean} height="10mm" width="25mm" showText={false} />
            </div>
          ) : code ? (
            <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center w-[30mm]">
               {/* NUMERAÇÃO NA BORDA (SAP) */}
               <div className="w-full flex justify-center mb-0">
                  <span className="text-[8.4px] text-black tracking-tighter inline-block rotate-180 font-normal">{code}</span>
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
