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

  const isHappyFriday = Boolean(settings?.happyFridayEnabled);
  const hasDiscount = isOffer && valDe > 0 && valPor > 0 && valDe > valPor;
  const discount    = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');
  const [deInteger, deDecimal] = formatCurrency(valDe).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallments = maxInstallments > 1;
  const [instInteger, instDecimal] = formatCurrency(installmentValue).split(',');

  // ── TIPOGRAFIA DINÂMICA COM MAXIMIZAÇÃO DE ÁREA (COM TRAVAS DE SEGURANÇA CONTRA OVERFLOW) ──
  // Descrição do Produto (Roboto Bold): quando Happy Friday está ativo, há mais altura livre na coluna esquerda
  let descFontSize = '15.5pt';
  if (isHappyFriday) {
    if (description.length > 55) descFontSize = '13pt';
    else if (description.length > 40) descFontSize = '14.5pt';
    else if (description.length > 28) descFontSize = '16.5pt';
    else if (description.length > 18) descFontSize = '18.5pt';
    else if (description.length <= 12) descFontSize = '22pt';
    else descFontSize = '20pt';
  } else {
    if (description.length > 45) descFontSize = '12pt';
    else if (description.length > 32) descFontSize = '13.5pt';
    else if (description.length > 22) descFontSize = '15pt';
    else if (description.length <= 14) descFontSize = '19.5pt';
    else descFontSize = '16.5pt';
  }

  // Bloco DE: R$ (GOTHICBI Bold Italic): preenchimento otimizado da largura sem transbordar
  let deNumFontSize = '34pt';
  if (isHappyFriday) {
    if (deInteger.length >= 6) deNumFontSize = '24pt';
    else if (deInteger.length === 5) deNumFontSize = '27pt';
    else if (deInteger.length === 4) deNumFontSize = '30pt';
    else if (deInteger.length === 3) deNumFontSize = '33pt';
    else deNumFontSize = '35pt';
  } else {
    if (deInteger.length >= 5) deNumFontSize = '27pt';
    else if (deInteger.length === 4) deNumFontSize = '29pt';
    else if (deInteger.length === 3) deNumFontSize = '31pt';
  }

  // Bloco POR: R$ (GOTHICBI Bold Italic): maximiza o tamanho do preço principal com calibração precisa por dígitos
  let porNumFontSize = '46pt';
  if (isHappyFriday) {
    // Quando tem parcelamento na esquerda, calibramos para manter o preço grande e legível sem empurrar o parcelamento
    if (showInstallments) {
      if (porInteger.length >= 6) porNumFontSize = '28pt';
      else if (porInteger.length === 5) porNumFontSize = '33pt';
      else if (porInteger.length === 4) porNumFontSize = '38pt';
      else if (porInteger.length === 3) porNumFontSize = '43pt';
      else porNumFontSize = '46pt';
    } else {
      // Sem parcelamento, pode crescer ao máximo disponível
      if (porInteger.length >= 6) porNumFontSize = '32pt';
      else if (porInteger.length === 5) porNumFontSize = '38pt';
      else if (porInteger.length === 4) porNumFontSize = '44pt';
      else if (porInteger.length === 3) porNumFontSize = '49pt';
      else porNumFontSize = '53pt';
    }
  } else {
    if (porInteger.length >= 6) porNumFontSize = '28pt';
    else if (porInteger.length === 5) porNumFontSize = '33pt';
    else if (porInteger.length === 4) porNumFontSize = '35pt';
    else if (porInteger.length === 3) porNumFontSize = '39pt';
  }

  // Bloco de Parcelamento (GOTHICBI Bold Italic): valor da parcela maximizado
  let instNumFontSize = '36pt';
  if (instInteger.length >= 4) instNumFontSize = '26pt';
  else if (instInteger.length === 3) instNumFontSize = '31pt';

  const validityText = offerValidityStart || offerValidity
    ? `OFERTA VÁLIDA ${offerValidityStart ? `DE ${offerValidityStart} ` : ''}${offerValidity ? `A ${offerValidity}` : ''}`
    : 'OFERTA VÁLIDA ENQUANTO DURAREM OS ESTOQUES';

  return (
    <div
      className="relative select-none print:color-adjust-exact overflow-hidden bg-white box-border"
      style={{
        width: '13.6cm',
        height: '9.0cm',
        backgroundImage: isHappyFriday ? 'none' : "url('/backgrounds/reliquias-bg.png')",
        backgroundRepeat: 'no-repeat',
        backgroundSize: '13.6cm 9.0cm',
        backgroundPosition: '0 0',
        padding: isHappyFriday ? '2.5mm' : '2mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Container Principal: no Happy Friday, coluna esquerda ganha espaço extra (1.3fr vs 1.0fr) e o bloco da direita se aproxima da borda direita */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isHappyFriday ? '1fr auto' : '1fr 1fr',
          gap: isHappyFriday ? '3mm' : '2mm',
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
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            minWidth: 0,
            paddingRight: isHappyFriday ? '1mm' : '0',
          }}
        >
          {/* Espaçador superior: reduzido no modo Happy Friday (sem logotipo OFERTAS) para subir descrição e preço */}
          <div style={{ height: isHappyFriday ? '0.85cm' : '2.65cm', flexShrink: 0 }} aria-hidden="true" />

          {/* Descrição do Produto (Roboto Bold) - ocupa 100% da largura */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: isHappyFriday ? '1.15cm' : '0.95cm',
              maxHeight: isHappyFriday ? '1.85cm' : '1.35cm',
              flexShrink: 0,
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
                WebkitLineClamp: isHappyFriday ? 3 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              {description}
            </h2>
          </div>

          {/* Bloco de Preços (DE: R$ e POR: R$ + UN) e Parcelamento no Happy Friday */}
          <div
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isHappyFriday ? '4px' : hasDiscount ? '13px' : '0',
            }}
          >
            {/* Bloco DE: R$ (Arial + GOTHICBI Bold Italic) com line-height 1 */}
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
                    fontSize: deInteger.length >= 5 ? '8.5pt' : deInteger.length >= 3 ? '9pt' : '10pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: 'rgb(0, 0, 0)',
                    lineHeight: '1',
                    flexShrink: 0,
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

            {/* Bloco POR: R$ + UN (GOTHICBI Bold Italic) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'center',
                width: '100%',
                lineHeight: '0.88',
                whiteSpace: 'nowrap',
                gap: porInteger.length >= 5 ? '2px' : porInteger.length >= 3 ? '2.5px' : '3px',
              }}
            >
              <span
                style={{
                  fontSize: isHappyFriday
                    ? (porInteger.length >= 5 ? '8pt' : porInteger.length >= 3 ? '9pt' : '10pt')
                    : (porInteger.length >= 5 ? '8pt' : porInteger.length >= 3 ? '8.5pt' : '9.5pt'),
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
                  letterSpacing: porInteger.length >= 5 ? '-0.038em' : porInteger.length >= 3 ? '-0.03em' : '-0.02em',
                  flexShrink: 0,
                }}
              >
                {porInteger},{porDecimal}
              </span>
              <span
                style={{
                  fontSize: isHappyFriday
                    ? (porInteger.length >= 5 ? '8pt' : porInteger.length >= 3 ? '8.5pt' : '9.5pt')
                    : (porInteger.length >= 5 ? '7.5pt' : porInteger.length >= 3 ? '8pt' : '9pt'),
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

            {/* Bloco de Parcelamento reposicionado para a ESQUERDA quando Happy Friday estiver ativo */}
            {isHappyFriday && showInstallments && (
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  marginTop: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '7.5pt',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    color: '#000000',
                    lineHeight: '1.1',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  OU EM ATÉ {maxInstallments}X DE
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    lineHeight: '0.9',
                  }}
                >
                  <span
                    style={{
                      fontSize: '8pt',
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
                      fontSize: instInteger.length >= 4 ? '18pt' : '21pt',
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
                      fontSize: '12pt',
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
                      fontSize: '7pt',
                      fontFamily: 'Arial, sans-serif',
                      fontWeight: 'bold',
                      color: '#000000',
                      lineHeight: '1',
                      letterSpacing: '0.2px',
                      marginLeft: '3px',
                    }}
                  >
                    CADA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé de Códigos: SAP / EAN / REF (Arial Bold) - fixado na base com 100% de largura */}
          <div
            style={{
              marginTop: 'auto',
              flexShrink: 0,
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

        {/* ── METADE DIREITA: Selo Circular, Bloco de Parcelamento (quando não for Happy Friday) e Aviso Legal ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: isHappyFriday ? 'flex-end' : 'center',
            height: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* No Happy Friday: Círculo Chamativo em Cima + Retângulo Regulamento em Baixo (sem a frase de validade/estoque no rodapé) */}
          {isHappyFriday ? (
            <div
              style={{
                width: 'auto',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '1mm',
                paddingBottom: '0',
                paddingRight: '0.5mm',
                boxSizing: 'border-box',
              }}
            >
              {/* Círculo Preto Chamativo com letras brancas (Alto Contraste P&B, texto centralizado) */}
              <div
                style={{
                  width: '5.0cm',
                  height: '5.0cm',
                  background: '#000000',
                  borderRadius: '50%',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '3.5mm',
                  boxSizing: 'border-box',
                  zIndex: 10,
                  flexShrink: 0,
                  WebkitPrintColorAdjust: 'exact',
                  printColorAdjust: 'exact',
                }}
              >
                <span
                  style={{
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    lineHeight: '1',
                    textAlign: 'center',
                    width: '100%',
                    display: 'block',
                  }}
                >
                  GANHE
                </span>
                <span
                  style={{
                    fontSize: '32pt',
                    fontFamily: 'Arial Black, Impact, sans-serif',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-1.5px',
                    lineHeight: '0.9',
                    marginTop: '3px',
                    marginBottom: '1px',
                    textAlign: 'center',
                    width: '100%',
                    display: 'block',
                  }}
                >
                  50% OFF
                </span>
                <span
                  style={{
                    fontSize: '10.5pt',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                    lineHeight: '1',
                    marginTop: '2px',
                    textAlign: 'center',
                    width: '100%',
                    display: 'block',
                  }}
                >
                  NESTE ITEM
                </span>
              </div>

              {/* Retângulo com o Regulamento da Campanha (Mais alto, quase quadrado, texto ampliado e nítido) */}
              <div
                style={{
                  width: '5.0cm',
                  minHeight: '2.9cm',
                  border: '1.3px solid #000000',
                  borderRadius: '3px',
                  padding: '2mm 2.2mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  fontFamily: 'Arial, sans-serif',
                  color: '#000000',
                  backgroundColor: 'transparent',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '7.8pt',
                    fontWeight: 'bold',
                    lineHeight: '1.16',
                    textTransform: 'uppercase',
                    letterSpacing: '-0.1px',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  A CADA R$ 100 EM COMPRAS FORA DA CAMPANHA, COMPRE 1 ITEM SELECIONADO COM 50% OFF¹
                </p>
                <div
                  style={{
                    width: '65%',
                    height: '0.8px',
                    backgroundColor: '#000000',
                    margin: '2.5px 0',
                    opacity: 0.25,
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: '4.75pt',
                    fontWeight: 'normal',
                    lineHeight: '1.16',
                    color: '#000000',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  ¹A cada R$ 100 em compras, o cliente terá direito a adquirir 1 produto selecionado com 50% de desconto. R$ 200 em compras = 2 produtos; R$ 300 = 3 produtos, e assim sucessivamente. Desconto válido exclusivamente para os produtos participantes e sinalizados. Promoção válida de 05/11 a 30/11/2026 ou enquanto durarem os estoques.
                </p>
              </div>
            </div>
          ) : hasDiscount ? (
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
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact',
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

          {/* Bloco de Parcelamento (quando NÃO for Happy Friday, pois no Happy Friday já foi para a esquerda) */}
          {!isHappyFriday && showInstallments ? (
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
          ) : !isHappyFriday ? (
            <div style={{ flex: 1 }} />
          ) : null}

          {/* Aviso Legal: Fixado na base exata, ocultado no Happy Friday pois o retângulo inferior já contém todo o regulamento legal */}
          {!isHappyFriday && (
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
          )}
        </div>
      </div>
    </div>
  );
}
