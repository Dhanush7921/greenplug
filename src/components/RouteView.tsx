import { useEffect, useRef, useState, type ComponentType } from 'react';
import { flushSync } from 'react-dom';
import { pageTitles, site } from '../config/site';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/prefs';
import { useLocation, type AppLocation } from '../lib/router';
import { LogoMark } from './Logo';

function scrollToHash(hash: string) {
  if (!hash) return;
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}

function setTitle(pathname: string) {
  const t = pageTitles[pathname];
  document.title = t ? `${t} | ${site.name}` : `Page not found | ${site.name}`;
}

/**
 * Renders the current page and plays a layered "curtain" wipe between pages
 * (three skewed bands sweep up, the mark draws its energy line, then the bands clear).
 */
export function RouteView({ routes, fallback }: { routes: Record<string, ComponentType>; fallback: ComponentType }) {
  const location = useLocation();
  const [shown, setShown] = useState<AppLocation>(location);
  const curtain = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(shown.pathname);
  }, [shown.pathname]);

  useEffect(() => {
    // initial deep link to a hash
    const t = window.setTimeout(() => scrollToHash(location.hash), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (location.key === shown.key) return;
    if (location.pathname === shown.pathname) {
      setShown(location);
      if (location.hash) scrollToHash(location.hash);
      else if (location.search === shown.search) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      return;
    }
    const swap = () => {
      flushSync(() => setShown(location));
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      const main = document.getElementById('main');
      main?.focus({ preventScroll: true });
    };
    const c = curtain.current;
    if (!c || prefersReducedMotion()) {
      swap();
      scrollToHash(location.hash);
      return;
    }
    const bands = c.querySelectorAll('.curtain-band');
    const mark = c.querySelector('.curtain-mark');
    const line = c.querySelector('.curtain-line');
    const tl = gsap.timeline();
    tl.set(c, { visibility: 'visible' })
      .fromTo(bands, { yPercent: 115 }, { yPercent: 0, duration: 0.6, stagger: 0.08, ease: 'power4.inOut' })
      .fromTo(mark, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' }, '-=0.25')
      .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, '<')
      .add(swap)
      .to(mark, { autoAlpha: 0, y: -14, duration: 0.22, ease: 'power2.in' })
      .to(bands, { yPercent: -115, duration: 0.65, stagger: { each: 0.08, from: 'end' }, ease: 'power4.inOut' }, '-=0.08')
      .set(c, { visibility: 'hidden' })
      .add(() => scrollToHash(location.hash));
    return () => {
      // If another navigation interrupts, finish instantly so the curtain never sticks.
      if (tl.isActive()) {
        tl.progress(1);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const Page = routes[shown.pathname] ?? fallback;
  return (
    <>
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <Page key={shown.pathname} />
      </main>
      <div className="curtain" ref={curtain} aria-hidden="true">
        <div className="curtain-band" />
        <div className="curtain-band" />
        <div className="curtain-band" />
        <div className="curtain-mark">
          <LogoMark />
          <span>{site.name}</span>
          <span className="curtain-line" />
        </div>
      </div>
    </>
  );
}
