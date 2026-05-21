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
  let priceFontSize = isLongDesc ? '10.8em' : '14.4em';
  if (porInteger.length === 4) {
    priceFontSize = '9.9em';
  } else if (porInteger.length === 3) {
    priceFontSize = '12.2em';
  }

  return (
    <Card 
      className="w-full h-full overflow-hidden shadow-none border-none rounded-none bg-white text-black font-body relative flex flex-col items-center pt-[1.5cm] px-[0.8cm] pb-[1cm] box-border gap-y-12"
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

      {/* MEIO: DE */}
      <div className="flex flex-col items-center w-full shrink-0 z-10">
        <div className={cn("transition-opacity text-center font-headline text-black relative", valDe > 0 ? 'opacity-100' : 'opacity-0')}>
          <span className="block text-[3em] leading-none mb-1">DE:</span>
          <div className="relative inline-block px-4">
            <span className="text-[5.5em] font-bold leading-none">
              R$ {formatCurrency(valDe)}
            </span>
            <div className="absolute inset-x-0 top-[55%] h-[1mm] bg-black -rotate-[12deg] pointer-events-none rounded-full" />
          </div>
        </div>
      </div>

      {/* BASE: POR + Parcelamento + Validade */}
      <div className="flex flex-col items-center w-full shrink-0">
        <div className="flex flex-col items-center w-full">
          <span className="font-headline text-[4em] font-medium leading-none uppercase mb-2">
            POR:
          </span>
          <div className="flex items-baseline justify-center w-full">
            <div className="flex items-baseline">
              <span className="font-headline text-[6.5em] font-medium mr-2">R$</span>
              <span className="font-headline font-medium leading-[0.8] inline-block origin-center scale-x-90" style={{ fontSize: priceFontSize }}>
                {porInteger},{porDecimal}
              </span>
            </div>
            <span className="text-[2em] font-medium uppercase opacity-80 ml-1 shrink-0 whitespace-nowrap">un.</span>
          </div>
        </div>

        {hasInstallments && (
          <div className="font-headline text-center font-medium text-[2.6em] leading-[1.1] mt-6 uppercase">
            <div>ou parcelado em</div>
            <div>até {maxInstallments}x sem juros de R$ {formatCurrency(installmentValue)}</div>
          </div>
        )}
      </div>

      <div className="text-[1.3em] text-center w-full shrink-0 leading-tight text-black font-semibold mt-8">
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

    </Card>
  );
}
