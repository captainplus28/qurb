# qurb · Voortgang & vervolg (opslagpunt)

*Lees dit eerst om naadloos verder te gaan. Laatste update: handmatig bijwerken per sessie.*

## Wat qurb is
Parkeervergelijker: voer adres + tijdvak in → zie waar je het voordeligst parkeert
(straat, garage, P+R), met live tarieven uit open RDW-data. *peek before you park.*

## Architectuur (belangrijk)
- **Eén statische `index.html`** (app + landingspagina). Geen server.
- **Per-gemeente data** in `data/<areamanagerid>/{straat,permit,garages}.json`, **lazy geladen**:
  de frontend bepaalt via PDOK de gemeente van het adres → `data/gemeenten.json` geeft het
  RDW-id → laadt alleen die stad. Schaalt naar heel NL zonder server.
- **Hosting:** Netlify (statisch). `_headers` zet de security-headers. CSP in de `<head>`.
- **Verversing:** GitHub Action (`.github/workflows/refresh-data.yml`) draait de pijplijnen.

## Klaar (✅)
- Security-hardening (CSP, XSS-escaping, headers, SECURITY.md).
- Live **straattarief per zone** uit RDW NPR-feed, incl. dag/avond/zondag/gratis-uren.
  Gevalideerd tegen amsterdam.nl (centrum €8,05). Tariefregel: `charge / (chargePeriod/60)`.
- **"Kan ik hier staan"**: classificatie betaald / gratis / **vergunninghouders**.
- **Garages** (gemeente + privaat) op afstand, met dagmax. Q-Park zonder open tarief:
  getoond met locatie + "tarief bij exploitant" + link.
- **Nederland-uitrol**: pijplijnen geparametriseerd; 4 steden live & getest
  (Amsterdam 363, Rotterdam 599, Utrecht 344, Den Haag 518). Namen opgeschoond.
- **Action ontdekt automatisch** alle ~130 gemeenten met betaald parkeren (`steden_lijst.py`),
  bouwt ze, commit incrementeel (per 10) → bestand tegen timeouts bestand.

## Direct vervolg (openstaand)
1. **Action handmatig starten** om heel NL te bouwen (gebruikersactie, kost geen Claude-limiet):
   - Schrijfrechten: github.com/captainplus28/qurb/settings/actions → "Read and write" → Save.
   - Run: github.com/captainplus28/qurb/actions/workflows/refresh-data.yml → "Run workflow".
   - Repo is publiek → run is te volgen via `curl https://api.github.com/repos/captainplus28/qurb/actions/runs`.
2. **Netlify live zetten** (4 steden zijn klaar) + headers checken op securityheaders.com.
3. **Q-Park officiële data** (partnership): zie `docs/qpark-dataverzoek.md` (concept-mail klaar;
   bedrijfsgegevens invullen). api-partners.q-park.com.
4. **2FA** aanzetten op GitHub/Netlify/e-mail/domein (grootste praktische beveiligingswinst).

## Datastrategie (beslist)
- **Nu = open RDW-data + eerlijke degradatie (optie C).** Sterk in grote steden.
- **Valse "gratis" opgelost:** heeft een gemeente betaald parkeren (`data/dekking.json`) maar
  vinden we de zone niet → "controleer de automaat", géén "gratis". (`build_dekking.py`.)
- **Kleine gemeenten:** open data mist daar vaak geometrie én straattarieven — fundamentele
  limiet van de open subset (geverifieerd o.a. Barneveld).
- **De cijfercodes** op automaten/apps = NPR-zonecodes. Alle apps gebruiken dezelfde NPR;
  zij zijn **SHPV-parkeerproviders** met volledige toegang, wij gebruiken de open subset.
  → Echte landelijke betrouwbaarheid komt alleen via **SHPV-aansluiting** (shpv.nl) — dé
  vervolgstap als betrouwbaarheid in kleine gemeenten prioriteit wordt. Maakt ook een
  "typ de zonecode van de automaat"-feature mogelijk.
- **Google Places API:** onderzocht, **voorlopig afgezien**. Geeft géén tarieven (alleen
  booleans zoals paidStreetParking) en NL-dekking onzeker. Geen kerngat-oplossing.

## Later
- NDW/parkeervakken: bord-/vakniveau "kan ik hier staan" (parkeerverbod E1) — verfijning.
- Tijdvakken in de garagekosten fijner (eerste uur vs vervolg).
- Sortering/relevantie van garages bijschaven.

## Handige commando's
```bash
# Eén stad (lokaal) bouwen — <areamanagerid> <gemeentenaam>:
python3 scripts/build_street.py  363
python3 scripts/build_permit.py  363
python3 scripts/build_garages.py 363 Amsterdam
# Gemeente-kaart + lijst gemeenten met betaald parkeren:
python3 scripts/build_gemeentenmap.py
python3 scripts/steden_lijst.py
# Lokaal previewen: serveer de map en open index.html (data/ ernaast).
```

## Datamodel-naslag
Volledige RDW-datamodel, join-keten en valkuilen: **`FASE1-bevindingen.md`**.

## Sleutelgegevens
- Repo: github.com/captainplus28/qurb (publiek). Git via SSH.
- areamanager-ids: Amsterdam 363, Rotterdam 599, Utrecht 344, Den Haag 518.
- Werkmap data staat op externe schijf; commits gaan via de map in ~/Downloads (git-repo).
