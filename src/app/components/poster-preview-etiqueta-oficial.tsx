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

  const displayDescription = truncateDescription(description, 32);

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  const isRegular = !isOffer;
  
  // Tamanhos calculados calibrados (proporções originais perfeitas)
  const mainPriceSize = isRegular 
    ? (hasInstallments ? '36px' : '42.1px')
    : (hasInstallments ? '24px' : '27px');
    
  const dePriceSize = hasInstallments ? '20px' : '23px';
  
  const labelSize = isRegular
    ? (hasInstallments ? '9.5px' : '11px')
    : (hasInstallments ? '7.7px' : '8.9px');
    
  const unSize = isRegular
    ? (hasInstallments ? '9px' : '10px')
    : (hasInstallments ? '6.5px' : '7.5px');

  // Fornecedor e Referência conforme padrão
  const fornecedorRefText = [
    supplier ? truncateDescription(supplier, 32) : '',
    reference ? `Ref ${reference}` : ''
  ].filter(Boolean).join(' - ');

  return (
    <div 
      className={cn(
        "w-full h-full text-black font-gotham overflow-hidden relative flex box-border p-[2.1mm]", 
        isOffer ? 'bg-[#FFF200] print:!bg-white' : 'bg-white'
      )}
    >
      {/* Container de compressão (95% para margem de segurança de corte e escala) */}
      <div className="w-full h-full flex flex-row" style={{ transform: 'scale(0.95)', transformOrigin: 'center' }}>
        
        {/* ─── LADO ESQUERDO: Área Comercial (Nome, Preços, Parcelas, Fornecedor) ─── */}
        <div className="flex-1 flex flex-col justify-between pr-2 h-full min-w-0 overflow-hidden">
          
          {/* 1. NOME DO PRODUTO (Topo Esquerdo - Caixa Alta, Negrito) */}
          <div className="shrink-0">
            <h2 className="font-bold text-[14.5px] leading-[1.1] uppercase tracking-tighter overflow-hidden line-clamp-2 text-left origin-left">
              {displayDescription}
            </h2>
          </div>

          {/* 2. ÁREA DE PREÇO E PARCELAMENTO */}
          <div className="flex-1 flex flex-col justify-center min-h-0 min-w-0 my-0.5">
            {isOffer && hasDiscount ? (
              /* CASO OFERTA: DE / POR */
              <div className="flex w-full items-center justify-between">
                {/* SEÇÃO DE: */}
                <div className="flex w-[48%] justify-start">
                  <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-0.5 leading-none shrink-0">
                      <span className="font-bold uppercase" style={{ fontSize: labelSize }}>De:</span>
                      <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                    </div>
                    <div className="flex items-baseline leading-none relative">
                      <span className="font-bold tracking-tighter whitespace-nowrap leading-none" style={{ fontSize: dePriceSize }}>
                        {deInteger},{deDecimal}
                      </span>
                      <div className="absolute inset-x-[-1mm] top-[45%] h-[0.35mm] bg-black -rotate-[12deg] pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="w-[4%] shrink-0" />

                {/* SEÇÃO POR: */}
                <div className="flex w-[48%] justify-start">
                  <div className="flex flex-col items-start">
                    <div className="flex items-baseline gap-0.5 leading-none shrink-0">
                      <span className="font-bold uppercase" style={{ fontSize: labelSize }}>Por:</span>
                      <span className="font-bold uppercase leading-none" style={{ fontSize: labelSize }}>R$</span>
                    </div>
                    <div className="flex items-baseline leading-none flex-nowrap">
                      <span className="font-bold leading-none tracking-tighter" style={{ fontSize: mainPriceSize }}>{porInteger}</span>
                      <div className="flex items-baseline leading-none">
                        <span className="font-bold ml-0.5 tracking-tighter" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>,</span>
                        <div className="flex items-baseline leading-none">
                          <span className="font-bold leading-none tracking-tighter" style={{ fontSize: mainPriceSize }}>{porDecimal}</span>
                          <span className="font-bold uppercase ml-1" style={{ fontSize: unSize }}>UN</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : hasInstallments ? (
              /* CASO REGULAR COM PARCELAMENTO (Grid: Preço à Vista + Total em Destaque) */
              <div className="flex flex-col justify-center w-full">
                <div className="flex items-baseline justify-between w-full">
                  {/* RÓTULO: PREÇO À VISTA: R$ */}
                  <div className="flex items-baseline shrink-0">
                    <span className="font-bold uppercase leading-none tracking-tight" style={{ fontSize: '9px' }}>
                      PREÇO À VISTA: R$
                    </span>
                  </div>

                  {/* PREÇO TOTAL EM NEGRITO (Ex: 129,99) */}
                  <div className="flex items-baseline leading-none flex-nowrap origin-right">
                    <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>
                      {porInteger}
                    </span>
                    <span className="font-bold ml-0.5 leading-none" style={{ fontSize: `calc(${mainPriceSize} * 0.7)` }}>
                      ,
                    </span>
                    <span className="font-bold tracking-normal leading-none" style={{ fontSize: mainPriceSize }}>
                      {porDecimal}
                    </span>
                    <span className="font-bold uppercase ml-1" style={{ fontSize: unSize }}>
                      UN
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* CASO REGULAR À VISTA (SEM PARCELAMENTO) */
              <div className="flex w-full items-baseline justify-start gap-1.5">
                <span className="font-bold uppercase leading-none" style={{ fontSize: '11px' }}>R$</span>
                <div className="flex items-baseline leading-none flex-nowrap origin-left scale-x-[0.95]">
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

          {/* 3. BLOCO DE PARCELAS: [NUM]X, SEM JUROS (abaixo do número) e VALOR PARCELA */}
          {hasInstallments && (
            <div className="shrink-0 flex items-center justify-between py-0.5 w-full">
              {/* [NUM]X e SEM JUROS (SEM JUROS posicionado logo abaixo do número, sem o zero) */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-[13px] font-bold leading-none tracking-tighter">
                  {maxInstallments}X
                </span>
                <span className="text-[6.5px] font-bold leading-none uppercase tracking-wider mt-[1.5px]">
                  SEM JUROS
                </span>
              </div>

              {/* R$ [VALOR PARCELA] */}
              <div className="flex items-baseline gap-0.5">
                <span className="font-bold leading-none" style={{ fontSize: '9px' }}>R$</span>
                <span className="font-bold leading-none tracking-tight" style={{ fontSize: '18px' }}>
                  {formatCurrency(installmentValue)}
                </span>
              </div>
            </div>
          )}

          {/* 4. RODAPÉ - FORNECEDOR / RAZÃO SOCIAL - Ref XXX (Cobrindo toda a largura até o código de barras) */}
          <div className="shrink-0 flex items-center overflow-hidden h-[4.5mm] text-[8px] font-normal uppercase w-full">
            <span className="truncate w-full text-left">
              {fornecedorRefText || (reference ? `REF: ${reference}` : '')}
            </span>
          </div>
        </div>

        {/* ─── LADO DIREITO (Borda Direita): Códigos Verticais e Barras ─── */}
        <div className="w-[18%] flex-none flex items-center justify-center h-full relative pl-1">
          {/* COLUNA INTERNA: Código SAP/Interno (se disponível e tiver EAN) */}
          {code && ean && ean.length >= 12 && (
            <div className="h-full flex items-center justify-center mr-1">
              <span className="text-[7.5px] text-black font-bold tracking-wider -rotate-90 origin-center whitespace-nowrap">
                {code}
              </span>
            </div>
          )}

          {/* COLUNA EXTERNA: Código de Barras + Numeração Afastada */}
          <div className="flex flex-col items-center justify-center h-full">
            {ean && ean.length >= 12 ? (
              <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center">
                {/* NÚMERO EAN AFASTADO DAS BARRAS (com espaçamento mb-1.5 para nunca encavalar) */}
                <div className="w-full flex justify-center mb-1">
                  <span className="text-[7.5px] text-black tracking-tight inline-block rotate-180 font-bold">
                    {ean}
                  </span>
                </div>
                {/* BARRAS ABAIXO DA NUMERAÇÃO */}
                <div className="flex items-center justify-center">
                  <BarcodeEAN value={ean} height="8.5mm" width="24mm" showText={false} />
                </div>
              </div>
            ) : code ? (
              <div className="rotate-90 origin-center whitespace-nowrap flex flex-col items-center">
                <div className="w-full flex justify-center mb-1">
                  <span className="text-[7.5px] text-black tracking-tight inline-block rotate-180 font-bold">
                    {code}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <BarcodeSAP value={code} height="8.5mm" width="24mm" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
