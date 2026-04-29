import React from 'react';
import { cn } from '@/lib/utils';
import { parsePrice, formatCurrency, calculateInstallments, truncateDescription } from '@/app/lib/poster-utils';
import type { PosterData, PosterSettings } from '@/app/lib/types';

export function PosterPreviewAereo({
  description,
  priceFrom,
  priceFor,
  code,
  ean,
  reference,
  supplier,
  paymentOption,
  posterSubType,
  settings,
}: PosterData & { settings: PosterSettings }) {
  const valDe  = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const isOffer = posterSubType === 'offer';
  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;

  const [porInt, porDec] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallment  = paymentOption === 'installment' && maxInstallments > 1;

  // Aplica o limite de caracteres na descrição (aprox 2 linhas)
  const displayDescription = truncateDescription(description, 35);

  // Lógica de fonte dinâmica para o Aéreo (Aumentada e Comprimida)
  let priceFontSize = '96px';
  if (porInt.length >= 6) priceFontSize = '64px';
  else if (porInt.length === 5) priceFontSize = '76px';
  else if (porInt.length === 4) priceFontSize = '88px';

  return (
    <div className="w-full h-full bg-white text-black font-body overflow-hidden relative flex flex-col justify-between box-border px-[12mm] py-[2.5mm]">
      
      {/* Faixa vertical de OFERTA integrada à direita */}
      {isOffer && (
        <div className="absolute right-[4mm] top-[4mm] bottom-[4mm] w-[12mm] bg-black text-white flex flex-col items-center justify-center rounded-md z-10">
          <span className="font-headline font-black text-[22pt] leading-none uppercase tracking-[4px]" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            OFERTA
          </span>
        </div>
      )}

      {/* 1. TOPO: DESCRIÇÃO */}
      <div className={cn("w-full h-[18mm] flex items-center justify-center shrink-0", isOffer && "pr-[14mm]")}>
        <h2 className="font-headline font-black text-[24pt] leading-[1] uppercase text-center overflow-hidden max-h-[2.2em]">
          {displayDescription}
        </h2>
      </div>

      {/* 2. MEIO: ÁREA DE PREÇOS */}
      <div className={cn("flex-1 flex flex-col items-center justify-center relative min-h-0 w-full", isOffer && "pr-[14mm]")}>
        
        {isOffer && hasDiscount ? (
          <div className="flex flex-row items-center justify-center w-full gap-x-6">
            {/* SEÇÃO DE */}
            <div className="flex flex-col items-center">
               <div className="flex items-center gap-2">
                  <div className="flex flex-col items-start shrink-0">
                     <span className="font-headline font-medium text-[14pt] leading-none uppercase">De:</span>
                     <span className="font-headline font-medium text-[14pt] leading-none mt-1">R$</span>
                  </div>
                  <span className="font-headline font-medium leading-none tracking-tighter inline-block origin-left scale-x-70 relative" style={{ fontSize: `calc(${priceFontSize} * 0.7)` }}>
                    {formatCurrency(valDe)}
                    {/* Barra inclinada preta sólida - Espessura reduzida */}
                    <div className="absolute inset-x-0 top-[45%] h-[0.75mm] bg-black -rotate-[12deg] pointer-events-none" />
                  </span>
               </div>
            </div>

            {/* SEÇÃO POR */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-start shrink-0">
                   <span className="font-headline font-medium text-[14pt] leading-none uppercase">Por:</span>
                   <span className="font-headline font-medium text-[14pt] leading-none mt-1">R$</span>
                </div>
                <div className="flex items-baseline">
                  <span className="font-headline font-medium leading-none tracking-tighter inline-block origin-left scale-x-70" style={{ fontSize: `calc(${priceFontSize} * 0.85)` }}>
                    {porInt},{porDec}
                  </span>
                  <span className="font-bold text-[5.5pt] uppercase leading-none ml-2 mb-2">un. à vista</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preço ÚNICO (Sem Oferta) */
          <div className="flex flex-col items-center justify-center w-full">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-start shrink-0">
                 <span className="font-headline font-medium text-[20pt] leading-none uppercase">Por:</span>
                 <span className="font-headline font-medium text-[20pt] leading-none mt-1">R$</span>
              </div>
              <div className="flex items-baseline">
                <span className="font-headline font-medium leading-none tracking-tighter inline-block origin-left scale-x-70" style={{ fontSize: priceFontSize }}>
                  {porInt},{porDec}
                </span>
                <span className="font-bold text-[11pt] uppercase leading-none ml-2 mb-2">un. à vista</span>
              </div>
            </div>
          </div>
        )}

        {/* Parcelamento estilo CAPSULA (Pill) - Ajustado para linha única com fontes menores */}
        {showInstallment && (
           <div className="mt-4 border-[0.6mm] border-black rounded-[3mm] px-4 py-1.5 flex items-center justify-center gap-x-1.5 w-full whitespace-nowrap overflow-hidden">
              <span className="font-headline font-medium text-[8pt] uppercase">ou parcelado em até</span>
              <span className="font-headline font-black text-[11pt] uppercase">{maxInstallments}x sem juros</span>
              <span className="font-headline font-medium text-[8pt] uppercase">de</span>
              <span className="font-headline font-black text-[14pt] uppercase">R$ {formatCurrency(installmentValue)}</span>
           </div>
        )}
      </div>

      {/* 3. BASE: METADADOS E FORNECEDOR EM LINHA ÚNICA - Limitado para não quebrar layout */}
      <div className={cn("w-full flex items-center justify-center gap-x-4 flex-nowrap text-[5pt] font-mono font-bold uppercase opacity-100 overflow-hidden", isOffer && "pr-[14mm]")}>
          {code && <span className="truncate max-w-[15%]">SAP: {code}</span>}
          {ean && <span className="truncate max-w-[25%]">EAN: {ean}</span>}
          {reference && <span className="truncate max-w-[25%]">REF: {reference}</span>}
          {supplier && <span className="text-black font-black whitespace-nowrap overflow-hidden text-ellipsis max-w-[50%]">| FORN: {supplier}</span>}
      </div>
    </div>
  );
}
