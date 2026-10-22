import { useLayoutEffect, useRef } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { LeadForm } from '../components/LeadForm';
import { PageHero } from '../components/PageHero';
import { site } from '../config/site';
import { gsap } from '../lib/gsap';
import type { LeadType } from '../lib/leads';
import { prefersReducedMotion } from '../lib/prefs';
import { useNavigate, useSearchParam } from '../lib/router';
import { useReveals } from '../lib/reveal';

const TABS: { key: LeadType; label: string; icon: IconName; blurb: string }[] = [
  { key: 'driver', label: 'Driver early access', icon: 'car', blurb: 'Be first to test the app in your city and help decide what we build.' },
  { key: 'host', label: 'Host interest', icon: 'house', blurb: 'Have a charger or a suitable socket where vehicles park? Tell us about it.' },
  { key: 'partner', label: 'Partnerships', icon: 'handshake', blurb: 'Charge point operators, vehicle brands, fleets, property owners and public bodies.' },
  { key: 'general', label: 'General enquiry', icon: 'message-circle', blurb: 'Questions, ideas, feedback or media requests.' },
];

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  const param = useSearchParam('form') as LeadType | null;
  const navigate = useNavigate();
  const active: LeadType = TABS.some((t) => t.key === param) ? (param as LeadType) : 'driver';
  const tabs = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const pill = tabs.current?.querySelector<HTMLElement>('.tab-pill');
    const el = tabs.current?.querySelector<HTMLElement>('.tab[aria-selected="true"]');
    const place = () => {
      if (!pill || !el) return;
      const vars = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
      if (first.current || prefersReducedMotion()) gsap.set(pill, vars);
      else gsap.to(pill, { ...vars, duration: 0.6, ease: 'expo.out' });
    };
    place();
    if (!first.current && !prefersReducedMotion() && panel.current) {
      gsap.fromTo(panel.current, { y: 30, autoAlpha: 0, rotateX: -8, transformPerspective: 1200 }, { y: 0, autoAlpha: 1, rotateX: 0, duration: 0.8, ease: 'expo.out' });
    }
    first.current = false;
    const onResize = () => {
      if (pill && el) gsap.set(pill, { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active]);

  const tab = TABS.find((t) => t.key === active)!;
  const select = (k: LeadType) => navigate(`/contact?form=${k}`, { replace: true });

  return (
    <div ref={ref}>
      <PageHero
        kicker="Contact and early access"
        title="Join early, or just say hello."
        lede={<p>Choose the form that fits. Each one asks only for what we need to reply properly.</p>}
        tiles={[
          { icon: 'bell', label: 'Early access' },
          { icon: 'house', label: 'Hosting' },
          { icon: 'handshake', label: 'Partners' },
          { icon: 'mail', label: 'Questions' },
        ]}
      />
      <section className="section" aria-labelledby="contact-title">
        <div className="container contact-layout">
          <div className="contact-main">
            <h2 id="contact-title" className="sr-only">
              Contact forms
            </h2>
            <div className="tabs contact-tabs" role="tablist" aria-label="Choose a form" ref={tabs}>
              <span className="tab-pill" aria-hidden="true" />
              {TABS.map((t, i) => (
                <button
                  key={t.key}
                  id={`ctab-${t.key}`}
                  type="button"
                  role="tab"
                  className="tab"
                  aria-selected={active === t.key}
                  aria-controls="contact-panel"
                  tabIndex={active === t.key ? 0 : -1}
                  onClick={() => select(t.key)}
                  onKeyDown={(e) => {
                    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                    if (!dir) return;
                    const next = TABS[(i + dir + TABS.length) % TABS.length].key;
                    select(next);
                    requestAnimationFrame(() => document.getElementById(`ctab-${next}`)?.focus());
                  }}
                >
                  <Icon name={t.icon} /> {t.label}
                </button>
              ))}
            </div>
            <div className="panel form-panel" id="contact-panel" role="tabpanel" aria-labelledby={`ctab-${active}`} ref={panel}>
              <h3 className="h3">{tab.label}</h3>
              <p className="muted">{tab.blurb}</p>
              <LeadForm key={active} type={active} />
            </div>
          </div>
          <aside className="contact-side" data-stagger>
            <div className="panel side-card">
              <h3 className="h3">What happens next</h3>
              <ol className="next-steps">
                <li>We read your message and note your city and vehicle.</li>
                <li>We contact you only about what you asked for.</li>
                <li>When testing or onboarding opens near you, you hear first.</li>
              </ol>
            </div>
            <div className="panel side-card">
              <h3 className="h3">Other ways to reach us</h3>
              {site.contactEmail ? (
                <p>
                  <a className="text-link" href={`mailto:${site.contactEmail}`}>
                    <Icon name="mail" /> {site.contactEmail}
                  </a>
                </p>
              ) : (
                <p className="muted small">A public email address will be added here soon. For now, the forms are the best way to reach the team.</p>
              )}
              <p className="muted small">We are a small team based in {site.region}. Replies may take a few days.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
