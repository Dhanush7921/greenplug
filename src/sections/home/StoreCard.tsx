import { useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { LeadForm } from '../../components/LeadForm';
import { LogoMark } from '../../components/Logo';
import { Modal } from '../../components/Modal';
import { StoreButtons } from '../../components/StoreButtons';
import { gsap, useGSAP } from '../../lib/gsap';

/** A small "coming soon" pill that opens into the full app-store card as you scroll. */
export function StoreCard() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const card = root.current!.querySelector<HTMLElement>('.store-card')!;
        const w = card.offsetWidth;
        const h = card.offsetHeight;
        const px = Math.max(0, (w - 300) / 2);
        const py = Math.max(0, (h - 64) / 2);
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 20%', scrub: 0.8, invalidateOnRefresh: true } });
        tl.fromTo(card, { clipPath: `inset(${py}px ${px}px round 999px)` }, { clipPath: 'inset(0px 0px round 36px)', ease: 'power2.inOut' })
          .fromTo('.store-pill', { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.9, duration: 0.25 }, 0.1)
          .from('.store-inner > *', { y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.4 }, 0.45)
          .from('.store-mark', { scale: 0.4, rotate: -30, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' }, 0.4);
      });
      return () => mm.revert();
    },
    [],
    root,
  );

  return (
    <section className="section store" ref={root} aria-labelledby="store-title">
      <div className="container">
        <div className="store-card">
          <div className="store-pill" aria-hidden="true">
            <span className="chip-dot" /> Coming to Android and iOS
          </div>
          <div className="store-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="store-mark" aria-hidden="true">
            <LogoMark />
          </div>
          <div className="store-inner">
            <h2 id="store-title" className="h2">
              Be among the first riders to try it.
            </h2>
            <p className="lede">The apps are not in the stores yet. Join early access and we will tell you when testing opens in your city.</p>
            <StoreButtons onComingSoon={() => setOpen(true)} />
            <div>
              <Button type="button" onClick={() => setOpen(true)} icon="bell" className="store-cta">
                Join early access
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Driver early access">
        <p className="muted small">Tell us what you ride and where. We will only contact you about early access.</p>
        <LeadForm type="driver" compact onDone={() => setOpen(false)} />
      </Modal>
    </section>
  );
}
