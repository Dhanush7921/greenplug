import { useRef } from 'react';
import { gsap, useGSAP } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/prefs';

/** A short energy line that draws between sections as you scroll, ending in a charge node. */
export function Connector() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const flow = el.querySelector('.flow');
      const node = el.querySelector('.node');
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 50%', scrub: 0.6 } });
      tl.fromTo(flow, { scaleY: 0 }, { scaleY: 1, ease: 'none', transformOrigin: '50% 0%' }).fromTo(node, { scale: 0 }, { scale: 1, ease: 'back.out(3)', transformOrigin: '50% 50%', duration: 0.25 }, '>-0.1');
    },
    [],
    ref,
  );
  return (
    <div className="connector" ref={ref} aria-hidden="true">
      <svg viewBox="0 0 24 160" preserveAspectRatio="none">
        <line className="track" x1="12" y1="0" x2="12" y2="148" strokeWidth="1.5" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
        <line className="flow" x1="12" y1="0" x2="12" y2="148" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg className="node" viewBox="0 0 24 24" style={{ position: 'absolute', bottom: 0, width: 22, height: 22 }}>
        <circle cx="12" cy="12" r="7" fill="var(--bg)" stroke="var(--glow)" strokeWidth="2.5" />
        <circle cx="12" cy="12" r="2.5" fill="var(--glow)" />
      </svg>
    </div>
  );
}
