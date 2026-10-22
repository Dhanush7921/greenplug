import { useRef } from 'react';
import { ButtonLink } from '../components/Button';
import { Icon, type IconName } from '../components/Icon';
import { CtaBand, PageHero } from '../components/PageHero';
import { site } from '../config/site';
import { useReveals } from '../lib/reveal';

const PRINCIPLES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'user-check', title: 'Hosts are checked before listing', text: 'We plan identity checks, site photos and a safety checklist for every private host. A host appears in the app only after that review.' },
  { icon: 'badge-check', title: 'Honest information only', text: 'No invented stations, ratings or reviews. Anything illustrative on this website is labelled as a sample.' },
  { icon: 'indian-rupee', title: 'Prices before you plug in', text: 'Stations and hosts set their prices. The app is designed to show them, and any fee from us, before you commit.' },
  { icon: 'eye-off', title: 'Privacy by default', text: 'A home host’s exact address is planned to be shared only with a confirmed driver, not shown to everyone on the map.' },
  { icon: 'flag', title: 'Reports get action', text: 'Unsafe or broken chargers can be reported in a few taps. Listings with safety doubts are paused while we check.' },
  { icon: 'shield-check', title: 'Electrical safety first', text: 'We will never encourage improvised wiring, extension cords or overloaded sockets — for drivers or hosts.' },
];

const DRIVER_SAFE = ['Inspect plugs and cables before every charge', 'Do not charge from damaged or wet sockets', 'Follow the host’s parking and access instructions', 'Stay reachable while your vehicle is charging'];
const HOST_SAFE = ['Use a dedicated, protected circuit', 'Keep the charging area dry, lit and clear', 'Switch off and report anything that smells, sparks or overheats', 'Pause your listing whenever you are unsure'];

export default function Safety() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  return (
    <div ref={ref}>
      <PageHero
        kicker="Safety and trust"
        title="Trust has to come before the first plug-in."
        lede={<p>Sharing a charger means letting a stranger park at your home or shop, and trusting a stranger’s socket with your vehicle. These are the principles we are building around.</p>}
        tiles={[
          { icon: 'user-check', label: 'Checked hosts' },
          { icon: 'lock', label: 'Private address' },
          { icon: 'shield-check', label: 'Safe wiring' },
          { icon: 'flag', label: 'Quick reports' },
        ]}
      />

      <section className="section" aria-labelledby="principles-title">
        <div className="container">
          <div className="section-head">
            <h2 id="principles-title" className="h2" data-split="stretch">
              Six principles
            </h2>
          </div>
          <div className="principles" data-stagger>
            {PRINCIPLES.map((p) => (
              <article key={p.title} className="principle">
                <span className="principle-icon">
                  <Icon name={p.icon} />
                </span>
                <h3 className="h3">{p.title}</h3>
                <p className="muted">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section band" aria-labelledby="habits-title">
        <div className="container">
          <div className="section-head">
            <h2 id="habits-title" className="h2" data-split="stretch">
              Safe habits on both sides
            </h2>
          </div>
          <div className="habits">
            <div className="panel habit gloss" data-reveal="left" data-tilt="4">
              <h3 className="h3">
                <Icon name="car" /> Drivers and riders
              </h3>
              <ul className="checklist">
                {DRIVER_SAFE.map((c) => (
                  <li key={c}>
                    <Icon name="check" /> {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="panel habit gloss" data-reveal="right" data-tilt="4">
              <h3 className="h3">
                <Icon name="house" /> Hosts
              </h3>
              <ul className="checklist">
                {HOST_SAFE.map((c) => (
                  <li key={c}>
                    <Icon name="check" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="notice emergency" data-reveal>
            <Icon name="triangle-alert" />
            <span>
              <strong>In an electrical emergency</strong>
              Keep people away, switch off the supply only if it is safe to do so, and call the national emergency number 112.
            </span>
          </div>
        </div>
      </section>

      <section className="section" id="privacy" aria-labelledby="privacy-title">
        <div className="container split-2">
          <div>
            <h2 id="privacy-title" className="h2" data-split="stretch">
              How we handle your data
            </h2>
            <p className="lede">Plain answers about this website’s forms. A full privacy policy will be published before the app launches.</p>
          </div>
          <dl className="facts" data-stagger>
            <div>
              <dt>What we collect</dt>
              <dd>Only what you type into a form: usually your name, contact details, city and your answers.</dd>
            </div>
            <div>
              <dt>Why</dt>
              <dd>To reply to you and to plan early access, hosting and partnerships. Nothing else.</dd>
            </div>
            <div>
              <dt>Where it goes</dt>
              <dd>When the form service is switched on, submissions are stored in a private Google Sheet run by the {site.name} team. When it is off, the forms run in a labelled demo mode and nothing leaves your browser.</dd>
            </div>
            <div>
              <dt>What we never do</dt>
              <dd>Sell your details or add you to unrelated marketing lists.</dd>
            </div>
            <div>
              <dt>Your choice</dt>
              <dd>Ask us to correct or delete your details at any time through the contact page.</dd>
            </div>
          </dl>
        </div>
      </section>

      <CtaBand title="Have a safety question?" text="If something here is unclear, or you want to suggest a safeguard, we want to hear it.">
        <ButtonLink to="/contact?form=general" icon="message-circle">
          Ask a question
        </ButtonLink>
      </CtaBand>
    </div>
  );
}
