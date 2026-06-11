#!/usr/bin/env python3
"""Eenmalige patch: Google Maps looproutes + 'Goedkoper verderop' tip-blok
op index.html en alle stedenpagina's. Idempotent (slaat al gepatchte files over)."""
import sys
from pathlib import Path

FILES = ["index.html", "amsterdam.html", "rotterdam.html", "den-haag.html",
         "utrecht.html", "eindhoven.html", "groningen.html", "haarlem.html", "leiden.html"]

HELPERS = """const gmapsWalkHref = (from, to) => `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=walking`;
  """

TIP_FNS = """/* ── "Goedkoper verderop": goedkoopste zone binnen 500 m van de bestemming ── */
  const NEARBY_TIP = { maxMeters: 500, minSavingEur: 0.5, minSavingPct: 0.15 };
  function zoneRateAt(zone, start) {
    const weekday = start.getDay() === 0 ? 7 : start.getDay();
    const minutes = start.getHours() * 60 + start.getMinutes();
    let rate = 0;
    for (const w of zone.vensters ?? []) if (w.days.includes(weekday) && minutes >= w.from && minutes <= w.to && w.eur > rate) rate = w.eur;
    return rate;
  }
  function nearestZonePoint(coord, zone) {
    let best = null;
    for (const poly of zone.polys ?? []) for (const [lon, lat] of poly) {
      const distance = haversineMeters(coord, { lat, lon });
      if (!best || distance < best.distance) best = { distance, lat, lon };
    }
    return best;
  }
  async function findCheaperNearby(areaId, coord, currentRate, start) {
    if (!areaId || !coord || !(currentRate > 0)) return null;
    const zones = await loadStreetZones(areaId);
    let best = null;
    for (const zone of zones) {
      if (inAnyPolygon(coord, zone)) continue;
      const near = nearestZonePoint(coord, zone);
      if (!near || near.distance > NEARBY_TIP.maxMeters) continue;
      const rate = zoneRateAt(zone, start);
      const saving = round2(currentRate - rate);
      if (saving < NEARBY_TIP.minSavingEur || saving < round2(currentRate * NEARBY_TIP.minSavingPct)) continue;
      if (!best || rate < best.rate || (rate === best.rate && near.distance < best.distance)) best = { areaid: zone.areaid, naam: zone.naam, rate, saving, ...near };
    }
    return best;
  }

  """

ROUTE_CALC = """const origin = state.place?.coord; const route = origin && g.lat != null && g.lon != null ? html`<p class="row__route"><a href="${gmapsWalkHref(origin, g)}" target="_blank" rel="noopener">Routebeschrijving →</a></p>` : '';
      """

TIP_HTML = """const tipHtml = tip ? html`<div class="tip anim" role="note"><p class="tip__title">Goedkoper verderop</p><p class="tip__body"><strong>${eur.format(tip.saving)}/uur goedkoper</strong>${tip.rate === 0 ? ' (op dit tijdstip gratis)' : ''} in zone ${tip.areaid} · ${tip.naam} — ${formatDistance(tip.distance)} lopen vanaf je bestemming.</p><a class="tip__link" href="${gmapsWalkHref(state.place.coord, tip)}" target="_blank" rel="noopener">Bekijk looproute in Google Maps →</a></div>` : '';
    """

CSS = """    .tip { background: rgba(124,199,154,.12); border: 1px solid rgba(124,199,154,.45); border-radius: var(--radius-md, 12px); padding: 16px 20px; margin-block-end: 28px; }
    .tip__title { font-size: 13px; font-weight: 700; letter-spacing: .3px; text-transform: uppercase; color: var(--results-link, #7cc79a); margin: 0 0 6px; }
    .tip__body { font-size: 14px; line-height: 1.6; color: var(--results-text, #fff); margin: 0 0 10px; }
    .tip__link { font-size: 14px; font-weight: 600; color: var(--results-link, #7cc79a); text-decoration: none; }
    .tip__link:hover { text-decoration: underline; }
    .row__route { margin-block-start: 4px; font-size: 13px; }
    .row__route a { color: var(--results-link, #7cc79a); text-decoration: none; }
    .row__route a:hover { text-decoration: underline; }
"""

SUBS = [
    # (anchor, replacement-with-anchor)
    ("function pointInPolygon(", HELPERS + "function pointInPolygon("),
    ("kind: GARAGE_TYPE[g.type] ?? null,",
     "kind: GARAGE_TYPE[g.type] ?? null, lat: g.lat ?? null, lon: g.lon ?? null,"),
    ("const safeUrl = g.url ? safeHttps(g.url) : null;",
     "const safeUrl = g.url ? safeHttps(g.url) : null;\n      " + ROUTE_CALC.rstrip() + "\n      "),
    ("${sub}</p></div>", "${sub}</p>${raw(route)}</div>"),
    ("const state = {", TIP_FNS + "const state = {"),
    ("const base = round2(street.rate * hours);",
     "const base = round2(street.rate * hours);\n      const tip = street.kind === 'paid' ? await findCheaperNearby(state.place.areaId, state.place.coord, street.rate, start) : null;"),
    ("base, hours, garages, start, end });", "base, hours, garages, start, end, tip });"),
    ("function renderResults({ street, durationMin, base, hours, garages, start, end })",
     "function renderResults({ street, durationMin, base, hours, garages, start, end, tip })"),
    ("const summaryRight = street.kind === 'permit' ? '—'",
     TIP_HTML + "const summaryRight = street.kind === 'permit' ? '—'"),
    ('<div class="results__inner">', '<div class="results__inner">${raw(tipHtml)}'),
    ("</style>", CSS + "  </style>"),
]

for name in FILES:
    p = Path(name)
    text = p.read_text(encoding="utf-8")
    if "findCheaperNearby" in text:
        print(f"{name}: al gepatcht, overgeslagen")
        continue
    for anchor, repl in SUBS:
        n = text.count(anchor)
        if n != 1:
            sys.exit(f"{name}: anchor {n}x gevonden (verwacht 1): {anchor[:60]}")
        text = text.replace(anchor, repl)
    p.write_text(text, encoding="utf-8")
    print(f"{name}: gepatcht")
