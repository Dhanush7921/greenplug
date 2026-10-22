import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '../../components/Icon';
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/prefs';

const SCREENS: { key: string; icon: IconName; title: string; text: string }[] = [
  { key: 'discover', icon: 'search', title: 'Discover', text: 'Search near you or along a road and see every compatible option on one map.' },
  { key: 'check', icon: 'plug', title: 'Check', text: 'Open any charger to see connector, power and access notes against your own vehicle.' },
  { key: 'plan', icon: 'route', title: 'Plan', text: 'For longer drives, add charging stops that suit your range before you leave.' },
];
const DURATION = 5.5;

function Skeleton() {
  return (
    <div className="ph-skel" aria-hidden="true">
      <span style={{ width: '70%' }} />
      <span style={{ height: 120 }} />
      <span style={{ width: '50%' }} />
      <span style={{ width: '85%' }} />
      <span style={{ height: 64 }} />
    </div>
  );
}

function Discover() {
  return (
    <div className="ph-screen">
      <div className="ph-search">
        <Icon name="search" /> <span>Search near Visakhapatnam</span>
      </div>
      <div className="ph-map ph-item">
        <svg viewBox="0 0 260 200" aria-hidden="true">
          <rect width="260" height="200" fill="var(--ph-map)" />
          <path d="M-10 150 C 60 120, 90 160, 150 110 S 240 60, 280 80" stroke="var(--ph-road)" strokeWidth="10" fill="none" />
          <path d="M60 -10 L 90 210 M 180 -10 L 160 210 M -10 60 L 270 40" stroke="var(--ph-road)" strokeWidth="5" fill="none" opacity=".7" />
          <path d="M215 0 C 230 60, 250 120, 240 200 L 260 200 L 260 0 Z" fill="var(--ph-water)" />
          <path className="ph-route" d="M40 170 C 70 140, 100 150, 130 118 S 180 80, 200 70" stroke="var(--ph-accent)" strokeWidth="4" strokeLinecap="round" fill="none" />
          {[
            [130, 118],
            [200, 70],
            [80, 60],
          ].map(([x, y], i) => (
            <g key={i} className="ph-pin" transform={`translate(${x} ${y})`}>
              <circle r="11" fill="var(--ph-accent)" />
              <circle r="4" fill="var(--ph-bg)" />
            </g>
          ))}
          <circle cx="40" cy="170" r="7" fill="var(--ph-bg)" stroke="var(--ph-accent)" strokeWidth="3" />
        </svg>
      </div>
      <div className="ph-card ph-item">
        <div className="ph-thumb">
          <Icon name="house" />
        </div>
        <div>
          <strong>Home charger</strong>
          <span>Type 2 AC, 2.4 km away</span>
        </div>
        <em>Sample</em>
      </div>
      <div className="ph-chips ph-item">
        <span>Car</span>
        <span className="on">Type 2</span>
        <span>Open now</span>
      </div>
    </div>
  );
}

function Check() {
  const rows: [string, boolean, string][] = [
    ['Portable charger on a 15A socket', true, 'Works with your scooter'],
    ['Type 2 AC', false, 'Not used by this vehicle'],
    ['CCS2 DC fast charging', false, 'Not used by this vehicle'],
  ];
  return (
    <div className="ph-screen">
      <div className="ph-vehicle ph-item">
        <Icon name="motorbike" />
        <div>
          <span>Your vehicle</span>
          <strong>Electric scooter</strong>
        </div>
        <em>Sample</em>
      </div>
      <h4 className="ph-h ph-item">Connectors at this location</h4>
      {rows.map(([name, ok, note]) => (
        <div className="ph-row ph-item" key={name} data-ok={ok}>
          <span className="ph-tick">
            <Icon name={ok ? 'check' : 'x'} />
          </span>
          <div>
            <strong>{name}</strong>
            <span>{note}</span>
          </div>
        </div>
      ))}
      <div className="ph-note ph-item">
        <Icon name="info" /> Power, hours and price come from the host or operator.
      </div>
    </div>
  );
}

function Plan() {
  const stops = [
    { name: 'Visakhapatnam', note: 'Start', pct: 92 },
    { name: 'Stop near Rajamahendravaram', note: 'Suggested charge', pct: 34 },
    { name: 'Vijayawada', note: 'Arrive', pct: 41 },
  ];
  return (
    <div className="ph-screen">
      <div className="ph-trip ph-item">
        <span>Trip plan</span>
        <strong>Visakhapatnam to Vijayawada</strong>
        <em>Sample route</em>
      </div>
      <ol className="ph-stops">
        {stops.map((s) => (
          <li key={s.name} className="ph-item">
            <span className="ph-node" />
            <div>
              <strong>{s.name}</strong>
              <span>{s.note}</span>
            </div>
            <span className="ph-batt" aria-label={`Estimated battery ${s.pct} percent`}>
              <i style={{ width: `${s.pct}%` }} />
            </span>
          </li>
        ))}
      </ol>
      <div className="ph-note ph-item">
        <Icon name="info" /> Estimates will depend on your vehicle, load and driving.
      </div>
    </div>
  );
}

