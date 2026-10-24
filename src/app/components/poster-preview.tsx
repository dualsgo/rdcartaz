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

  // ── FONTES DO COMMIT a0309ac ──
  // Ajuste dinâmico de fonte para a descrição (Roboto Bold)
  let descFontSize = '12.2pt';
  if (description.length > 45) descFontSize = '9.5pt';
  else if (description.length > 32) descFontSize = '10.5pt';
  else if (description.length > 22) descFontSize = '12pt';
  else if (description.length <= 14) descFontSize = '15.5pt';
  else descFontSize = '13pt';

  // Ajuste dinâmico de fonte para numerais do preço vigente (GOTHICBI, padrão 43pt do Pricefy)
  let porNumFontSize = '43pt';
  if (porInteger.length >= 6) porNumFontSize = '28pt';
  else if (porInteger.length === 5) porNumFontSize = '33pt';
  else if (porInteger.length === 4) porNumFontSize = '37pt';

  // Ajuste dinâmico de fonte para o preço antigo (GOTHICBI, padrão 30pt do Pricefy)
  let deNumFontSize = '30pt';
  if (deInteger.length >= 5) deNumFontSize = '22pt';
  else if (deInteger.length === 4) deNumFontSize = '25pt';

  // Ajuste dinâmico de fonte para parcela (GOTHICBI, padrão 35pt do Pricefy)
  let instNumFontSize = '35pt';
  if (instInteger.length >= 4) instNumFontSize = '26pt';
  else if (instInteger.length === 3) instNumFontSize = '30pt';

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
      {/* Container Principal: Grid 50% / 50% */}
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
          {/* Espaçador superior para preservar a área do logo pré-impresso OFERTAS */}
          <div style={{ height: '2.75cm', flexShrink: 0 }} aria-hidden="true" />

          {/* Descrição do Produto (Roboto Bold - commit a0309ac) */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '1.1cm',
              maxHeight: '1.5cm',
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
                lineHeight: '1.12',
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
            {/* Bloco DE: R$ (Arial 10pt normal + GOTHICBI bold italic 30pt - commit a0309ac) */}
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
                    fontSize: '10pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'normal',
                    color: 'rgb(0, 0, 0)',
                    lineHeight: '100%',
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

            {/* Bloco POR: R$ (Arial 10pt normal + GOTHICBI bold italic 43pt + UN 9.5pt - commit a0309ac) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                width: '100%',
                lineHeight: '1',
                whiteSpace: 'nowrap',
                gap: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '10pt',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'normal',
                  color: 'rgb(0, 0, 0)',
                  lineHeight: '100%',
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
                  lineHeight: '1',
                  flexShrink: 0,
                }}
              >
                {porInteger},{porDecimal}
              </span>
              <span
                style={{
                  fontSize: '9.5pt',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  color: 'rgb(0, 0, 0)',
                  lineHeight: '1',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                UN
              </span>
            </div>
          </div>

          {/* Rodapé de Códigos: SAP / EAN / REF (Arial 5.5pt/6.8pt bold - commit a0309ac) */}
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.05cm' }}>
                <span style={{ fontSize: '5.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>SAP:</span>
                <span style={{ fontSize: '6.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{code}</span>
              </div>
            )}

            {ean && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.05cm' }}>
                <span style={{ fontSize: '5.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>EAN:</span>
                <span style={{ fontSize: '6.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{ean}</span>
              </div>
            )}

            {reference && (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.05cm' }}>
                <span style={{ fontSize: '5.5pt', color: 'rgb(80, 80, 80)', fontWeight: 'bold' }}>REF:</span>
                <span style={{ fontSize: '6.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold' }}>{reference}</span>
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
          {/* Selo Circular Preto (% De Desconto): Arial Bold 56pt + Roboto Bold 20pt (commit a0309ac) */}
          {hasDiscount ? (
            <div
              style={{
                width: '85%',
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
              <span
                style={{
                  fontSize: '56pt',
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
              <span
                style={{
                  fontSize: '20pt',
                  fontFamily: 'Roboto, sans-serif',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  lineHeight: '1',
                  textAlign: 'center',
                  marginTop: '0.08cm',
                }}
              >
                De Desconto
              </span>
            </div>
          ) : (
            <div style={{ width: '85%', aspectRatio: '1 / 1' }} />
          )}

          {/* Bloco de Parcelamento: Arial Bold + GOTHICBI bold italic (commit a0309ac) */}
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
                  lineHeight: '1.15',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    fontSize: '9pt',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  OU PARCELADO EM ATÉ
                </span>
                <span
                  style={{
                    fontSize: '11.5pt',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    marginTop: '0.04cm',
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
                  marginTop: '0.06cm',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    fontSize: '11pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    marginRight: '0.08cm',
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
                    lineHeight: '0.8',
                  }}
                >
                  {instInteger}
                </span>
                <span
                  style={{
                    fontSize: '18.55pt',
                    fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    color: '#000000',
                    lineHeight: '0.8',
                    marginLeft: '0.05cm',
                  }}
                >
                  ,{instDecimal}
                </span>
                <span
                  style={{
                    fontSize: '8.5pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    lineHeight: '1',
                    letterSpacing: '0.3px',
                    marginLeft: '0.12cm',
                  }}
                >
                  CADA
                </span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Mensagem de estoque / aviso legal (Arial Bold 5.8pt - commit a0309ac) */}
          <div
            style={{
              marginTop: 'auto',
              width: '100%',
              textAlign: 'center',
              fontSize: '5.8pt',
              fontFamily: 'Arial, sans-serif',
              color: 'rgb(0, 0, 0)',
              fontWeight: 'bold',
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
