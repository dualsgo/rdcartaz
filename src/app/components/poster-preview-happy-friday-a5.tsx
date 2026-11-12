'use client';

import type { PosterData, PosterSettings } from '@/app/lib/types';
import { parsePrice, formatCurrency } from '@/app/lib/poster-utils';

export function PosterPreviewHappyFridayA5({
  description,
  priceFrom,
  priceFor,
  code,
  reference,
  supplier,
  category,
  offerValidityStart,
  offerValidity,
  customDefectReason,
}: PosterData & { isImperdiveis?: boolean; settings: PosterSettings }) {
  const valDe = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;
  const discountVal = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 50;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  // Tipografia dinâmica do título do produto
  let descFontSize = '27pt';
  if (description.length > 55) descFontSize = '18pt';
  else if (description.length > 40) descFontSize = '21pt';
  else if (description.length > 25) descFontSize = '24pt';

  // Tipografia dinâmica do preço inteiro para evitar overflow
  let priceNumFontSize = '110pt';
  if (porInteger.length >= 6) priceNumFontSize = '75pt';
  else if (porInteger.length === 5) priceNumFontSize = '88pt';
  else if (porInteger.length === 4) priceNumFontSize = '98pt';

  // Texto da mecânica secundária
  const promoSecondaryText = customDefectReason || 'A cada R$ 100, desbloqueis 50% OFF neste produto!';

  // Descrição secundária (categoria / fornecedor ou repetindo a descrição conforme padrão Pricefy)
  const secondaryDescription = category || supplier || description;

  return (
    <div
      id="label"
      className="pdf-page pdf-page-on-preview paper-color background-as-image select-none print:color-adjust-exact"
      style={{
        position: 'relative',
        top: 0,
        left: 0,
        height: '18cm',
        width: '13.6cm',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        margin: '0 auto',
        backgroundColor: 'white',
        backgroundImage: "url('/backgrounds/OFERTA-IMP_A5V_343888522_Preview.png')",
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── SELO PRETO CIRCULAR (Ganhe Desconto 50%) ── */}
      <div
        id="box_seloHappy"
        className="label-box"
        style={{
          position: 'absolute',
          backgroundColor: 'black',
          borderColor: 'black',
          borderWidth: '1.3px',
          borderStyle: 'solid',
          borderRadius: '50%',
          height: '3.055cm',
          width: '2.925cm',
          top: '13.845cm',
          left: '1.17cm',
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
            fontSize: '17.55pt',
            fontFamily: 'Roboto, sans-serif',
            color: 'white',
            lineHeight: '1.05',
            display: 'block',
            textAlign: 'center',
          }}
        >
          Ganhe
        </span>
        <span
          id="field_percentualDesconto"
          style={{
            fontSize: '29.25pt',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 'bold',
            color: 'white',
            lineHeight: '0.95',
            display: 'block',
            textAlign: 'center',
          }}
        >
          {discountVal}%
        </span>
        <span
          id="field_descontoHappy"
          style={{
            fontSize: '11.7pt',
            fontFamily: 'Roboto, sans-serif',
            color: 'white',
            lineHeight: '1.05',
            display: 'block',
            textAlign: 'center',
          }}
        >
          Desconto
        </span>
      </div>

      {/* ── CAIXA / BORDA DO DESCONTO (Produto Secundário / Mecânica) ── */}
      <div
        id="box_boxODesconto"
        className="label-box"
        style={{
          position: 'absolute',
          backgroundColor: 'transparent',
          borderColor: 'black',
          borderWidth: '2.6px',
          borderStyle: 'solid',
          borderRadius: '7.8px',
          height: '2.6cm',
          width: '8.775cm',
          top: '14.17cm',
          left: '4.225cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2mm 3mm',
          boxSizing: 'border-box',
          zIndex: 4,
        }}
      >
        <div
          id="field_produtoDescricaoPrincipalCartazSecundario"
          className="label-text"
          style={{
            fontSize: '16.25pt',
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 'bold',
            color: 'black',
            lineHeight: '1.15',
            textAlign: 'center',
            width: '8.125cm',
            height: '2.275cm',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <p
            style={{
              margin: 0,
              width: '100%',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {promoSecondaryText}
          </p>
        </div>
      </div>

      {/* ── DESCRIÇÃO PRINCIPAL DO PRODUTO ── */}
      <div
        id="field_produtoDescricaoPrincipalCartaz"
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: descFontSize,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          color: 'black',
          lineHeight: '1.15',
          top: '6.76cm',
          left: '0.65cm',
          textAlign: 'center',
          width: '12.415cm',
          height: '2.21cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxSizing: 'border-box',
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
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: '16pt',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          color: 'black',
          lineHeight: '1.15',
          top: '8.97cm',
          left: '0.65cm',
          textAlign: 'center',
          width: '12.415cm',
          height: '0.65cm',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxSizing: 'border-box',
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

      {/* ── CIFRÃO R$ ── */}
      <div
        id="field_simbolo"
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: '14.3pt',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          color: 'black',
          lineHeight: '0.935em',
          top: '10.5238cm',
          left: '0.588793cm',
          textAlign: 'left',
          width: '1.3cm',
        }}
      >
        R$
      </div>

      {/* ── PREÇO VIGENTE (Inteiro e Centavos) ── */}
      <div
        id="field_valorVigente"
        style={{
          position: 'absolute',
          top: '10.4073cm',
          left: '1.20629cm',
          display: 'flex',
          alignItems: 'baseline',
          lineHeight: '0.735em',
        }}
      >
        <div
          id="field_valorVigente_num"
          className="label-text"
          style={{
            fontSize: priceNumFontSize,
            fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
            fontWeight: 'bold',
            color: 'black',
            lineHeight: '0.735em',
            textAlign: 'right',
            width: '6.52002cm',
            height: '2.91042cm',
            whiteSpace: 'nowrap',
          }}
        >
          {porInteger}
        </div>
        <div
          id="field_valorVigente_cen"
          className="label-text"
          style={{
            fontSize: priceNumFontSize,
            fontFamily: 'GOTHICB, GOTHICBI, "Century Gothic", sans-serif',
            fontWeight: 'bold',
            color: 'black',
            lineHeight: '0.735em',
            textAlign: 'left',
            width: '5.4324cm',
            height: '3.76497cm',
            whiteSpace: 'nowrap',
          }}
        >
          ,{porDecimal}
        </div>
      </div>

      {/* ── UNIDADE DE MEDIDA (UN) ── */}
      <div
        id="field_produtoApresentacao"
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: '16.25pt',
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 'bold',
          color: 'black',
          lineHeight: '0.935em',
          top: '13.4511cm',
          left: '9.02631cm',
          textAlign: 'left',
          width: '2.275cm',
        }}
      >
        UN
      </div>

      {/* ── VALIDADE DA OFERTA ── */}
      <div
        id="static_12"
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: '7.15pt',
          fontFamily: 'Roboto, sans-serif',
          color: 'black',
          lineHeight: '130%',
          letterSpacing: '0.013cm',
          top: '16.965cm',
          left: '0.65cm',
          textAlign: 'left',
          width: '5.5575cm',
        }}
      >
        {offerValidityStart || offerValidity ? (
          <>
            Oferta válida {offerValidityStart ? `de ${offerValidityStart} ` : ''}
            {offerValidity ? `a ${offerValidity}` : ''}
            <br />
            Mediante estoque
          </>
        ) : (
          <>
            Oferta válida de 02/11/2024 a 31/12/9999
            <br />
            Mediante estoque
          </>
        )}
      </div>

      {/* ── REFERÊNCIA E CÓDIGO SAP ── */}
      <div
        id="field_comReferencia"
        className="label-text"
        style={{
          position: 'absolute',
          fontSize: '7.15pt',
          fontFamily: 'Roboto, sans-serif',
          color: 'black',
          lineHeight: '0.935em',
          letterSpacing: '0.013cm',
          top: '16.9588cm',
          left: '6.8575cm',
          textAlign: 'right',
          width: '6.1425cm',
        }}
      >
        {reference ? `Ref. ${reference} ` : ''}
        {code ? `Cód. ${code}` : ''}
      </div>
    </div>
  );
}
