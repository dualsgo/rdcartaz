'use client';

import React from 'react';

// EAN-13 encoding patterns
const L_CODE = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G_CODE = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R_CODE = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];

const FIRST_DIGIT_STRUCTURE = [
  'LLLLLL', // 0
  'LLGLGG', // 1
  'LLGGLG', // 2
  'LLGGGL', // 3
  'LGLLGG', // 4
  'LGGLLG', // 5
  'LGGGLL', // 6
  'LGLGLG', // 7
  'LGLGGL', // 8
  'LGGLGL'  // 9
];

interface BarcodeEANProps {
  value: string;
  height?: number | string;
  width?: number | string;
  className?: string;
  showText?: boolean;
}

export function BarcodeEAN({ 
  value, 
  height = 40, 
  width = '100%', 
  className,
  showText = true
}: BarcodeEANProps) {
  if (!value || value.length < 12) return null;

  // Normalize to 13 digits
  let ean = value.padStart(13, '0').slice(-13);
  
  const firstDigit = parseInt(ean[0]);
  const structure = FIRST_DIGIT_STRUCTURE[firstDigit];
  
  let pattern = '101'; // Left guard
  
  // Left side
  for (let i = 1; i <= 6; i++) {
    const digit = parseInt(ean[i]);
    const codeType = structure[i - 1];
    pattern += codeType === 'L' ? L_CODE[digit] : G_CODE[digit];
  }
  
  pattern += '01010'; // Center guard
  
  // Right side
  for (let i = 7; i <= 12; i++) {
    const digit = parseInt(ean[i]);
    pattern += R_CODE[digit];
  }
  
  pattern += '101'; // Right guard

  const elements = [];
  const barWidth = 100 / pattern.length;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      elements.push(
        <rect
          key={i}
          x={`${i * barWidth}%`}
          y={0}
          width={`${barWidth}%`}
          height="100%"
          fill="black"
        />
      );
    }
  }

  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {elements}
      </svg>
      {showText && (
        <div className="flex justify-between px-[5%] text-[8px] font-mono font-bold mt-[-5%] bg-white">
          <span>{ean[0]}</span>
          <div className="flex-1 flex justify-around">
            <span>{ean.slice(1, 7)}</span>
            <span>{ean.slice(7, 13)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
