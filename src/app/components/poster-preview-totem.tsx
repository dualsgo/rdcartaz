import type { PosterData, PosterSettings } from '@/app/lib/types';
import { Card } from '@/components/ui/card';
import { OfertasHeader } from './ofertas-header';
import { cn } from '@/lib/utils';
import { parsePrice, formatCurrency, calculateInstallments, truncateMultiLine } from '@/app/lib/poster-utils';

export function PosterPreviewTotem({
  description,
  priceFrom,
  priceFor,
  code,
  ean,
  reference,
  paymentOption,
  offerValidityStart,
  offerValidity,
  settings,
}: PosterData & { settings: PosterSettings }) {
  const valDe = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const displayDescriptionLines = truncateMultiLine(description, 20, 2);

  const hasDiscount = valDe > 0 && valPor > 0 && valDe > valPor;
  const discount = hasDiscount ? Math.round(((valDe - valPor) / valDe) * 100) : 0;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  
  const hasInstallments = paymentOption === 'installment' && maxInstallments > 1;

  const isLongDesc = displayDescriptionLines.length > 1 || (displayDescriptionLines[0]?.length || 0) > 15;
  let priceFontSize = isLongDesc ? '10em' : '13em';
  if (porInteger.length >= 6) {
    priceFontSize = '8em';
  } else if (porInteger.length === 5) {
    priceFontSize = '9.5em';
  }

  return (
    <Card 
      className="w-full h-full overflow-hidden shadow-none border-none rounded-none bg-white text-black font-body relative flex flex-col items-center justify-between p-[0.8cm] box-border"
      style={{ fontSize: '12px' }} 
    >
      
      {/* TOPO: Cabeçalho OFERTAS + Nome do Produto + SAP/EAN */}
      <div className="flex flex-col items-center w-full shrink-0 px-8">
        <OfertasHeader textSize={60} />
        
        <h2 className="font-headline font-black uppercase text-[4em] leading-[1] break-words text-center mt-6 mb-2 w-full">
          {displayDescriptionLines.map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h2>

        <div className="text-[1.2em] flex flex-nowrap justify-center gap-x-4 text-black font-semibold text-center w-full overflow-hidden">
          {reference && <span className="truncate max-w-[40%]">Ref.: <b className="font-bold">{reference}</b></span>}
          {code && <span className="truncate max-w-[30%]">SAP: <b className="font-bold">{code}</b></span>}
          {ean && <span className="truncate max-w-[30%]">EAN: <b className="font-bold">{ean}</b></span>}
        </div>
      </div>

      {/* MEIO: DE / DESCONTO */}
      <div className="flex flex-col items-center w-full shrink-0 my-2 z-10">
        <div className={cn("transition-opacity text-center font-headline text-black mb-6", valDe > 0 ? 'opacity-100' : 'opacity-0')}>
          <span className="block text-[3em] leading-none mb-1">DE:</span>
          <span className="text-[5.5em] font-bold line-through decoration-[1mm] leading-none">
            R$ {formatCurrency(valDe)}
          </span>
        </div>

        <div className={cn("bg-black text-white text-center font-headline font-black transition-opacity flex flex-col items-center justify-center print:color-adjust-exact px-6 py-4 w-[90%] rounded-md shadow-lg", discount > 0 ? 'opacity-100' : 'opacity-0')}>
          <div className="flex flex-col justify-center items-center w-full">
             <span className="text-[2.5em] leading-tight uppercase tracking-wider">DESCONTO DE</span>
             <span className="text-[7.5em] leading-[0.85]">{discount}%</span>
          </div>
        </div>
      </div>

      {/* BASE: POR + Parcelamento + Validade */}
      <div className="flex flex-col items-center justify-start w-full flex-1 mt-6">
        <div className="flex flex-col items-center w-full">
          <span className="font-headline text-[4em] font-black leading-none uppercase mb-2">
            POR:
          </span>
          <div className="flex items-baseline justify-center w-full">
            <div className="flex items-baseline">
              <span className="font-headline text-[6em] font-black mr-2">R$</span>
              <span className="font-headline font-black leading-[0.8] tracking-tighter inline-block origin-center scale-x-90" style={{ fontSize: priceFontSize }}>
                {porInteger},{porDecimal}
              </span>
            </div>
            <span className="text-[1.8em] font-bold uppercase opacity-80 ml-1 shrink-0 whitespace-nowrap">un.</span>
          </div>
        </div>

        {hasInstallments ? (
          <div className="font-headline text-center font-bold text-[2.6em] leading-[1.1] mt-8 uppercase">
            <div>ou parcelado em</div>
            <div>até {maxInstallments}x sem juros de R$ {formatCurrency(installmentValue)}</div>
          </div>
        ) : (
          <div className="mt-4" style={{ height: '4.8em' }}></div>
        )}

        <div className="text-[1.2em] text-center w-full shrink-0 leading-tight text-black font-semibold mt-auto pt-6">
          {(offerValidityStart || offerValidity) ? (
            <span>
              Oferta válida{' '}
              {offerValidityStart && <span>de <b className="font-black text-black">{offerValidityStart}</b>{' '}</span>}
              {offerValidity && <span>até <b className="font-black text-black">{offerValidity}</b>{' '}</span>}
              ou enquanto durarem os estoques.
            </span>
          ) : (
            <span>Oferta válida por tempo indeterminado ou enquanto durarem os estoques.</span>
          )}
        </div>
      </div>

    </Card>
  );
}
