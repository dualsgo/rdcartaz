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
  const displayDescription = truncateDescription(description, 34);

  // Lógica de fonte dinâmica para o Aéreo (Aumentada e Comprimida)
  let priceFontSize = '70px';
  if (porInt.length === 4) {
    priceFontSize = '64px';
  } else if (porInt.length === 3) {
    priceFontSize = '70px';
  }

  const discount = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  return (
    <div className="w-full h-full bg-white text-black font-body overflow-hidden relative flex flex-row box-border">
      {/* ── CONTEÚDO PRINCIPAL (COMPRIMIDO À ESQUERDA) ── */}
      <div className="flex-1 flex flex-col justify-between p-[5mm] overflow-hidden relative">
        
        {/* 1. TOPO: DESCRIÇÃO */}
        <div className="w-full h-[16mm] flex items-center justify-center shrink-0">
          <h2 className="font-headline font-medium text-[15.5pt] leading-[1.1] uppercase text-center overflow-hidden max-h-[2.2em]">
            {displayDescription}
          </h2>
        </div>

        {/* 2. MEIO: ÁREA DE PREÇOS */}
        <div className="flex-1 flex flex-col items-center justify-start pt-[2mm] relative min-h-0 w-full">
          
          {isOffer && hasDiscount ? (
            <div className="flex flex-row items-center justify-center w-full gap-x-10 relative">
              {/* SEÇÃO DE */}
              <div className="flex flex-row items-center gap-x-2">
                <span className="font-headline font-medium text-[8.5pt] leading-none uppercase">De:</span>
                
                <div className="flex items-start">
                  <span className="font-headline font-medium text-[8.5pt] leading-none mt-[1mm] mr-1">R$</span>
                  <span className="font-headline font-medium leading-none tracking-normal inline-block origin-left scale-x-70 relative" style={{ fontSize: `calc(${priceFontSize} * 0.5)` }}>
                    {formatCurrency(valDe)}
                    <div className="absolute inset-x-0 top-[45%] h-[0.5mm] bg-black -rotate-[12deg] pointer-events-none" />
                  </span>
                </div>
              </div>

              {/* SEÇÃO POR - Com Por: perto do preço e R$ expoente */}
              <div className="flex flex-row items-center gap-x-2">
                <span className="font-headline font-medium text-[8.5pt] leading-none uppercase">Por:</span>
                
                <div className="flex items-start">
                  <span className="font-headline font-medium text-[11pt] leading-none mt-[1mm] mr-1">R$</span>
                  <div className="flex items-end">
                    <span className="font-headline font-medium leading-none tracking-normal inline-block origin-left scale-x-70" style={{ fontSize: `calc(${priceFontSize} * 0.9)` }}>
                      {porInt},{porDec}
                    </span>
                    <span className="font-bold text-[5pt] uppercase leading-none ml-1 mb-[1.5mm]">un. à vista</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Preço ÚNICO (Sem Oferta) */
            <div className="flex flex-col items-center justify-center w-full relative">
              {/* Rótulo Por: reduzido e deslocado para a esquerda perto da borda */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-start">
                 <span className="font-headline font-medium text-[16pt] leading-none uppercase">Por:</span>
              </div>

              <div className="flex items-start">
                {/* R$ como expoente no topo ajustado */}
                <span className="font-headline font-medium text-[22pt] leading-none mt-[2mm] mr-2">R$</span>
                <div className="flex items-end">
                  <span className="font-headline font-medium leading-none tracking-normal inline-block origin-left scale-x-70" style={{ fontSize: priceFontSize }}>
                    {porInt},{porDec}
                  </span>
                  {/* un. à vista reduzido e mais baixo */}
                  <span className="font-bold text-[10pt] uppercase leading-none ml-2 mb-[4mm]">un. à vista</span>
                </div>
              </div>
            </div>
          )}

          {/* Parcelamento estilo CAPSULA (Pill) - Ajustado para ocupar mais espaço */}
          {showInstallment && (
             <div className="mt-auto mb-[2mm] border-[0.5mm] border-black rounded-[3.5mm] px-2 py-1.5 flex items-center justify-center gap-x-1.5 w-full whitespace-nowrap overflow-hidden">
                <span className="font-headline font-medium text-[11pt] uppercase">ou</span>
                <span className="font-headline font-medium text-[15pt] uppercase">{maxInstallments}x sem juros</span>
                <span className="font-headline font-medium text-[11pt] uppercase">de</span>
                <span className="font-headline font-medium text-[18pt] uppercase">R$ {formatCurrency(installmentValue)}</span>
             </div>
          )}
        </div>

        {/* 3. BASE: METADADOS E FORNECEDOR EM LINHA ÚNICA */}
        <div className="w-full pt-1 flex items-center justify-center gap-x-4 flex-nowrap text-[7.5pt] font-headline font-bold uppercase overflow-hidden whitespace-nowrap">
            <span className="truncate max-w-[25%]">{supplier || 'N/A'}</span>
            <span className="opacity-30">|</span>
            <span className="shrink-0">SAP: {code || 'N/A'}</span>
            <span className="shrink-0">EAN: {ean || 'N/A'}</span>
            <span className="shrink-0">REF: {reference || 'N/A'}</span>
        </div>
      </div>

      {/* ── QUADRADO DE DESCONTO (À DIREITA) ── */}
      {isOffer && hasDiscount && (
        <div className="w-[28mm] h-full bg-black text-white flex items-center justify-center shrink-0 z-10 border-l border-white/20">
          <div className="-rotate-90 whitespace-nowrap">
            <span className="font-headline font-medium text-[34pt] leading-none tracking-[6px] uppercase">
              Oferta
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
