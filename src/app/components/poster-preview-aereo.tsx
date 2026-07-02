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
  const displaySupplier = supplier ? supplier.split(' ').slice(0, 2).join(' ').substring(0, 20) : '';

  // ── FONTE PRINCIPAL (POR ou NORMAL) ──────────────────────────────────────────
  // A altura máxima do contêiner é ~115px (aprox 6.9rem).
  let priceFontSizeNum = 6.9; 

  if (isOffer && hasDiscount) {
    // OFERTA (com ou sem parcelamento): 2 colunas, divide espaço horizontal com DE
    if (valPor === 0)                  priceFontSizeNum = 4.2;
    else if (priceDisplay.length >= 8) priceFontSizeNum = 3.5; 
    else if (priceDisplay.length >= 7) priceFontSizeNum = 4.2;
    else if (priceDisplay.length >= 6) priceFontSizeNum = 5.2;
    else if (priceDisplay.length >= 5) priceFontSizeNum = 6.0;
    else                               priceFontSizeNum = 6.8; 
  } else {
    // NORMAL (muito mais espaço horizontal)
    if (valPor === 0)                  priceFontSizeNum = 4.2;
    else if (priceDisplay.length >= 8) priceFontSizeNum = 4.0;
    else if (priceDisplay.length >= 7) priceFontSizeNum = 4.8;
    else if (priceDisplay.length >= 6) priceFontSizeNum = 5.8;
    else if (priceDisplay.length >= 5) priceFontSizeNum = 6.8;
    else                               priceFontSizeNum = 6.9;
  }

  const actualPorFontSizeNum = priceFontSizeNum;

  // ── FONTE PARCELADO (menor que à vista — CDC) ────────────────────────────
  let installFontSizeNum = 3.8;
  if (installStr.length >= 8)      installFontSizeNum = 2.4;
  else if (installStr.length >= 6) installFontSizeNum = 3.0;
  else if (installStr.length >= 5) installFontSizeNum = 3.4;

  // Garantia CDC: parcelado não pode ser maior que o preço à vista
  // Reduzimos em 10% para ter certeza visualmente que é menor
  installFontSizeNum = Math.min(installFontSizeNum, actualPorFontSizeNum * 0.9);

  const priceFontSize = `${priceFontSizeNum}rem`;
  const installFontSize = `${installFontSizeNum}rem`;
  const deFontSize = `${priceFontSizeNum * 0.55}rem`;

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

        {/* ─── LINHA 3 — PARCELAMENTO (2 colunas ou 1 coluna centrada) ─── */}
        <div className="flex-[1] flex flex-row overflow-hidden">

          {showInstallment ? (
            <>
              {/* Coluna A — NxX + SEM JUROS */}
              <div className="flex-1 flex flex-col items-end justify-center overflow-hidden px-[2mm]">
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
              </div>

              {/* Coluna B — R$ + valor parcelado */}
              <div className="flex-1 flex flex-col items-start justify-center overflow-hidden px-[2mm]">
                <div className="flex flex-row items-start justify-start gap-x-1 font-gotham">
                  <span className="font-medium leading-none text-black" style={{ fontSize: '1.1rem', paddingTop: '0.35em' }}>R$</span>
                  <span className="font-bold leading-none tracking-tight text-black" style={{ fontSize: installFontSize }}>
                    {installStr}
                  </span>
                </div>
              </div>
            </>
          ) : hasDiscount && !isOffer ? (
            <div className="w-full flex flex-row items-center justify-center gap-2 overflow-hidden px-[2mm]">
              <span className="font-gotham font-medium uppercase text-black" style={{ fontSize: '1.1rem' }}>DE:</span>
              <span className="font-gotham font-medium text-black relative" style={{ fontSize: '2.42rem' }}>
                R$ {formatCurrency(valDe)}
                <span className="absolute inset-x-0 top-[50%] border-t-[1.5px] border-black" style={{ transform: 'rotate(-4deg)' }} />
              </span>
            </div>
          ) : null}

        </div>{/* fim linha 3 */}

        {/* ─── LINHA 4 — À VISTA (flex-[1.1]) ─── */}
        <div className="flex-[1.1] flex items-center justify-center px-[4mm] overflow-hidden">
          <div className="w-full h-[88%] border-[0.5mm] border-black rounded-[1.5mm] flex flex-row overflow-hidden box-border">

            {isOffer && hasDiscount ? (
              <>
                {/* OFERTA: 2 colunas expandidas — DE (flex-[2]) | POR (flex-[2.7]) */}

                {/* Col B — DE: + valor riscado — expandida com espaço liberado */}
                <div className="flex-[2] flex flex-row items-center justify-center leading-none font-gotham overflow-hidden px-[1mm]">
                  <div className="flex flex-row items-start gap-x-0.5 relative">
                    <div className="flex flex-col items-start justify-start pt-[0.2em]">
                      <span className="font-medium uppercase text-black mb-[2px]" style={{ fontSize: '0.95rem' }}>DE:</span>
                      <span className="font-medium leading-none text-black" style={{ fontSize: '0.95rem' }}>R$</span>
                    </div>
                    <span className="font-medium leading-none text-black relative" style={{ fontSize: deFontSize }}>
                      {formatCurrency(valDe)}
                      <span className="absolute inset-x-0 top-[45%] border-t border-black" style={{ transform: 'rotate(-8deg)' }} />
                    </span>
                  </div>
                </div>

                {/* Col C — POR: — ocupando grande parte do espaço */}
                <div className="flex-[2.7] flex flex-row items-center justify-center leading-none font-gotham overflow-hidden px-[2mm]">
                  <div className="flex flex-row items-start gap-x-1">
                    <div className="flex flex-col items-start justify-start pt-[0.2em]">
                      <span className="font-medium uppercase text-black mb-[2px]" style={{ fontSize: '0.95rem' }}>POR:</span>
                      <span className="font-medium leading-none text-black" style={{ fontSize: '0.95rem' }}>R$</span>
                    </div>
                    <span className="font-bold leading-none tracking-tight text-black" style={{ fontSize: priceFontSize }}>
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
            {displaySupplier  && <span>{displaySupplier}</span>}
            {displaySupplier  && (code || ean || reference) && <span>|</span>}
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
