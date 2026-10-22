import { useRef } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { gsap, useGSAP } from '../../lib/gsap';

type Service = { icon: IconName; title: string; text: string; status: 'Planned for launch' | 'Planned later' };

export const SERVICES: Service[] = [
  { icon: 'map-pin', title: 'Find charging nearby', text: 'Public stations and participating private hosts on one map, with distance and directions.', status: 'Planned for launch' },
  { icon: 'plug', title: 'Check compatibility first', text: 'Match connector type and power level to your car or bike before you set off.', status: 'Planned for launch' },
  { icon: 'calendar-clock', title: 'See when it is open', text: 'Opening hours and access notes, plus live availability wherever a host or operator shares it.', status: 'Planned for launch' },
  { icon: 'route', title: 'Plan longer trips', text: 'Add charging stops to drives across Andhra Pradesh, based on your vehicle and route.', status: 'Planned later' },
  { icon: 'handshake', title: 'Request a host slot', text: 'Ask a private host for a time window and see their price before you agree.', status: 'Planned later' },
  { icon: 'flag', title: 'Report problems fast', text: 'Flag a broken charger or wrong details so the information stays accurate for everyone.', status: 'Planned for launch' },
];

/**
 * Concave 3D gallery (cards stand on an arc around the viewer). Scrolling turns the arc,
 * the card facing you comes forward. On small screens it becomes a swipeable row.
 */
export function ServicesArc() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.arc-card', el);
        const P = 1200;
        const R = 1200;
        const step = 0.3; // radians between cards
        const state = { c: 1 }; // index of the card facing the viewer
        const layout = () => {
          cards.forEach((c, i) => {
            const a = (i - state.c) * step;
            const x = Math.sin(a) * R;
            const z = P - Math.cos(a) * R;
            const focus = Math.max(0, 1 - Math.abs(a) / (step * 1.2));
            gsap.set(c, { x, z: z + focus * 60, rotateY: (-a * 180) / Math.PI, opacity: Math.abs(a) > 1.15 ? 0 : 1 });
            c.style.setProperty('--focus', focus.toFixed(3));
          });
        };
        layout();
        const tl = gsap.timeline({
          scrollTrigger: { trigger: el.querySelector('.arc-stage'), start: 'top top', end: 'bottom bottom', scrub: 0.8 },
        });
        tl.to(state, { c: cards.length - 2, ease: 'none', onUpdate: layout });
        tl.fromTo(el.querySelector('.arc-progress span'), { scaleX: 0 }, { scaleX: 1, ease: 'none' }, 0);
        return () => cards.forEach((c) => gsap.set(c, { clearProps: 'all' }));
      });
      mm.add('(max-width: 899px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.from(el.querySelectorAll('.arc-card'), { y: 40, autoAlpha: 0, stagger: 0.08, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: el.querySelector('.arc-track'), start: 'top 85%', once: true } });
      });
      return () => mm.revert();
    },
    [],
    root,
  );

  return (
    <section className="services" ref={root} aria-labelledby="services-title">
      <div className="arc-stage">
        <div className="arc-sticky">
          <div className="container services-head">
            <h2 id="services-title" className="h2" data-split="stretch">
              What the app is being built to do
            </h2>
            <p className="lede">Six things we are designing first, shaped by the questions EV riders in Andhra Pradesh ask most. Each one is a plan, not a live feature yet.</p>
          </div>
          <div className="arc-viewport">
            <ul className="arc-track">
              {SERVICES.map((s) => (
                <li className="arc-card panel gloss" key={s.title} data-tilt="6">
                  <span className="arc-orb" data-depth style={{ ['--d' as string]: 40 }}>
                    <Icon name={s.icon} />
                  </span>
                  <h3 className="h3">{s.title}</h3>
                  <p className="muted">{s.text}</p>
                  <span className="badge">{s.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="arc-progress container" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
