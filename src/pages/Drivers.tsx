import { useLayoutEffect, useRef, useState } from 'react';
import { Accordion } from '../components/Accordion';
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { CtaBand, PageHero } from '../components/PageHero';
import { gsap } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/prefs';
import { useReveals } from '../lib/reveal';

type Conn = { name: string; where: string; note: string; tag: string };
const VEHICLES: Record<'car' | 'bike', { label: string; icon: IconName; intro: string; connectors: Conn[] }> = {
  car: {
    label: 'Electric car',
    icon: 'car',
    intro: 'Most newer electric cars sold in India charge on Type 2 for AC and CCS2 for DC fast charging. Some older fleet models use the Bharat standards.',
    connectors: [
      { name: 'Type 2 (AC)', where: 'Homes, offices, hotels, destination chargers', note: 'Slower, steady charging while you park for a while.', tag: 'Common' },
      { name: 'CCS2 (DC fast)', where: 'Public fast-charging stations, highways', note: 'Much faster top-ups on longer drives, where your car supports it.', tag: 'Common' },
      { name: 'Bharat AC-001 / DC-001', where: 'Some older public and fleet chargers', note: 'Low-power standards used by certain earlier fleet models.', tag: 'Older models' },
      { name: 'Portable charger on a socket', where: 'Homes and hosts with a suitable dedicated socket', note: 'Slowest option, useful overnight or as a backup.', tag: 'Backup' },
    ],
  },
  bike: {
    label: 'Bike or scooter',
    icon: 'motorbike',
    intro: 'Many electric two-wheelers charge from a portable charger plugged into a suitable socket. Some brands also use their own fast-charging connectors.',
    connectors: [
      { name: 'Portable charger on a 15A socket', where: 'Homes, shops, cafés, apartment parking', note: 'The most flexible option — which is why private hosts matter so much for riders.', tag: 'Most common' },
      { name: 'Brand-specific fast chargers', where: 'Brand and partner charging points', note: 'Faster, but only for compatible models. The app will label these clearly.', tag: 'Model specific' },
      { name: 'Light-EV DC connectors', where: 'Some newer public charging points', note: 'Supported by certain newer two-wheelers; check your manual.', tag: 'Newer models' },
      { name: 'Battery swapping', where: 'Swap stations run by some brands', note: 'Outside our launch scope, but we may show them later.', tag: 'Later' },
    ],
  },
};

const BENEFITS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'scan-line', title: 'Only what fits', text: 'Your vehicle profile hides chargers you cannot use, so the map is shorter and more useful.' },
  { icon: 'clock', title: 'Hours and access up front', text: 'Gated parking, shop hours, a host who needs a call first — you see it before you drive there.' },
  { icon: 'indian-rupee', title: 'Prices from the source', text: 'Stations and hosts set their own prices. We plan to show them clearly, without surprises at the plug.' },
  { icon: 'users', title: 'More places to charge', text: 'Participating homes, shops and cafés fill the gaps between public stations, especially for two-wheelers.' },
];

const CHECKLIST = [
  'Confirm the connector and power rating match your vehicle',
  'Carry your own charging cable or portable charger if needed',
  'Read the host’s access notes and parking rules',
  'Never use a damaged socket, cable or plug',
  'Avoid extension cords and multi-plug adapters',
  'Report anything unsafe in the app straight away',
];

