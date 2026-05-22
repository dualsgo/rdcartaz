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
  offerValidityStart,
  offerValidity,
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
    <div className={cn("w-full h-full text-black font-body overflow-hidden relative flex flex-row box-border", isOffer ? 'bg-[#FFF200] print:!bg-white' : 'bg-white')}>
      {/* ── CONTEÚDO PRINCIPAL (COMPRIMIDO À ESQUERDA) ── */}
      <div className="flex-1 flex flex-col justify-between p-[5mm] overflow-hidden relative">
        
        {/* 1. TOPO: DESCRIÇÃO */}
        <div className="w-full h-[12mm] flex items-start justify-center shrink-0">
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
                  <div className="flex items-end pb-[2.5mm]">
                    <span className="font-headline font-medium leading-none tracking-normal inline-block origin-left scale-x-70 relative" style={{ fontSize: `calc(${priceFontSize} * 0.9)` }}>
                      {porInt},{porDec}
                      <span className="absolute right-[2%] -bottom-[2.5mm] font-bold text-[6.5pt] uppercase leading-none origin-right text-right" style={{ transform: 'scaleX(1.43)' }}>un. à vista</span>
                    </span>
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
                <div className="flex items-end pb-[3.5mm]">
                  <span className="font-headline font-medium leading-none tracking-normal inline-block origin-left scale-x-70 relative" style={{ fontSize: priceFontSize }}>
                    {porInt},{porDec}
                    {/* un. à vista embaixo do último centavo */}
                    <span className="absolute right-0 -bottom-[3mm] font-bold text-[7.5pt] uppercase leading-none origin-right text-right" style={{ transform: 'scaleX(1.43)' }}>un. à vista</span>
                  </span>
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

        {/* 3. BASE: METADADOS (APENAS SAP E EAN) */}
        <div className="w-full pt-1 flex items-center justify-center gap-x-12 flex-nowrap text-[11pt] font-headline uppercase overflow-hidden whitespace-nowrap">
            <span className="shrink-0">SAP: <b className="font-black">{code || '-'}</b></span>
            <span className="shrink-0">EAN: <b className="font-black">{ean || '-'}</b></span>
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

      {/* VALIDADE (Absoluta para não quebrar layout serrilhado) */}
      {(isOffer && (offerValidityStart || offerValidity)) && (
        <div className="absolute bottom-[0.5mm] right-[30mm] text-[4.5pt] font-headline uppercase text-black/60 pointer-events-none whitespace-nowrap bg-white/80 px-1 rounded">
          Válido {offerValidityStart ? `de ${offerValidityStart} ` : ''}{offerValidity ? `até ${offerValidity}` : 'enquanto durarem os estoques'}
        </div>
      )}
    </div>
  );
}
