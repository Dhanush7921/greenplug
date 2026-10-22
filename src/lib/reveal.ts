// Page-level motion vocabulary, applied declaratively via data attributes:
//   data-split="stretch"  headline chars rise from a mask while the variable-font width opens (62% -> final)
//   data-split="lines"    line-masked rise
//   data-reveal           block rises into place (use sparingly)
//   data-stagger          children cascade in
//   data-parallax="0.15"  scrubbed depth drift
//   data-draw             SVG stroke draws with scroll
//   data-count="120"      number counts up once visible
import type { RefObject } from 'react';
import { gsap, ScrollTrigger, SplitText, useGSAP } from './gsap';
import { prefersReducedMotion } from './prefs';

export function revealHeading(el: HTMLElement, opts: { delay?: number; scroll?: boolean } = {}) {
  const mode = el.dataset.split || 'lines';
  const finalWdth = getComputedStyle(el).getPropertyValue('--wdth').trim() || '110%';
  return SplitText.create(el, {
    type: mode === 'stretch' ? 'lines,words,chars' : 'lines',
    mask: 'lines',
    linesClass: 'split-line',
    charsClass: 'char',
    autoSplit: true,
    onSplit(self) {
      if (el.dataset.revealed === '1') return;
      const trigger = opts.scroll === false ? undefined : { trigger: el, start: 'top 88%', once: true };
      const done = () => {
        el.dataset.revealed = '1';
      };
      if (mode === 'stretch') {
        return gsap.fromTo(
          self.chars,
          { yPercent: 115, '--wdth': '62%' },
          { yPercent: 0, '--wdth': finalWdth, duration: 1.15, ease: 'expo.out', stagger: { each: 0.018 }, delay: opts.delay ?? 0, scrollTrigger: trigger, onComplete: done },
        );
      }
      return gsap.from(self.lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.08, delay: opts.delay ?? 0, scrollTrigger: trigger, onComplete: done });
    },
  });
}

export function useReveals(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || prefersReducedMotion()) return;

      root.querySelectorAll<HTMLElement>('[data-split]:not([data-split-manual])').forEach((el) => revealHeading(el));

      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        // sideways entrances only on wide screens, so nothing starts outside a phone's viewport
        const dir = window.innerWidth < 900 && (el.dataset.reveal === 'left' || el.dataset.reveal === 'right') ? 'up' : el.dataset.reveal;
        const from: gsap.TweenVars = { autoAlpha: 0, duration: 1.1, ease: 'expo.out' };
        if (dir === 'left') from.x = -60;
        else if (dir === 'right') from.x = 60;
        else if (dir === 'scale') Object.assign(from, { scale: 0.92, y: 30 });
        else from.y = 50;
        gsap.from(el, { ...from, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      });

      root.querySelectorAll<HTMLElement>('[data-stagger]').forEach((el) => {
        gsap.from(el.children, {
          autoAlpha: 0,
          y: 46,
          rotateX: -12,
          transformPerspective: 800,
          transformOrigin: '50% 0%',
          duration: 1,
          ease: 'expo.out',
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true },
        });
      });

      root.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
        const amt = parseFloat(el.dataset.parallax || '0.15');
        gsap.fromTo(el, { yPercent: amt * 100 }, { yPercent: -amt * 100, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      root.querySelectorAll<SVGGeometryElement>('[data-draw]').forEach((el) => {
        const len = el.getTotalLength();
        gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
        const trigger = (el.closest('[data-draw-trigger]') as Element) || el;
        gsap.to(el, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger, start: 'top 75%', end: 'bottom 55%', scrub: 0.6 } });
      });

      root.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const end = parseFloat(el.dataset.count || '0');
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          onUpdate: () => {
            el.textContent = Math.round(obj.v).toLocaleString('en-IN');
          },
        });
      });

      // Fonts can shift layout: recompute trigger positions once they are ready.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    deps,
    scope,
  );
}
