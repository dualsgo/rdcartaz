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

  const displayDescription = truncateDescription(description, 36);

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;
  const [instInteger, instDecimal] = formatCurrency(installmentValue).split(',');

  const fontGothic = "'GOTHICB', 'Century Gothic', 'TeX Gyre Adventor', sans-serif";
  const fontRoboto = "'Roboto', 'Arial', sans-serif";

  // Fornecedor e Referência formatados conforme Pricefy: "ESTRELA DISTR DE BRINQ... - Ref 13805"
  const fornecedorRefText = [
    supplier ? truncateDescription(supplier, 34) : '',
    reference ? `Ref ${reference}` : ''
  ].filter(Boolean).join(' - ');

  return (
    <div 
      className={cn(
        "w-full h-full text-black overflow-hidden relative select-none box-border",
        isOffer ? "bg-[#FFF200] print:!bg-white" : "bg-white"
      )}
      style={{
        width: '90mm',
        height: '34mm',
        position: 'relative',
      }}
    >
      {/* ───────────────────────────────────────────────────────────
          1. TOPO ESQUERDO: NOME DO PRODUTO (Roboto-Bold, 11.5pt)
      ──────────────────────────────────────────────────────────── */}
      <div 
        id="field_produtoDescricaoEtiqueta"
        className="absolute overflow-hidden flex items-center"
        style={{
          top: '3.0mm',
          left: '6.0mm',
          width: '54.0mm',
          height: '6.5mm',
        }}
      >
        <h2 
          className="font-bold uppercase text-black leading-[1.15] line-clamp-2"
          style={{
            fontFamily: fontRoboto,
            fontSize: '11.5pt',
            fontWeight: 700,
          }}
        >
          {displayDescription}
        </h2>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. MEIO E ÁREA CENTRAL: PREÇOS E PARCELAMENTO
      ──────────────────────────────────────────────────────────── */}
      {isOffer && hasDiscount ? (
        /* ─── CASO OFERTA (DE / POR) ─── */
        <>
          {/* DE: R$ XX,XX */}
          <div 
            className="absolute flex items-baseline gap-1"
            style={{ top: '11.5mm', left: '6.0mm' }}
          >
            <span 
              className="font-bold uppercase leading-none"
              style={{ fontFamily: fontRoboto, fontSize: '6.5pt' }}
            >
              De: R$
            </span>
            <div className="relative inline-block leading-none">
              <span 
                className="font-bold leading-none tracking-tighter"
                style={{ fontFamily: fontGothic, fontSize: '18pt' }}
              >
                {deInteger},{deDecimal}
              </span>
              <div className="absolute inset-x-[-1mm] top-[45%] h-[0.35mm] bg-black -rotate-[12deg] pointer-events-none" />
            </div>
          </div>

          {/* POR: R$ XX,XX */}
          <div 
            className="absolute flex items-baseline gap-1"
            style={{ top: '11.0mm', left: '33.0mm' }}
          >
            <span 
              className="font-bold uppercase leading-none"
              style={{ fontFamily: fontRoboto, fontSize: '7.5pt' }}
            >
              Por: R$
            </span>
            <span 
              className="font-bold leading-none tracking-tighter"
              style={{ fontFamily: fontGothic, fontSize: '24pt' }}
            >
              {porInteger},{porDecimal}
            </span>
          </div>

          {/* UNIDADE UN */}
          <div 
            className="absolute"
            style={{ top: '21.5mm', left: '57.0mm' }}
          >
            <span 
              className="font-bold uppercase"
              style={{ fontFamily: fontRoboto, fontSize: '4.5pt' }}
            >
              UN
            </span>
          </div>

          {/* SE PARCELADO NA OFERTA */}
          {hasInstallments && (
            <div 
              className="absolute flex items-center gap-2"
              style={{ top: '23.0mm', left: '6.0mm' }}
            >
              <span 
                className="font-bold"
                style={{ fontFamily: fontGothic, fontSize: '13pt' }}
              >
                {maxInstallments}X
              </span>
              <span 
                className="font-bold uppercase"
                style={{ fontFamily: fontRoboto, fontSize: '4.5pt', letterSpacing: '0.15mm' }}
              >
                SEM JUROS
              </span>
              <span 
                className="font-bold"
                style={{ fontFamily: fontRoboto, fontSize: '5.5pt' }}
              >
                R$
              </span>
              <span 
                className="font-bold leading-none"
                style={{ fontFamily: fontGothic, fontSize: '14pt' }}
              >
                {instInteger},{instDecimal}
              </span>
            </div>
          )}
        </>
      ) : hasInstallments ? (
        /* ─── CASO REGULAR COM PARCELAMENTO (Layout Oficial Pricefy) ─── */
        <>
          {/* [Meio Esquerdo]: PREÇO À VISTA: R$ */}
          <div 
            id="field_Total"
            className="absolute leading-none"
            style={{
              top: '11.5mm',
              left: '10.0mm',
              fontFamily: fontGothic,
              fontSize: '7pt',
              fontWeight: 'bold',
            }}
          >
            PREÇO À VISTA: R$
          </div>

          {/* [Meio Centro/Direito]: PREÇO TOTAL INTEIRO (30pt GOTHICB) */}
          <div 
            id="field_valorVigente_num"
            className="absolute leading-[0.735em] text-left"
            style={{
              top: '11.78mm',
              left: '41.0mm',
              fontFamily: fontGothic,
              fontSize: '30pt',
              fontWeight: 'bold',
            }}
          >
            {porInteger}
          </div>

          {/* [Meio Centro/Direito]: PREÇO TOTAL CENTAVOS (30pt GOTHICB) */}
          <div 
            id="field_valorVigente_cen"
            className="absolute leading-[0.735em] text-left"
            style={{
              top: '11.78mm',
              left: '52.85mm',
              fontFamily: fontGothic,
              fontSize: '30pt',
              fontWeight: 'bold',
            }}
          >
            ,{porDecimal}
          </div>

          {/* [Abaixo do Preço Principal]: UNIDADE UN */}
          <div 
            id="field_produtoApresentacao"
            className="absolute leading-none"
            style={{
              top: '22.36mm',
              left: '60.0mm',
              fontFamily: fontRoboto,
              fontSize: '4.5pt',
              fontWeight: 'bold',
            }}
          >
            UN
          </div>

          {/* [Meio Esquerdo]: QUANTIDADE DE PARCELAS: 2X/3X/4X */}
          <div 
            id="field_quantidadeDeParcelas"
            className="absolute leading-[0.935em] text-center"
            style={{
              top: '15.81mm',
              left: '10.0mm',
              width: '17.5mm',
              fontFamily: fontGothic,
              fontSize: '20pt',
              fontWeight: 'bold',
            }}
          >
            {maxInstallments}X
          </div>

          {/* [Meio Esquerdo]: SUBTEXTO: SEM JUROS */}
          <div 
            id="field_textparcela"
            className="absolute text-center leading-none"
            style={{
              top: '20.81mm',
              left: '6.25mm',
              width: '25.0mm',
              fontFamily: fontRoboto,
              fontSize: '4.5pt',
              letterSpacing: '0.15mm',
            }}
          >
            SEM JUROS
          </div>

          {/* [Meio Esquerdo]: INDICADOR NUMÉRICO: 0 */}
          <div 
            id="field_produtoDepartamentoCodigo"
            className="absolute text-center leading-none"
            style={{
              top: '26.81mm',
              left: '11.5mm',
              width: '15.0mm',
              fontFamily: fontRoboto,
              fontSize: '5.5pt',
              letterSpacing: '0.25mm',
            }}
          >
            0
          </div>

          {/* [Abaixo do Preço Principal]: SÍMBOLO R$ DA PARCELA */}
          <div 
            id="field_simbolo"
            className="absolute leading-none"
            style={{
              top: '24.81mm',
              left: '32.5mm',
              fontFamily: fontRoboto,
              fontSize: '6pt',
              fontWeight: 'bold',
            }}
          >
            R$
          </div>

          {/* [Abaixo do Preço Principal]: VALOR PARCELA INTEIRO */}
          <div 
            id="field_valorDaParcela_num"
            className="absolute leading-[0.735em] text-left"
            style={{
              top: '23.85mm',
              left: '37.5mm',
              fontFamily: fontGothic,
              fontSize: '20pt',
              fontWeight: 'bold',
            }}
          >
            {instInteger}
          </div>

          {/* [Abaixo do Preço Principal]: VALOR PARCELA CENTAVOS */}
          <div 
            id="field_valorDaParcela_cen"
            className="absolute leading-[0.735em] text-left"
            style={{
              top: '23.85mm',
              left: '45.4mm',
              fontFamily: fontGothic,
              fontSize: '20pt',
              fontWeight: 'bold',
            }}
          >
            ,{instDecimal}
          </div>
        </>
      ) : (
        /* ─── CASO REGULAR SEM PARCELAMENTO (À VISTA) ─── */
        <>
          <div 
            className="absolute leading-none"
            style={{
              top: '16.5mm',
              left: '8.0mm',
              fontFamily: fontRoboto,
              fontSize: '10pt',
              fontWeight: 'bold',
            }}
          >
            R$
          </div>
          <div 
            className="absolute flex items-baseline leading-[0.735em] text-left"
            style={{
              top: '11.8mm',
              left: '18.0mm',
              fontFamily: fontGothic,
              fontSize: '36pt',
              fontWeight: 'bold',
            }}
          >
            <span>{porInteger}</span>
            <span style={{ fontSize: '36pt' }}>,{porDecimal}</span>
          </div>
          <div 
            className="absolute leading-none"
            style={{
              top: '22.36mm',
              left: '58.0mm',
              fontFamily: fontRoboto,
              fontSize: '5pt',
              fontWeight: 'bold',
            }}
          >
            UN
          </div>
          <div 
            id="field_produtoDepartamentoCodigo"
            className="absolute text-center leading-none"
            style={{
              top: '26.81mm',
              left: '11.5mm',
              width: '15.0mm',
              fontFamily: fontRoboto,
              fontSize: '5.5pt',
              letterSpacing: '0.25mm',
            }}
          >
            0
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────
          3. RODAPÉ DO CORPO: FORNECEDOR / RAZÃO SOCIAL - Ref XXX
      ──────────────────────────────────────────────────────────── */}
      <div 
        id="field_fornecedor"
        className="absolute text-left leading-none truncate overflow-hidden"
        style={{
          top: '30.31mm',
          left: '6.0mm',
          width: '54.0mm',
          fontFamily: fontRoboto,
          fontSize: '5pt',
          letterSpacing: '0.15mm',
        }}
      >
        {fornecedorRefText}
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. LATERAL DIREITA (Orientação Vertical 90°):
             - Coluna interna: CÓDIGO INTERNO (SAP)
             - Coluna externa (borda): CÓDIGO DE BARRAS + NÚMERO EAN
      ──────────────────────────────────────────────────────────── */}

      {/* COLUNA INTERNA: Código Numérico Interno / SKU */}
      <div 
        id="field_produtoCodigo"
        className="absolute text-center leading-none font-bold"
        style={{
          top: '16.06mm',
          left: '60.0mm',
          width: '26.5mm',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center center',
          fontFamily: fontRoboto,
          fontSize: '5.5pt',
          letterSpacing: '0.25mm',
        }}
      >
        {code || ''}
      </div>

      {/* COLUNA EXTERNA: Código de Barras Vertical */}
      <div 
        id="static_16"
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          top: '12.5mm',
          left: '65.0mm',
          width: '29.0mm',
          height: '10.0mm',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center center',
        }}
      >
        {ean && ean.length >= 12 ? (
          <BarcodeEAN value={ean} height="10mm" width="29mm" showText={false} />
        ) : code ? (
          <BarcodeSAP value={code} height="10mm" width="29mm" />
        ) : null}
      </div>

      {/* COLUNA EXTERNA (BORDA): Número EAN impresso */}
      <div 
        id="field_codigoBarras"
        className="absolute text-center leading-none font-bold"
        style={{
          top: '16.06mm',
          left: '71.75mm',
          width: '26.5mm',
          transform: 'rotate(-90deg)',
          transformOrigin: 'center center',
          fontFamily: fontRoboto,
          fontSize: '5.5pt',
          letterSpacing: '0.25mm',
        }}
      >
        {ean || code || ''}
      </div>
    </div>
  );
}
