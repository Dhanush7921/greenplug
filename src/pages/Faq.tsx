import { useMemo, useRef, useState } from 'react';
import { Accordion, type AccItem } from '../components/Accordion';
import { ButtonLink } from '../components/Button';
import { Icon } from '../components/Icon';
import { CtaBand, PageHero } from '../components/PageHero';
import { site } from '../config/site';
import { Link } from '../lib/router';
import { useReveals } from '../lib/reveal';

type Cat = 'About' | 'Drivers' | 'Hosts' | 'Safety and data';
type Q = { cat: Cat; q: string; a: string; link?: { to: string; label: string } };

const QUESTIONS: Q[] = [
  { cat: 'About', q: `What is ${site.name}?`, a: `${site.name} is a working name for a planned app that helps electric car and two-wheeler riders find charging that suits their vehicle, from public stations to private hosts who share a charger or suitable socket.` },
  { cat: 'About', q: 'Is the app available now?', a: 'No. The app is being designed and built. This website explains what we are planning and lets you join early access.', link: { to: '/contact?form=driver', label: 'Join early access' } },
  { cat: 'About', q: 'Where will it work first?', a: 'We are starting in Andhra Pradesh. The exact launch cities will depend on where riders and hosts sign up.' },
  { cat: 'About', q: 'Are the stations and hosts on this website real?', a: 'No. Every map, listing, price and screen on this website is an illustrative sample. We do not list real hosts or stations yet.' },
  { cat: 'Drivers', q: 'Will it support electric scooters and bikes?', a: 'Yes. Two-wheelers are central to the plan, including riders who charge with a portable charger on a suitable socket.' },
  { cat: 'Drivers', q: 'How will I know a charger fits my vehicle?', a: 'You add your vehicle and connector once. The app is designed to show compatibility for each listing and hide options that will not work for you.', link: { to: '/drivers', label: 'Read about compatibility' } },
  { cat: 'Drivers', q: 'How much will charging cost?', a: 'Stations and hosts will set their own prices. Our own pricing model is not final; any fee from us will be shown clearly before you commit.' },
  { cat: 'Drivers', q: 'Can I book a charger in advance?', a: 'Slot requests with private hosts are planned for a later version. At launch the focus is on finding and checking chargers.' },
  { cat: 'Hosts', q: 'Who can become a charging host?', a: 'Homes, apartments with association approval, shops, cafés, hotels and offices with a charger or a suitable dedicated socket — once the setup passes our checks.', link: { to: '/hosts', label: 'Learn about hosting' } },
  { cat: 'Hosts', q: 'Do I need to buy a charger?', a: 'Not always. Many two-wheelers charge from a suitable dedicated socket. Cars generally need a proper charger. We will publish guidance before onboarding opens.' },
  { cat: 'Hosts', q: 'Who decides my price and hours?', a: 'You do. Hosts will choose their availability, which vehicles they serve and what they charge, and can pause their listing any time.' },
  { cat: 'Hosts', q: 'Are there electricity rules I should know about?', a: 'Possibly. How you bill for electricity can depend on your connection type and your DISCOM’s rules in Andhra Pradesh. We will share guidance, but please check with your DISCOM or a qualified professional.' },
  { cat: 'Safety and data', q: 'How will hosts be checked?', a: 'We plan identity checks, site photos and a safety checklist before any private host is listed, and we will pause listings when safety is in doubt.', link: { to: '/safety', label: 'Our safety principles' } },
  { cat: 'Safety and data', q: 'Will my home address be public if I host?', a: 'That is not the plan. Exact addresses of home hosts are planned to be shared only with a confirmed driver.' },
  { cat: 'Safety and data', q: 'What happens to the details I send through this website?', a: 'They are used only to reply and plan early access. If the form service is not switched on, forms run in a demo mode and nothing is sent.', link: { to: '/safety#privacy', label: 'How we handle data' } },
];

const CATS: ('All' | Cat)[] = ['All', 'About', 'Drivers', 'Hosts', 'Safety and data'];

export default function Faq() {
  const ref = useRef<HTMLDivElement>(null);
  useReveals(ref);
  const [cat, setCat] = useState<'All' | Cat>('All');
  const [query, setQuery] = useState('');
  const items: AccItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QUESTIONS.filter((x) => (cat === 'All' || x.cat === cat) && (!q || `${x.q} ${x.a}`.toLowerCase().includes(q))).map((x) => ({
      q: x.q,
      a: (
        <>
          <p>{x.a}</p>
          {x.link && (
            <Link to={x.link.to} className="text-link">
              {x.link.label} <Icon name="arrow-up-right" />
            </Link>
          )}
        </>
      ),
    }));
  }, [cat, query]);

  return (
    <div ref={ref}>
      <PageHero
        kicker="FAQ"
        title="Straight answers, including the ones we are still working out."
        lede={<p>If your question is not here, ask us. Useful questions often become features.</p>}
        tiles={[
          { icon: 'circle-alert', label: 'Is it live?' },
          { icon: 'plug', label: 'Will it fit?' },
          { icon: 'indian-rupee', label: 'What will it cost?' },
          { icon: 'shield-check', label: 'Is it safe?' },
        ]}
      />
      <section className="section" aria-labelledby="faq-title">
        <div className="container narrow">
          <h2 id="faq-title" className="sr-only">
            Questions
          </h2>
          <div className="faq-tools">
            <label className="faq-search">
              <Icon name="search" />
              <span className="sr-only">Search questions</span>
              <input type="search" className="input" placeholder="Search questions" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            <div className="choice-group" role="group" aria-label="Filter by topic">
              {CATS.map((c) => (
                <label className="choice" key={c}>
                  <input type="radio" name="faq-cat" checked={cat === c} onChange={() => setCat(c)} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="small muted" aria-live="polite" style={{ margin: '18px 0' }}>
            {items.length} {items.length === 1 ? 'question' : 'questions'}
          </p>
          {items.length ? (
            <Accordion key={`${cat}-${query}`} items={items} />
          ) : (
            <div className="notice">
              <Icon name="search" />
              <span>
                <strong>No questions match “{query}”.</strong> Try a shorter word, choose another topic, or <Link to="/contact?form=general">ask us directly</Link>.
              </span>
            </div>
          )}
        </div>
      </section>
      <CtaBand title="Still wondering about something?" text="Send your question. We read every message, though replies may take a few days while the team is small.">
        <ButtonLink to="/contact?form=general" icon="message-circle">
          Ask a question
        </ButtonLink>
      </CtaBand>
    </div>
  );
}
