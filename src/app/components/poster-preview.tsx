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

  // Formatação da validade da oferta
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
      {/* Container Principal: Grid de 2 colunas 50% / 50% */}
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
        {/* ── METADE ESQUERDA: Descrição, Preços (DE / POR) e Rodapé (COD / REF) ── */}
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
          {/* Espaçador superior para preservar o logo gráfico pré-impresso OFERTAS */}
          <div style={{ height: '2.75cm', flexShrink: 0 }} aria-hidden="true" />

          {/* Título do Produto: Arial, 700, 8.5pt, uppercase */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '1.0cm',
              maxHeight: '1.4cm',
              overflow: 'hidden',
            }}
          >
            <h2
              style={{
                fontFamily: 'Arial, sans-serif',
                fontWeight: 700,
                fontSize: '8.5pt',
                color: '#000000',
                textAlign: 'center',
                lineHeight: '1.15',
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

          {/* Bloco de Preços (DE: R$ e POR: R$) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
          >
            {/* Bloco DE: R$ (6.5pt, Regular) + 499,99 (22pt, Trebuchet MS Bold Italic) alinhados ao topo */}
            {hasDiscount && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: '4px',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 400,
                    fontSize: '6.5pt',
                    textTransform: 'uppercase',
                    color: '#000000',
                    lineHeight: '1.2',
                    paddingTop: '2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  DE: R$
                </span>
                <span
                  style={{
                    fontFamily: "'Trebuchet MS', Calibri, sans-serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '22pt',
                    color: '#000000',
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {deInteger},{deDecimal}
                </span>
              </div>
            )}

            {/* Bloco POR: R$ (7pt, Regular) + 299,99 (36pt, Trebuchet MS Bold Italic) alinhados ao topo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                gap: '4px',
                width: '100%',
              }}
            >
              <span
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 400,
                  fontSize: '7pt',
                  textTransform: 'uppercase',
                  color: '#000000',
                  lineHeight: '1.2',
                  paddingTop: '3px',
                  whiteSpace: 'nowrap',
                }}
              >
                POR: R$
              </span>
              <span
                style={{
                  fontFamily: "'Trebuchet MS', Calibri, sans-serif",
                  fontWeight: 700,
                  fontStyle: 'italic',
                  fontSize: '36pt',
                  color: '#000000',
                  lineHeight: '1',
                  whiteSpace: 'nowrap',
                }}
              >
                {porInteger},{porDecimal}
              </span>
            </div>
          </div>

          {/* Rodapé de Códigos: COD: / REF: (4.5pt, Arial Regular 400 uppercase) */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              fontFamily: 'Arial, sans-serif',
              fontSize: '4.5pt',
              fontWeight: 400,
              textTransform: 'uppercase',
              color: '#000000',
              whiteSpace: 'nowrap',
              lineHeight: '1',
              paddingBottom: '1mm',
            }}
          >
            {code && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span>COD: {code}</span>
              </div>
            )}

            {reference && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span>REF: {reference}</span>
              </div>
            )}

            {ean && !reference && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span>EAN: {ean}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── METADE DIREITA: Selo Circular (% Desconto), Parcelamento e Aviso Legal ── */}
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
          {/* Selo Circular Preto: 44pt (Arial 700 line-height 1) + 14pt De Desconto (Arial 700) */}
          {hasDiscount ? (
            <div
              style={{
                width: '85%',
                aspectRatio: '1 / 1',
                background: '#000000',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  fontSize: '44pt',
                  color: '#ffffff',
                  lineHeight: '1',
                  textAlign: 'center',
                  letterSpacing: '-1px',
                }}
              >
                {discount}%
              </span>
              <span
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  fontSize: '14pt',
                  color: '#ffffff',
                  textAlign: 'center',
                  marginTop: '2px',
                  lineHeight: '1',
                }}
              >
                De Desconto
              </span>
            </div>
          ) : (
            <div style={{ width: '85%', aspectRatio: '1 / 1' }} />
          )}

          {/* Bloco de Parcelamento: 10X sem juros (9pt Arial 700) + 29 (22pt) ,99 (12pt) */}
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
              <span
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 700,
                  fontSize: '9pt',
                  color: '#000000',
                  lineHeight: '1.1',
                  whiteSpace: 'nowrap',
                }}
              >
                {maxInstallments}X sem juros
              </span>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'center',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                }}
              >
                <span
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 700,
                    fontSize: '9pt',
                    color: '#000000',
                    marginRight: '2px',
                    lineHeight: '1',
                  }}
                >
                  R$
                </span>
                <span
                  style={{
                    fontFamily: "'Trebuchet MS', Calibri, sans-serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '22pt',
                    color: '#000000',
                    lineHeight: '1',
                    verticalAlign: 'baseline',
                  }}
                >
                  {instInteger}
                </span>
                <span
                  style={{
                    fontFamily: "'Trebuchet MS', Calibri, sans-serif",
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: '12pt',
                    color: '#000000',
                    lineHeight: '1',
                    verticalAlign: 'baseline',
                  }}
                >
                  ,{instDecimal}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Aviso Legal: OFERTA VÁLIDA... (4.5pt, Arial Regular 400 uppercase) */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 400,
              fontSize: '4.5pt',
              textTransform: 'uppercase',
              color: '#000000',
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
