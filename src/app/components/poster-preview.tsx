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

  // Ajuste dinâmico de fonte para a descrição (Roboto Bold)
  // "PEL URSINHO LUIZ CREME G" (25 caracteres) cabe em 1 linha.
  // Máximo permitido: 2 linhas.
  let descFontSize = '12.2pt';
  if (description.length > 45) descFontSize = '9.5pt';
  else if (description.length > 32) descFontSize = '10.5pt';
  else if (description.length > 22) descFontSize = '12pt';
  else if (description.length <= 14) descFontSize = '15.5pt';
  else descFontSize = '13pt';

  // Ajuste dinâmico de fonte para numerais do preço vigente caso tenha muitos dígitos (padrão 43pt do Pricefy)
  let porNumFontSize = '43pt';
  if (porInteger.length >= 6) porNumFontSize = '28pt';
  else if (porInteger.length === 5) porNumFontSize = '33pt';
  else if (porInteger.length === 4) porNumFontSize = '37pt';

  // Ajuste dinâmico de fonte para o preço antigo caso tenha muitos dígitos (padrão 30pt do Pricefy)
  let deNumFontSize = '30pt';
  if (deInteger.length >= 5) deNumFontSize = '22pt';
  else if (deInteger.length === 4) deNumFontSize = '25pt';

  // Ajuste dinâmico de fonte para parcela (padrão 35pt do Pricefy)
  let instNumFontSize = '35pt';
  if (instInteger.length >= 4) instNumFontSize = '26pt';
  else if (instInteger.length === 3) instNumFontSize = '30pt';

  const validityText = offerValidityStart || offerValidity
    ? `OFERTA VÁLIDA ${offerValidityStart ? `DE ${offerValidityStart} ` : ''}${offerValidity ? `A ${offerValidity}` : ''}`
    : 'OFERTA VÁLIDA ENQUANTO DURAREM OS ESTOQUES';

  return (
    <div
      className="relative select-none print:color-adjust-exact overflow-hidden bg-white"
      style={{
        width: '13.6cm',
        height: '9.0cm',
        backgroundImage: "url('/backgrounds/reliquias-bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: '13.6cm 9.0cm',
        backgroundPosition: '0 0',
      }}
    >
      {/* ── 4. DESCRIÇÃO DO PRODUTO (Roboto-Regular bold, máx 2 linhas) ── */}
      <div 
        style={{
          position: 'absolute',
          top: '3.04cm',
          left: '0.38cm',
          width: '6.66cm',
          height: '1.75cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            maxHeight: '1.75cm',
          }}
        >
          {description}
        </h2>
      </div>

      {/* ── 1. SELO CIRCULAR DE DESCONTO COM CONTEÚDO INTEGRADO (Helvetica) ── */}
      {hasDiscount && (
        <div
          style={{
            position: 'absolute',
            top: '0.29cm',
            right: '0.45cm',
            width: '5.50cm',
            height: '5.00cm',
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
          {/* Porcentagem em Arial Bold (64pt) */}
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
          {/* Rótulo "De Desconto" em Roboto Bold (24pt) */}
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
      )}

      {/* ── 5. RÓTULO "DE: R$" (10pt, Arial) ── */}
      {hasDiscount && (
        <div
          style={{
            position: 'absolute',
            top: '4.71cm',
            left: '0.25cm',
            width: '1.39cm',
            height: '0.47cm',
            fontSize: '10pt',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'normal',
            color: 'rgb(0, 0, 0)',
            textAlign: 'center',
            lineHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          DE: R$
        </div>
      )}

      {/* ── 6 e 7. PREÇO ANTIGO - REAIS E CENTAVOS (30pt, GOTHICBI bold italic) ── */}
      {hasDiscount && (
        <div
          style={{
            position: 'absolute',
            top: '4.68cm',
            left: '1.80cm',
            display: 'flex',
            alignItems: 'baseline',
            fontSize: deNumFontSize,
            fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: 'rgb(0, 0, 0)',
            lineHeight: '1',
            overflow: 'visible',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{deInteger}</span>
          <span>,{deDecimal}</span>
        </div>
      )}

      {/* ── 8. RÓTULO "POR: R$" (10pt, Arial) ── */}
      <div
        style={{
          position: 'absolute',
          top: '6.12cm',
          left: '0.33cm',
          width: '1.66cm',
          height: '0.60cm',
          fontSize: '10pt',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'normal',
          color: 'rgb(0, 0, 0)',
          textAlign: 'center',
          lineHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        POR: R$
      </div>

      {/* ── 9 e 10. PREÇO OFERTA - REAIS E CENTAVOS (43pt, GOTHICBI bold italic) COM "UN" ABAIXO À DIREITA ── */}
      <div
        style={{
          position: 'absolute',
          top: '6.02cm',
          left: '2.05cm',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            fontSize: porNumFontSize,
            fontFamily: 'GOTHICBI, "Century Gothic", sans-serif',
            fontWeight: 'bold',
            fontStyle: 'italic',
            color: 'rgb(0, 0, 0)',
            lineHeight: '1',
            overflow: 'visible',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{porInteger}</span>
          <span>,{porDecimal}</span>
        </div>

        {/* ── RÓTULO "UN" ABAIXO DOS VALORES (ALINHADO À DIREITA DO PREÇO) ── */}
        <div
          style={{
            fontSize: '9.5pt',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 'bold',
            color: 'rgb(0, 0, 0)',
            lineHeight: '1',
            letterSpacing: '0.5px',
            marginTop: '0.08cm',
            paddingRight: '0.10cm',
          }}
        >
          UN
        </div>
      </div>

      {/* ── 11, 12, 13. BLOCO DE PARCELAMENTO ALINHADO VERTICALMENTE AO SELO (X% DE DESCONTO) ── */}
      {showInstallments && (
        <div
          style={{
            position: 'absolute',
            top: '5.45cm',
            right: '0.45cm',
            width: '5.50cm',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {/* Texto de Parcelamento (2 linhas para caber perfeitamente no espaço designado) */}
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

          {/* Valor da Parcela com R$ e CADA pequeno ao lado dos centavos */}
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
      )}

      {/* ── 14, 15, 16. RODAPÉ OFICIAL: SAP, EAN, REF À ESQUERDA E ESTOQUE À DIREITA ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '0.28cm',
          left: '0.38cm',
          right: '0.38cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Arial, sans-serif',
          lineHeight: '1',
          zIndex: 20,
        }}
      >
        {/* Identificadores à esquerda com preferência para SAP, EAN e REF */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25cm', whiteSpace: 'nowrap' }}>
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

        {/* Mensagem de estoque à direita mantida intacta */}
        <div style={{ fontSize: '5.8pt', color: 'rgb(0, 0, 0)', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>
          {validityText}
        </div>
      </div>
    </div>
  );
}
