export function RiHappyHeader({ textSize = 30 }: { textSize?: number }) {
  return (
    <svg
      viewBox="0 0 320 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      <defs>
        <g id="rh-star" fill="black">
          <path d="M 0,-10 L 2.939,-4.045 L 9.511,-3.09 L 4.755,1.118 L 5.878,7.025 L 0,4 L -5.878,7.025 L -4.755,1.118 L -9.511,-3.09 L -2.939,-4.045 Z" />
        </g>
      </defs>

      <use href="#rh-star" transform="translate(60, 25) scale(0.8)" />
      <use href="#rh-star" transform="translate(260, 25) scale(0.8)" />
      <use href="#rh-star" transform="translate(40, 75) scale(0.6)" />
      <use href="#rh-star" transform="translate(280, 75) scale(0.6)" />

      <text
        x="50%"
        y="55%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="font-headline font-black"
        style={{ fontSize: `${textSize}px`, letterSpacing: '-1px' }}
        fill="black"
      >
        RI HAPPY
      </text>
    </svg>
  );
}
