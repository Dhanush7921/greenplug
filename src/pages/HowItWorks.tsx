import { useRef } from 'react';
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { CtaBand, PageHero } from '../components/PageHero';
import { site } from '../config/site';
import { useReveals } from '../lib/reveal';

const STEPS: { icon: IconName; title: string; text: string; points: string[] }[] = [
  {
    icon: 'motorbike',
    title: 'Tell the app what you ride',
    text: 'Add your car or two-wheeler once. The model and connector you choose decide which chargers you see.',
    points: ['Car, bike or scooter', 'Connector and charging cable you carry', 'Optional range preferences'],
  },
  {
    icon: 'search',
    title: 'Search nearby or along a road',
    text: 'Browse public charging stations and participating private hosts on one map, nearest first.',
    points: ['Distance and directions', 'Filters for power and access', 'Public and private options side by side'],
  },
  {
    icon: 'clipboard-check',
    title: 'Check the details before you go',
    text: 'Each listing is planned to show connector, power, opening hours, access notes and the price set by the operator or host.',
    points: ['Compatibility shown against your vehicle', 'Host rules and parking notes', 'Availability where it is shared'],
  },
  {
    icon: 'plug-zap',
    title: 'Arrive and charge',
    text: 'Follow the access notes. For private hosts we plan to add slot requests, so both sides agree on time and price first.',
    points: ['Directions to the exact spot', 'Host contact through the app (planned)', 'Slot requests (planned later)'],
  },
  {
    icon: 'flag',
    title: 'Confirm it worked, or flag a problem',
    text: 'A quick confirmation keeps information fresh. Reports of broken or unsafe chargers go straight to our team.',
    points: ['One-tap confirmation', 'Problem reports with photos', 'Listings paused when safety is in doubt'],
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  return (
    <div ref={ref}>
      <PageHero
        kicker="How it works"
        title="From low battery to plugged in."
        lede={<p>Five steps, designed around the questions riders ask before every charge: will it fit, is it open, and is it worth the detour?</p>}
        actions={<ButtonLink to="/contact?form=driver" icon="bell">Get early access</ButtonLink>}
        tiles={[
          { icon: 'motorbike', label: 'Your vehicle' },
          { icon: 'map-pin', label: 'Nearby options' },
          { icon: 'plug', label: 'Compatible' },
          { icon: 'circle-check', label: 'Charged' },
        ]}
      />

      <section className="section" aria-labelledby="steps-title">
        <div className="container">
          <div className="section-head">
            <h2 id="steps-title" className="h2" data-split="stretch">
              The journey, step by step
            </h2>
            <p className="lede">This is how the first version of the app is planned to work. We will refine it with early testers before launch.</p>
          </div>
          <div className="timeline" data-draw-trigger>
            <svg className="timeline-line" viewBox="0 0 4 1000" preserveAspectRatio="none" aria-hidden="true">
              <line x1="2" y1="0" x2="2" y2="1000" className="timeline-track" />
              <line x1="2" y1="0" x2="2" y2="1000" className="timeline-flow" data-draw />
            </svg>
            <ol className="timeline-list">
            {STEPS.map((s, i) => (
              <li className="t-step" key={s.title} data-reveal>
                <span className="t-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="t-card panel gloss" data-tilt="3">
                  <div className="t-head">
                    <span className="t-icon">
                      <Icon name={s.icon} />
                    </span>
                    <h3 className="h3">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </h3>
                  </div>
                  <p>{s.text}</p>
                  <ul className="t-points">
                    {s.points.map((p) => (
                      <li key={p}>
                        <Icon name="check" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="scope-title">
        <div className="container">
          <div className="section-head">
            <h2 id="scope-title" className="h2" data-split="stretch">
              What comes first, and what comes later
            </h2>
            <p className="lede">We would rather launch something small that works than promise everything at once. Plans may change as we learn.</p>
          </div>
          <div className="scope" data-stagger>
            <div className="scope-col panel">
              <h3 className="h3">
                <Icon name="zap" /> Planned for launch
              </h3>
              <ul>
                <li>Map of public stations and checked private hosts</li>
                <li>Vehicle profile and connector filters</li>
                <li>Hours, access notes and prices from the source</li>
                <li>Problem reporting and listing confirmations</li>
              </ul>
            </div>
            <div className="scope-col panel">
              <h3 className="h3">
                <Icon name="hourglass" /> Planned later
              </h3>
              <ul>
                <li>Slot requests with private hosts</li>
                <li>Trip planning with charging stops</li>
                <li>Live availability from partner operators</li>
                <li>In-app payments, if they make charging simpler</li>
              </ul>
            </div>
            <div className="scope-col panel scope-not">
              <h3 className="h3">
                <Icon name="ban" /> What {site.name} will not do
              </h3>
              <ul>
                <li>Sell electricity or act as a power supplier</li>
                <li>List a host before our checks are complete</li>
                <li>Invent stations, reviews or ratings</li>
                <li>Encourage improvised or unsafe wiring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Help shape the first version" text="Early testers in Andhra Pradesh will decide what we build first. Tell us how you charge today.">
        <ButtonLink to="/contact?form=driver" icon="bell">
          Join as a driver
        </ButtonLink>
        <ButtonLink to="/contact?form=host" variant="ghost" icon="house">
          Join as a host
        </ButtonLink>
      </CtaBand>
    </div>
  );
}
