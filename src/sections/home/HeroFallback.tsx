/** Static illustration used when WebGL is unavailable. Same composition as the 3D scene. */
export function HeroFallback() {
  return (
    <svg className="hero-fallback" viewBox="0 0 900 560" role="img" aria-label="Illustration of an electric car and scooter beside a charging station on a circular platform">
      <defs>
        <linearGradient id="fb-plat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--bg-3)" />
          <stop offset="1" stopColor="var(--sage)" stopOpacity=".5" />
        </linearGradient>
        <linearGradient id="fb-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#8EB69B" stopOpacity="0" />
          <stop offset=".5" stopColor="#DAF1DE" />
          <stop offset="1" stopColor="#8EB69B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 300 L120 230 L210 270 L330 190 L450 250 L560 200 L700 260 L820 210 L900 240 V340 H0Z" fill="var(--sage)" opacity=".25" />
      <ellipse cx="470" cy="430" rx="400" ry="96" fill="url(#fb-plat)" stroke="var(--sage)" strokeWidth="3" />
      <ellipse cx="470" cy="430" rx="280" ry="64" fill="none" stroke="var(--sage)" strokeDasharray="6 10" />
      <path d="M180 140 A300 300 0 0 1 760 140" fill="none" stroke="var(--line-strong)" strokeWidth="14" strokeLinecap="round" transform="translate(0 40)" />
      <rect x="520" y="170" width="70" height="200" rx="22" fill="var(--surface-solid)" stroke="var(--line-strong)" strokeWidth="2" />
      <rect x="532" y="190" width="46" height="120" rx="8" fill="#0B2B26" />
      <path d="M558 220 l-12 18 h9 l-4 14 14-19 h-9 l3-13Z" fill="#DAF1DE" />
      <path d="M220 400 q10-60 80-70 l60-40 q40-20 110-14 l40 30 q40 6 50 40 l4 54 Z" fill="var(--surface-solid)" stroke="var(--moss)" strokeWidth="3" />
      <path d="M330 296 l50-28 q40-10 80 0 l28 28 Z" fill="#0B2B26" />
      <circle cx="290" cy="410" r="30" fill="#0B2B26" />
      <circle cx="470" cy="410" r="30" fill="#0B2B26" />
      <path d="M640 400 q0-46 40-60 l30-4 -6-60 h20 l10 70 q30 10 32 54 Z" fill="var(--surface-solid)" stroke="var(--moss)" strokeWidth="3" />
      <circle cx="660" cy="410" r="20" fill="#0B2B26" />
      <circle cx="745" cy="410" r="20" fill="#0B2B26" />
      <path d="M555 175 C 420 60, 160 120, 180 250 S 520 360, 470 330" fill="none" stroke="url(#fb-glow)" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
