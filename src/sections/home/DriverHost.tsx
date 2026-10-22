import { useRef } from 'react';
import { ButtonLink } from '../../components/Button';
import { Icon, type IconName } from '../../components/Icon';
import { gsap, useGSAP } from '../../lib/gsap';

const driver: [IconName, string][] = [
  ['motorbike', 'Filter by your car or two-wheeler and its connector'],
  ['clock', 'Opening hours and access notes before you leave'],
  ['indian-rupee', 'Prices shown upfront by the station or host'],
  ['flag', 'Report a problem in two taps'],
];
const host: [IconName, string][] = [
  ['house', 'List a charger, or a suitable dedicated socket'],
  ['calendar-clock', 'You choose the hours and who you can serve'],
  ['wallet', 'You set the price for your electricity and space'],
  ['shield-check', 'Guidance on safe wiring and approvals first'],
];

/** Two layered panels that swing in from either side; inner layers sit at different depths. */
export function DriverHost() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const [a, b] = gsap.utils.toArray<HTMLElement>('.dh-panel', root.current);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 25%', scrub: 0.8 } });
        tl.fromTo(a, { xPercent: -14, rotateY: 16, z: -160, autoAlpha: 0.2, transformPerspective: 1400 }, { xPercent: 0, rotateY: 0, z: 0, autoAlpha: 1, ease: 'power2.out' }, 0).fromTo(
          b,
          { xPercent: 14, rotateY: -16, z: -160, autoAlpha: 0.2, transformPerspective: 1400 },
          { xPercent: 0, rotateY: 0, z: 0, autoAlpha: 1, ease: 'power2.out' },
          0.06,
        );
        gsap.utils.toArray<HTMLElement>('.dh-layer', root.current).forEach((l, i) => {
          gsap.fromTo(l, { yPercent: 18 + i * 6 }, { yPercent: -10 - i * 4, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        gsap.from('.dh-list li', { x: -24, autoAlpha: 0, stagger: 0.06, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 55%', once: true } });
      });
      return () => mm.revert();
    },
    [],
    root,
  );

  return (
    <section className="section dh" ref={root} aria-labelledby="dh-title">
      <div className="container">
        <div className="section-head">
          <h2 id="dh-title" className="h2" data-split="stretch">
            Two sides of the same plug
          </h2>
          <p className="lede">Riders need a reliable charge. Plenty of places have power to spare. The app is designed to make that exchange simple, safe and fair for both.</p>
        </div>
        <div className="dh-grid">
          <article className="dh-panel dh-driver gloss" data-tilt="4">
            <div className="dh-layer dh-rings" aria-hidden="true" />
            <div className="dh-layer dh-icon" aria-hidden="true">
              <Icon name="car" strokeWidth={1.2} />
            </div>
            <div className="dh-content">
              <span className="badge">For drivers and riders</span>
              <h3 className="dh-title">Know before you go.</h3>
              <ul className="dh-list">
                {driver.map(([i, t]) => (
                  <li key={t}>
                    <Icon name={i} /> {t}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/drivers" variant="ghost">
                The driver experience
              </ButtonLink>
            </div>
          </article>
          <article className="dh-panel dh-host gloss" data-tilt="4">
            <div className="dh-layer dh-rings" aria-hidden="true" />
            <div className="dh-layer dh-icon" aria-hidden="true">
              <Icon name="plug-zap" strokeWidth={1.2} />
            </div>
            <div className="dh-content">
              <span className="badge">For charging hosts</span>
              <h3 className="dh-title">Share power you already have.</h3>
              <ul className="dh-list">
                {host.map(([i, t]) => (
                  <li key={t}>
                    <Icon name={i} /> {t}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/hosts">How hosting will work</ButtonLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
