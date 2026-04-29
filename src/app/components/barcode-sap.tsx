'use client';

import React from 'react';

// Code 39 Mapping for Digits and Start/Stop (*)
// b = narrow bar, B = wide bar, w = narrow space, W = wide space
const CODE39_MAP: Record<string, string> = {
  '0': 'bwbWBwBwb',
  '1': 'BwbWbwbwB',
  '2': 'bwBWbwbwB',
  '3': 'BwBWbwbwb',
  '4': 'bwbWBwbwB',
  '5': 'BwbWBwbwb',
  '6': 'bwBWBwbwb',
  '7': 'bwbWbwBwB',
  '8': 'BwbWbwBwb',
  '9': 'bwBWbwBwb',
  '*': 'bwbWbWbBw',
};

interface BarcodeSAPProps {
  value: string;
  height?: number | string;
  width?: number | string;
  className?: string;
}

export function BarcodeSAP({ 
  value, 
  height = 40, 
  width = '100%', 
  className,
  orientation = 'horizontal'
}: BarcodeSAPProps & { orientation?: 'horizontal' | 'vertical' }) {
  if (!value) return null;

  // Code 39 requires start/stop characters
  const data = `*${value.toUpperCase()}*`;
  let pattern = '';

  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const charPattern = CODE39_MAP[char];
    if (charPattern) {
      pattern += charPattern;
      // Add inter-character gap (narrow space)
      if (i < data.length - 1) {
        pattern += 'w';
      }
    }
  }

  const thinSize = 1.5;
  const thickSize = 4;
  
  // Calculate total length (width for horizontal, height for vertical)
  let totalLength = 0;
  for (const part of pattern) {
    totalLength += (part === 'B' || part === 'W') ? thickSize : thinSize;
  }

  let currentPos = 0;
  const elements = [];

  const isVertical = orientation === 'vertical';

  for (let i = 0; i < pattern.length; i++) {
    const part = pattern[i];
    const isBar = part === 'b' || part === 'B';
    const rectSize = (part === 'B' || part === 'W') ? thickSize : thinSize;

    if (isBar) {
      if (isVertical) {
        // Horizontal bars stacked vertically
        elements.push(
          <rect
            key={i}
            x={0}
            y={currentPos}
            width={100}
            height={rectSize}
            fill="black"
          />
        );
      } else {
        // Vertical bars placed horizontally
        elements.push(
          <rect
            key={i}
            x={currentPos}
            y={0}
            width={rectSize}
            height={100}
            fill="black"
          />
        );
      }
    }
    currentPos += rectSize;
  }

  const viewBox = isVertical 
    ? `0 0 100 ${totalLength}` 
    : `0 0 ${totalLength} 100`;

  return (
    <div className={className} style={{ width, height }}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {elements}
      </svg>
    </div>
  );
}
