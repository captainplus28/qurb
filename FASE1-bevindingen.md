# Fase 1 — RDW-datamodel: bevindingen & bouwbeslissingen

*Onderzoek op de live RDW Open Data (Socrata, opendata.rdw.nl). MVP-stad: Amsterdam = `areamanagerid` **363**.*

## Geverifieerd datamodel (SPDP2.0 op Socrata)

| Tabel | Dataset-id | Sleutels / belangrijke velden |
|---|---|---|
| GEBIED | `adw6-9hsg` | areamanagerid, areaid, areadesc, start/enddatearea |
| PARKEERGEBIED | `mz4f-59fw` | areamanagerid, areaid, **usageid** (straat vs garage), areaname |
| GEOMETRIE GEBIED | `nsk3-v9n7` | areamanagerid, areaid, **areageometryastext** (WKT, WGS84) |
| TIJDVAK | `ixf8-gtwq` | areamanagerid, **regulationid**, daytimeframe, start/endtimetimeframe, **farecalculationcode**, claimrightpossible |
| TARIEFDEEL | `534e-5vdg` | areamanagerid, **farecalculationcode**, startdurationfarepart, enddurationfarepart, **amountfarepart**, **stepsizefarepart**, enddatefarepart |
| Index gemeenten | `f6v7-gjpa` | gemeentenaam → areamanagerid (Amsterdam=363) |

### Koppelketen
```
GEBIED/PARKEERGEBIED (areaid) ── TIJDVAK (regulationid = areaid; dag+tijd) ── farecalculationcode ── TARIEFDEEL (€ per duurstap)
                                  GEOMETRIE GEBIED (areaid → polygon WGS84)
```
Filter op actueel: `enddatearea='29991231'`, `enddatetimeframe='29991231235959'`, `enddatefarepart='29991231'`.

