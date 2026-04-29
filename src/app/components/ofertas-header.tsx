export function OfertasHeader({ 
  textSize = 50, 
  title = "OFERTAS" 
}: { 
  textSize?: number;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 320 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <defs>
        <g id="starburst-line" stroke="black" strokeWidth="1.5">
          <line y1="-7" y2="-5" />
        </g>
        <g id="starburst">
          <use href="#starburst-line" />
          <use href="#starburst-line" transform="rotate(30)" />
          <use href="#starburst-line" transform="rotate(60)" />
          <use href="#starburst-line" transform="rotate(90)" />
          <use href="#starburst-line" transform="rotate(120)" />
          <use href="#starburst-line" transform="rotate(150)" />
          <use href="#starburst-line" transform="rotate(180)" />
          <use href="#starburst-line" transform="rotate(210)" />
          <use href="#starburst-line" transform="rotate(240)" />
          <use href="#starburst-line" transform="rotate(270)" />
          <use href="#starburst-line" transform="rotate(300)" />
          <use href="#starburst-line" transform="rotate(330)" />
        </g>
      </defs>

      <g fill="none" stroke="black" strokeWidth="2.5">
        {/* Top-left arc */}
        <path d="M 50,32 A 15 15 0 0 1 65,17" />
        <path d="M 45,32 A 20 20 0 0 1 65,12" />
        <path d="M 40,32 A 25 25 0 0 1 65,7" />

        {/* Top-right lines */}
        <path d="M 255,15 L 275,35 M 260,15 L 280,35 M 265,15 L 285,35 M 270,15 L 290,35" />

        {/* Bottom-left wave */}
        <path d="M 40,85 C 50,75 65,95 75,85" />

        {/* Bottom-right zigzag */}
        <path d="M 240,90 L 245,85 L 250,90 L 255,85 L 260,90 L 265,85 L 270,90" />
      </g>
      
      {/* Starbursts */}
      <use href="#starburst" transform="translate(95, 30)" />
      <use href="#starburst" transform="translate(140, 88)" />

      {title === "OFERTAS IMPERDÍVEIS" ? (
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-headline font-black"
          fill="black"
        >
          <tspan x="50%" dy="-0.2em" style={{ fontSize: `${textSize * 0.7}px`, letterSpacing: '-1px' }}>
            OFERTAS
          </tspan>
          <tspan x="50%" dy="0.95em" style={{ fontSize: `${textSize * 0.55}px`, letterSpacing: '-1.5px' }}>
            IMPERDÍVEIS
          </tspan>
        </text>
      ) : (
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="font-headline font-black"
          style={{ fontSize: `${title.length > 10 ? textSize * 0.55 : textSize}px`, letterSpacing: '-2px' }}
          fill="black"
          textLength={title.length > 10 ? 250 : undefined}
          lengthAdjust={title.length > 10 ? "spacingAndGlyphs" : undefined}
        >
          {title}
        </text>
      )}
    </svg>
  );
}
