import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { site } from '../../config/site';
import { gsap, useGSAP } from '../../lib/gsap';
import { hasFinePointer, prefersReducedMotion, useReducedMotion } from '../../lib/prefs';
import { revealHeading } from '../../lib/reveal';
import { currentTheme, THEME_EVENT, type Theme } from '../../lib/theme';
import type { AnchorMap, HeroScene, PinFilter } from '../../three/HeroScene';
import { HeroFallback } from './HeroFallback';

type Mode = 'loading' | '3d' | 'fallback';

const CHIPS = [
  { id: 'charger', icon: 'shield-check' as const, text: 'Host checks before listing', side: 'right' },
  { id: 'car', icon: 'calendar-clock' as const, text: 'Availability details', side: 'left' },
  { id: 'scooter', icon: 'motorbike' as const, text: 'Cars and bikes', side: 'right' },
];

const PIN_LABELS: { id: string; text: string; kinds: PinFilter[] }[] = [
  { id: 'pin-dc', text: 'Public DC fast charger', kinds: ['all', 'car'] },
  { id: 'pin-bike', text: 'Shop socket for bikes', kinds: ['all', 'bike'] },
  { id: 'pin-host', text: 'Home host, AC charging', kinds: ['all', 'car', 'bike'] },
];

export function HeroStage() {
  const stage = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HeroScene | null>(null);
  const anchorEls = useRef<Record<string, HTMLElement | null>>({});
  const [mode, setMode] = useState<Mode>('loading');
  const [filter, setFilter] = useState<PinFilter>('all');
  const reduced = useReducedMotion();
  const isStatic = reduced || mode === 'fallback';

  // ---- 3D scene lifecycle ----
  useEffect(() => {
    let disposed = false;
    let scene: HeroScene | null = null;
    const cleanups: (() => void)[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    import('../../three/HeroScene')
      .then(async (mod) => {
        if (disposed) return;
        if (!mod.webglAvailable()) return setMode('fallback');
        const nav = navigator as Navigator & { deviceMemory?: number };
        const low = matchMedia('(pointer: coarse)').matches || window.innerWidth < 820 || (nav.deviceMemory !== undefined && nav.deviceMemory <= 4);
        try {
          scene = new mod.HeroScene({ canvas, quality: low ? 'low' : 'high', theme: currentTheme(), reducedMotion: prefersReducedMotion() });
        } catch (err) {
          console.warn('[GREENPLUG] 3D scene unavailable, showing illustration instead.', err);
          return setMode('fallback');
        }
        sceneRef.current = scene;
        const s = scene;
        const chipBox = new WeakMap<HTMLElement, { left: number; width: number }>();
        s.onAnchors = (a: AnchorMap) => {
          const vw = canvas.clientWidth;
          for (const [id, p] of Object.entries(a)) {
            const el = anchorEls.current[id];
            if (!el) continue;
            el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
            el.style.visibility = p.visible ? '' : 'hidden';
            // keep the label inside the viewport (the dot stays on the 3D point)
            const chip = el.querySelector<HTMLElement>('.chip');
            if (!chip || !chip.offsetWidth) continue;
            let box = chipBox.get(chip);
            if (!box || box.width !== chip.offsetWidth) {
              box = { left: chip.offsetLeft, width: chip.offsetWidth };
              chipBox.set(chip, box);
            }
            const left = p.x + box.left;
            const shift = left < 12 ? 12 - left : left + box.width > vw - 12 ? vw - 12 - (left + box.width) : 0;
            chip.style.translate = `${shift.toFixed(1)}px 0`;
          }
        };
        s.onContextLost = () => setMode('fallback');
        const size = () => s.resize(canvas.clientWidth, canvas.clientHeight);
        size();
        const ro = new ResizeObserver(size);
        ro.observe(canvas);
        cleanups.push(() => ro.disconnect());

        // Only render while the stage is on screen and the tab is visible.
        let inView = true;
        const sync = () => (inView && !document.hidden ? s.start() : s.stop());
        const io = new IntersectionObserver(([e]) => {
          inView = e.isIntersecting;
          sync();
        });
        io.observe(stage.current!);
        document.addEventListener('visibilitychange', sync);
        cleanups.push(() => {
          io.disconnect();
          document.removeEventListener('visibilitychange', sync);
        });

        const onTheme = (e: Event) => s.setTheme((e as CustomEvent<Theme>).detail);
        window.addEventListener(THEME_EVENT, onTheme);
        cleanups.push(() => window.removeEventListener(THEME_EVENT, onTheme));

        if (hasFinePointer() && !prefersReducedMotion()) {
          const onMove = (e: PointerEvent) => s.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
          window.addEventListener('pointermove', onMove, { passive: true });
          cleanups.push(() => window.removeEventListener('pointermove', onMove));
        }

        await s.warmup();
        if (disposed) return;
        setMode('3d');
        if (prefersReducedMotion()) s.render();
        else {
          s.playIntro();
          s.start();
        }
      })
      .catch((err) => {
        console.warn('[GREENPLUG] Could not load the 3D scene.', err);
        if (!disposed) setMode('fallback');
      });

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setPinFilter(filter);
  }, [filter]);

  // ---- entrance choreography (copy) ----
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const title = stage.current?.querySelector<HTMLElement>('.hero-title');
      if (title) revealHeading(title, { delay: 0.35, scroll: false });
      gsap.from('.hero-copy .kicker, .hero-lede, .hero-actions > *, .hero-notes li', { y: 34, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: 'expo.out', delay: 0.85 });
      gsap.from('.scroll-cue', { autoAlpha: 0, y: -10, duration: 0.8, delay: 2.6 });
    },
    [],
    stage,
  );

  // chips appear once the 3D scene (and its anchors) exist, as the vehicles settle
  useGSAP(
    () => {
      if (mode !== '3d' || prefersReducedMotion()) return;
      gsap.from('.hero-anchors .chip', { scale: 0.5, autoAlpha: 0, duration: 0.9, stagger: 0.14, ease: 'back.out(2.2)', delay: 1.9 });
      gsap.from('.hero-anchors .anchor-line', { scaleY: 0, duration: 0.6, stagger: 0.14, ease: 'power3.out', delay: 1.8, transformOrigin: '50% 100%' });
      gsap.from('.hero-anchors .anchor-dot', { scale: 0, duration: 0.5, stagger: 0.14, ease: 'back.out(3)', delay: 1.7 });
    },
    [mode],
    stage,
  );

  // ---- scroll story: hero -> energy -> discovery map ----
  useGSAP(
    () => {
      if (isStatic || mode !== '3d') return;
      const proxy = { p: 0 };
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: stage.current, start: 'top top', end: 'bottom bottom', scrub: 0.9 },
      });
      tl.to(proxy, { p: 1, duration: 1, onUpdate: () => sceneRef.current?.setScroll(proxy.p) }, 0)
        .to('.scroll-cue', { autoAlpha: 0, duration: 0.03 }, 0)
        .to('.hero-copy', { yPercent: -14, autoAlpha: 0, duration: 0.14, ease: 'power1.in' }, 0.03)
        .to('.hero-anchors', { autoAlpha: 0, duration: 0.08 }, 0.06)
        .fromTo('.cap-b', { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.2)
        .fromTo('.cap-b .cap-line', { scaleX: 0 }, { scaleX: 1, duration: 0.14, transformOrigin: '0% 50%' }, 0.22)
        .to('.cap-b', { autoAlpha: 0, y: -70, duration: 0.08, ease: 'power2.in' }, 0.43)
        .fromTo('.cap-c', { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.72)
        .fromTo('.pin-anchors', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.88);
    },
    [isStatic, mode],
    stage,
  );

  const setAnchor = (id: string) => (el: HTMLElement | null) => {
    anchorEls.current[id] = el;
  };

  return (
    <section className={`hero-stage${isStatic ? ' is-static' : ''}`} ref={stage} aria-labelledby="hero-title" data-mode={mode}>
      <div className="hero-sticky">
        <div className="hero-backdrop" aria-hidden="true" />
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" style={{ opacity: mode === 'fallback' ? 0 : 1 }} />
        {mode === 'fallback' && <HeroFallback />}
        <div className="hero-vignette" aria-hidden="true" />

        {mode === '3d' && !reduced && (
          <div className="hero-anchors" aria-hidden="true">
            {CHIPS.map((c) => (
              <div key={c.id} className={`hero-anchor side-${c.side} anchor-${c.id}`} ref={setAnchor(c.id)}>
                <span className="anchor-dot" />
                <span className="anchor-line" />
                <span className="chip">
                  <Icon name={c.icon} />
                  {c.text}
                </span>
              </div>
            ))}
          </div>
        )}
        {mode === '3d' && !reduced && (
          <div className="pin-anchors" aria-hidden="true">
            {PIN_LABELS.map((p) => (
              <div key={p.id} className="hero-anchor pin-anchor" ref={setAnchor(p.id)} data-hidden={!p.kinds.includes(filter)}>
                <span className="chip">
                  <span className="chip-dot" />
                  {p.text} <em>sample</em>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="hero-copy">
          <p className="kicker">A planned EV charging app for {site.region}</p>
          <h1 id="hero-title" className="display hero-title" data-split="stretch" data-split-manual>
            Charge closer.
            <br />
            Drive further.
          </h1>
          <p className="lede hero-lede">
            {site.name} is being built to help electric car and bike riders find charging that fits their vehicle — from public stations to private hosts in their own neighbourhood.
          </p>
          <div className="hero-actions">
            <ButtonLink to="/contact?form=driver" icon="bell" cursorLabel="Join">
              Get early access
            </ButtonLink>
            <ButtonLink to="/hosts" variant="ghost" icon="house">
              Host a charger
            </ButtonLink>
          </div>
          <ul className="hero-notes">
            <li>
              <Icon name="car" /> Cars and two-wheelers
            </li>
            <li>
              <Icon name="plug" /> Public and private chargers
            </li>
            <li>
              <Icon name="map-pin" /> Starting in {site.region}
            </li>
          </ul>
        </div>

        <div className="hero-caption cap-b">
          <span className="cap-line" aria-hidden="true" />
          <h2 className="h2">Every parked vehicle is next to a plug somewhere.</h2>
          <p className="lede">
            Homes, shops, cafés and offices across {site.region} already have power where people park. {site.name} plans to connect riders with the hosts willing to share it, alongside public charging stations, so the next charge is rarely far away.
          </p>
        </div>

        <div className="hero-caption cap-c">
          <h2 className="h2">Discovery that knows what you ride.</h2>
          <p className="lede">Choose your vehicle and the map is designed to show only chargers you can actually use, with notes on power, access and opening hours.</p>
          <div className="tabs" role="group" aria-label="Show chargers for">
            {(
              [
                ['all', 'Everything', 'layers'],
                ['car', 'Car', 'car'],
                ['bike', 'Bike or scooter', 'motorbike'],
              ] as const
            ).map(([key, label, icon]) => (
              <button key={key} type="button" className="tab" aria-pressed={filter === key} onClick={() => setFilter(key)} data-magnetic="0.2">
                <Icon name={icon} /> {label}
              </button>
            ))}
          </div>
          <p className="small muted cap-note">
            <Icon name="info" /> Illustrative map with sample pins. These are not real locations.
          </p>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll to follow the energy</span>
          <span className="scroll-cue-line" />
        </div>
      </div>
    </section>
  );
}
