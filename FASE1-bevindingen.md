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

## Eerstvolgende concrete stap (voorstel)
1. Echte **Amsterdam-garages** uit RDW in JSON (volledig geverifieerd pad) — vervangt de gesimuleerde garagetabel.
2. Parallel: BP↔T-mapping kraken via de NPR-feed → live **straat**-tarief per zone.
