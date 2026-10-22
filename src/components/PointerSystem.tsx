// Desktop pointer system: glossy cursor + trailing light, magnetic controls, 3D tilt and
// pointer-tracked sheen. Uses event delegation so new pages work without re-binding.
// Disabled on touch/coarse pointers, with reduced motion, or when the visitor turns it off.
import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { hasFinePointer, prefersReducedMotion, usePointerEffects, useRichPointer } from '../lib/prefs';

const INTERACTIVE = 'a, button, [role="button"], label, summary, select, .choice, [data-cursor]';
const TEXT = 'input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]';
const SHEEN = '.gloss, .btn, .store-btn, [data-tilt]';

type Quick = (v: number) => void;

export function PointerSystem() {
  const rich = useRichPointer();
  const effects = usePointerEffects();
  const layer = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLDivElement>(null);

  // Sheen coordinates work for any fine pointer (even with rich effects off) — they only move a highlight.
  useEffect(() => {
    if (!hasFinePointer()) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      raf = 0;
      if (!last) return;
      const el = (last.target as Element | null)?.closest?.(SHEEN) as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${last.clientX - r.left}px`);
      el.style.setProperty('--my', `${last.clientY - r.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [effects]);

  useEffect(() => {
    if (!rich || !layer.current || !lightRef.current) return;
    const root = document.documentElement;
    const L = layer.current;
    const dot = L.querySelector<HTMLElement>('.cursor-dot')!;
    const ring = L.querySelector<HTMLElement>('.cursor-ring')!;
    const label = L.querySelector<HTMLElement>('.cursor-label')!;
    const light = lightRef.current;
    const trails = Array.from(L.querySelectorAll<HTMLElement>('.cursor-trail'));
    root.classList.add('has-cursor');

    const q = (el: HTMLElement, d: number, ease = 'power3') => ({ x: gsap.quickTo(el, 'x', { duration: d, ease }), y: gsap.quickTo(el, 'y', { duration: d, ease }) });
    const followers = [
      { el: dot, ...q(dot, 0.06) },
      { el: ring, ...q(ring, 0.28) },
      { el: light, ...q(light, 0.85, 'power2') },
      ...trails.map((t, i) => ({ el: t, ...q(t, 0.16 + i * 0.07) })),
    ];
    let visible = false;
    let hoverState: 'none' | 'link' | 'text' = 'none';
    let pressed = false;

    const show = (x: number, y: number) => {
      followers.forEach((f) => gsap.set(f.el, { x, y }));
      gsap.to([dot, ring], { opacity: 1, duration: 0.3 });
      gsap.to(light, { opacity: 1, duration: 0.6 });
      trails.forEach((t, i) => gsap.to(t, { opacity: 0.45 - i * 0.07, duration: 0.4 }));
      visible = true;
    };
    const hide = () => {
      gsap.to([dot, ring, light, ...trails], { opacity: 0, duration: 0.3 });
      visible = false;
    };

    const ringTo = () => {
      const scale = hoverState === 'link' ? 1.75 : hoverState === 'text' ? 0.4 : 1;
      gsap.to(ring, { scale: pressed ? scale * 0.82 : scale, opacity: hoverState === 'text' ? 0 : 1, duration: 0.45, ease: 'expo.out' });
      gsap.to(dot, { scale: pressed ? 1.8 : hoverState === 'link' ? 0.6 : 1, opacity: hoverState === 'text' ? 0 : 1, duration: 0.3 });
    };

    // --- magnetic ---
    let mag: HTMLElement | null = null;
    const magQ = new WeakMap<HTMLElement, { x: Quick; y: Quick; inner?: { x: Quick; y: Quick } }>();
    const getMagQ = (el: HTMLElement) => {
      let v = magQ.get(el);
      if (!v) {
        const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
        v = {
          x: gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }),
          y: gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' }),
          inner: inner ? { x: gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'power3' }), y: gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'power3' }) } : undefined,
        };
        magQ.set(el, v);
      }
      return v;
    };
    const release = (el: HTMLElement) => {
      const inner = el.querySelector('[data-magnetic-inner]');
      gsap.to(inner ? [el, inner] : el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)', overwrite: true });
      magQ.delete(el);
    };

    // --- tilt ---
    let tilt: HTMLElement | null = null;
    const tiltQ = new WeakMap<HTMLElement, { rx: Quick; ry: Quick }>();
    const releaseTilt = (el: HTMLElement) => {
      gsap.to(el, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'power3.out', overwrite: true });
      el.classList.remove('is-lit');
      tiltQ.delete(el);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const { clientX: x, clientY: y } = e;
      if (!visible) show(x, y);
      followers.forEach((f) => {
        f.x(x);
        f.y(y);
      });
      const target = e.target as Element;

      const m = target.closest?.('[data-magnetic]') as HTMLElement | null;
      if (m !== mag) {
        if (mag) release(mag);
        mag = m;
      }
      if (m) {
        const r = m.getBoundingClientRect();
        const cx = r.left - (gsap.getProperty(m, 'x') as number) + r.width / 2;
        const cy = r.top - (gsap.getProperty(m, 'y') as number) + r.height / 2;
        const s = parseFloat(m.dataset.magnetic || '0.3');
        const v = getMagQ(m);
        v.x((x - cx) * s);
        v.y((y - cy) * s);
        v.inner?.x((x - cx) * s * 0.45);
        v.inner?.y((y - cy) * s * 0.45);
      }

      const t = target.closest?.('[data-tilt]') as HTMLElement | null;
      if (t !== tilt) {
        if (tilt) releaseTilt(tilt);
        tilt = t;
        if (t) gsap.set(t, { transformPerspective: 1000 });
      }
      if (t) {
        const r = t.getBoundingClientRect();
        const max = parseFloat(t.dataset.tilt || '7');
        let v = tiltQ.get(t);
        if (!v) {
          v = { rx: gsap.quickTo(t, 'rotationX', { duration: 0.6, ease: 'power3' }), ry: gsap.quickTo(t, 'rotationY', { duration: 0.6, ease: 'power3' }) };
          tiltQ.set(t, v);
        }
        v.ry(((x - r.left) / r.width - 0.5) * max * 2);
        v.rx(-((y - r.top) / r.height - 0.5) * max * 2);
        t.classList.add('is-lit');
      }
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element;
      const next = t.closest?.(TEXT) ? 'text' : t.closest?.(INTERACTIVE) ? 'link' : 'none';
      const labelText = (t.closest?.('[data-cursor]') as HTMLElement | null)?.dataset.cursor || '';
      label.textContent = labelText;
      gsap.to(label, { opacity: labelText && next === 'link' ? 1 : 0, duration: 0.25 });
      if (next !== hoverState) {
        hoverState = next;
        ringTo();
      }
    };
    const onDown = () => {
      pressed = true;
      ringTo();
    };
    const onUp = () => {
      pressed = false;
      ringTo();
    };
    const onLeaveDoc = (e: PointerEvent) => {
      if (!e.relatedTarget) hide();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.addEventListener('pointerout', onLeaveDoc, { passive: true });
    window.addEventListener('blur', hide);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerout', onLeaveDoc);
      window.removeEventListener('blur', hide);
      root.classList.remove('has-cursor');
      if (mag) release(mag);
      if (tilt) releaseTilt(tilt);
      gsap.killTweensOf([dot, ring, light, label, ...trails]);
    };
  }, [rich]);

  if (!rich || prefersReducedMotion()) return null;
  return (
    <>
    {/* The light sits outside the cursor layer so its blend mode reaches the page beneath. */}
    <div className="cursor-light" ref={lightRef} aria-hidden="true" />
    <div className="cursor-layer" ref={layer} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="cursor-trail" key={i} style={{ transform: `scale(${1 - i * 0.14})` }} />
      ))}
      <div className="cursor-ring">
        <span className="cursor-label" />
      </div>
      <div className="cursor-dot" />
    </div>
    </>
  );
}
