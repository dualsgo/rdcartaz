'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { PosterData, PosterSettings } from '@/app/lib/types';
import { parsePrice, formatCurrency, calculateInstallments, truncateDescription } from '@/app/lib/poster-utils';

export function PosterPreviewVitrine({
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

  const displayDescription = truncateDescription(description, 35); // Limite um pouco maior pois ganhamos espaço horizontal

  let displaySupplier = supplier || '';
  if (displaySupplier) {
    displaySupplier = displaySupplier.split(' ').slice(0, 3).join(' ');
    if (displaySupplier.length > 25) {
      displaySupplier = displaySupplier.substring(0, 25);
    }
    displaySupplier = displaySupplier.trim();
  }

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  const isRegular = !isOffer;
  
  // Tamanhos significativamente maiores, já que não temos o bloco de código de barras
  const mainPriceSize = isRegular 
    ? (hasInstallments ? '40.5px' : '46.8px')
    : (hasInstallments ? '31.5px' : '36px');
    
  const dePriceSize = hasInstallments ? '28.8px' : '32.4px';
  
  const labelSize = isRegular
    ? (hasInstallments ? '10.8px' : '12.6px')
    : (hasInstallments ? '9.9px' : '11.7px');
    
  const unSize = isRegular
    ? (hasInstallments ? '9px' : '9.9px')
    : (hasInstallments ? '7.6px' : '9px');

  // Ajuste fixo proporcional e elegante (sempre garantindo > 1/3 do preço principal)
  const instValueSize = isRegular ? '18px' : '16.2px';
  const instXSize = isRegular ? '12.6px' : '10.8px';
  const instJurosSize = isRegular ? '6.3px' : '5.4px';
  const instRsSize = isRegular ? '9px' : '8.1px';

  return (
    <div className={cn("w-full h-full text-black font-gotham overflow-hidden relative flex flex-col box-border p-[2.5mm]", isOffer ? 'bg-[#FFF200] print:!bg-white' : 'bg-white')}>
      {/* Container de compressão para margem de segurança */}
      <div className="w-full h-full flex flex-col justify-between" style={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
        
        {/* 1. DESCRIÇÃO */}
        <div className="shrink-0 mb-1">
          <h2 className="font-bold text-[18px] leading-[1.1] uppercase tracking-tighter overflow-hidden line-clamp-2 text-center w-full">
            {displayDescription}
          </h2>
        </div>

        {/* 2. ÁREA DE PREÇO (Ocupando largura total) */}
        <div className="flex-1 flex flex-col justify-center min-h-0 min-w-0 px-2">
          <div className="flex items-center w-full justify-center">
               {isOffer && valDe > 0 ? (
                <div className={cn("flex w-full", !hasInstallments ? "flex-row justify-center gap-6" : "flex-row justify-center items-center gap-4")}>
                    {/* SEÇÃO DE: */}
                    <div className={cn("flex", !hasInstallments ? "flex-col items-center" : "items-start gap-1")}>
                       <div className={cn("flex leading-none shrink-0", hasInstallments ? "flex-col items-start gap-0.5" : "flex-row items-baseline gap-1")}>
                          <span className="font-bold uppercase" style={{ fontSize: labelSize }}>De:</span>
                           <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                       </div>
                        <div className="flex items-baseline leading-none relative origin-left scale-x-[0.9]">
                         <span className="font-bold tracking-normal whitespace-nowrap leading-none" style={{ fontSize: dePriceSize }}>
                             {deInteger},{deDecimal}
                         </span>
                         {/* Barra inclinada de corte no preço DE */}
                         <div className="absolute inset-x-[-1mm] top-[45%] h-[0.4mm] bg-black -rotate-[12deg] pointer-events-none" />
                       </div>
                    </div>

                    {/* SEÇÃO POR: */}
                    <div className={cn("flex", !hasInstallments ? "flex-col items-center" : "items-start gap-1")}>
                       <div className={cn("flex leading-none shrink-0", hasInstallments ? "flex-col items-start gap-0.5" : "flex-row items-baseline gap-1")}>
                          <span className="font-bold uppercase" style={{ fontSize: labelSize }}>Por:</span>
                           <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                       </div>
                        <div className="flex items-baseline leading-none flex-nowrap origin-left">
                           <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                              <div className="flex items-baseline leading-none">
                                 <span className="font-bold ml-0.5" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                                 <div className="flex items-baseline leading-none">
                                    <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                                    <span className="font-bold uppercase ml-1" style={{ fontSize: unSize }}>UN</span>
                                 </div>
                              </div>
                        </div>
                    </div>
                 </div>
             ) : (
                  <div className={cn("flex w-full justify-center", !hasInstallments ? "flex-row items-baseline gap-2" : "flex-row items-baseline gap-2")}>
                       <div className={cn("flex items-baseline shrink-0", !hasInstallments ? "" : "mr-1")}>
                         {hasInstallments && (
                             <span className="font-bold uppercase leading-none tracking-normal mr-2" style={{ fontSize: labelSize }}>Preço à Vista:</span>
                          )}
                         <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                      </div>
                      <div className="flex items-baseline leading-none flex-nowrap origin-left">
                         <span className="font-bold tracking-normal" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                            <div className="flex items-baseline leading-none">
                               <span className="font-bold ml-0.5" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                               <div className="flex items-baseline leading-none">
                                  <span className="font-bold tracking-normal" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
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
          <div className="shrink-0 border-[0.2mm] border-black rounded-[1mm] px-1 py-0.5 flex flex-col justify-center min-h-[4.6mm] w-full mt-1 mb-0.5">
              <div className="flex items-center justify-center gap-8">
                <div className="flex flex-col items-center border-black/20 pr-3">
                   <span className="font-bold leading-none tracking-tighter" style={{ fontSize: instXSize }}>{maxInstallments}X</span>
                   <span className="font-normal leading-none uppercase mt-0.5" style={{ fontSize: instJurosSize }}>Sem Juros</span>
                </div>
                <div className="flex items-start gap-1">
                   <span className="font-normal leading-none self-start mt-[0.5mm]" style={{ fontSize: instRsSize }}>R$</span>
                   <span className="font-bold leading-none tracking-tighter" style={{ fontSize: instValueSize }}>{formatCurrency(installmentValue)}</span>
                </div>
              </div>
          </div>
        )}

        {/* 4. RODAPÉ LINEAR: REF | FORNECEDOR | SAP | EAN */}
         <div className="shrink-0 mt-auto overflow-hidden h-[4.5mm] flex justify-center items-center w-full px-1">
            <div className="text-[7.2px] font-medium uppercase text-black/80 flex justify-between w-full items-center gap-1">
              {reference && (
                <div className="shrink-0 whitespace-nowrap">
                  REF: <b className="font-bold">{reference}</b>
                </div>
              )}
              
              {reference && displaySupplier && <div className="text-black/30 shrink-0">|</div>}

              {displaySupplier && (
                <div className="flex-1 min-w-0 truncate text-center">
                  <span>{displaySupplier}</span>
                </div>
              )}
              
              {displaySupplier && code && <div className="text-black/30 shrink-0">|</div>}

              {code && (
                <div className="shrink-0 whitespace-nowrap">
                  SAP: <b className="font-bold">{code}</b>
                </div>
              )}
              
              {code && ean && <div className="text-black/30 shrink-0">|</div>}

              {ean && (
                <div className="shrink-0 whitespace-nowrap">
                  EAN: <b className="font-bold">{ean}</b>
                </div>
              )}
            </div>
         </div>

      </div>
    </div>
  );
}
