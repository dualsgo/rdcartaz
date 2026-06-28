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

  const isOffer     = posterSubType === 'offer';
  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;

  const priceDisplay = formatCurrency(valPor); // "999,99" — string uniforme

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallment = paymentOption === 'installment' && maxInstallments > 1;
  const installStr = formatCurrency(installmentValue);

  const displayDescription = truncateDescription(description, 50);

  // ── FONTE À VISTA (maior — CDC) ──────────────────────────────────────────
  // Linha 4 box height ≈ 115px (88% de ~131px). Máximo sem vazar.
  let priceFontSize = '6.9rem';
  if (priceDisplay.length >= 8)      priceFontSize = '4.52rem';
  else if (priceDisplay.length >= 6) priceFontSize = '5.47rem';
  else if (priceDisplay.length >= 5) priceFontSize = '6.19rem';

  // ── FONTE PARCELADO (menor que à vista — CDC) ────────────────────────────
  let installFontSize = '3.8rem';
  if (installStr.length >= 8)      installFontSize = '2.4rem';
  else if (installStr.length >= 6) installFontSize = '3.0rem';
  else if (installStr.length >= 5) installFontSize = '3.4rem';

  return (
    <div className={cn(
      'w-full h-full text-black font-gotham overflow-hidden relative flex flex-col box-border',
      isOffer ? 'bg-[#FFF200] print:!bg-white' : 'bg-white'
    )}>

      {/* ── LINHA 1: ESPAÇO EM BRANCO (25%) ── */}
      <div className="h-[25%] shrink-0" />

      {/* ── LINHAS 2–4 + METADADOS (75%) ── */}
      <div className="flex-1 flex flex-col">

        {/* ─── LINHA 2 — DESCRIÇÃO ─── */}
        {/* Altura ≈ 124px. 2 linhas → máx ~3.0rem por linha */}
        <div className="flex-[1] flex items-center justify-center px-[5mm] overflow-hidden">
          <h2
            className="font-gotham font-bold uppercase text-center leading-[1.05] tracking-tight line-clamp-2 w-full text-black"
            style={{ fontSize: '3.0rem' }}
          >
            {displayDescription}
          </h2>
        </div>

        {/* ─── LINHA 3 — PARCELAMENTO (2 colunas) ─── */}
        <div className="flex-[1] flex flex-row overflow-hidden">

          {/* Coluna A — NxX + SEM JUROS */}
          <div className="flex-1 flex flex-col items-end justify-center overflow-hidden px-[2mm]">
            {showInstallment ? (
              <>
                <span
                  className="font-gotham font-bold uppercase leading-none text-black"
                  style={{ fontSize: installFontSize }}
                >
                  {maxInstallments}X
                </span>
                <span
                  className="font-gotham font-medium uppercase tracking-widest leading-none text-black"
                  style={{ fontSize: '0.75rem' }}
                >
                  SEM JUROS
                </span>
              </>
            ) : hasDiscount ? (
              <>
                <span className="font-gotham font-medium uppercase leading-none text-black" style={{ fontSize: '0.75rem' }}>de</span>
                <span className="font-gotham font-medium line-through leading-none text-black" style={{ fontSize: '2.5rem' }}>
                  R$ {formatCurrency(valDe)}
                </span>
              </>
            ) : null}
          </div>

          {/* Coluna B — R$ + valor parcelado */}
          <div className="flex-1 flex flex-col items-start justify-center overflow-hidden px-[2mm]">
            {showInstallment ? (
              <div className="flex flex-row items-start justify-start gap-x-1 font-gotham">
                <span className="font-medium leading-none text-black" style={{ fontSize: '1.1rem', paddingTop: '0.35em' }}>R$</span>
                <span className="font-bold leading-none tracking-tight text-black" style={{ fontSize: installFontSize }}>
                  {installStr}
                </span>
              </div>
            ) : null}
          </div>

        </div>{/* fim linha 3 */}

        {/* ─── LINHA 4 — À VISTA (flex-[1.1]) ─── */}
        <div className="flex-[1.1] flex items-center justify-center px-[4mm] overflow-hidden">
          <div className="w-full h-[88%] border-[0.5mm] border-black rounded-[1.5mm] flex flex-row overflow-hidden box-border">

            {isOffer && hasDiscount ? (
              <>
                {/* OFERTA: 3 colunas — À vista (estreita) | DE (estreita) | POR (máximo) */}

                {/* Col A — apenas "À vista:" — comprimida */}
                <div className="flex-[0.6] flex flex-col items-center justify-center leading-none font-gotham overflow-hidden px-[1mm]">
                  <span className="font-medium uppercase tracking-tight text-black whitespace-nowrap" style={{ fontSize: '0.95rem' }}>
                    À vista:
                  </span>
                </div>

                {/* Col B — DE: + valor riscado — expandida com espaço liberado */}
                <div className="flex-[1.6] flex flex-row items-center justify-center leading-none font-gotham overflow-hidden px-[1mm]">
                  <div className="flex flex-row items-start gap-x-0.5 relative">
                    <div className="flex flex-col items-start justify-start pt-[0.2em]">
                      <span className="font-medium uppercase text-black mb-[2px]" style={{ fontSize: '0.6rem' }}>DE:</span>
                      <span className="font-medium leading-none text-black" style={{ fontSize: '0.65rem' }}>R$</span>
                    </div>
                    <span className="font-medium leading-none text-black relative" style={{ fontSize: `calc(${priceFontSize} * 0.48)` }}>
                      {formatCurrency(valDe)}
                      <span className="absolute inset-x-0 top-[45%] border-t border-black" style={{ transform: 'rotate(-8deg)' }} />
                    </span>
                  </div>
                </div>

                {/* Col C — POR: — ajustado para ceder espaço */}
                <div className="flex-[2.5] flex flex-row items-center justify-end leading-none font-gotham overflow-hidden pl-[1mm] pr-[5mm]">
                  <div className="flex flex-row items-start gap-x-1">
                    <div className="flex flex-col items-start justify-start pt-[0.2em]">
                      <span className="font-medium uppercase text-black mb-[2px]" style={{ fontSize: '0.65rem' }}>POR:</span>
                      <span className="font-medium leading-none text-black" style={{ fontSize: '1.1rem' }}>R$</span>
                    </div>
                    <span className="font-bold leading-none tracking-tight text-black" style={{ fontSize: `calc(${priceFontSize} * 0.85)` }}>
                      {priceDisplay}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* NORMAL: 2 colunas — "À vista:" | R$ + preço */}

                {/* Col A — apenas "À vista:" */}
                <div className="flex-[0.85] flex flex-col items-center justify-center leading-none font-gotham overflow-hidden px-[1mm]">
                  <span className="font-medium uppercase tracking-tight text-black whitespace-nowrap" style={{ fontSize: '1.09rem' }}>
                    À vista:
                  </span>
                </div>

                {/* Col B — R$ padrão + preço */}
                <div className="flex-[2.5] flex items-center justify-center font-gotham overflow-hidden px-[2mm]">
                  <div className="flex flex-row items-start gap-x-1">
                    <span className="font-medium leading-none text-black" style={{ fontSize: '1.8rem', paddingTop: '0.35em' }}>R$</span>
                    <span className="font-bold leading-none tracking-tight text-black" style={{ fontSize: priceFontSize }}>
                      {priceDisplay}
                    </span>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>{/* fim linha 4 */}

        {/* ─── METADADOS (flex-[0.4]) ─── */}
        <div className="flex-[0.4] flex items-center justify-center px-[4mm] overflow-hidden">
          <div
            className="flex items-center gap-x-3 font-gotham font-medium uppercase text-black whitespace-nowrap overflow-hidden"
            style={{ fontSize: '0.84rem' }}
          >
            {supplier  && <span>{supplier}</span>}
            {supplier  && (code || ean || reference) && <span>|</span>}
            {code      && <span>SAP: {code}</span>}
            {ean       && <span>EAN: {ean}</span>}
            {reference && <span>REF.: {reference}</span>}
          </div>
        </div>

      </div>{/* fim linhas 2–4 + metadados */}

      {/* VALIDADE */}
      {(offerValidityStart || offerValidity) && (
        <div className="absolute bottom-[0.5mm] right-[4mm] text-[3.5pt] font-gotham font-medium uppercase text-black pointer-events-none whitespace-nowrap">
          Válido {offerValidityStart ? `de ${offerValidityStart} ` : ''}{offerValidity ? `até ${offerValidity}` : 'enquanto durarem os estoques'}
        </div>
      )}
    </div>
  );
}
