import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/prefs';
import { revealHeading } from '../lib/reveal';
import { Icon, type IconName } from './Icon';

export type Tile = { icon: IconName; label: string };

/**
 * Subpage hero: stretch-reveal headline + a stack of glass tiles floating at different depths.
 * The stack tilts with the pointer (data-tilt) and drifts apart on scroll.
 */
export function PageHero({ kicker, title, lede, actions, tiles }: { kicker: string; title: string; lede: ReactNode; actions?: ReactNode; tiles: Tile[] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const h = root.current!.querySelector<HTMLElement>('h1');
      if (h) revealHeading(h, { delay: 0.15, scroll: false });
      gsap.from('.ph-kicker, .page-hero .lede, .page-hero-actions > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, ease: 'expo.out', delay: 0.55 });
      gsap.from('.tile', { z: -400, rotateX: 40, autoAlpha: 0, stagger: 0.09, duration: 1.4, ease: 'expo.out', delay: 0.4 });
      gsap.from('.tile-base', { scale: 0.4, autoAlpha: 0, duration: 1.4, ease: 'expo.out', delay: 0.3 });
      gsap.utils.toArray<HTMLElement>('.tile').forEach((t, i) => {
        gsap.to(t, { yPercent: -30 - i * 18, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } });
      });
      gsap.to('.page-hero-line', { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut', delay: 0.6 });
    },
    [],
    root,
  );
  return (
    <section className="page-hero" ref={root}>
      <div className="container page-hero-grid">
        <div className="page-hero-copy">
          <p className="kicker ph-kicker">{kicker}</p>
          <h1 className="display page-title" data-split="stretch" data-split-manual>
            {title}
          </h1>
          <div className="lede">{lede}</div>
          {actions && <div className="page-hero-actions">{actions}</div>}
        </div>
        <div className="tile-stage" aria-hidden="true">
          <div className="tile-stack" data-tilt="10">
            <div className="tile-base" />
            {tiles.map((t, i) => (
              <div key={t.label} className={`tile tile-${i}`} style={{ ['--i' as string]: i }}>
                <span className="tile-icon">
                  <Icon name={t.icon} />
                </span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <svg className="page-hero-energy" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
        <path className="page-hero-line" d="M0 90 C 300 90, 420 30, 720 40 S 1140 100, 1440 60" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
      </svg>
    </section>
  );
}

export function CtaBand({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="section-tight">
      <div className="container">
        <div className="cta-band gloss" data-reveal="scale">
          <div>
            <h2 className="h2" data-split="lines">
              {title}
            </h2>
            <p className="lede">{text}</p>
          </div>
          <div className="cta-actions">{children}</div>
        </div>
      </div>
    </section>
  );
}
