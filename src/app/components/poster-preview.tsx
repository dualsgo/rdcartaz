'use client';

import type { PosterData, PosterSettings } from '@/app/lib/types';
import { Card } from '@/components/ui/card';
import { OfertasHeader } from './ofertas-header';
import { parsePrice, formatCurrency, calculateInstallments, truncateMultiLine } from '@/app/lib/poster-utils';

/** Tamanho dinâmico da fonte da descrição baseado no número de linhas */
function descFontSize(linesCount: number): string {
  return '1.35em';
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
    <div className="w-full h-full overflow-hidden bg-white text-black font-body relative">
      {/* Layout: duas colunas, cada uma com grid de 3 linhas fixas */}
      <div className="flex h-full w-full">

        {/* ── Coluna Esquerda ── */}
        <div className="w-1/2 p-[0.35cm] pb-[1cm] flex flex-col overflow-hidden">

          {/* ZONA 1: Header (tamanho fixo) */}
          <div className="shrink-0">
            <OfertasHeader
              textSize={70}
              title={isImperdiveis ? 'OFERTAS IMPERDÍVEIS' : 'OFERTAS'}
            />
          </div>

          {/* ZONA 2: Descrição (fonte dinâmica) */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <h2 
              className="font-headline font-black uppercase leading-[1.05] tracking-tight text-center text-black line-clamp-3"
              style={{ fontSize: descFontSize(displayDescriptionLines.length) }}
            >
              {displayDescriptionLines.join('\n')}
            </h2>
          </div>
  
          {/* ZONA 3: Preço DE */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className={`transition-opacity text-center text-[1.8em] font-headline text-black ${hasDiscount ? 'opacity-100' : 'opacity-0'}`}>
              <span className="block text-[0.6em] mb-1 font-medium">DE:</span>
              <div className="relative inline-block">
                <span className="font-medium">R$ {formatCurrency(valDe)}</span>
                <div className="absolute inset-x-0 top-[50%] h-[0.4mm] bg-black -rotate-[12deg] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ZONA 4: Espaço reservado para manter o alinhamento da coluna */}
          <div className="h-4" />
        </div>

        {/* ── Coluna Direita ── */}
        <div className="w-1/2 flex flex-col overflow-hidden pt-0 pr-0 pb-[0.35cm] pl-[0.35cm]">

          {/* ZONA 1: Caixa preta de desconto (tamanho fixo) */}
          <div className="shrink-0 bg-black text-white text-center font-headline font-black flex flex-col items-center justify-center print:color-adjust-exact px-3 py-1 w-full h-[5.5em]">
            <div className="flex flex-col justify-center items-center h-full">
              <span className="text-[1.5em] leading-none uppercase">DESCONTO DE</span>
              <span className="text-[3.5em] leading-none">{discount}%</span>
            </div>
          </div>

          {/* ZONA 2: Preço POR (ocupa espaço central) */}
          <div className="flex-1 flex flex-col items-center justify-center text-[1.3em] leading-none text-black w-full min-w-0 px-0">
            <span className="font-headline text-[0.75em] font-medium w-full text-center shrink-0 mb-1 z-10">POR:</span>
            <div className="flex items-center justify-center w-full shrink-0">
              <div className="flex items-baseline shrink-0 tracking-tighter w-full justify-center relative">
                <span className="font-headline font-medium leading-none whitespace-nowrap" style={{ fontSize: priceFontSize }}>
                  R$ {porInteger},{porDecimal}
                </span>
                {valPor > 0 && (
                  <div className="absolute right-[5%] bottom-[-0.75em] font-bold text-black">
                    <span className="text-[0.45em] uppercase leading-none">un. à vista</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ZONA 3: Parcelamento (Alinhado com o preço DE da esquerda) */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {installmentText}
          </div>

          {/* ZONA 3: Validade (tamanho fixo) */}
          <div className="shrink-0 text-[0.52em] w-full leading-tight text-black font-semibold pb-1 flex flex-col items-center text-center">
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
        <div className="text-[0.45em] flex flex-nowrap gap-x-6 text-black font-bold uppercase">
           {reference && <span className="truncate max-w-[30%]">Ref.: <b className="font-bold">{reference}</b></span>}
           {code      && <span className="truncate max-w-[25%]">SAP: <b className="font-bold">{code}</b></span>}
           {ean       && <span className="truncate max-w-[25%]">EAN: <b className="font-bold">{ean}</b></span>}
           {supplier  && <span className="truncate max-w-[40%]">Forn.: <b className="font-bold">{supplier}</b></span>}
        </div>
      </div>
    </div>
  );
}
