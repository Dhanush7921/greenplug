# GREENPLUG website (working name)

Informational marketing website for **GREENPLUG**, a planned EV charging discovery app for electric cars and two-wheelers, starting in Andhra Pradesh, India.

- 7 pages: Home, How it works, For drivers, For charging hosts, Safety and trust, FAQ, Contact and early access
- Cinematic Three.js hero: procedural car, scooter, sculptural charger, reflective platform, arch, glowing energy ribbon. Scroll drives the camera and morphs the ribbon into a route over an illustrative discovery map with filterable pins.
- GSAP + ScrollTrigger + SplitText motion: variable-font "stretch" headline reveals, 3D concave services gallery, layered driver/host panels, skeleton-to-content app preview, pill-to-card store section, page curtain transitions
- Desktop pointer system: glossy cursor with trailing light, magnetic buttons, 3D card tilt, pointer-tracked sheen. Off on touch devices, with reduced motion, or via the footer switch.
- Light and dark themes (persisted, circular view-transition reveal), built only from the six supplied palette colours plus white
- Honest forms: driver early access, host interest, partnerships, general enquiries → Google Sheets via Apps Script, with a clearly labelled demo mode when no endpoint is configured

> Nothing on the site claims to be live: stations, hosts, prices, maps and app screens are labelled as samples or concepts.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173 (rebuilds on save, live reload)
npm run build      # production build in dist/
npm run preview    # serve dist/ exactly like GitHub Pages (sub-path + 404 fallback)
npm run typecheck
```

Requires Node 20+.

### Why esbuild instead of Vite?

The project follows Vite's conventions (`index.html` entry, `VITE_*` env variables, `import.meta.env.BASE_URL`) but builds with **esbuild directly** through `scripts/build.mjs` — esbuild is the compiler Vite uses under the hood. It was built in an environment where the npm registry was unavailable, so only esbuild could be verified end to end. If you prefer Vite, add `vite` + `@vitejs/plugin-react`, point `vite.config.ts` at `base: process.env.BASE_PATH`, and replace the `dev`/`build` scripts; no source changes are needed.

## Configuration

Copy `.env.example` to `.env` for local builds, or set **repository variables** for the GitHub Actions build (Settings → Secrets and variables → Actions → **Variables**). All `VITE_*` values are public — they end up in the browser bundle.

| Variable | Purpose |
| --- | --- |
| `VITE_LEADS_ENDPOINT` | Google Apps Script web-app URL. Empty → forms run in demo mode and say nothing was saved. |
| `VITE_PLAY_STORE_URL`, `VITE_APP_STORE_URL` | Store links. Empty → buttons show "Coming soon" and open early access. |
| `VITE_CONTACT_EMAIL` | Optional public email on the Contact page. |
| `VITE_BRAND_NAME` | Replaces the "GREENPLUG" name across the site and page titles. |
| `BASE_PATH` | Sub-path for GitHub Pages project sites. The workflow sets it automatically. |

Brand pieces to replace later:
- Logo: `src/components/LogoMark` in `src/components/Logo.tsx` and `public/favicon.svg` (original SVG placeholders)
- Palette tokens: top of `src/styles/base.css` and `src/three/palette.ts` (3D scene colours)
- Page titles/descriptions: `src/config/routes.json`
- When the apps launch, replace the store buttons in `src/components/StoreButtons.tsx` with the official Google Play / App Store badges, following each store's brand guidelines.

## Google Sheets lead capture

1. Create a Google Sheet → **Extensions → Apps Script**.
2. Paste `apps-script/Code.gs`, save.
3. **Deploy → New deployment → Web app**. Execute as **Me**, access **Anyone**. Authorise and copy the `/exec` URL.
4. Set `VITE_LEADS_ENDPOINT` to that URL (repository variable for deploys, `.env` locally) and rebuild.

Each form type gets its own tab with headers. The script validates input, neutralises spreadsheet formulas, ignores duplicate submission IDs, and never returns sheet data. The browser side adds required-field and format validation, a honeypot, in-flight lock and a 24-hour duplicate check.

## Deploy to GitHub Pages

The workflow `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

```bash
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The first run publishes to `https://<you>.github.io/<repo>/`.

- Base path is derived from the repo name (`/<repo>/`); `<you>.github.io` repos and custom domains use `/` — or set a `BASE_PATH` repository variable.
- Every page is emitted as its own `index.html` (`/drivers/`, `/faq/`, …) so deep links return HTTP 200 with the right title; unknown paths fall back to `404.html`, which renders the app's not-found page.
- After your first local `npm install`, commit `package-lock.json` so CI uses `npm ci`.

## Verification

`scripts/verify.mjs` runs Playwright checks against the production build served under a sub-path (all seven pages × 1440×900 and 390×844 × light/dark, no horizontal overflow or console errors, WebGL scene + animation, pointer system, magnetic/tilt, scroll story, theme persistence, form validation and demo honesty, reduced motion, no-WebGL fallback, deep links and 404). Screenshots go to `test-results/`.

```bash
npm i -D playwright && npx playwright install chromium
BASE_PATH=/greenplug-website/ npm run build && BASE_PATH=/greenplug-website/ npm run verify
```

## Performance notes

- three.js loads as a separate chunk only on the home page; other pages ship without it.
- Rendering runs only while the hero is on screen and the tab is visible; reduced motion renders a single still frame.
- Pixel ratio is capped (2 desktop, 1.5 mobile) and lowered automatically if frames are slow. Mobile/low-memory devices skip the real-time mirror reflection.
- Shaders are compiled before the entrance animation to avoid first-frame stutter.
- Frame rate on real devices has not been measured yet; test on a mid-range Android phone before launch.

## Project structure

```
src/
  three/          HeroScene (renderer, camera path, morphing ribbon), procedural models, shaders, palette
  sections/home/  HeroStage, ServicesArc, DriverHost, AppPreview, StoreCard
  pages/          the seven pages + not found
  components/     Nav, Footer, PointerSystem, RouteView (curtain transitions), LeadForm, Modal, Accordion, ...
  lib/            router, theme, GSAP setup + reveal vocabulary, preferences, lead submission
  styles/         base (tokens/type), ui (components), home, pages
apps-script/      Google Apps Script endpoint
scripts/          build, dev, preview, verify, icon generator
```

## Credits and licences

- [three.js](https://threejs.org) — MIT
- [GSAP](https://gsap.com) (ScrollTrigger, SplitText) — GreenSock standard no-charge licence
- [React](https://react.dev) — MIT
- [Lucide](https://lucide.dev) icons — ISC (`src/components/LUCIDE-LICENSE.txt`)
- [Archivo](https://github.com/Omnibus-Type/Archivo) variable font by Omnibus-Type — SIL OFL 1.1 (`src/assets/fonts/ARCHIVO-OFL.txt`)