## Tariefberekening — GEDECODEERD en intern gevalideerd
Voor gevensterde codes (`TC*_Dxxxx` = dagvenster, `_Nxxxx` = nacht, `_Zxxxx` = zon/feestdag):
- **`stepsizefarepart` = lengte van het tijdvenster in MINUTEN**
- **`amountfarepart` = totaalprijs (euro's) voor dat hele venster**
- **uurtarief = `amountfarepart ÷ (stepsizefarepart ÷ 60)`**

Validatie (Amsterdam tariefzone 1, huidig):
- `TC1_D0919` (09–19u, 600 min): €48,30 → €4,83/uur
- `TC1_D0921` (09–21u, 720 min): €57,90 → €4,825/uur
- `TC1_D0924` (09–24u, 900 min): €72,40 → €4,827/uur

→ Onderling consistent (~€4,83/uur overdag). Voor exacte duur+tijdvak: stap door TARIEFDEEL-delen per `startduration/endduration`.

## De openstaande blocker: coördinaat → straat-tariefzone
- **Garages** (`363_GAR*`, `363_TER*`): GPS-locatie + TIJDVAK + TARIEFDEEL volledig joinbaar. **Direct bruikbaar.**
- **Straat (betaald)**: de **152 BP-regelzones** dragen de `TC*`-tarieven via TIJDVAK, maar hebben **GÉÉN polygon** in GEOMETRIE GEBIED (telling = 0). De polygonen zitten op aparte **T-zones** (BETAALDP, bijv. `T11V` "Tariefzone 1") en **AN-zones** (VERGUNP, vergunninghouders).
- **Ontbrekend**: de mapping **BP-regelzone ↔ T-geometriezone**. Niet aanwezig in de platte Socrata-tabellen.

### Routes om de blocker op te lossen (volgende stap)
1. **NPR SPDP2.0 geneste feed** `https://npropendata.rdw.nl/parkingdata/v2` — bevat de volledige relaties (gebied↔regeling↔geometrie) genest; waarschijnlijk dé bron voor de BP↔T-koppeling.
2. **SPDP2.0-specdocument** (`data.openparking.nl/downloads/Standard_for_the_Publication_of_Dynamic_Parking_Data_v2.0.pdf`) — bevestigt het koppelveld. (Blokkeerde directe fetch; handmatig downloaden kan.)

## Bouwbeslissingen
- **Architectuur Fase 1a = build-time pipeline + client-side lookup.** Een periodiek Python-script haalt de Amsterdam-data op en schrijft compacte JSON in het repo; `index.html` doet point-in-polygon + tariefberekening in de browser. **Geen server nodig** — alle data is CC-0/open en PDOK vraagt geen sleutel, dus er is niets te verbergen. (Node bleek lokaal niet beschikbaar; Python wel.)
- **Serverless (Netlify Functions) verschuift naar Fase 2**, wanneer dynamische garagebeschikbaarheid en de handmatige app-servicekostentabel erbij komen — dáár ontstaat pas een reden voor een backend.
- **Coördinaten**: PDOK `suggest` geeft alleen een id; gebruik PDOK `lookup?id=...` → `centroide_ll` (WGS84 POINT) voor de lat/lon van het gekozen adres.

## OPGELOST — straat-tarief via de NPR-feed (de doorbraak)
De flat Socrata-tabellen bleken een doodlopend spoor (BP-regelzones zonder polygon).
De **NPR v2 static-feed** lost het op: per BETAALDP-tariefzone (uuid uit PARKEERGEBIED)
levert `…/parkingdata/v2/static/<uuid>` in één blob:
- `specifications[0].areaGeometry` — een **GeoJSON-polygon** (zonegrens, WGS84)
- `tariffs[]` — per dag/tijd-venster `intervalRates {charge, chargePeriod, durationType}`

**Uurtarief = `charge / (chargePeriod/60)`** (durationType 'Minutes'). Onafhankelijk
gevalideerd tegen TARIEFDEEL (€4,83 voor TC1_D0919) → identiek. Pijplijn:
`scripts/build_street.py` → `data/amsterdam-straat.json` (53 zones, ~128 kB).

Frontend: punt-in-polygon (ray casting) → zone(s) → venster matchen op dag+tijd →
€/uur. Dit rekent dag/avond/zondag/gratis-uren correct mee.

### Open nuance (bewust gekozen heuristiek)
Bij overlappende zone-varianten (bv. Dam valt in T11N én T11V) bestaan meerdere
officiële producten met verschillende tarieven (€4,83 dagvenster-product vs €8,05
regulier uurtarief). We kiezen het **hoogste passende** tarief = het reguliere
bezoekers-uurtarief (€8,05 ≈ het echte centrumtarief). Te valideren tegen de
officiële tarievenpagina van Amsterdam; zone-prioriteit kan later verfijnd worden.

## Tariefvalidatie (uitgevoerd)
Vergeleken met de officiële bron (amsterdam.nl / 2026):
- **Centrum (Zone 1) = €8,05/uur, 24/7** → onze pijplijn geeft exact €8,05 voor Dam. ✓
- Tiers kloppen: Zuid/West/Oost ~€4,50–6 (wij: €4,18–6,98), Noord/Zuidoost ~€1,60–3,50 (wij: €1,72–3,22). ✓
- De 26 "€0,10"-zones bleken **"10c max 60"-kortparkeer-uitzonderingen** (U-zones) die over de
  gewone zones liggen; onze "hoogste passende"-heuristiek negeert ze correct. ✓

Validatie met echte PDOK-geocodeerde adressen: Dam €8,05, Buikslotermeerplein €1,72,
Surinameplein/Czaar Peterstraat €5,37 (Zone 3) — allemaal correct.

### Dekking — OPGELOST
De gaten kwamen niet door ontbrekende zones maar door **onvolledig ingelezen geometrie**:
de WKT-parser ving multi-part (MULTIPOLYGON) zones maar half. Met een robuuste parser en
Socrata-geometrie als primaire bron (alle ringen per zone) lossen nu alle stadsdelen op:
Dam €8,05 (Z1), Museumstraat €6,98 (Z2), Apollolaan/Javastraat €5,37 (Z3), Osdorpplein
€3,01 (Z6), Buikslotermeerplein €1,72. Data: 78 zones, ~515 kB.

### Vrij parkeren
- In een zone maar buiten het betaalde venster → "Gratis op dit tijdstip".
- Buiten elke betaalde zone (bv. landelijk Noord) → "Geen betaald straattarief — mogelijk
  gratis of vergunninghouders". Geen misleidende terugval meer op een indicatief tarief.

## Status
- [x] Echte **Amsterdam-garages** uit RDW (tarief, locatie, capaciteit, live afstand).
- [x] Live **straat-tarief per zone** uit RDW (dag/tijd-vensters), voedt de app-vergelijking.
- [x] Private garage-exploitanten erbij (89 garages: Interparking, APCOA, ParkKing, P1,
      AMC + gemeente, via NPR-index op bbox). 43 met live tarief; Q-Park (23) en overige
      zonder gepubliceerd tarief worden getoond met locatie + "tarief bij exploitant" + link.
      Officiële Q-Park-data-aanvraag: zie docs/qpark-dataverzoek.md.
- [ ] Dynamische vrije plekken (Fase 2).
- [x] "Kan ik hier staan" (MVP): classificatie betaald / gratis / **vergunninghouders** per
      adres (231 VERGUNP-zones, lazy geladen). Bay-/bord-niveau (NDW-parkeervakken,
      Amsterdam parkeervakken-API, parkeerverbod E1) is een latere verfijning.
- [x] Periodieke verversing geautomatiseerd: GitHub Action (`.github/workflows/refresh-data.yml`)
      draait wekelijks de drie build-scripts, commit verse data → Netlify deployt automatisch.
      Scripts hebben een veiligheidsguard (niet schrijven bij te weinig resultaten).
