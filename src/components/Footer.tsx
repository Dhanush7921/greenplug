import { navItems, site } from '../config/site';
import { setPointerEffects, useFinePointer, usePointerEffects, useReducedMotion } from '../lib/prefs';
import { Link } from '../lib/router';
import { useTheme } from '../lib/theme';
import { LogoMark } from './Logo';

export function Footer() {
  const { theme, toggle } = useTheme();
  const effects = usePointerEffects();
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <h2>Charging should be the easy part of going electric.</h2>
            <Link to="/" className="logo" aria-label={`${site.name} home`}>
              <LogoMark />
              <span className="logo-word">{site.name}</span>
              <span className="logo-tag">Working name</span>
            </Link>
          </div>
          <div>
            <h3>Explore</h3>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              {navItems.slice(0, 3).map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Trust and help</h3>
            <ul>
              {navItems.slice(3).map((n) => (
                <li key={n.to}>
                  <Link to={n.to}>{n.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/safety#privacy">Privacy approach</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Display</h3>
            <ul>
              <li>
                <button type="button" className="setting" role="switch" aria-checked={theme === 'dark'} onClick={() => toggle()}>
                  <span className="switch" aria-hidden="true" /> Dark theme
                </button>
              </li>
              {fine && !reduced && (
                <li>
                  <button type="button" className="setting" role="switch" aria-checked={effects} onClick={() => setPointerEffects(!effects)}>
                    <span className="switch" aria-hidden="true" /> Pointer effects
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">
          {site.name}
        </div>
        <div className="footer-bottom">
          <p>
            {site.name} is a working name for a planned EV charging discovery service focused on {site.region}, India. The app is not available yet. Stations, hosts, prices and screens shown on
            this site are illustrative samples, not real listings.
          </p>
          <span>© {year} {site.name} project</span>
        </div>
      </div>
    </footer>
  );
}
