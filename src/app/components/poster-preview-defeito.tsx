'use client';

import type { PosterData, PosterSettings } from '@/app/lib/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AvariaHeader } from './avaria-header';
import { parsePrice, formatCurrency, calculateInstallments, truncateMultiLine } from '@/app/lib/poster-utils';

const defectOptions = [
  { value: 'embalagem_danificada', label: 'Embalagem Danificada', discount: 20 },
  { value: 'marcas_de_uso',        label: 'Marcas de Uso',        discount: 30 },
  { value: 'pelucia_suja',         label: 'Pelúcia Suja',         discount: 40 },
  { value: 'peca_faltando',        label: 'Peça Faltando',        discount: 50 },
  { value: 'outro',                label: 'Outro (descrever)',     discount: null },
];

function descFontSize(linesCount: number): string {
  return '1.35em';
}

export function PosterPreviewDefeito({
  description,
  priceFrom,
  priceFor,
  code,
  ean,
  reference,
  paymentOption,
  defectType,
  customDefectReason,
  customDefectDiscount,
  defectNote,
  settings,
}: PosterData & { settings: PosterSettings }) {
  const valDe = parsePrice(priceFrom);
  const valPor = parsePrice(priceFor);

  const displayDescriptionLines = truncateMultiLine(description, 20, 2);

  const selectedDefect = defectOptions.find(opt => opt.value === defectType);
  
  const discount = defectType === 'outro' 
    ? (customDefectDiscount ?? 0)
    : (selectedDefect?.discount ?? 0);

  const reasonText = defectType === 'outro' 
    ? customDefectReason 
    : selectedDefect?.label;

  const [porInteger, porDecimal] = formatCurrency(valPor).split(',');

  const { maxInstallments, installmentValue } = calculateInstallments(valPor, settings);
  const showInstallment  = paymentOption === 'installment' && maxInstallments > 1;
  const installmentText  = showInstallment ? (
    <div className="font-headline text-center font-bold text-[0.7em] leading-tight mt-3 opacity-90 flex flex-col items-center uppercase">
      <span>ou parcelado em até</span>
      <span className="text-[1.15em]">{maxInstallments}x sem juros de R$ {formatCurrency(installmentValue)}</span>
    </div>
  ) : (
    <div className="h-[2.4em] mt-3"></div>
  );
  
  let priceFontSize = '3.0rem';
  if (porInteger.length >= 6) priceFontSize = '1.8rem';
  else if (porInteger.length === 5) priceFontSize = '2.2rem';
  else if (porInteger.length === 4) priceFontSize = '2.6rem';

  return (
    <div className="w-full h-full overflow-hidden bg-white text-black font-body relative">
      <div className="flex h-full w-full">
        {/* ── Coluna Esquerda ── */}
        <div className="w-1/2 p-[0.35cm] pb-[1cm] flex flex-col overflow-hidden">
          {/* ZONA 1: Header (fixo) */}
          <div className="shrink-0">
            <AvariaHeader />
          </div>

          {/* ZONA 2: Descrição (fonte dinâmica) */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <h2 
              className="font-headline font-black uppercase leading-[1.05] tracking-tight text-center text-black line-clamp-3"
              style={{ fontSize: descFontSize(displayDescriptionLines.length) }}
            >
              {displayDescriptionLines.join('\n')}
            </h2>
          </div>

          {/* ZONA 3: Preço DE */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <div className={cn('transition-opacity text-center text-[1.8em] font-headline text-black', valDe > 0 ? 'opacity-100' : 'opacity-0')}>
              <span className="block text-[0.6em] mb-1 font-medium">DE:</span>
              <div className="relative inline-block">
                <span className="font-medium">R$ {formatCurrency(valDe)}</span>
                <div className="absolute inset-x-0 top-[50%] h-[0.4mm] bg-black -rotate-[12deg] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-1/2 flex flex-col justify-between items-center pt-0 pr-0 pb-[0.35cm] pl-[0.35cm]">
          <div
            className={cn(
              'bg-black text-white text-center font-headline font-black transition-opacity flex flex-col items-center justify-center print:color-adjust-exact px-2 w-full shrink-0 pt-2',
              discount > 0 ? 'opacity-100' : 'opacity-0'
            )}
            style={{ height: '7.2em' }}
          >
            {discount > 0 && (
              <div className='flex flex-col items-center w-full h-full'>
                {/* MOTIVO DO DEFEITO */}
                <div className="flex items-center justify-center w-full h-[1.2em] mb-0.5 mt-1">
                   <span className="text-[0.95em] leading-tight uppercase text-center line-clamp-1">{reasonText}</span>
                </div>
                
                {/* OBSERVAÇÃO OPCIONAL */}
                <div className="flex items-center justify-center w-full h-[1.8em] mb-1 px-2">
                  <span className="text-[0.7em] font-medium tracking-wide leading-[1.1] uppercase text-white text-center line-clamp-2">
                    {defectNote}
                  </span>
                </div>
                
                {/* 20% OFF */}
                <div className="flex items-center justify-center w-full flex-1 pb-1">
                  <span className="text-[2.2em] leading-none whitespace-nowrap">{discount}% OFF</span>
                </div>
              </div>
            )}
          </div>
          
          {/* ZONA 2: Preço POR (ocupa espaço central) */}
          <div className="flex-1 flex flex-col items-center justify-center text-[1.3em] leading-none text-black w-full min-w-0 px-0">
            <span className="font-headline text-[0.75em] font-medium w-full text-center shrink-0 mb-1 z-10">POR:</span>
            <div className="flex items-center justify-center w-full shrink-0">
              <div className="flex items-baseline shrink-0 tracking-tighter w-full justify-center relative">
                <span className="font-headline font-medium leading-none whitespace-nowrap" style={{ fontSize: priceFontSize }}>
                  R$ {porInteger},{porDecimal}
                </span>
                {valPor > 0 && (
                  <div className="absolute right-[5%] bottom-[-0.75em] font-bold text-black">
                    <span className="text-[0.45em] uppercase leading-none">un. à vista</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ZONA 3: Parcelamento (Alinhado com o preço DE da esquerda) */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {installmentText}
          </div>


        </div>
      </div>
      {/* RODAPÉ INTEGRADO FULL WIDTH (Ponta a Ponta) */}
      <div className="absolute bottom-[0.1cm] left-0 right-0 flex flex-col items-center px-[0.35cm] opacity-100 z-20">
        {/* Identificadores Técnicos */}
        <div className="text-[0.45em] flex flex-nowrap gap-x-6 text-black font-bold uppercase mb-1">
           {reference && <span className="truncate max-w-[30%]">Ref.: <b className="font-bold">{reference}</b></span>}
           {code      && <span className="truncate max-w-[25%]">SAP: <b className="font-bold">{code}</b></span>}
           {ean       && <span className="truncate max-w-[40%]">EAN: <b className="font-bold">{ean}</b></span>}
        </div>
        
        {/* Frase Legal */}
        <p className="text-[0.52em] text-black font-bold text-center leading-tight border-t border-black/10 pt-1 w-full uppercase">
          Item de ponta de estoque, vendido no estado. Não possui direito a troca.
        </p>
      </div>
    </div>
  );
}
