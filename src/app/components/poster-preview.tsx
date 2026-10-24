'use client';

import type { PosterData, PosterSettings } from '@/app/lib/types';
import { parsePrice, formatCurrency, calculateInstallments } from '@/app/lib/poster-utils';

export function PosterPreview({
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
}: PosterData & { isImperdiveis?: boolean; settings: PosterSettings }) {
  const isOffer = posterSubType === 'offer';
  const valDe  = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;
  const discount    = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallments = maxInstallments > 1;
  const [instInteger, instDecimal] = formatCurrency(installmentValue).split(',');

  // ── TIPOGRAFIA a0309ac COM ESPAÇAMENTOS E TAMANHOS MAXIMIZADOS ──
  // Descrição do Produto (Roboto Bold): font-size ampliado para preencher a largura
  let descFontSize = '15.5pt';
  if (description.length > 45) descFontSize = '12pt';
  else if (description.length > 32) descFontSize = '13.5pt';
  else if (description.length > 22) descFontSize = '15pt';
  else if (description.length <= 14) descFontSize = '19.5pt';
  else descFontSize = '16.5pt';

  // Bloco DE: R$ (GOTHICBI Bold Italic): aumentado em ~30%, line-height 1
  let deNumFontSize = '38pt';
  if (deInteger.length >= 5) deNumFontSize = '28pt';
  else if (deInteger.length === 4) deNumFontSize = '32pt';

  // Bloco POR: R$ (GOTHICBI Bold Italic): ampliado para ocupar quase 100% da largura
  let porNumFontSize = '52pt';
  if (porInteger.length >= 6) porNumFontSize = '30pt';
  else if (porInteger.length === 5) porNumFontSize = '35pt';
  else if (porInteger.length === 4) porNumFontSize = '42pt';

  // Bloco de Parcelamento (GOTHICBI Bold Italic): valor da parcela maximizado
  let instNumFontSize = '38pt';
  if (instInteger.length >= 4) instNumFontSize = '28pt';
  else if (instInteger.length === 3) instNumFontSize = '33pt';

  const validityText = offerValidityStart || offerValidity
    ? `OFERTA VÁLIDA ${offerValidityStart ? `DE ${offerValidityStart} ` : ''}${offerValidity ? `A ${offerValidity}` : ''}`
    : 'OFERTA VÁLIDA ENQUANTO DURAREM OS ESTOQUES';

  return (
    <div
      className="relative select-none print:color-adjust-exact overflow-hidden bg-white box-border"
      style={{
        width: '13.6cm',
        height: '9.0cm',
        backgroundImage: "url('/backgrounds/reliquias-bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: '13.6cm 9.0cm',
        backgroundPosition: '0 0',
        padding: '2mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Container Principal: Grid de 2 colunas 50% / 50% com preenchimento total */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2mm',
          height: '100%',
          width: '100%',
          alignItems: 'stretch',
          boxSizing: 'border-box',
        }}
      >
        {/* ── METADE ESQUERDA: Descrição, Preços (DE / POR) e Rodapé (SAP/EAN/REF) ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Espaçador superior para preservar a área do logotipo pré-impresso OFERTAS */}
          <div style={{ height: '2.75cm', flexShrink: 0 }} aria-hidden="true" />

          {/* Descrição do Produto (Roboto Bold) - ocupa 100% da largura logo abaixo do OFERTAS */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '1.1cm',
              maxHeight: '1.45cm',
              overflow: 'hidden',
            }}
          >
            <h2
              style={{
                fontSize: descFontSize,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 'bold',
                color: 'rgb(0, 0, 0)',
                textAlign: 'center',
                lineHeight: '1.05',
                letterSpacing: '-0.3px',
                textTransform: 'uppercase',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {description}
            </h2>
          </div>

          {/* Bloco de Preços (DE: R$ e POR: R$ + UN) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
          >
            {/* Bloco DE: R$ (Arial 11pt + GOTHICBI Bold Italic 38pt) com line-height 1 */}
            {hasDiscount && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  gap: '4px',
                  width: '100%',
                  lineHeight: '1',
                }}
              >
                <span
                  style={{
                    fontSize: '11pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: 'rgb(0, 0, 0)',
                    lineHeight: '1',
                  }}
                >
                  DE: R$
                </span>
                <span
                  style={{
                    fontSize: deNumFontSize,
                    fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: 'rgb(0, 0, 0)',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {deInteger},{deDecimal}
                </span>
              </div>
            )}

            {/* Bloco POR: R$ + UN (GOTHICBI Bold Italic 52pt) - maior elemento da coluna esquerda */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                width: '100%',
                lineHeight: '0.88',
                whiteSpace: 'nowrap',
                gap: '3px',
              }}
            >
              <span
                style={{
                  fontSize: '11pt',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: 'rgb(0, 0, 0)',
                  lineHeight: '1',
                  flexShrink: 0,
                }}
              >
                POR: R$
              </span>
              <span
                style={{
                  fontSize: porNumFontSize,
                  fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  color: 'rgb(0, 0, 0)',
                  lineHeight: '0.88',
                  letterSpacing: '-0.03em',
                  flexShrink: 0,
                }}
              >
                {porInteger},{porDecimal}
              </span>
              <span
                style={{
                  fontSize: '10pt',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: 'rgb(0, 0, 0)',
                  lineHeight: '1',
                  flexShrink: 0,
                }}
              >
                UN
              </span>
            </div>
          </div>

          {/* Rodapé de Códigos: SAP / EAN / REF (Arial Bold) - fixado na base com 100% de largura */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              lineHeight: '1',
              paddingBottom: '1mm',
            }}
          >
            {code && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '6.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>SAP:</span>
                <span style={{ fontSize: '7.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{code}</span>
              </div>
            )}

            {ean && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '6.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>EAN:</span>
                <span style={{ fontSize: '7.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{ean}</span>
              </div>
            )}

            {reference && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '6.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>REF:</span>
                <span style={{ fontSize: '7.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{reference}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── METADE DIREITA: Selo Circular, Bloco de Parcelamento e Aviso Legal ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Selo Circular Preto: cresce para width 86% da coluna com aspect-ratio 1 / 1 */}
          {hasDiscount ? (
            <div
              style={{
                width: '86%',
                aspectRatio: '1 / 1',
                background: '#000000',
                borderRadius: '50%',
                fontFamily: 'Helvetica, Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              {/* Numeral da Porcentagem em Arial Bold (maximizado para 60pt-66pt) */}
              <span
                style={{
                  fontSize: discount >= 100 ? '48pt' : discount >= 10 ? '60pt' : '66pt',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  lineHeight: '0.9',
                  textAlign: 'center',
                  letterSpacing: '-2px',
                }}
              >
                {discount}%
              </span>
              {/* Rótulo "De Desconto" em Roboto Bold */}
              <span
                style={{
                  fontSize: '20pt',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  lineHeight: '1',
                  textAlign: 'center',
                  marginTop: '2px',
                }}
              >
                De Desconto
              </span>
            </div>
          ) : (
            <div style={{ width: '86%', aspectRatio: '1 / 1' }} />
          )}

          {/* Bloco de Parcelamento: Ocupa 100% da largura, valor maximizado com line-height 0.9 */}
          {showInstallments ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                marginTop: 'auto',
                marginBottom: 'auto',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: '#000000',
                  lineHeight: '1.1',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    fontSize: '10.5pt',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  OU PARCELADO EM ATÉ
                </span>
                <span
                  style={{
                    fontSize: '13pt',
                    fontWeight: 'bold',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                  }}
                >
                  {maxInstallments} VEZES DE
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  lineHeight: '0.9',
                }}
              >
                <span
                  style={{
                    fontSize: '12pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginRight: '2px',
                  }}
                >
                  R$
                </span>
                <span
                  style={{
                    fontSize: instNumFontSize,
                    fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: '#000000',
                    lineHeight: '0.9',
                  }}
                >
                  {instInteger}
                </span>
                <span
                  style={{
                    fontSize: '21pt',
                    fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: '#000000',
                    lineHeight: '0.9',
                    marginLeft: '1px',
                  }}
                >
                  ,{instDecimal}
                </span>
                <span
                  style={{
                    fontSize: '9.5pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    lineHeight: '1',
                    letterSpacing: '0.3px',
                    marginLeft: '4px',
                  }}
                >
                  CADA
                </span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Aviso Legal: Fixado na base exata, alinhado horizontalmente com o rodapé SAP/EAN/REF */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              textAlign: 'center',
              fontSize: '6.5pt',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              color: 'rgb(0, 0, 0)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: '1',
              paddingBottom: '1mm',
            }}
          >
            {validityText}
          </div>
        </div>
      </div>
    </div>
  );
}
