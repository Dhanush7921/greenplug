import { useMemo, useRef, useState } from 'react';
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { LeadForm } from '../components/LeadForm';
import { PageHero } from '../components/PageHero';
import { useReveals } from '../lib/reveal';

const PLACES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'house', title: 'Independent homes', text: 'A driveway or gate-side spot with a suitable socket or charger.' },
  { icon: 'building', title: 'Apartments and gated communities', text: 'Shared parking, with the residents’ association on board.' },
  { icon: 'store', title: 'Shops and showrooms', text: 'Riders charge while they browse or wait.' },
  { icon: 'coffee', title: 'Cafés and restaurants', text: 'A natural stop for a 30 to 60 minute top-up.' },
  { icon: 'hotel', title: 'Hotels and homestays', text: 'Overnight charging for guests and travellers.' },
  { icon: 'factory', title: 'Offices and campuses', text: 'Daytime charging for staff and visitors.' },
];

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: 'send', title: 'Register your interest', text: 'Tell us about your place, your parking and your current setup. No commitment.' },
  { icon: 'clipboard-check', title: 'Site and safety check', text: 'We plan to review photos, wiring details and your permissions before anything is listed.' },
  { icon: 'calendar-clock', title: 'Set hours, vehicles and price', text: 'You decide when you are available, whether you host cars, bikes or both, and what you charge.' },
  { icon: 'handshake', title: 'Welcome riders', text: 'Drivers see your access notes in the app. You can pause your listing whenever you need to.' },
];

const SAFE: string[] = [
  'A dedicated circuit installed or checked by a licensed electrician',
  'Proper earthing and residual-current (RCD/RCBO) protection',
  'A socket or charger rated for continuous charging loads',
  'Cable routes that do not cross walkways or sit in water',
  'Permission from your housing society or landlord where needed',
  'Electricity connection and billing that follow your DISCOM’s rules',
];

function Estimator() {
  const [price, setPrice] = useState(12);
  const [cost, setCost] = useState(7);
  const [sessions, setSessions] = useState(6);
  const [kwh, setKwh] = useState(3);
  const weekly = useMemo(() => Math.max(0, sessions * kwh * (price - cost)), [price, cost, sessions, kwh]);
  const field = (label: string, id: string, value: number, set: (n: number) => void, min: number, max: number, step: number, unit: string) => (
    <div className="est-field">
      <label htmlFor={id}>
        {label} <output htmlFor={id}>{unit === '₹' ? `₹${value}` : `${value} ${unit}`}</output>
      </label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} />
    </div>
  );
  return (
    <div className="estimator panel gloss" data-reveal="scale">
      <div className="est-inputs">
        {field('Price you would charge per kWh', 'est-price', price, setPrice, 5, 30, 1, '₹')}
        {field('Your electricity cost per kWh', 'est-cost', cost, setCost, 2, 15, 0.5, '₹')}
        {field('Charging sessions per week', 'est-sessions', sessions, setSessions, 0, 40, 1, 'sessions')}
        {field('Energy per session', 'est-kwh', kwh, setKwh, 1, 30, 1, 'kWh')}
      </div>
      <div className="est-out" aria-live="polite">
        <span className="small">Difference between price and cost, per week</span>
        <strong>₹{weekly.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
        <p className="small">
          This only multiplies the example numbers you set. It is not a forecast or a promise of earnings. Tariffs, taxes, platform fees and local rules may apply — the starting values are placeholders, not typical figures.
        </p>
      </div>
    </div>
  );
}

export default function Hosts() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  return (
    <div ref={ref}>
      <PageHero
        kicker="For charging hosts"
        title="Your parking spot could keep a neighbour moving."
        lede={<p>If you have a charger or a suitable dedicated socket where vehicles can park, you could help riders nearby — on your own schedule, at your own price, once your setup passes our checks.</p>}
        actions={
          <>
            <ButtonLink to="/hosts#host-form" icon="house">
              Register host interest
            </ButtonLink>
            <ButtonLink to="/safety" variant="ghost">
              Our safety principles
            </ButtonLink>
          </>
        }
        tiles={[
          { icon: 'house', label: 'Your place' },
          { icon: 'plug-zap', label: 'Safe setup' },
          { icon: 'calendar-clock', label: 'Your hours' },
          { icon: 'wallet', label: 'Your price' },
        ]}
      />

      <section className="section" aria-labelledby="who-title">
        <div className="container">
          <div className="section-head">
            <h2 id="who-title" className="h2" data-split="stretch">
              Who could host
            </h2>
            <p className="lede">Two-wheelers especially can charge from a suitable socket, which means many everyday places can help — if they are set up safely.</p>
          </div>
          <div className="places" data-stagger>
            {PLACES.map((p) => (
              <div key={p.title} className="place">
                <span className="place-icon">
                  <Icon name={p.icon} />
                </span>
                <div>
                  <h3 className="h3">{p.title}</h3>
                  <p className="muted small">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" aria-labelledby="hsteps-title">
        <div className="container">
          <div className="section-head">
            <h2 id="hsteps-title" className="h2" data-split="stretch">
              How hosting is planned to work
            </h2>
          </div>
          <ol className="hsteps" data-stagger>
            {STEPS.map((s, i) => (
              <li key={s.title} className="hstep panel gloss" data-tilt="5">
                <span className="hstep-num">{i + 1}</span>
                <Icon name={s.icon} />
                <h3 className="h3">{s.title}</h3>
                <p className="muted small">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="est-title">
        <div className="container">
          <div className="section-head">
            <h2 id="est-title" className="h2" data-split="stretch">
              Think it through with your own numbers
            </h2>
            <p className="lede">A simple calculator to explore the basics. Change any value — nothing here is a forecast.</p>
          </div>
          <Estimator />
        </div>
      </section>

      <section className="section" aria-labelledby="safe-title">
        <div className="container split-2">
          <div>
            <h2 id="safe-title" className="h2" data-split="stretch">
              What a safe host setup looks like
            </h2>
            <p className="lede">We will publish detailed onboarding guidance before hosting opens. This list is an overview, not electrical or legal advice.</p>
          </div>
          <ul className="checklist" data-stagger>
            {SAFE.map((c) => (
              <li key={c}>
                <Icon name="shield-check" /> {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="host-form" aria-labelledby="hform-title">
        <div className="container form-layout">
          <div>
            <h2 id="hform-title" className="h2" data-split="stretch">
              Register host interest
            </h2>
            <p className="lede">No commitment and no listing yet. We will contact you when host onboarding opens near you.</p>
          </div>
          <div className="panel form-panel">
            <LeadForm type="host" />
          </div>
        </div>
      </section>
    </div>
  );
}
