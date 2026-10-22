import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { navItems } from '../config/site';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { prefersReducedMotion } from '../lib/prefs';
import { Link, useLocation } from '../lib/router';
import { ButtonLink } from './Button';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

const menuNotes: Record<string, string> = {
  '/how-it-works': 'Five steps',
  '/drivers': 'Cars and bikes',
  '/hosts': 'Share a charger',
  '/safety': 'Principles',
  '/faq': 'Answers',
  '/contact': 'Early access',
};

export function Nav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLLIElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const wasOpen = useRef(false);

  const movePill = useCallback((el: HTMLElement | null, instant = false) => {
    const pill = pillRef.current;
    if (!pill) return;
    if (!el) {
      gsap.to(pill, { opacity: 0, duration: 0.3 });
      return;
    }
    const vars = { x: el.offsetLeft, width: el.offsetWidth, opacity: 1 };
    if (instant || prefersReducedMotion()) gsap.set(pill, vars);
    else gsap.to(pill, { ...vars, duration: 0.55, ease: 'expo.out' });
  }, []);

  const activeLink = useCallback(() => listRef.current?.querySelector<HTMLElement>('a[aria-current="page"]') ?? null, []);

  useLayoutEffect(() => {
    movePill(activeLink(), true);
    const onResize = () => movePill(activeLink(), true);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pathname, movePill, activeLink]);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    gsap.set(nav, { yPercent: 0 });
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const hide = self.direction === 1 && self.scroll() > 240;
        gsap.to(nav, { yPercent: hide ? -140 : 0, duration: 0.5, ease: 'power3.out', overwrite: true });
      },
    });
    return () => st.kill();
  }, [pathname]);

  // Mobile menu: circular reveal from the menu button, links rise in.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const links = menu.querySelectorAll('li, .menu-foot');
    const tl = gsap.timeline({ paused: true });
    tl.set(menu, { visibility: 'visible' })
      .fromTo(menu, { clipPath: 'circle(0px at calc(100% - 46px) 42px)' }, { clipPath: 'circle(160% at calc(100% - 46px) 42px)', duration: 0.75, ease: 'power3.inOut' })
      .fromTo(links, { y: 60, autoAlpha: 0, skewY: 5 }, { y: 0, autoAlpha: 1, skewY: 0, duration: 0.7, stagger: 0.05, ease: 'expo.out' }, '-=0.4');
    tlRef.current = tl;
    return () => {
      tl.kill();
    };
  }, []);

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    const html = document.documentElement;
    if (open) {
      wasOpen.current = true;
      if (prefersReducedMotion()) tl.progress(1);
      else tl.timeScale(1).play();
      html.style.overflow = 'hidden';
      requestAnimationFrame(() => menuRef.current?.querySelector('a')?.focus());
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    if (!wasOpen.current) return; // never opened: keep the timeline paused at the start
    wasOpen.current = false;
    if (prefersReducedMotion()) tl.progress(0);
    else tl.timeScale(1.6).reverse();
    html.style.overflow = '';
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header className="nav" ref={navRef}>
        <nav className="nav-inner" aria-label="Main">
          <Logo />
          <ul className="nav-links" ref={listRef} onMouseLeave={() => movePill(activeLink())}>
            <li className="nav-pill" ref={pillRef} aria-hidden="true" />
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} aria-current={pathname === item.to ? 'page' : undefined} onMouseEnter={(e) => movePill(e.currentTarget)} onFocus={(e) => movePill(e.currentTarget)}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="nav-actions">
            <ThemeToggle />
            <ButtonLink to="/contact?form=driver" size="sm" className="nav-cta">
              Get early access
            </ButtonLink>
            <button
              ref={menuBtnRef}
              type="button"
              className="icon-btn menu-btn"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((o) => !o)}
            >
              <Icon name={open ? 'x' : 'menu'} />
            </button>
          </div>
        </nav>
      </header>
      <div className="mobile-menu" id="mobile-menu" ref={menuRef} aria-hidden={!open} inert={!open ? true : undefined}>
        <ul>
          <li>
            <Link to="/" onClick={() => setOpen(false)}>
              Home <small>Overview</small>
            </Link>
          </li>
          {navItems.map((item) => (
            <li key={item.to}>
              <Link to={item.to} onClick={() => setOpen(false)} aria-current={pathname === item.to ? 'page' : undefined}>
                {item.label} <small>{menuNotes[item.to]}</small>
              </Link>
            </li>
          ))}
        </ul>
        <div className="menu-foot">
          <ButtonLink to="/contact?form=driver">Get early access</ButtonLink>
          <span>A planned app for Andhra Pradesh. Nothing here is live yet.</span>
        </div>
      </div>
    </>
  );
}
