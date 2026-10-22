import routes from './routes.json';

// Central, replaceable brand + integration settings.
// Values come from VITE_* environment variables at build time (see .env.example).
const env = import.meta.env;

export const site = {
  name: (env.VITE_BRAND_NAME || 'GREENPLUG').trim(),
  /** Shown next to the logo while the name is a working title. */
  provisional: true,
  region: 'Andhra Pradesh',
  contactEmail: (env.VITE_CONTACT_EMAIL || '').trim(),
  stores: {
    play: (env.VITE_PLAY_STORE_URL || '').trim(),
    apple: (env.VITE_APP_STORE_URL || '').trim(),
  },
  leadsEndpoint: (env.VITE_LEADS_ENDPOINT || '').trim(),
  base: env.BASE_URL || '/',
};

export type NavItem = { to: string; label: string };

export const navItems: NavItem[] = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/drivers', label: 'For drivers' },
  { to: '/hosts', label: 'For hosts' },
  { to: '/safety', label: 'Safety' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

/** Page titles/descriptions (shared with the build script, which writes one HTML file per route). */
export const pageTitles: Record<string, string> = Object.fromEntries(routes.map((r) => [r.path, r.title]));
