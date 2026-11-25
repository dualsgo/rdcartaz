'use client';

import { useState, useEffect } from 'react';
import type { PosterData, PosterSettings } from '@/app/lib/types';
import { parsePrice, formatCurrency, calculateInstallments } from '@/app/lib/poster-utils';

const CAMPAIGN_BACKGROUNDS: Record<'rihappy' | 'pbkids', string> = {
  rihappy: '/backgrounds/HAPPYFRID_A6V_1156781672_Preview.png',
  pbkids: '/backgrounds/BESTFRIDPB_A6V_1238060618_Preview.png',
};

/**
 * Cartaz A6 Vertical (9.0cm × 13.6cm) para as campanhas Happy Friday (Ri Happy)
 * e Best Friday (PB Kids), fiel ao modelo Ravioli A6V (escala 0.43).
 */
export function PosterPreviewHappyFridayA6V({
  description,
  priceFrom,
  priceFor,
  code,
  reference,
  supplier,
  category,
  posterSubType,
  offerValidityStart,
  offerValidity,
  settings,
}: PosterData & { isImperdiveis?: boolean; settings: PosterSettings }) {
  const brand: 'rihappy' | 'pbkids' = settings?.campaignBrand === 'pbkids' ? 'pbkids' : 'rihappy';
  const isPbKids = brand === 'pbkids';
  const bgUrl = CAMPAIGN_BACKGROUNDS[brand];
  const [bgError, setBgError] = useState(false);

  useEffect(() => {
    setBgError(false);
  }, [bgUrl]);

  const isOffer = posterSubType === 'offer';
  const valDe = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const hasDiscount = isOffer && valDe > 0 && valPor > 0 && valDe > valPor;
  const discount = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');
  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallments = maxInstallments > 1 && valPor > 0;
  const [instInteger, instDecimal] = formatCurrency(installmentValue).split(',');

  const secondaryDescription = category || supplier || description;

  // Tipografia dinâmica da descrição principal (Roboto Bold, max 2 linhas)
  let descFontSize = '17pt';
  if (description.length > 50) descFontSize = '12.5pt';
  else if (description.length > 36) descFontSize = '14.5pt';
  else if (description.length > 24) descFontSize = '16pt';

  // Tipografia dinâmica do DE (GOTHICB) — maior quando não há parcelamento (44pt vs 33pt)
  let deFontSize = showInstallments ? '33pt' : '44pt';
  if (deInteger.length >= 6) deFontSize = showInstallments ? '25pt' : '31pt';
  else if (deInteger.length === 5) deFontSize = showInstallments ? '29pt' : '36pt';

  // Tipografia dinâmica do POR (GOTHICB) — maior quando não há parcelamento (53pt vs 41pt)
  let porFontSize = showInstallments ? '41pt' : '53pt';
  if (porInteger.length >= 6) porFontSize = showInstallments ? '30pt' : '36pt';
  else if (porInteger.length === 5) porFontSize = showInstallments ? '35pt' : '42pt';
  else if (porInteger.length === 4) porFontSize = showInstallments ? '38pt' : '47pt';

  const parcelFontSize = maxInstallments >= 10 ? '30pt' : '34.4pt';
  const instValFontSize = instInteger.length >= 4 ? '23pt' : '28pt';

  const campaignTitle = isPbKids ? 'Best Friday' : 'Happy Friday';
  const validityLine =
    offerValidityStart || offerValidity
      ? `Oferta antecipada válida ${offerValidityStart ? `${offerValidityStart} ` : ''}${offerValidity ? `à ${offerValidity}` : ''}.`
      : 'Oferta antecipada válida enquanto durarem os estoques.';
  const legalLine = `Mediante à Estoque. Produtos adquiridos no ${campaignTitle}, não são passíveis de devolução, sendo sua troca efetuada apenas por defeito.`;

  return (
    <div
      id="label"
      className="pdf-page pdf-page-on-preview paper-color background-as-image select-none print:color-adjust-exact"
      style={{
        position: 'relative',
        top: 0,
        left: 0,
        width: '9cm',
        height: '13.6cm',
        margin: '0 auto',
        backgroundColor: 'white',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Imagem de fundo da campanha: somente exibida em ofertas válidas (DE > POR) */}
      {hasDiscount && (!bgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={bgUrl}
          src={bgUrl}
          alt={campaignTitle}
          onError={() => setBgError(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '9cm',
            height: '13.6cm',
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: '0.45cm',
            left: 0,
            width: '9cm',
            textAlign: 'center',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 900,
            fontSize: '34pt',
            lineHeight: '0.95',
            letterSpacing: '-1.5px',
            color: 'black',
            pointerEvents: 'none',
          }}
        >
          <div>{isPbKids ? 'Best' : 'Happy'}</div>
          <div>Friday</div>
        </div>
      ))}

      {/* ── DESCRIÇÃO PRINCIPAL DO PRODUTO ── */}
      <div
        id="field_produtoDescricaoPrincipalCartaz"
        style={{
          position: 'absolute',
          top: '4.4cm',
          left: '0.43cm',
          width: '8.14cm',
          height: '1.5cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: descFontSize,
          lineHeight: '115%',
          color: 'black',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            margin: 0,
            width: '100%',
            textTransform: 'uppercase',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>
      </div>

      {/* ── DESCRIÇÃO SECUNDÁRIA DO PRODUTO ── */}
      <div
        id="field_produtoDescricaoSecundariaCartaz"
        style={{
          position: 'absolute',
          top: '5.92cm',
          left: '0.43cm',
          width: '8.14cm',
          height: '0.52cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: '10pt',
          lineHeight: '115%',
          color: 'black',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            margin: 0,
            width: '100%',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {secondaryDescription}
        </p>
      </div>

      {/* ── BLOCO DE: R$ + VALOR ANTIGO COM RISCO DIAGONAL ── */}
      {hasDiscount && (
        <>
          <div
            id="static_3"
            style={{
              position: 'absolute',
              top: showInstallments ? '7.18cm' : '7.74cm',
              left: '0.43cm',
              width: '1.45cm',
              height: showInstallments ? '0.43cm' : '0.602cm',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
              fontSize: '10.75pt',
              lineHeight: '0.9',
              color: 'black',
              whiteSpace: 'nowrap',
            }}
          >
            DE: R$
          </div>

          <div
            id="field_valorAntigo"
            style={{
              position: 'absolute',
              top: showInstallments ? '7.095cm' : '7.74cm',
              left: showInstallments ? '1.88cm' : '1.935cm',
              width: '4.65cm',
              height: showInstallments ? '1.15cm' : '1.72cm',
              display: 'flex',
              alignItems: 'flex-start',
              fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
              fontWeight: 'bold',
              fontSize: deFontSize,
              lineHeight: '0.735em',
              color: 'black',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'flex-start' }}>
              <span id="field_valorAntigo_num">{deInteger}</span>
              <span id="field_valorAntigo_cen">,{deDecimal}</span>

              {/* Risco diagonal sobre o preço antigo */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-4%',
                  width: '108%',
                  height: '2.4px',
                  backgroundColor: 'black',
                  transform: 'translateY(-50%) rotate(-12deg)',
                  transformOrigin: 'center center',
                }}
              />
            </span>
          </div>

          {/* ── SELO CIRCULAR PRETO (Ganhe X% de desconto) ── */}
          <div
            id="box_seloHappy"
            style={{
              position: 'absolute',
              top: showInstallments ? '6.75cm' : '7.31cm',
              left: showInstallments ? '6.78cm' : '6.837cm',
              width: '1.96cm',
              height: '1.96cm',
              borderRadius: '50%',
              backgroundColor: 'black',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              boxSizing: 'border-box',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              zIndex: 5,
            }}
          >
            <span
              id="field_fraseHappy"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '11.61pt',
                fontWeight: 400,
                lineHeight: '1.05',
                color: 'white',
                display: 'block',
              }}
            >
              Ganhe
            </span>
            <span
              id="field_porcentagemHappy"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '19.35pt',
                fontWeight: 'bold',
                lineHeight: '0.95',
                color: 'white',
                display: 'block',
              }}
            >
              {discount}%
            </span>
            <span
              id="field_descontoHappy"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '7.74pt',
                fontWeight: 400,
                lineHeight: '1.1',
                color: 'white',
                display: 'block',
              }}
            >
              de desconto
            </span>
          </div>
        </>
      )}

      {/* ── BLOCO POR: R$ + VALOR VIGENTE + UN ── */}
      <div
        id="field_total"
        style={{
          position: 'absolute',
          top: showInstallments ? '9.05cm' : '9.89cm',
          left: '0.43cm',
          width: '1.59cm',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: showInstallments ? '11.18pt' : '10.75pt',
          lineHeight: '1.0',
          color: 'black',
        }}
      >
        {showInstallments ? (
          <>
            <div>POR:</div>
            <div>R$</div>
          </>
        ) : (
          <div>POR: R$</div>
        )}
      </div>

      <div
        id="field_valorVigente"
        style={{
          position: 'absolute',
          top: showInstallments ? '9.0251cm' : '10.062cm',
          left: showInstallments ? '1.78cm' : '1.935cm',
          width: '4.601cm',
          height: showInstallments ? '1.35cm' : '1.72cm',
          display: 'flex',
          alignItems: showInstallments ? 'flex-start' : 'center',
          justifyContent: 'center',
          fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
          fontWeight: 'bold',
          fontSize: porFontSize,
          lineHeight: '0.735em',
          color: 'black',
          whiteSpace: 'nowrap',
        }}
      >
        <span id="field_valorVigente_num">{porInteger}</span>
        <span id="field_valorVigente_cen">,{porDecimal}</span>
      </div>

      <div
        id="field_produtoApresentacao"
        style={{
          position: 'absolute',
          top: showInstallments ? '10.12cm' : '11.95cm',
          left: showInstallments ? '4.9cm' : '4.62cm',
          width: '1.72cm',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: showInstallments ? '7.74pt' : '10.75pt',
          lineHeight: '0.935em',
          color: 'black',
        }}
      >
        UN
      </div>

      {/* ── CAIXA DE PARCELAMENTO (boxOParcela) ── */}
      {showInstallments && (
        <div
          id="box_boxOParcela"
          style={{
            position: 'absolute',
            top: '10.535cm',
            left: '0.4085cm',
            width: '8.213cm',
            height: '1.72cm',
            border: '1.72px solid black',
            borderRadius: '5.16px',
            boxSizing: 'border-box',
            backgroundColor: 'transparent',
            zIndex: 4,
          }}
        >
          {/* Quantidade de parcelas (8X) */}
          <div
            id="field_quantidadeDeParcelas"
            style={{
              position: 'absolute',
              top: '0.18cm',
              left: maxInstallments >= 10 ? '0.12cm' : '0.32cm',
              width: maxInstallments >= 10 ? '2.15cm' : '1.505cm',
              textAlign: 'center',
              fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
              fontWeight: 'bold',
              fontSize: parcelFontSize,
              lineHeight: '0.935em',
              color: 'black',
              whiteSpace: 'nowrap',
            }}
          >
            {maxInstallments}X
          </div>

          {/* SEM JUROS */}
          <div
            id="field_textparcela"
            style={{
              position: 'absolute',
              top: '1.27cm',
              left: '0.06cm',
              width: '2.15cm',
              height: '0.38cm',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
              fontSize: '8.17pt',
              lineHeight: '0.935em',
              color: 'black',
            }}
          >
            SEM JUROS
          </div>

          {/* R$ da Parcela */}
          <div
            id="field_simbolo"
            style={{
              position: 'absolute',
              top: '0.45cm',
              left: '3.65cm',
              width: '0.86cm',
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 'bold',
              fontSize: '9.46pt',
              lineHeight: '0.935em',
              color: 'black',
            }}
          >
            R$
          </div>

          {/* Valor da Parcela (Inteiro + Centavos) */}
          <div
            id="field_valorDaParcela"
            style={{
              position: 'absolute',
              top: '0.68cm',
              left: '4.1cm',
              width: '2.55cm',
              height: '0.9cm',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
              fontWeight: 'bold',
              fontSize: instValFontSize,
              lineHeight: '0.735em',
              color: 'black',
              whiteSpace: 'nowrap',
            }}
          >
            <span id="field_valorDaParcela_num">{instInteger}</span>
            <span id="field_valorDaParcela_cen">,{instDecimal}</span>
          </div>
        </div>
      )}

      {/* ── RODAPÉ: REFERÊNCIA, CÓDIGO E AVISOS LEGAIS ── */}
      <div
        id="field_comReferencia"
        style={{
          position: 'absolute',
          top: '12.50cm',
          left: '4.5365cm',
          width: '4.0635cm',
          textAlign: 'right',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          fontSize: '4.73pt',
          lineHeight: '0.935em',
          letterSpacing: '0.0086cm',
          color: 'black',
          whiteSpace: 'nowrap',
        }}
      >
        {reference ? `Ref. ${reference} ` : ''}
        {code ? `Cód. ${code}` : ''}
      </div>

      <div
        id="field_OfertaValidaHappy"
        style={{
          position: 'absolute',
          top: '12.74cm',
          left: '0.43cm',
          width: '8.084cm',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: '6pt',
          lineHeight: '115%',
          color: 'black',
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {validityLine}
      </div>

      <div
        id="field_fraseTextoRiHappy"
        style={{
          position: 'absolute',
          top: '13.02cm',
          left: '0.43cm',
          width: '7.525cm',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          fontSize: '4.3pt',
          lineHeight: '115%',
          color: 'black',
          textAlign: 'left',
        }}
      >
        {legalLine}
      </div>
    </div>
  );
}
