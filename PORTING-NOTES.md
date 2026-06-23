# Porting notes — qurb static site → Next.js (App Router)

This documents what was ported faithfully and what was intentionally changed,
simplified, or deferred while rebuilding the original static qurb site
(`/Users/bobschaufele/Desktop/Claude-dispatch`) as a Next.js + Tailwind v4 +
shadCN app.

## Approach

- **Design tokens**: every `:root` CSS custom property from `index.html` was
  ported verbatim into `src/app/globals.css` (brand palette, results dark-tile
  palette, radii, shadow, layout widths) and the key brand colours are also
  exposed as Tailwind `@theme` colours. The full component stylesheet from the
  original `<style>` block lives in `src/app/qurb.css` (scoped radius vars under
  `.qurb-page`). Per-page `<style>` blocks (faq/contact/over-ons/goedkoopste)
  were ported into co-located, page-scoped CSS files.
- **Font**: Poppins via `next/font/google` (replaces the create-next-app Geist
  fonts).
- **Vergelijker engine**: the entire original `<script type="module">` block was
  ported **verbatim** into `src/lib/qurb-engine.js`, wrapped in `initQurb()` and
  run once on mount via the `QurbEngine` client component. All business logic is
  unchanged: PDOK suggest/lookup/reverse, Nominatim place search via
  `/api/places`, per-municipality RDW data loading, zone tariff resolution, the
  5-app service-fee model (Parkmobile / EasyPark / Yellowbrick / ANWB / Q-Park),
  garage ranking, "goedkoper verderop" tip, Amsterdam parkeervakken check, and
  the dark-tile result rendering. Keeping it intact avoids re-deriving subtle
  tariff math in React.
- **Pages**: homepage (`/`), 4 content pages (`/faq`, `/contact`, `/over-ons`,
  `/goedkoopste-parkeerapp`), and 8 flat-URL city pages
  (`/amsterdam` … `/groningen`) built from one shared `CityPage` component plus
  per-city copy in `src/lib/cities.ts`. SEO titles/descriptions use the Next.js
  Metadata API.
- **API**: `api/places.js` (Vercel serverless Nominatim proxy) → Next.js Route
  Handler `src/app/api/places/route.ts`, same request/response contract
  (q ≥ 3 validation, User-Agent, cache headers, error shape).
- **Data**: the 124 municipality folders + top-level `gemeenten.json` /
  `dekking.json` / `betrouwbaarheid.json` were copied to `public/data/` so the
  client fetches them at the same `/data/<id>/*.json` paths. macOS `._*` /
  `.DS_Store` files were excluded.

## Meldformulier / forms (past-bug guards)

- The in-page **meld-modal** (report-an-issue) posts to the same Formspree
  endpoint `https://formspree.io/f/xwvjzylg` with `Accept: application/json`.
  - The historical `esc() bestond niet` bug is avoided: the engine uses the
    original `escapeHtml` / `html` tagged-template helpers (no `esc()` call).
  - The CSP that previously blocked the Formspree POST is **not** reintroduced —
    no restrictive CSP meta tag is emitted, and the POST is a normal client
    `fetch`. (See "Deferred" re: setting a proper CSP via `next.config.ts`.)
- The **contact form** posts to `https://formspree.io/f/xzdqjznw` (honeypot +
  ok/err status), ported into the `ContactForm` client component.

## Intentionally changed

- Internal navigation uses `next/link` (`<Link>`) instead of `<a>` for routes
  (lint requirement / client-side nav). Same-page hash anchors (`#vergelijker`,
  `#hoe`, `#apps`) remain `<a>`.
- Clean URLs come from the App Router directly, so the original
  `vercel.json` rewrites are no longer needed.

## Deferred / not ported

- **Analytics**: the Google Analytics `gtag` script (`G-BGSXG9SP4G`) and the
  Vercel Insights script (`/_vercel/insights/script.js`) were **not** ported.
  Add via `next/script` or `@vercel/analytics` if desired.
- **Content Security Policy**: the original sites set a CSP. It is **deferred** —
  Next.js can set one via `next.config.ts` `headers()`. If added, it must allow
  the Formspree POST (`connect-src https://formspree.io`), PDOK
  (`api.pdok.nl`), Nominatim via the same-origin `/api/places` proxy, the
  Amsterdam parkeervakken API (`api.data.amsterdam.nl`), and Google fonts —
  otherwise the meld/contact forms and autocomplete break (the exact regression
  from the original "CSP blokkeerde Formspree" bug).
- **JSON-LD structured data** (the per-page `application/ld+json` blocks) was not
  ported; can be added per route via a `<script type="application/ld+json">` in
  each page if SEO structured data is required.
- **`/privacy` and `/hoe-het-werkt`** are linked in the footer/nav but have no
  page yet (they had no source HTML in scope). They currently 404.
- `robots.txt` / `sitemap.xml` from the source were not regenerated.

## Verification

- `npm run build` passes; all routes prerender static except `/api/places`
  (dynamic). `npm run lint` is clean.
- Dev smoke test confirmed: homepage, a city page (`/amsterdam`), and `/faq`
  render with correct copy and branding; `#199646` and the `#18151f` results
  tile colour are present in the served CSS; `/data/*.json` is served statically
  and `/api/places` validates `q ≥ 3`.
