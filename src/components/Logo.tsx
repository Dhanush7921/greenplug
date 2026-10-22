import { site } from '../config/site';
import { Link } from '../lib/router';

/**
 * Original, editable logo placeholder: a leaf-drop shape (one squared corner, like a plug face)
 * carrying a lightning bolt. Replace the paths or the wordmark freely.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="gp-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#235347" />
          <stop offset="1" stopColor="#051F20" />
        </linearGradient>
      </defs>
      <path d="M16 2C23.7 2 30 8.3 30 16S23.7 30 16 30H4a2 2 0 0 1-2-2V16C2 8.3 8.3 2 16 2Z" fill="url(#gp-mark)" />
      <path d="M16 2C23.7 2 30 8.3 30 16" fill="none" stroke="#8EB69B" strokeWidth="1" opacity=".7" />
      <path d="M18.2 6.5 9.8 17.6h5.6l-2.1 7.9 8.9-11.7h-5.7l1.7-7.3Z" fill="#DAF1DE" />
    </svg>
  );
}

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="logo" aria-label={`${site.name} home`} onClick={onClick} data-magnetic="0.25">
      <LogoMark />
      <span className="logo-word">{site.name}</span>
      {site.provisional && <span className="logo-tag">Working name</span>}
    </Link>
  );
}