/** Phone preview: each screen loads as a skeleton, then content fills in (dashboard-style), cycling automatically. */
export function AppPreview() {
  const root = useRef<HTMLElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const progress = useRef<gsap.core.Tween | null>(null);

  const go = useCallback((i: number) => {
    setIdx(i);
    setLoading(true);
  }, []);

  // play/pause the cycle only while visible
  useGSAP(
    () => {
      ScrollTrigger.create({ trigger: root.current, start: 'top 70%', end: 'bottom 20%', onToggle: (self) => setPlaying(self.isActive) });
      if (!prefersReducedMotion()) {
        gsap.from('.phone', { y: 120, rotateX: 22, rotateZ: -4, autoAlpha: 0, transformPerspective: 1400, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
        gsap.to('.phone-wrap', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    },
    [],
    root,
  );

  // skeleton -> content
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const t = window.setTimeout(() => setLoading(false), reduced ? 0 : 650);
    return () => window.clearTimeout(t);
  }, [idx]);

  useEffect(() => {
    if (loading || !screenRef.current || prefersReducedMotion()) return;
    const items = screenRef.current.querySelectorAll('.ph-item, .ph-pin, .ph-route');
    const ctx = gsap.context(() => {
      if (items.length) gsap.from(items, { y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out' });
      const route = screenRef.current!.querySelector<SVGPathElement>('.ph-route');
      if (route) {
        const len = route.getTotalLength();
        gsap.fromTo(route, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', delay: 0.2 });
      }
      const bars = screenRef.current!.querySelectorAll('.ph-batt i');
      if (bars.length) gsap.from(bars, { width: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.2 });
    }, screenRef);
    return () => ctx.revert();
  }, [loading, idx]);

  // auto-advance with a progress bar
  useEffect(() => {
    progress.current?.kill();
    const bar = root.current?.querySelector<HTMLElement>(`.ap-step[data-i="${idx}"] .ap-bar i`);
    root.current?.querySelectorAll<HTMLElement>('.ap-bar i').forEach((b) => gsap.set(b, { scaleX: 0 }));
    if (!bar) return;
    if (!playing || prefersReducedMotion()) {
      gsap.set(bar, { scaleX: 1 });
      return;
    }
    progress.current = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: DURATION, ease: 'none', onComplete: () => go((idx + 1) % SCREENS.length) });
    return () => {
      progress.current?.kill();
    };
  }, [idx, playing, go]);

  const Screen = [Discover, Check, Plan][idx];
  return (
    <section className="section app-preview" ref={root} aria-labelledby="ap-title">
      <div className="container ap-grid">
        <div className="ap-copy">
          <h2 id="ap-title" className="h2" data-split="stretch">
            Your charging companion, in progress
          </h2>
          <p className="lede">A first look at the screens we are designing. Layouts and features will change as we test them with riders in Andhra Pradesh.</p>
          <ol className="ap-steps">
            {SCREENS.map((s, i) => (
              <li key={s.key}>
                <button type="button" className="ap-step" data-i={i} aria-current={i === idx ? 'step' : undefined} onClick={() => go(i)}>
                  <span className="ap-step-icon">
                    <Icon name={s.icon} />
                  </span>
                  <span className="ap-step-text">
                    <strong>{s.title}</strong>
                    <span>{s.text}</span>
                  </span>
                  <span className="ap-bar" aria-hidden="true">
                    <i />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="phone-wrap">
          <div className="phone" data-tilt="8" aria-label={`Concept screen: ${SCREENS[idx].title}`} role="img">
            <div className="phone-notch" />
            <div className="phone-status">
              <span>9:41</span>
              <span>Concept preview</span>
            </div>
            <div className="phone-screen" ref={screenRef}>
              {loading ? <Skeleton /> : <Screen />}
            </div>
            <nav className="phone-tabs" aria-hidden="true">
              {SCREENS.map((s, i) => (
                <span key={s.key} className={i === idx ? 'on' : ''}>
                  <Icon name={s.icon} />
                  {s.title}
                </span>
              ))}
            </nav>
          </div>
          <div className="phone-glow" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
