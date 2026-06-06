# Qurb parkeervergelijker — technische architectuur

*Stand: juni 2026, na de productie-refactor. Doel: een ontwikkelaar kan hiermee de codebase
begrijpen, onderhouden en uitbreiden.*

---

## 1. Stack-overzicht

| Laag | Keuze | Reden |
|---|---|---|
| Runtime | **Geen** — 100% statische `index.html` | Geen server om te beheren of te beveiligen; deploybaar op elke CDN |
| Markup | Semantische **HTML5** | Toegankelijkheid + SEO out-of-the-box |
| Styling | **Moderne CSS**: custom properties, logical properties, `@container`, intrinsic grid, `:focus-visible`, `prefers-reduced-motion` | Geen build-stap, geen framework, toekomstbestendig |
| Logica | **Vanilla JS** als ES-module (`<script type="module">`) | Strict mode + scoping zonder bundler; gedeferd (niet render-blocking) |
| Adres-API | **PDOK Locatieserver v3.1** (open, geen sleutel) | Rijksdienst voor adres/geo-resolutie |
| Domeindata | **Open RDW-parkeerdata**, voorbewerkt tot JSON per gemeente | Echte zonetarieven, vergunningsgebieden, garages |
| Fonts | Google Fonts (Poppins), `display=swap` + `preconnect` | Snelle, niet-blokkerende webfont |
| Hosting | Netlify / Cloudflare Pages (statisch) | `_headers` zet de productie-CSP en securityheaders |
| Dataverversing | GitHub Action (`.github/workflows/refresh-data.yml`) | Herbouwt de per-gemeente JSON uit de RDW-bron |

**Geen** runtime-dependencies, geen npm, geen bundler. De enige externe origin op runtime is
`api.pdok.nl` (vastgelegd in de CSP `connect-src`).

---

## 2. Modulekaart (binnen de `<script type="module">`)

De code is één module, intern verdeeld in duidelijk afgebakende secties met enkele
verantwoordelijkheid elk:

```
CONFIG            Bevroren configuratie: endpoints, debounce, timeouts, limieten, fallback-tarief
MUNICIPAL_RATE    Indicatief gemeentetarief (€/uur) tot zone-exact cijfer beschikbaar is
APPS              Servicekostenmodel per parkeer-app: fee(rate, hours) → €

Utilities
  ├─ html``       Tagged template die élke interpolatie standaard HTML-escapet (XSS-veilig)
  ├─ raw()        Expliciete opt-out voor reeds-vertrouwde HTML-fragmenten
  ├─ safeHttps()  Valideert/normaliseert een hostnaam naar een veilige https-URL
  ├─ debounce()   Met .cancel()
  └─ format*      eur (Intl), afstand, duur, datetime-local

Network
  ├─ fetchJson()  fetch + harde timeout (AbortSignal.timeout) + externe abort (AbortSignal.any)
  └─ sessionCache get/set rond sessionStorage (quota-safe)

PDOK API
  ├─ suggestAddresses(query, signal)   → [{id, label}]   (gecached, afbreekbaar)
  └─ lookupAddress(id)                 → {lon, lat, municipality}  (gecached)

Per-gemeente data (lazy, in-memory via Map<url, Promise>)
  ├─ getMunicipalityMap / getCoverageMap
  ├─ resolveAreaId(municipality) → RDW area-id
  └─ loadStreetZones / loadPermitZones / loadGarages(areaId)

Geometry
  ├─ haversineMeters(a, b)
  └─ pointInPolygon(pt, poly) / inAnyPolygon

Domein
  ├─ municipalRate / displayCity
  ├─ streetRateAt(areaId, coord, start)   zone + tijdvenster → €/uur
  ├─ inPermitZone(areaId, coord)
  ├─ resolveStreet(place, start)          → {kind, rate, label}  (state machine)
  ├─ rankApps(rate, hours)                → gesorteerde apps
  └─ rankGarages(garages, coord, hours)   → op afstand, dan prijs

State            { place }  — enige gedeelde mutabele toestand
Controllers
  ├─ initTimeInputs()       van/tot synchronisatie
  ├─ combobox (IIFE)        WAI-ARIA combobox: input, keyboard, listbox, abort
  ├─ setPlace/clearFound    search-meta (gevonden adres + tarief)
  └─ compare()              orkestreert validatie → resolveStreet → render

Rendering
  ├─ showError / clearError / setBusy(aria-busy + spinner)
  ├─ renderStreet(street, …)   per `kind` de juiste UI (paid/free/permit/uncertain/nodata)
  ├─ renderGarages(ranked, …)
  └─ renderResults(model)      bouwt de donkere resultaten-tile
```

