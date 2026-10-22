// End-to-end checks with Playwright against the production build served under BASE_PATH,
// mimicking GitHub Pages (unknown paths -> 404.html).
// Usage: BASE_PATH=/greenplug-website/ npm run build && BASE_PATH=/greenplug-website/ npm run verify
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root, normalizeBase } from './build.mjs';
import { startPreview } from './preview.mjs';

const require = createRequire(import.meta.url);
let playwright;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) {
  try {
    playwright = require(p);
    break;
  } catch {
    /* try next */
  }
}
if (!playwright) throw new Error('Playwright is required: npm i -D playwright && npx playwright install chromium');

const base = normalizeBase(process.env.BASE_PATH || '/');
const port = 4321;
const origin = `http://localhost:${port}`;
const out = path.join(root, 'test-results');
fs.mkdirSync(out, { recursive: true });
const ROUTES = ['/', '/how-it-works', '/drivers', '/hosts', '/safety', '/faq', '/contact'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};
const url = (p) => `${origin}${base}${p.replace(/^\//, '')}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const server = await startPreview(port);
const browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function newPage(vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], deviceScaleFactor: 1, hasTouch: vp === 'mobile', isMobile: vp === 'mobile', ...opts });
  const page = await ctx.newPage();
  // This container renders WebGL in software (~1 fps). Make GSAP follow wall-clock time so
  // animations reach their end states; real browsers do not need this.
  await page.addInitScript(() => {
    const t = setInterval(() => {
      if (window.__gsap) {
        window.__gsap.ticker.lagSmoothing(0);
        clearInterval(t);
      }
    }, 5);
  });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  return { ctx, page, errors };
}

/** Fast-forward entrance timelines (not scroll-linked ones) so screenshots show end states quickly. */
async function settle(page, ms = 2500) {
  if (await page.locator('.hero-stage').count()) await page.waitForSelector('.hero-stage[data-mode="3d"], .hero-stage[data-mode="fallback"], .hero-stage.is-static', { timeout: 180000 });
  await page.evaluate(() => {
    const g = window.__gsap;
    if (!g) return;
    g.globalTimeline.getChildren(false, true, true).forEach((t) => {
      if (!t.scrollTrigger && !t.paused() && t.repeat() !== -1) t.progress(1);
    });
  });
  await wait(ms);
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  // ---------- every page, both viewports, both themes ----------
  for (const vp of Object.keys(VIEWPORTS)) {
    for (const theme of ['light', 'dark']) {
      const { ctx, page, errors } = await newPage(vp, { colorScheme: theme });
      for (const r of ROUTES) {
        await page.goto(url(r), { waitUntil: 'networkidle' });
        await settle(page, r === '/' ? 3000 : 1500);
        const h1 = await page.locator('h1').first().textContent();
        const t = await page.evaluate(() => document.documentElement.dataset.theme);
        const ox = await overflow(page);
        check(`[${vp}/${theme}] ${r} renders`, h1 && h1.length > 5 && t === theme, `h1="${h1?.trim().slice(0, 40)}", theme=${t}`);
        check(`[${vp}/${theme}] ${r} no horizontal overflow`, ox <= 0, `overflow=${ox}px`);
        const name = `${vp}-${theme}-${r === '/' ? 'home' : r.slice(1)}`;
        await page.screenshot({ path: path.join(out, `${name}.png`) });
        if (r !== '/') {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
          await wait(1500);
          await page.screenshot({ path: path.join(out, `${name}-mid.png`) });
        }
      }
      check(`[${vp}/${theme}] no console errors`, errors.length === 0, errors.slice(0, 4).join(' | '));
      await ctx.close();
    }
  }

  // ---------- home: 3D scene, ribbon, scroll story ----------
  {
    const { ctx, page, errors } = await newPage('desktop');
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await settle(page, 3000);
    const mode = await page.getAttribute('.hero-stage', 'data-mode');
    check('Hero renders genuine WebGL 3D scene', mode === '3d', `mode=${mode}`);
    const canvas = page.locator('.hero-canvas');
    const a = await canvas.screenshot();
    await wait(900);
    const b = await canvas.screenshot();
    check('Energy ribbon / scene animates between frames', Buffer.compare(a, b) !== 0);
    // pointer parallax
    await page.mouse.move(200, 200);
    await wait(300);
    await page.mouse.move(1300, 700, { steps: 8 });
    await wait(900);
    const c = await canvas.screenshot();
    check('Scene responds to pointer', Buffer.compare(b, c) !== 0);
    // anchored chips follow 3D positions
    const chip = await page.locator('.anchor-charger').evaluate((el) => el.style.transform);
    check('HTML chips anchored to 3D positions', /translate3d\(\d/.test(chip), chip);
    // scroll story
    const stageH = await page.evaluate(() => document.querySelector('.hero-stage').offsetHeight);
    for (const [label, f] of [
      ['b', 0.3],
      ['c', 0.6],
      ['d', 0.97],
    ]) {
      await page.evaluate((y) => window.scrollTo(0, y), (stageH - 900) * f);
      await wait(2600);
      await page.screenshot({ path: path.join(out, `story-${label}.png`) });
    }
    const capC = await page.locator('.cap-c').evaluate((el) => getComputedStyle(el).opacity);
    check('Scroll story reaches discovery map caption', parseFloat(capC) > 0.5, `opacity=${capC}`);
    // filter
    await page.locator('.cap-c .tab', { hasText: 'Bike' }).click();
    await wait(1200);
    const hidden = await page.locator('.pin-anchor[data-hidden="true"]').count();
    check('Vehicle filter updates discovery pins', hidden >= 1, `hidden labels=${hidden}`);
    await page.screenshot({ path: path.join(out, 'story-d-bike.png') });
    // services arc + rest of home
    const servicesTop = await page.evaluate(() => document.querySelector('.services').getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y + window.innerHeight * 0.9), servicesTop);
    await wait(2200);
    await page.screenshot({ path: path.join(out, 'home-arc.png') });
    const arcT = await page.locator('.arc-card').nth(2).evaluate((el) => el.style.transform);
    check('Services arc cards positioned in 3D', /rotateY|translate3d|matrix3d/.test(arcT), arcT.slice(0, 80));
    for (const sel of ['.dh', '.app-preview', '.store']) {
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'start' }), sel);
      await page.evaluate(() => window.scrollBy(0, -60));
      await wait(2200);
      await page.screenshot({ path: path.join(out, `home-${sel.slice(1)}.png`) });
    }
    const clip = await page.locator('.store-card').evaluate((el) => getComputedStyle(el).clipPath);
    check('App-store pill morphs into card on scroll', clip.includes('inset'), clip);
    const phoneContent = await page.locator('.phone-screen .ph-screen').count();
    check('App preview resolves skeleton into content', phoneContent === 1);
    check('Home: no console errors during interactions', errors.length === 0, errors.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // ---------- pointer system ----------
  {
    const { ctx, page } = await newPage('desktop');
    await page.goto(url('/how-it-works'), { waitUntil: 'networkidle' });
    await wait(1500);
    await page.mouse.move(300, 300);
    await page.mouse.move(420, 380, { steps: 6 });
    await wait(600);
    const hasCursor = await page.evaluate(() => document.documentElement.classList.contains('has-cursor'));
    const ringT = await page.locator('.cursor-ring').evaluate((el) => el.style.transform);
    const lightT = await page.locator('.cursor-light').evaluate((el) => el.style.transform);
    check('Custom cursor active on desktop', hasCursor);
    check('Cursor ring follows pointer', /translate/.test(ringT) && ringT.includes('4'), ringT);
    check('Mint radial light tracks pointer', /translate/.test(lightT), lightT);
    const btn = page.locator('.page-hero-actions .btn').first();
    const box = await btn.boundingBox();
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2, { steps: 6 });
    await wait(700);
    const mt = await btn.evaluate((el) => el.style.transform);
    check('Magnetic button moves toward pointer', /translate/.test(mt) && !/translate\(0px, 0px\)/.test(mt), mt);
    const ringScale = await page.locator('.cursor-ring').evaluate((el) => el.style.transform);
    check('Cursor ring reacts to interactive hover', /scale\(1\.[5-9]/.test(ringScale) || /scale\(1\.7/.test(ringScale), ringScale);
    const sheen = await btn.evaluate((el) => el.style.getPropertyValue('--mx'));
    check('Glossy highlight follows pointer (--mx)', sheen.endsWith('px'), sheen);
    await page.evaluate(() => document.querySelector('.t-card').scrollIntoView({ block: 'center' }));
    await wait(1600);
    const card = page.locator('.t-card').first();
    const cb = await card.boundingBox();
    await page.mouse.move(cb.x + cb.width * 0.8, cb.y + cb.height * 0.25, { steps: 8 });
    await wait(800);
    const ct = await card.evaluate((el) => el.style.transform);
    check('3D card tilt responds to pointer', /rotate[XY]\((?!0deg)/.test(ct), ct);
    await page.screenshot({ path: path.join(out, 'pointer-tilt.png') });
    await ctx.close();
  }

  // ---------- touch: no custom cursor ----------
  {
    const { ctx, page } = await newPage('mobile');
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await wait(2500);
    const n = await page.locator('.cursor-ring').count();
    check('Custom cursor disabled on touch devices', n === 0);
    await page.locator('.menu-btn').click();
    await wait(1200);
    await page.screenshot({ path: path.join(out, 'mobile-menu.png') });
    const vis = await page.locator('.mobile-menu').evaluate((el) => getComputedStyle(el).visibility);
    check('Mobile menu opens', vis === 'visible');
    await page.locator('.mobile-menu a', { hasText: 'FAQ' }).click();
    await wait(2200);
    check('Mobile menu navigation works', page.url().endsWith(`${base}faq`), page.url());
    await ctx.close();
  }

  // ---------- navigation, deep links, base path ----------
  {
    const { ctx, page, errors } = await newPage('desktop');
    await page.goto(url('/faq'), { waitUntil: 'networkidle' });
    await wait(1500);
    const h = await page.locator('h1').textContent();
    check('Deep link (per-route HTML) renders the right page', h?.includes('Straight answers'), h);
    for (const [label, path_] of [
      ['How it works', '/how-it-works'],
      ['For drivers', '/drivers'],
      ['For hosts', '/hosts'],
      ['Safety', '/safety'],
      ['Contact', '/contact'],
    ]) {
      await page.locator('.nav-links a', { hasText: label }).click();
      await wait(1900);
      check(`Nav link "${label}" navigates under base path`, page.url() === url(path_), page.url());
    }
    await page.goBack();
    await wait(1900);
    check('Browser back button works', page.url() === url('/safety'), page.url());
    const assets = await page.evaluate(() => [...document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="icon"]')].map((e) => e.getAttribute('src') || e.getAttribute('href')));
    check('Asset URLs use the base path', assets.length >= 3 && assets.every((a) => a.startsWith(base)), assets.join(', '));
    check('Navigation: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // ---------- theme toggle persistence ----------
  {
    const { ctx, page } = await newPage('desktop', { colorScheme: 'light' });
    await page.goto(url('/safety'), { waitUntil: 'networkidle' });
    await wait(1200);
    await page.locator('.nav .theme-toggle').click();
    await wait(1200);
    const t1 = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.reload({ waitUntil: 'networkidle' });
    await wait(800);
    const t2 = await page.evaluate(() => document.documentElement.dataset.theme);
    check('Theme toggle switches and persists after reload', t1 === 'dark' && t2 === 'dark', `${t1} -> ${t2}`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check('Dark theme applies dark background', bg === 'rgb(5, 31, 32)', bg);
    await ctx.close();
  }

  // ---------- forms: validation + honest demo mode ----------
  {
    const { ctx, page, errors } = await newPage('desktop');
    await page.goto(url('/contact?form=general'), { waitUntil: 'networkidle' });
    await wait(1500);
    const notice = await page.locator('.notice').first().textContent();
    check('Form shows clearly identified demo state when no endpoint', /Demo mode/.test(notice), notice.slice(0, 60));
    await page.locator('form button[type="submit"]').click();
    await wait(600);
    const errs = await page.locator('.field-error').count();
    check('Empty submit shows validation errors', errs >= 4, `${errs} errors`);
    await page.fill('#f-general-name', 'Test Rider');
    await page.fill('#f-general-email', 'not-an-email');
    await page.locator('#f-general-email').blur();
    await wait(200);
    const emailErr = await page.locator('.field-error', { hasText: 'email' }).count();
    check('Invalid email rejected', emailErr === 1);
    await page.fill('#f-general-email', 'rider@example.com');
    await page.selectOption('#f-general-topic', { index: 1 });
    await page.fill('#f-general-message', 'Testing the general enquiry form.');
    await page.locator('input[name="consent"]').check();
    await page.locator('form button[type="submit"]').dblclick();
    await wait(1200);
    const res = await page.locator('.result').first().textContent();
    check('Valid submit in demo mode states nothing was sent or saved', /nothing was sent or saved/i.test(res), res.slice(0, 80));
    await page.screenshot({ path: path.join(out, 'form-demo-result.png') });
    // tabs via query string
    await page.goto(url('/contact?form=host'), { waitUntil: 'networkidle' });
    await wait(1200);
    const sel = await page.locator('.contact-tabs .tab[aria-selected="true"]').textContent();
    check('Contact form tab selected from ?form= link', /Host/.test(sel), sel);
    check('Forms: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // ---------- reduced motion ----------
  {
    const { ctx, page, errors } = await newPage('desktop', { reducedMotion: 'reduce' });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await wait(3000);
    const isStatic = await page.locator('.hero-stage.is-static').count();
    const cursor = await page.locator('.cursor-ring').count();
    const titleVisible = await page.locator('.hero-title').evaluate((el) => getComputedStyle(el).opacity);
    check('Reduced motion: hero becomes static layout', isStatic === 1);
    check('Reduced motion: custom cursor off, normal cursor kept', cursor === 0);
    check('Reduced motion: content visible without animation', titleVisible === '1');
    await page.screenshot({ path: path.join(out, 'reduced-motion-home.png'), fullPage: false });
    await page.locator('.nav-links a', { hasText: 'FAQ' }).click();
    await wait(800);
    check('Reduced motion: navigation is instant', page.url() === url('/faq'));
    check('Reduced motion: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // ---------- WebGL unavailable fallback ----------
  {
    const { ctx, page, errors } = await newPage('desktop');
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (/webgl/.test(type)) return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto(url('/'), { waitUntil: 'networkidle' });
    await wait(2000);
    const fb = await page.locator('.hero-fallback').count();
    check('No-WebGL fallback illustration shown', fb === 1);
    await page.screenshot({ path: path.join(out, 'webgl-fallback.png') });
    check('Fallback: no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // ---------- unknown route ----------
  {
    const { ctx, page } = await newPage('desktop');
    await page.goto(url('/does-not-exist'), { waitUntil: 'networkidle' });
    await wait(800);
    const h = await page.locator('h1').textContent();
    check('Unknown route shows not-found page', /doesn’t lead anywhere/.test(h), h);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ base, total: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `; ${failed.length} failed` : ''}`);
process.exit(failed.length ? 1 : 0);