function VehicleTabs() {
  const [v, setV] = useState<'car' | 'bike'>('car');
  const panel = useRef<HTMLDivElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    const pill = tabs.current?.querySelector<HTMLElement>('.tab-pill');
    const active = tabs.current?.querySelector<HTMLElement>('.tab[aria-selected="true"]');
    if (pill && active) {
      const vars = { x: active.offsetLeft, y: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight };
      if (first.current || prefersReducedMotion()) gsap.set(pill, vars);
      else gsap.to(pill, { ...vars, duration: 0.6, ease: 'expo.out' });
    }
    if (!first.current && !prefersReducedMotion() && panel.current) {
      gsap.fromTo(panel.current.querySelectorAll('.conn'), { y: 30, autoAlpha: 0, rotateX: -15 }, { y: 0, autoAlpha: 1, rotateX: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out' });
    }
    first.current = false;
  }, [v]);
  const data = VEHICLES[v];
  return (
    <div className="vehicle-tabs">
      <div className="tabs" role="tablist" aria-label="Vehicle type" ref={tabs}>
        <span className="tab-pill" aria-hidden="true" />
        {(['car', 'bike'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            className="tab"
            id={`tab-${k}`}
            aria-selected={v === k}
            aria-controls="vehicle-panel"
            tabIndex={v === k ? 0 : -1}
            onClick={() => setV(k)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                const next = k === 'car' ? 'bike' : 'car';
                setV(next);
                (e.currentTarget.parentElement?.querySelector(`#tab-${next}`) as HTMLElement | null)?.focus();
              }
            }}
          >
            <Icon name={VEHICLES[k].icon} /> {VEHICLES[k].label}
          </button>
        ))}
      </div>
      <div id="vehicle-panel" role="tabpanel" aria-labelledby={`tab-${v}`} ref={panel} className="vehicle-panel">
        <p className="lede">{data.intro}</p>
        <div className="conn-grid">
          {data.connectors.map((c) => (
            <article key={c.name} className="conn panel gloss" data-tilt="5">
              <div className="conn-top">
                <span className="conn-icon">
                  <Icon name="plug" />
                </span>
                <span className="badge">{c.tag}</span>
              </div>
              <h3 className="h3">{c.name}</h3>
              <p className="small muted">
                <strong>Where you find it:</strong> {c.where}
              </p>
              <p className="small">{c.note}</p>
            </article>
          ))}
        </div>
        <p className="small muted">Always follow your vehicle manufacturer’s charging guidance. Connector support varies by model and year.</p>
      </div>
    </div>
  );
}

export default function Drivers() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  return (
    <div ref={ref}>
      <PageHero
        kicker="For drivers and riders"
        title="Charging that fits what you ride."
        lede={<p>Whether you drive an electric car or ride an electric scooter, the app is being designed to show you only the chargers you can actually use — and everything you need to know before you get there.</p>}
        actions={
          <>
            <ButtonLink to="/contact?form=driver" icon="bell">
              Get early access
            </ButtonLink>
            <ButtonLink to="/how-it-works" variant="ghost">
              See how it works
            </ButtonLink>
          </>
        }
        tiles={[
          { icon: 'car', label: 'Car profile' },
          { icon: 'motorbike', label: 'Scooter profile' },
          { icon: 'plug', label: 'Type 2 or socket' },
          { icon: 'navigation', label: 'Directions' },
        ]}
      />

      <section className="section" aria-labelledby="benefits-title">
        <div className="container">
          <div className="section-head">
            <h2 id="benefits-title" className="h2" data-split="stretch">
              Fewer detours, fewer surprises
            </h2>
          </div>
          <div className="benefits" data-stagger>
            {BENEFITS.map((b) => (
              <div key={b.title} className="benefit">
                <Icon name={b.icon} />
                <h3 className="h3">{b.title}</h3>
                <p className="muted">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" aria-labelledby="compat-title">
        <div className="container">
          <div className="section-head">
            <h2 id="compat-title" className="h2" data-split="stretch">
              Understand compatibility
            </h2>
            <p className="lede">Connectors are the most common reason a charging trip fails. Here is the landscape the app will help you navigate.</p>
          </div>
          <VehicleTabs />
        </div>
      </section>

      <section className="section" aria-labelledby="check-title">
        <div className="container split-2">
          <div>
            <h2 id="check-title" className="h2" data-split="stretch">
              Before you plug in
            </h2>
            <p className="lede">Good habits that keep you, your vehicle and your host safe — wherever you charge.</p>
          </div>
          <ul className="checklist" data-stagger>
            {CHECKLIST.map((c) => (
              <li key={c}>
                <Icon name="circle-check" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="dfaq-title">
        <div className="container narrow">
          <h2 id="dfaq-title" className="h2" data-split="lines" style={{ marginBottom: 28 }}>
            Driver questions
          </h2>
          <Accordion
            items={[
              { q: 'When can I use the app?', a: <p>It is still being designed and built. Join early access and we will tell you when testing opens in your city. We have not set a public launch date yet.</p> },
              { q: 'Will it work for electric scooters and bikes?', a: <p>Yes. Two-wheelers are a core part of the plan, including riders who charge with a portable charger on a suitable socket.</p> },
              { q: 'Will charging through the app cost extra?', a: <p>Our pricing model is not final. Stations and hosts will set their own charging prices, and we will show any fee from us clearly before you commit.</p> },
            ]}
          />
        </div>
      </section>

      <CtaBand title="Tell us how you charge today" text="Your answers decide which cities, connectors and features we focus on first.">
        <ButtonLink to="/contact?form=driver" icon="bell">
          Join driver early access
        </ButtonLink>
      </CtaBand>
    </div>
  );
}