**Ontwerpprincipe:** pure rekenfuncties (`rankApps`, `rankGarages`, `streetRateAt`,
`resolveStreet`) zijn gescheiden van I/O (`fetch*`, `load*`) en van DOM (`render*`). Dat maakt de
domeinlogica los testbaar en de render-laag dom.

---

## 3. Dataflow (van toetsaanslag tot resultaat)

```
 Gebruiker typt adres
        │  (input event)
        ▼
 debounce 250ms ─── < 3 tekens? ──► listbox sluiten
        │ ≥ 3 tekens
        ▼
 suggestAddresses(query, signal)         AbortController: vorige call afbreken
        │   ├─ sessionCache hit? ─► direct terug
        │   └─ GET api.pdok.nl/…/suggest?fq=type:adres&q=…   (timeout 8s)
        ▼
 listbox met opties  ◄── toetsenbord: ↑/↓ activeren, Enter kiezen, Esc sluiten
        │  (kies optie)
        ▼
 choose(option)
   ├─ optimistisch: cityFromLabel → municipalRate → setPlace (indicatief €/uur)
   └─ lookupAddress(id)  ── GET …/lookup?fl=centroide_ll,gemeentenaam&id=…
            │
            ▼
        {lon, lat, municipality}
            │
            ▼
        resolveAreaId(municipality)  ── data/gemeenten.json (lazy, 1×)
            │
            ▼
        setPlace({ label, municipality, rate, coord, areaId })   ← state.place
─────────────────────────────────────────────────────────────────────────────
 Gebruiker kiest van/tot  →  submit (form)
        │  preventDefault → compare()
        ▼
 Validatie: place? rate? geldige tijden? eind>begin? online?  ──► showError(...)
        │ ok                                       (aria-busy=true, spinner)
        ▼
 resolveStreet(place, start)
   ├─ geen areaId/coord ─────────────► kind:'indicative', rate = gemeentecijfer
   └─ areaId + coord:
        streetRateAt → data/<id>/straat.json   (punt-in-polygon × tijdvenster)
          ├─ rate>0  ─► kind:'paid'
          ├─ in zone, buiten venster ─► kind:'free'
          ├─ inPermitZone (data/<id>/vergunning.json) ─► kind:'permit'
          ├─ coverage>0 (data/dekking.json) ─► kind:'uncertain'
          └─ anders ─► kind:'nodata'
        │
        ▼
 base = rate × uren
 rankApps(rate, uren)              loadGarages(areaId) → rankGarages(coord, uren)
        │                                   │
        └───────────────┬───────────────────┘
                        ▼
              renderResults(model)   →  donkere tile (samenvatting + straat + garages)
                        ▼
              aria-busy=false, scrollIntoView
```

---

## 4. Externe afhankelijkheden & endpoints

**API-endpoints (runtime):**

- `GET https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?rows=6&fq=type:adres&q={query}`
- `GET https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fl=centroide_ll,gemeentenaam&id={id}`

**Statische datacontracten (self-hosted, lazy):**

| Bestand | Vorm |
|---|---|
| `data/gemeenten.json` | `{ gemeenten: { "<naam>": "<areaId>" } }` |
| `data/dekking.json` | `{ betaald_zones: { "<areaId>": <aantal> } }` |
| `data/<areaId>/straat.json` | `{ zones: [{ areaid, naam, polys: [[[lon,lat]…]], vensters: [{ days:[1-7], from, to, eur }] }] }` |
| `data/<areaId>/vergunning.json` | `{ zones: [{ polys: [[[lon,lat]…]] }] }` |
| `data/<areaId>/garages.json` | `{ garages: [{ naam, operator, type, url, lat, lon, capaciteit, uur, dagmax }] }` |

**Code-dependencies:** geen. Geen runtime-bibliotheken; alleen browser-API's en Google Fonts (CSS).

---

## 5. Browsercompatibiliteit & performance

**Browser-baseline (2026):** moderne evergreen browsers. Bewust gebruikte API's:

