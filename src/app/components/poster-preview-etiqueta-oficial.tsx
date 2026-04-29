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

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  // REGRAS DE HIERARQUIA E PROPORÇÃO (Baseado em Preço 100% = 36px)
  // Preço: 36px (100%)
  // Parcelamento: 18px (50%)
  // "X vezes": 12px (33%)
  // "Sem juros": 6px (16%)
  // Título: 12px (33%)
  // Rodapé: 5px (14%)

  return (
    <div className="w-full h-full bg-white text-black font-sans overflow-hidden relative flex box-border p-[2.1mm]">
      
      {/* LADO ESQUERDO: Área Comercial */}
      <div className="flex-1 flex flex-col justify-between pr-2 h-full min-w-0 overflow-hidden">
        
        {/* 1. DESCRIÇÃO */}
        <div className="shrink-0">
          <h2 className="font-bold text-[15px] leading-[1.1] uppercase tracking-tight overflow-hidden line-clamp-2 text-left">
            {displayDescription}
          </h2>
        </div>

        {/* 2. ÁREA DE PREÇO: Ajustada para ocupar apenas o espaço restante, com respiro para equidistância */}
        <div className="flex flex-col justify-center flex-1 py-2 overflow-hidden min-h-0 min-w-0">
          <div className="flex items-center w-full justify-start">
              {isOffer && valDe > 0 ? (
                <div className="flex items-start w-full justify-start gap-2">
                   {/* SEÇÃO DE: */}
                   <div className="flex items-start gap-1">
                      <div className="flex flex-col items-start leading-none mt-1.5 shrink-0">
                         <span className="text-[11px] font-bold uppercase">De:</span>
                         <span className="text-[11px] font-bold leading-none mt-1">R$</span>
                      </div>
                      <span className="text-[32px] font-bold tracking-tighter inline-block origin-left scale-x-75 whitespace-nowrap leading-none relative">
                         {formatCurrency(valDe)}
                         {/* Barra inclinada preta sólida para impressoras monocromáticas - Espessura reduzida pela metade */}
                         <div className="absolute inset-x-0 top-[45%] h-[0.75mm] bg-black -rotate-[15deg] pointer-events-none" />
                      </span>
                   </div>

                   {/* SEÇÃO POR: */}
                   <div className="flex items-start gap-1">
                      <div className="flex flex-col items-start leading-none mt-1.5 shrink-0">
                         <span className="text-[11px] font-bold uppercase">Por:</span>
                         <span className="text-[11px] font-bold leading-none mt-1">R$</span>
                      </div>
                      <div className="flex items-baseline leading-none">
                         <span className="text-[36px] font-bold tracking-tighter inline-block origin-left scale-x-75 whitespace-nowrap leading-none">
                            {formatCurrency(valPor)}
                         </span>
                         <span className="text-[8px] font-bold uppercase ml-[-6mm] self-end mb-1">un.</span>
                      </div>
                   </div>
                </div>
             ) : (
                 <div className="flex items-start w-full gap-3 justify-start overflow-hidden">
                    <div className="flex flex-col mt-2 shrink-0">
                       <span className="text-[12px] font-bold uppercase leading-none tracking-tight">Preço à Vista:</span>
                       <span className="text-[12px] font-bold leading-none mt-1">R$</span>
                    </div>
                  <div className="flex items-baseline leading-none flex-nowrap">
                     <span className="text-[42px] font-bold tracking-tighter inline-block origin-left scale-x-80">{porInteger}</span>
                     <span className="text-[32px] font-bold ml-0.5 mr-[-0.5mm]">,</span>
                     <span className="text-[42px] font-bold tracking-tighter inline-block origin-left scale-x-80">{porDecimal}</span>
                     <span className="text-[9px] font-bold uppercase ml-1.5 self-end mb-1 shrink-0">un.</span>
                  </div>
                 </div>
             )}
          </div>
        </div>

        {/* 3. PREÇO PARCELADO (ESPAÇO RESERVADO) */}
        <div className="shrink-0 mb-1 min-h-[1mm] flex flex-col justify-center">
          {hasInstallments ? (
            <div className="border-[0.2mm] border-black rounded-[3mm] px-1 py-0.5 flex flex-col justify-center min-h-[4mm] w-full">
               <div className="flex items-center justify-center gap-2">
                  <span className="text-[6.5px] font-bold uppercase leading-none max-w-[15mm] text-right">Parcelamento em até</span>
                  <div className="flex flex-col items-center border-l border-black/20 pl-2">
                     <span className="text-[14px] font-bold leading-none tracking-tighter">{maxInstallments}X</span>
                     <span className="text-[7px] font-bold leading-none uppercase mt-0.5">Sem Juros</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                     <span className="text-[16px] font-bold">R$</span>
                     <span className="text-[20px] font-bold leading-none tracking-tighter">{formatCurrency(installmentValue)}</span>
                  </div>
               </div>
            </div>
          ) : (
            <div className="w-full h-[9mm]" /> /* Espaço reservado vazio */
          )}
        </div>

        {/* 4. RODAPÉ - Limitado a linha única para não quebrar layout */}
        <div className="shrink-0 pt-1 flex flex-nowrap gap-x-2 items-baseline mt-auto overflow-hidden h-[4mm]">
           <span className="text-[7px] font-bold uppercase truncate max-w-[28mm]">REF: {reference || 'N/A'}</span>
           {code && <span className="text-[7px] font-bold truncate max-w-[18mm]">SAP: {code}</span>}
           {supplier && <span className="text-[7px] font-bold truncate max-w-[55mm] uppercase">FORN: {supplier}</span>}
        </div>
      </div>

      {/* LADO DIREITO: Código de Barras (Coluna Fixa com Padding Interno) */}
      <div className="w-[15%] flex-none flex flex-col items-center justify-center h-full">
        {ean && ean.length >= 12 ? (
          <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center w-[25mm]">
             {/* NUMERAÇÃO NA BORDA */}
             <div className="w-full flex justify-center mb-1">
                <span className="text-[10px] font-mono  text-black tracking-tighter">{ean}</span>
             </div>
             {/* BARRAS ABAIXO DA NUMERAÇÃO */}
             <BarcodeEAN value={ean} height="10mm" width="25mm" showText={false} />
          </div>
        ) : code ? (
          <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center w-[30mm]">
             {/* NUMERAÇÃO NA BORDA (SAP) */}
             <div className="w-full flex justify-center mb-1">
                <span className="text-[7.5px] font-mono font-bold text-black tracking-tighter">{code}</span>
             </div>
             {/* BARRAS SAP */}
             <BarcodeSAP value={code} height="10mm" width="25mm" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
