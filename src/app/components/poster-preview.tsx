'use client';

import type { PosterData, PosterSettings } from '@/app/lib/types';
import { Card } from '@/components/ui/card';
import { OfertasHeader } from './ofertas-header';
import { parsePrice, formatCurrency, calculateInstallments, truncateMultiLine } from '@/app/lib/poster-utils';

/** Tamanho dinâmico da fonte da descrição baseado no número de linhas */
function descFontSize(linesCount: number): string {
  return '1.15em';
}

export function PosterPreview({
  description,
  priceFrom,
  priceFor,
  code,
  ean,
  reference,
  supplier,
  paymentOption,
  offerValidityStart,
  offerValidity,
  isImperdiveis,
  settings,
}: PosterData & { isImperdiveis?: boolean; settings: PosterSettings }) {
  const valDe  = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const displayDescriptionLines = truncateMultiLine(description, 20, 2);

  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;
  const discount    = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const installmentText  = paymentOption === 'installment' && maxInstallments > 1 ? (
    <div className="font-headline text-center font-bold text-[0.8em] leading-tight mt-3 opacity-90 flex flex-col items-center uppercase">
      <span>ou parcelado em até</span>
      <span className="text-[1.15em]">{maxInstallments}x sem juros de R$ {formatCurrency(installmentValue)}</span>
    </div>
  ) : null;

  let priceFontSize = '2.8rem';
  if (porInteger.length >= 6) priceFontSize = '1.6rem';
  else if (porInteger.length === 5) priceFontSize = '2.0rem';
  else if (porInteger.length === 4) priceFontSize = '2.4rem';

  return (
    <div className="w-full h-full overflow-hidden bg-white text-black font-body relative" style={{ fontSize: '16px' }}>
      {/* Layout: duas colunas, cada uma com grid de 3 linhas fixas */}
      <div className="flex flex-col h-full w-full">
        {/* PARTE SUPERIOR: Duas Colunas (75% da altura) */}
        <div className="flex h-[75%] w-full">
          {/* Coluna Esquerda: Header, Descrição e Preço DE */}
          <div className="w-1/2 p-[0.35cm] pb-2 flex flex-col overflow-hidden">
            <div className="shrink-0 mb-2">
              <OfertasHeader
                textSize={70}
                title={isImperdiveis ? 'OFERTA IMPERDÍVEL' : 'OFERTA'}
              />
            </div>

            <div className="shrink-0 mb-2 h-[3.5em] flex items-center justify-center">
              <h2 
                className="font-headline font-black uppercase leading-[1.05] tracking-tight text-center text-black line-clamp-3"
                style={{ fontSize: descFontSize(displayDescriptionLines.length) }}
              >
                {displayDescriptionLines.join('\n')}
              </h2>
            </div>
    
            <div className={`flex-1 flex flex-col items-start justify-end pb-10 px-4 transition-opacity ${hasDiscount ? 'opacity-100' : 'opacity-0'}`}>
              <div className="relative inline-block ml-4">
                <span className="absolute -top-[0.4rem] -left-[1.0cm] text-[0.8em] font-headline font-bold uppercase leading-none z-10 whitespace-nowrap">DE: R$</span>
                <span className="font-headline font-bold text-[2.0rem] leading-none tabular-nums">
                  {formatCurrency(valDe)}
                </span>
              </div>
            </div>
          </div>

          <div className="w-1/2 flex flex-col overflow-hidden pt-0 pr-0 pb-0 pl-[0.35cm]">
            <div className="bg-black text-white text-center font-headline flex flex-col items-center justify-center print:color-adjust-exact px-3 w-full h-[85%]">
              <div className="flex flex-col justify-center items-center">
                <span className="text-[6.0em] leading-[0.9] font-medium tracking-tight tabular-nums">{discount}%</span>
                <span className="text-[0.8em] leading-none uppercase mt-2 tracking-tight font-bold">DE DESCONTO</span>
              </div>
            </div>
          </div>
        </div>

        {/* PARTE INFERIOR: Preço POR Centralizado (25% da altura) */}
        <div className="flex-1 flex flex-col items-start justify-center relative px-[1.2cm] mt-[-0.5cm]">
          <div className="flex flex-col space-y-1 ml-10 mt-[-1.5rem]">
            {/* Bloco POR */}
            <div className="flex flex-col items-start">
              <div className="relative inline-block ml-4">
                <span className="absolute -top-[0.6rem] -left-[1.2cm] text-[0.8em] font-headline font-bold uppercase leading-none z-10 whitespace-nowrap">POR: R$</span>
                <span className="font-headline font-bold text-[4.3rem] tracking-tight tabular-nums leading-none">
                  {porInteger},{porDecimal}
                </span>
                {valPor > 0 && (
                  <div className="absolute right-[-1.8cm] bottom-[0.8em] font-bold text-black whitespace-nowrap">
                    <span className="text-[0.5em] uppercase leading-none">un. à vista</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Validade logo abaixo do preço */}
          <div className="shrink-0 text-[0.45em] w-full leading-tight text-black font-semibold flex flex-col items-center text-center mt-4">
            {(offerValidityStart || offerValidity) && (
              <>
                <span>
                  Oferta válida{' '}
                  {offerValidityStart && <span>de <b className="font-black">{offerValidityStart}</b>{' '}</span>}
                  {offerValidity      && <span>até <b className="font-black">{offerValidity}</b></span>}
                </span>
                <span>ou enquanto durarem os estoques.</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RODAPÉ FULL WIDTH (Ponta a Ponta) - Fonte mínima e em preto sólido */}
      <div className="absolute bottom-[0.35cm] left-0 right-0 flex justify-center overflow-hidden px-[0.35cm] opacity-100">
        <div className="text-[0.45em] text-black font-bold uppercase flex flex-nowrap items-center gap-x-1">
          {supplier && <span>{supplier}</span>}
          {(supplier && (code || ean || reference)) && <span className="mx-1">|</span>}
          {code && <span className="ml-1">SAP: {code}</span>}
          {ean && <span className="ml-3">EAN: {ean}</span>}
          {reference && <span className="ml-3">REF.: {reference}</span>}
        </div>
      </div>
    </div>
  );
}