- `AbortSignal.timeout()` en `AbortSignal.any()` — Chrome 116+, Safari 17.4+, Firefox 124+
- ES-modules, optional chaining, nullish coalescing, `Intl.NumberFormat`
- CSS `@container`, logical properties, `:focus-visible`, `:where()`

Geen polyfills: alle gebruikte features zijn breed ondersteund op de doel-baseline. Er is geen IE/
legacy-ondersteuning (bewuste keuze; geen build-stap die transpileert).

**Performance-eigenschappen:**

- **Niet render-blocking JS:** ES-module is impliciet `defer`.
- **Eén enkele DOM-mutatie per render:** resultaten worden als string opgebouwd en in één keer
  toegekend; geen layout-thrashing.
- **Debounce (250 ms) + min. 3 tekens** beperken PDOK-aanroepen.
- **Afbreken van verouderde verzoeken** via `AbortController` (de combobox annuleert de vorige
  suggest-call bij elke nieuwe).
- **Caching op twee niveaus:** PDOK-antwoorden in `sessionStorage`; per-gemeente JSON in een
  in-memory `Map<url, Promise>` (laadt elke stad max. één keer, ook bij parallelle aanvragen).
- **Lazy data:** alleen de gemeente van het gekozen adres wordt geladen — schaalt naar heel NL
  zonder de eerste render te belasten.
- **`content-visibility`-vriendelijke, platte DOM**; animaties via `transform`/`opacity` (compositor),
  uitgeschakeld onder `prefers-reduced-motion`.
- **Conceptueel Lighthouse 90+**: minimale payload (één HTML-bestand + één webfont), geen JS van
  derden, geen blokkerende bronnen.

---

## 6. Beveiliging — overwegingen en maatregelen

| Risico | Maatregel in deze codebase |
|---|---|
| **XSS via API-data** (adressen, garagenamen) | `html`` `-tagged template escapet élke interpolatie standaard; `raw()` alleen voor eigen, vertrouwde fragmenten. Geen ongeëscapete `innerHTML` met externe data. |
| **Kwaadaardige/manipuleerbare URL's** (garage-links) | `safeHttps()` whitelistet het patroon en bouwt via `new URL()` een schone `https://`-link; faalt veilig naar `—`. Links krijgen `rel="noopener"`. |
| **Injectie via querystrings** | Alle query-parameters door `encodeURIComponent()`. |
| **Clickjacking / framing** | CSP `frame-ancestors 'none'` + `X-Frame-Options: DENY` (in `_headers`). |
| **Ongewenste bronnen** | CSP beperkt `connect-src` tot `'self' https://api.pdok.nl`, `script-src` tot `'self'`-origin, `img-src` tot `'self' data:`. |
| **Transport** | HSTS via `_headers`; `preload`-waardig. |
| **Datalek** | Geen sleutels, accounts, betalingen of persoonsgegevens in de client. |
| **Console-lekken** | Geen `console.*` in de productiecode. |

**Bekende hardening-vervolgstap:** de inline `<script type="module">` vereist nu
`script-src 'self' 'unsafe-inline'`. Bij een toekomstige build-stap kan dit worden vervangen door
een **nonce of hash**, of door het script te externaliseren naar `app.js` (dan volstaat
`script-src 'self'`). Dit staat ook in `SECURITY.md` als geplande aanscherping. Zolang de tool
bewust één statisch bestand blijft, is `'unsafe-inline'` de pragmatische keuze die overeenkomt met
de hosting-`_headers`.

---

## 7. Uitbreidpunten

- **Nieuwe stad live zetten:** draai de RDW-pijplijnen (`scripts/build_*.py <areaId>`), commit de
  `data/<areaId>/*.json`; de frontend pikt het automatisch op via `gemeenten.json`.
- **App-servicekosten bijwerken:** pas het `APPS`-model aan (één plek, pure functies).
- **Tijdvakken fijner meerekenen:** uitbreiden in `streetRateAt` (vensterselectie) en
  `rankGarages` (eerste uur vs. vervolg).
- **Beschikbaarheid garages:** een veld toevoegen aan het garage-contract en aan `renderGarages`.
- **SHPV-aansluiting** (volledige landelijke betrouwbaarheid): vervangt de open-data-laag achter
  `streetRateAt` zonder dat de UI-laag verandert.
