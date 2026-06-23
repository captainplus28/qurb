/* qurb engine — ported verbatim from the original index.html <script type="module"> block.
   Wrapped in initQurb() so it can run inside a React effect after mount.
   Logic (tariff math, PDOK/Nominatim calls, app-fee model, garages) is unchanged.
   eslint-disable -- intentional faithful port of legacy DOM code. */
/* eslint-disable */
// @ts-nocheck
export function initQurb() {

  /* ════════════════════════════ Config ════════════════════════════ */
  const CONFIG = Object.freeze({
    pdok: {
      suggest: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest',
      lookup:  'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup',
      reverse: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/free',
    },
    nominatim: {
      search: '/api/places',
    },
    debounceMs:   250,
    minQuery:     3,
    suggestRows:  6,
    suggestPlaceRows: 4,
    requestMs:    8000,   // per-request timeout
    maxGarages:   18,
    fallbackRate: 3.00,   // €/uur — landelijk gemiddelde wanneer geen stadcijfer bekend is
    reportEmail:  'meldingen@qurb.nl',   // TODO: definitief meld-adres instellen
  });

  // Indicatief gemeentetarief (€/uur) tot het zone-exacte cijfer uit de RDW-data komt.
  const MUNICIPAL_RATE = Object.freeze({
    amsterdam: 7.50, utrecht: 5.50, rotterdam: 3.75, 'den haag': 4.00, "'s-gravenhage": 4.00,
    haarlem: 4.40, leiden: 4.00, delft: 3.30, eindhoven: 3.20, groningen: 3.10,
    nijmegen: 3.10, maastricht: 3.40, tilburg: 2.90, breda: 2.80, arnhem: 2.90,
    zwolle: 2.70, "'s-hertogenbosch": 3.00,
  });

  const DISPLAY_NAME = Object.freeze({ "'s-gravenhage": 'Den Haag' });

  // Servicekostenmodel per parkeer-app. fee(rate, hours) → € bovenop het straattarief.
  const easyParkFee = (rate, hours) => Math.min(7, round2(Math.min(0.70, Math.max(0.19, 0.15 * rate)) * hours));
  const APPS = Object.freeze([
    { name: 'Parkmobile',    rule: '€0,52 per parkeeractie',                 fee: () => 0.52 },
    { name: 'EasyPark',      rule: '15% van tarief, €0,19–€0,70/uur, max €7', fee: easyParkFee },
    { name: 'Yellowbrick',   rule: '€0,49 per parkeeractie',                 fee: () => 0.49 },
    { name: 'ANWB Parkeren', rule: '€0,33 per actie, alleen voor leden',     fee: () => 0.33 },
    { name: 'Q-Park',        rule: 'Geen transactiekosten op straat',         fee: () => 0 },
  ]);

  /* ════════════════════════════ Utilities ════════════════════════════ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const eur = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

  /** Tagged template that HTML-escapes every interpolation by default.
   *  Arrays are joined as already-trusted fragments; raw(x) opts a value out. */
  const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const escapeHtml = (v) => String(v).replace(/[&<>"']/g, (c) => ESCAPE[c]);
  const raw = (value) => ({ raw: true, value: String(value) });
  function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      const piece = v == null ? ''
        : Array.isArray(v) ? v.join('')
        : v.raw ? v.value
        : escapeHtml(v);
      out += piece + strings[i + 1];
    }
    return out;
  }

  /** Only allow a bare hostname/path to become an https URL; reject anything else. */
  function safeHttps(url) {
    if (typeof url !== 'string' || !/^[\w.-]+(\/[\w./#?=&%-]*)?$/.test(url)) return null;
    try { return new URL('https://' + url).href; } catch { return null; }
  }

  function debounce(fn, ms) {
    let t;
    const wrapped = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    wrapped.cancel = () => clearTimeout(t);
    return wrapped;
  }

  const pad2 = (n) => String(n).padStart(2, '0');
  const toLocalInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const NBSP_THIN = ' ';
  const formatDistance = (m) => m >= 1000 ? `${(m / 1000).toFixed(1).replace('.', ',')}${NBSP_THIN}km` : `${m}${NBSP_THIN}m`;
  const formatDuration = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    return h && m ? `${h}u ${m}m` : h ? `${h}u` : `${m}m`;
  };

  /* ════════════════════════════ Network ════════════════════════════ */
  /** fetch JSON with a hard timeout and optional external abort signal. */
  async function fetchJson(url, { signal, accept = 'application/json' } = {}) {
    const timeout = AbortSignal.timeout(CONFIG.requestMs);
    const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const res = await fetch(url, { signal: composed, headers: { Accept: accept } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  // Small session-scoped cache for PDOK responses (bounded; survives soft reloads).
  const sessionCache = {
    get(key) {
      try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
      catch { return null; }
    },
    set(key, value) {
      try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* quota/private mode: skip */ }
    },
  };

  /* ════════════════════════════ PDOK address API ════════════════════════════ */
  async function suggestAddresses(query, signal) {
    const cacheKey = `pdok:s:${query.toLowerCase()}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return cached;

    const url = `${CONFIG.pdok.suggest}?rows=${CONFIG.suggestRows}&fq=type:adres&q=${encodeURIComponent(query)}`;
    const data = await fetchJson(url, { signal });
    const docs = data?.response?.docs ?? [];
    const items = docs
      .filter((d) => d && typeof d.weergavenaam === 'string')
      .map((d) => ({ id: String(d.id ?? ''), label: d.weergavenaam, source: 'pdok' }));
    sessionCache.set(cacheKey, items);
    return items;
  }

  /* ════════════════════════════ Nominatim place search (POIs, restaurants, etc.) ════════════════════════════ */
  async function suggestPlaces(query, signal) {
    const cacheKey = `osm:s:${query.toLowerCase()}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return cached;

    const url = `${CONFIG.nominatim.search}?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&countrycodes=nl&limit=${CONFIG.suggestPlaceRows}`;
    let docs;
    try {
      docs = await fetchJson(url, { signal }) ?? [];
    } catch { return []; }   // don't cache failures — retry next time
    const items = docs
      .filter((d) => d && d.display_name && d.lat && d.lon)
      .map((d) => {
        const name = d.name || d.address?.amenity || d.display_name.split(',')[0].trim();
        const street = d.address?.road || '';
        const city = d.address?.city || d.address?.town || d.address?.village || d.address?.municipality || '';
        return {
          id: `osm:${d.osm_type}:${d.osm_id}`,
          label: [name, street, city].filter(Boolean).join(', '),
          name,
          street,
          city,
          source: 'osm',
          lat: parseFloat(d.lat),
          lon: parseFloat(d.lon),
          municipality: city,
        };
      });
    sessionCache.set(cacheKey, items);
    return items;
  }

  async function lookupAddress(id) {
    const cacheKey = `pdok:l:${id}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return cached;

    const url = `${CONFIG.pdok.lookup}?fl=centroide_ll,gemeentenaam,straatnaam&id=${encodeURIComponent(id)}`;
    const data = await fetchJson(url);
    const doc = data?.response?.docs?.[0];
    const match = doc?.centroide_ll?.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
    if (!match) return null;
    const result = { lon: parseFloat(match[1]), lat: parseFloat(match[2]), municipality: doc.gemeentenaam ?? '', street: doc.straatnaam ?? null };
    sessionCache.set(cacheKey, result);
    return result;
  }

  /* ════════════════════════════ Parking bay (parkeervakken) verification ════════════════════════════ */
  // Tariff-zone polygons cover whole neighbourhoods and don't tell us whether a
  // specific street actually has parking bays. Amsterdam publishes a free,
  // CORS-enabled, per-street dataset of physical parking bays — use it to flag
  // streets (e.g. pedestrian areas) where the tariff is moot because you simply
  // can't park there. Not yet available for other cities.
  const PARKING_BAY_CITIES = { amsterdam: 'https://api.data.amsterdam.nl/v1/parkeervakken/parkeervakken/' };
  async function checkParkingBays(municipality, street) {
    const endpoint = municipality ? PARKING_BAY_CITIES[municipality.toLowerCase()] : null;
    if (!endpoint || !street) return null; // unsupported city — no verdict
    const cacheKey = `pvak:${municipality.toLowerCase()}:${street.toLowerCase()}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return cached;
    try {
      const url = `${endpoint}?straatnaam=${encodeURIComponent(street)}&_format=json`;
      const data = await fetchJson(url, { accept: '*/*' }); // this API 406s on a strict application/json Accept header
      const count = data?._embedded?.parkeervakken?.length ?? 0;
      const result = { found: count > 0, count };
      sessionCache.set(cacheKey, result);
      return result;
    } catch { return null; } // request failed — stay silent, don't falsely warn
  }

  async function reverseGeocode({ lon, lat }) {
    const cacheKey = `pdok:rev:${lon.toFixed(4)},${lat.toFixed(4)}`;
    if (sessionCache.has(cacheKey)) return sessionCache.get(cacheKey);
    try {
      const url = `${CONFIG.pdok.reverse}?lon=${lon}&lat=${lat}&fq=type:weg&rows=1`;
      const data = await fetchJson(url);
      const doc = data?.response?.docs?.[0];
      const street = doc?.straatnaam ?? null;
      sessionCache.set(cacheKey, street);
      return street;
    } catch { return null; }
  }

  /* ════════════════════════════ Per-municipality data (lazy, in-memory) ════════════════════════════ */
  // The frontend resolves a municipality → RDW area id → loads only that city's
  // street/permit/garage data on demand. Scales to all of NL without a server.
  const dataCache = new Map();          // url → Promise<json|null>
  let municipalityMap = null;           // { naam → areaId }
  let coverageMap = null;               // { areaId → #paid zones }

  async function loadJson(url, shape) {
    if (!dataCache.has(url)) {
      dataCache.set(url, fetchJson(url).then(shape).catch(() => null));
    }
    return dataCache.get(url);
  }

  async function getMunicipalityMap() {
    if (municipalityMap) return municipalityMap;
    municipalityMap = (await loadJson('data/gemeenten.json', (d) => d.gemeenten)) ?? {};
    return municipalityMap;
  }
  async function getCoverageMap() {
    if (coverageMap) return coverageMap;
    coverageMap = (await loadJson('data/dekking.json', (d) => d.betaald_zones)) ?? {};
    return coverageMap;
  }
  // Reliability tier per RDW area id: 'geverifieerd' | 'compleet' | 'onvoldoende'.
  // Generated by scripts/build_betrouwbaarheid.py. Cities not listed (or 'onvoldoende')
  // do NOT get a live street tariff — we never claim a price we can't trust.
  let reliabilityMap = null;
  async function getReliabilityMap() {
    if (reliabilityMap) return reliabilityMap;
    reliabilityMap = (await loadJson('data/betrouwbaarheid.json', (d) => d.tiers)) ?? {};
    return reliabilityMap;
  }
  const reliabilityTier = async (areaId) => (await getReliabilityMap())[areaId] ?? 'onvoldoende';
  const resolveAreaId = async (municipality) =>
    (await getMunicipalityMap())[(municipality ?? '').toLowerCase().trim()] ?? null;

  const loadStreetZones = (id) => loadJson(`data/${id}/straat.json`, (d) => d.zones ?? []).then((z) => z ?? []);
  const loadPermitZones = (id) => loadJson(`data/${id}/vergunning.json`, (d) => d.zones ?? []).then((z) => z ?? []);
  const loadGarages     = (id) => loadJson(`data/${id}/garages.json`, (d) => d.garages ?? []).then((g) => g ?? []);

  /* ════════════════════════════ Geometry ════════════════════════════ */
  const zoneCentroid = (zone) => { const pts = (zone.polys ?? []).flat(); if (!pts.length) return null; return { lat: pts.reduce((s,[,y])=>s+y,0)/pts.length, lon: pts.reduce((s,[x])=>s+x,0)/pts.length }; };
  function haversineMeters(a, b) {
    const R = 6371000, rad = (x) => x * Math.PI / 180;
    const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
  }
  const gmapsWalkHref = (_from, to) => `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lon}&travelmode=walking`;
  function pointInPolygon(pt, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt.lat) !== (yj > pt.lat) && pt.lon < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const inAnyPolygon = (pt, zone) => (zone.polys ?? []).some((p) => pointInPolygon(pt, p));

  /* ════════════════════════════ Tariff resolution ════════════════════════════ */
  const municipalRate = (municipality) => {
    const key = (municipality ?? '').toLowerCase().trim();
    if (!key) return null;
    return key in MUNICIPAL_RATE
      ? { rate: MUNICIPAL_RATE[key], source: municipality }
      : { rate: CONFIG.fallbackRate, source: 'landelijk gemiddelde' };
  };
  const displayCity = (s) => DISPLAY_NAME[(s ?? '').toLowerCase().trim()] ?? s;

  /** Zone-exact street tariff for a coordinate at a start time, or null outside coverage.
   *  Overlapping zone variants carry different products; the highest matching rate is
   *  the regular visitor hourly rate — what a visitor actually pays per hour. */
  async function streetRateAt(areaId, coord, start) {
    const zones = await loadStreetZones(areaId);
    if (!zones.length) return null;
    const hits = zones.filter((z) => inAnyPolygon(coord, z));
    if (!hits.length) return null;

    const weekday = start.getDay() === 0 ? 7 : start.getDay();     // 1=Mon … 7=Sun
    const minutes = start.getHours() * 60 + start.getMinutes();
    let rate = null, label = null;
    for (const zone of hits) {
      for (const w of zone.vensters ?? []) {
        if (w.days.includes(weekday) && minutes >= w.from && minutes <= w.to && (rate === null || w.eur > rate)) {
          rate = w.eur; label = zone.naam;
        }
      }
    }
    const matchZone = rate !== null ? (hits.find(z => z.naam === label) ?? hits[0]) : hits[0];
    return rate === null
      ? { rate: 0, label: matchZone.naam, areaid: matchZone.areaid, zoneCoord: zoneCentroid(matchZone), free: true }
      : { rate, label, areaid: matchZone.areaid, zoneCoord: zoneCentroid(matchZone) };
  }
  const inPermitZone = async (areaId, coord) =>
    (await loadPermitZones(areaId)).some((z) => inAnyPolygon(coord, z));

  /* ════════════════════════════ Domain model ════════════════════════════ */
  /** Resolve what a visitor pays on the street. Returns a `kind` (state) plus the
   *  reliability `tier` of the source data. The live-zone path runs only for cities
   *  whose open data is trustworthy ('geverifieerd'/'compleet'); for 'onvoldoende'
   *  cities we refuse to claim a tariff and say so honestly. */
  async function resolveStreet(place, start) {
    const fallback = place.rate; // indicative municipal €/uur, already known
    if (!place.areaId || !place.coord) return { kind: 'indicative', tier: null, rate: fallback, label: null };

    const tier = await reliabilityTier(place.areaId);
    if (tier === 'onvoldoende') {
      return { kind: 'unsupported', tier, rate: 0, label: 'Straattarief niet betrouwbaar beschikbaar' };
    }

    const street = await streetRateAt(place.areaId, place.coord, start);
    if (street && street.rate > 0) return { kind: 'paid', tier, rate: street.rate, label: street.label, areaid: street.areaid, zoneCoord: street.zoneCoord };
    if (street)                    return { kind: 'free', tier, rate: 0, label: `Gratis op dit tijdstip · ${street.label}`, areaid: street.areaid, zoneCoord: street.zoneCoord };
    if (await inPermitZone(place.areaId, place.coord)) return { kind: 'permit', tier, rate: 0, label: 'Vergunninghoudersgebied' };

    const coverage = await getCoverageMap();
    if ((coverage[place.areaId] ?? 0) > 0) return { kind: 'uncertain', tier, rate: 0, label: 'Zone niet te bepalen' };
    return { kind: 'nodata', tier, rate: 0, label: 'Geen betaald straatparkeren gevonden' };
  }

  function rankApps(rate, hours) {
    const base = round2(rate * hours);
    return APPS
      .map((app) => {
        const fee = round2(app.fee(rate, hours));
        return { name: app.name, rule: app.rule, fee, total: round2(base + fee) };
      })
      .sort((a, b) => a.total - b.total);
  }

  const GARAGE_TYPE = { Terreinparkeren: 'terrein', 'P+R': 'P+R', Carpoolparkeren: 'carpool' };
  function rankGarages(garages, coord, hours) {
    return garages
      .map((g) => {
        const priced = g.uur != null && g.uur > 0;
        const dayMax = priced ? (g.dagmax ?? round2(g.uur * 24)) : null;
        return {
          name: g.naam, operator: g.operator || '—', capacity: g.capaciteit, url: g.url,
          kind: GARAGE_TYPE[g.type] ?? null, lat: g.lat ?? null, lon: g.lon ?? null,
          distance: coord ? haversineMeters(coord, g) : null,
          hourly: g.uur, dayMax,
          cost: priced ? round2(Math.min(g.uur * hours, dayMax)) : null,
        };
      })
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || (a.cost ?? Infinity) - (b.cost ?? Infinity));
  }

  /* ════════════════════════════ State ════════════════════════════ */
  /* ── "Goedkoper verderop": goedkoopste zone binnen 500 m van de bestemming ── */
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
    if (best) {
      best.centroid = zoneCentroid(zones.find(z => z.areaid === best.areaid) ?? {});
    }
    return best;
  }

  const state = {
    place: null,   // { label, municipality, rate, coord:{lon,lat}|null, areaId:string|null }
  };

  /* ════════════════════════════ DOM refs ════════════════════════════ */
  const el = {
    form:      $('#search-form'),
    addr:      $('#addr'),
    whenChoice: $('#when-choice'),
    whenAtWrap: $('#when-at-wrap'),
    whenNow:    $('#when-now'),
    whenSpec:   $('#when-specific'),
    whenReset:  $('#when-reset'),
    start:      $('#start'),
    durVal:    $('#dur-val'),
    durMinus:  $('#dur-minus'),
    durPlus:   $('#dur-plus'),
    presets:       [...document.querySelectorAll('.dur__preset')],
    shortcuts:     [...document.querySelectorAll('.shortcut[data-min]')],
    shortcutLonger: $('#shortcut-longer'),
    suggest:   $('#suggest'),
    found:     $('#found'),
    tarief:    $('#tarief'),
    error:     $('#error'),
    results:   $('#results'),
  };

  /* ════════════════════════════ When + duration ════════════════════════════
   * Default: start = "Nu" + a duration; end is derived (start + duration).
   * "Nu" can be swapped for a specific start time. Duration via stepper. */
  const MIN_DUR = 15, MAX_DUR = 1440, STEP_DUR = 15;   // 15 min … 24 u, in 15-min steps
  let durationMin = 60;        // default 1 uur
  let startMode = 'now';       // 'now' | 'at'

  const durationLabelFull = (min) => (min >= 1440 ? 'Hele dag' : formatDuration(min));

  function renderDuration() {
    el.durVal.textContent = durationLabelFull(durationMin);
    el.durMinus.disabled = durationMin <= MIN_DUR;
    el.durPlus.disabled = durationMin >= MAX_DUR;
    el.presets.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.min) === durationMin)));
  }
  function stepDuration(dir) {
    durationMin = Math.min(MAX_DUR, Math.max(MIN_DUR, durationMin + dir * STEP_DUR));
    renderDuration();
  }
  function setStartMode(mode) {
    startMode = mode;
    const now = mode === 'now';
    el.whenAtWrap.hidden = now;
    el.whenNow.setAttribute('aria-pressed', String(now));
    el.whenNow.classList.toggle('toggle-btn--active', now);
    el.whenSpec.setAttribute('aria-pressed', String(!now));
    el.whenSpec.classList.toggle('toggle-btn--active', !now);
    if (!now) {
      if (!el.start.value) el.start.value = toLocalInput(new Date());
      requestAnimationFrame(() => {
        el.start.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        el.start.focus();
        try { el.start.showPicker(); } catch { /* niet ondersteund in oudere browsers */ }
      });
    }
  }
  function getStartTime() {
    if (startMode === 'now') return new Date();
    const v = new Date(el.start.value);
    return Number.isNaN(+v) ? new Date() : v;
  }
  function updateShortcutActive() {
    el.shortcuts.forEach((b) => b.classList.toggle('shortcut--active', Number(b.dataset.min) === durationMin));
  }

  function initWhenDuration() {
    el.durMinus.addEventListener('click', () => { stepDuration(-1); updateShortcutActive(); });
    el.durPlus.addEventListener('click', () => { stepDuration(1); updateShortcutActive(); });
    el.whenNow.addEventListener('click', () => setStartMode('now'));
    el.whenSpec.addEventListener('click', () => setStartMode('at'));
    el.whenReset?.addEventListener('click', () => setStartMode('now'));
    el.presets.forEach((b) => b.addEventListener('click', () => { durationMin = Number(b.dataset.min); renderDuration(); updateShortcutActive(); }));

    // Shortcut buttons
    el.shortcuts.forEach((b) => {
      b.addEventListener('click', () => {
        durationMin = Number(b.dataset.min);
        renderDuration();
        updateShortcutActive();
        if (state.place?.rate != null) compare();
      });
    });
    el.shortcutLonger.addEventListener('click', () => setStartMode('at'));

    renderDuration();
    updateShortcutActive();
  }

  /* ════════════════════════════ Autocomplete (WAI-ARIA combobox) ════════════════════════════ */
  const combobox = (() => {
    let options = [];       // [{ id, label }]
    let activeIndex = -1;
    let inflight = null;    // AbortController for the in-flight suggest call

    const close = () => {
      el.suggest.dataset.open = 'false';
      el.suggest.replaceChildren();
      el.addr.setAttribute('aria-expanded', 'false');
      el.addr.removeAttribute('aria-activedescendant');
      options = []; activeIndex = -1;
    };

    const renderEmpty = (text) => {
      el.suggest.innerHTML = html`<li class="suggest__empty" role="presentation">${text}</li>`;
      el.suggest.dataset.open = 'true';
      el.addr.setAttribute('aria-expanded', 'true');
    };

    const ICON_ADDRESS = '<svg class="suggest__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>';
    const ICON_PLACE = '<svg class="suggest__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>';

    const render = () => {
      el.suggest.innerHTML = options
        .map((o, i) => {
          const icon = o.source === 'osm' ? ICON_PLACE : ICON_ADDRESS;
          const body = o.source === 'osm'
            ? html`<span class="suggest__name">${o.name}</span> <span class="suggest__street">${[o.street, o.city].filter(Boolean).join(', ')}</span>`
            : html`${o.label}`;
          return html`<li class="suggest__item" role="option" id="opt-${i}" aria-selected="${i === activeIndex}">${raw(icon)}${raw(body)}</li>`;
        })
        .join('');
      el.suggest.dataset.open = 'true';
      el.addr.setAttribute('aria-expanded', 'true');
    };

    const setActive = (i) => {
      activeIndex = (i + options.length) % options.length;
      [...el.suggest.children].forEach((li, idx) => li.setAttribute('aria-selected', String(idx === activeIndex)));
      el.addr.setAttribute('aria-activedescendant', `opt-${activeIndex}`);
      el.suggest.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
    };

    async function choose(option) {
      el.addr.value = option.label;
      close();

      if (option.source === 'osm') {
        // Nominatim already gives us the coordinate + municipality directly.
        const municipality = option.municipality || cityFromLabel(option.label);
        setPlace({ label: option.label, placeName: option.name, street: option.street, municipality, ...rateFor(municipality), coord: null, areaId: null });
        try {
          const areaId = await resolveAreaId(municipality);
          setPlace({
            label: option.label,
            placeName: option.name,
            street: option.street,
            municipality,
            ...rateFor(municipality),
            coord: { lon: option.lon, lat: option.lat },
            areaId,
          });
        } catch { /* keep the indicative estimate; comparison still works */ }
        return;
      }

      // Optimistic: indicative municipal rate from the address text…
      const guessedCity = cityFromLabel(option.label);
      setPlace({ label: option.label, municipality: guessedCity, ...rateFor(guessedCity), coord: null, areaId: null });
      // …then refine with the exact coordinate + RDW area id.
      try {
        const place = await lookupAddress(option.id);
        if (place) {
          // PDOK returns the current municipality (e.g. "Nissewaard"); the RDW area
          // map keys on the historical place name (e.g. "Spijkenisse"). Try both, so
          // merged municipalities still resolve to their area id and reliability tier.
          const areaId = (await resolveAreaId(place.municipality)) ?? (await resolveAreaId(guessedCity));
          setPlace({
            label: option.label,
            street: place.street,
            municipality: place.municipality || guessedCity,
            ...rateFor(place.municipality || guessedCity),
            coord: { lon: place.lon, lat: place.lat },
            areaId,
          });
        }
      } catch { /* keep the indicative estimate; comparison still works */ }
    }

    const search = debounce(async (query) => {
      inflight?.abort();
      inflight = new AbortController();
      try {
        const [addresses, places] = await Promise.all([
          suggestAddresses(query, inflight.signal).catch(() => []),
          suggestPlaces(query, inflight.signal).catch(() => []),
        ]);
        options = [...addresses, ...places];
        activeIndex = -1;
        if (options.length) render();
        else renderEmpty('Geen adres of locatie gevonden');
      } catch (err) {
        if (err?.name !== 'AbortError') close();
      }
    }, CONFIG.debounceMs);

    el.addr.addEventListener('input', () => {
      clearFound();
      const q = el.addr.value.trim();
      if (q.length < CONFIG.minQuery) { search.cancel(); close(); return; }
      search(q);
    });

    el.addr.addEventListener('keydown', (e) => {
      const open = el.suggest.dataset.open === 'true' && options.length > 0;
      switch (e.key) {
        case 'ArrowDown': if (open) { e.preventDefault(); setActive(activeIndex + 1); } break;
        case 'ArrowUp':   if (open) { e.preventDefault(); setActive(activeIndex - 1); } break;
        case 'Enter':
          if (open && activeIndex >= 0) { e.preventDefault(); choose(options[activeIndex]); }
          break;
        case 'Escape': if (open) { e.preventDefault(); close(); } break;
      }
    });

    el.suggest.addEventListener('click', (e) => {
      const li = e.target.closest('.suggest__item');
      if (!li) return;
      choose(options[[...el.suggest.children].indexOf(li)]);
    });

    document.addEventListener('click', (e) => {
      if (!el.suggest.contains(e.target) && e.target !== el.addr) close();
    });

    return { close };
  })();

  function cityFromLabel(label) {
    if (!label) return '';
    const tail = label.split(',').pop().trim();
    return tail.replace(/^\s*\d{4}\s?[A-Za-z]{2}\s*/, '').trim();
  }
  const rateFor = (city) => {
    const r = municipalRate(city);
    return { rate: r ? r.rate : null, rateSource: r ? r.source : null };
  };

  /* ════════════════════════════ Search-meta (found + rate) ════════════════════════════ */
  function setPlace(place) {
    state.place = place;
    el.found.hidden = false;
    el.found.textContent = place.label;
    el.tarief.innerHTML = place.rate != null
      ? html`&nbsp;· gemeentetarief <strong>${eur.format(place.rate)}/uur</strong> <span style="color:var(--muted-soft)">(${place.rateSource})</span>`
      : '';
  }
  function clearFound() {
    el.found.hidden = true;
    el.found.textContent = '';
    el.tarief.textContent = '';
    state.place = null;
  }

  /* ════════════════════════════ Rendering ════════════════════════════ */
  const showError = (message) => {
    el.results.replaceChildren();
    el.error.innerHTML = html`<p class="banner" role="alert">${message}</p>`;
  };
  const clearError = () => el.error.replaceChildren();
  const setBusy = (busy) => {
    el.results.setAttribute('aria-busy', String(busy));
    if (busy) el.results.innerHTML = html`<div class="spinner" role="status">Parkeeropties berekenen…</div>`;
  };

  function renderStreet(street, base, hours) {
    if (street.kind === 'unsupported') return html`<div class="info anim">Voor deze gemeente is het straattarief <strong>niet betrouwbaar</strong> uit de open RDW-data te bepalen — de zonegegevens zijn hier te onvolledig. We tonen daarom geen straatprijs. Controleer de <strong>automaat of je parkeerapp</strong> voor het juiste tarief; de garages hieronder kloppen wel.</div>`;
    if (street.kind === 'permit') return html`<div class="info anim">Hier geldt <strong>vergunninghoudersparkeren</strong>. Als bezoeker kun je op straat doorgaans niet parkeren — kies een garage hieronder, of controleer of er een bezoekersregeling geldt.</div>`;
    if (street.kind === 'uncertain') return html`<div class="info anim">Deze gemeente kent <strong>betaald parkeren</strong>, maar we konden de zone op dit punt niet bepalen — de open parkeerdata is hier onvolledig. Controleer de <strong>automaat of je parkeerapp</strong> voor het juiste tarief en de zonecode.</div>`;
    if (street.kind === 'free' || street.kind === 'nodata') {
      return html`<div class="info anim">${street.kind === 'free'
        ? 'Op dit tijdstip is betaald straatparkeren hier niet van kracht — je parkeert gratis.'
        : 'Hier vonden we geen betaald of vergunningregime in de RDW-data. Waarschijnlijk parkeer je gratis — controleer het bord ter plekke.'}</div>`;
    }
    // paid / indicative → ranked app table
    const ranked = rankApps(street.rate, hours);
    const cheapest = ranked[0]?.total ?? 0;
    const rows = ranked.map((a, i) => {
      const best = a.total === cheapest;
      const delta = round2(a.total - cheapest);
      const right = best
        ? (a.fee === 0 ? 'geen servicekosten' : `${eur.format(a.fee)} servicekosten`)
        : `+${eur.format(delta)}`;
      return html`<li class="row anim" style="animation-delay:${(0.05 * (i + 1)).toFixed(2)}s">
        <div><p class="row__name">${a.name}${best ? raw('<span class="tag">goedkoopst</span>') : ''}</p><p class="row__sub">${a.rule}</p></div>
        <div class="row__right"><p class="row__total">${eur.format(a.total)}</p><p class="row__delta${best ? '' : ' row__delta--higher'}">${right}</p></div>
      </li>`;
    });
    const note = street.tier === 'compleet'
      ? html`<p class="info anim" style="animation-delay:.3s">Tarief uit de open RDW-data, <strong>indicatief</strong> — voor deze gemeente niet handmatig geverifieerd. Twijfel je? Controleer de automaat.</p>`
      : '';
    return html`<ul class="rows">${rows}</ul>${raw(note)}`;
  }

  function renderGarages(ranked, totalCount) {
    const shown = ranked.slice(0, CONFIG.maxGarages);
    const priced = shown.filter((g) => g.cost != null).map((g) => g.cost);
    const cheapest = priced.length ? Math.min(...priced) : null;
    const rows = shown.map((g, i) => {
      const best = g.cost != null && g.cost === cheapest;
      const dist = g.distance != null ? `${formatDistance(g.distance)} · ` : '';
      const sub = (g.kind ? `${g.kind} · ` : '') + (g.cost != null ? `${eur.format(g.hourly)}/uur, max ${eur.format(g.dayMax)}/dag` : 'tarief bij exploitant');
      const safeUrl = g.url ? safeHttps(g.url) : null;
      const route = g.lat != null && g.lon != null ? html`<p class="row__route"><a href="${gmapsWalkHref(null, g)}" target="_blank" rel="noopener">Routebeschrijving →</a></p>` : '';
      
      const right = g.cost != null ? eur.format(g.cost)
        : safeUrl ? raw(html`<a class="row__link" href="${safeUrl}" target="_blank" rel="noopener">tarief →</a>`) : '—';
      return html`<li class="row anim" style="animation-delay:${(0.05 * (Math.min(i, 12) + 1)).toFixed(2)}s">
        <div><p class="row__name">${g.name}${best ? raw('<span class="tag">goedkoopst</span>') : ''}</p><p class="row__sub">${g.operator} · ${raw(dist)}${sub}</p>${raw(route)}</div>
        <div class="row__right"><p class="row__total">${right}</p><p class="row__delta">${g.capacity ? `${g.capacity} plaatsen` : ''}</p></div>
      </li>`;
    });
    const hidden = totalCount - shown.length;
    return html`<ul class="rows">${rows}</ul>
      <p class="info anim" style="animation-delay:.4s">Dichtstbijzijnde ${shown.length} garages${hidden > 0 ? ` (${hidden} verder weg niet getoond)` : ''}. Live locaties en tarieven uit de open parkeerdata van de RDW (CC-0). Garages zonder gepubliceerd tarief (o.a. Q-Park) tonen we met een link naar de exploitant.</p>`;
  }

  /** Knop die de meld-modal opent met vooraf ingevulde context. */
  function reportBtn(street, start, end) {
    const p = state.place;
    const ctx = [
      `Adres: ${p?.label ?? '-'}`,
      `Gemeente: ${p?.municipality ?? '-'}`,
      `Straat-status: ${street.label ?? street.kind}`,
      `Gedetecteerd tarief: ${street.rate ? `${eur.format(street.rate)}/uur` : 'geen'}`,
      `Betrouwbaarheid: ${street.tier ?? 'n.v.t.'}`,
      `Tijdvak: ${start.toLocaleString('nl-NL')} – ${end.toLocaleString('nl-NL')}`,
    ].join('\n');
    // data-attrib wordt door de click-handler opgepakt
    return `data-report="${escapeHtml(ctx)}"`;
  }

  const FLAG = raw('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>');

  function renderResults({ street, durationMin, base, hours, garages, start, end, tip, parkingBays }) {
    const tipLocatie = tip ? (tip.naam) : '';
    const tipHtml = tip ? html`<div class="tip anim" role="note" id="tip-block"><p class="tip__title">Goedkoper verderop</p><p class="tip__body"><strong>${eur.format(tip.saving)}/uur goedkoper</strong>${tip.rate === 0 ? ' (op dit tijdstip gratis)' : ''} — <span id="tip-locatie">${tipLocatie}</span> · ${eur.format(tip.rate)}/uur · ${formatDistance(tip.distance)} lopen vanaf je bestemming.</p><a class="tip__link" href="${gmapsWalkHref(state.place.coord, tip)}" target="_blank" rel="noopener">Bekijk looproute in Google Maps →</a></div>` : '';
    const summaryRight = street.kind === 'permit' ? '—'
      : street.kind === 'uncertain' || street.kind === 'unsupported' ? '?'
      : (street.kind === 'free' || street.kind === 'nodata') ? 'Gratis'
      : eur.format(base);
    const streetName = state.place?.street || (state.place?.label ? state.place.label.split(',')[0].trim() : null);
    const summarySub = streetName
      ? `${streetName}${['paid', 'indicative'].includes(street.kind) ? ` · ${eur.format(street.rate)}/uur` : ''}`
      : 'Gelijk voor alle apps';
    const cityLabel = state.place?.municipality ? ` in ${displayCity(state.place.municipality)}` : '';

    const garagesHtml = garages == null
      ? html`<p class="info anim">Geen garagedata voor ${displayCity(state.place?.municipality) || 'deze plaats'}. In de volledige versie komen alle garages live uit de open parkeerdata van de RDW.</p>`
      : renderGarages(garages.ranked, garages.total);

    const parkLocationHtml = street.zoneCoord ? html`<div class="park-loc anim"><div class="park-loc__text"><span class="park-loc__title">Parkeerlocatie</span><span class="park-loc__body">${streetName ?? street.label ?? 'Parkeerzone'}${state.place?.placeName ? ` — bij ${state.place.placeName}` : ''}</span></div><a class="park-loc__link" href="${gmapsWalkHref(null, street.zoneCoord)}" target="_blank" rel="noopener">Route →</a></div>` : '';
    const noBaysHtml = parkingBays?.found === false ? html`<div class="warn anim" role="note"><p class="warn__title">Waarschijnlijk geen parkeerplek hier</p><p class="warn__body">Op ${streetName ?? 'deze straat'} zijn geen parkeervakken gevonden — het is mogelijk een voetgangersgebied of een straat zonder parkeerplaatsen. ${tip ? 'Bekijk het alternatief hierboven, of c' : 'C'}ontroleer ter plekke voordat je hier parkeert.</p></div>` : '';

    el.results.innerHTML = html`
      <section class="results" aria-label="Resultaten">
        <div class="results__inner">${raw(noBaysHtml)}${raw(tipHtml)}
          <div class="summary anim">
            <div><p class="summary__label">Duur</p><p class="summary__value">${formatDuration(durationMin)}</p></div>
            <div><p class="summary__label">${['permit', 'uncertain', 'unsupported'].includes(street.kind) ? 'Straat' : 'Basisprijs'}</p><p class="summary__value">${summaryRight}</p><p class="summary__sub">${summarySub}</p></div>
          </div>
          ${raw(parkLocationHtml)}
          <div class="group">
            <h2 class="group__label">Op straat</h2>
            ${raw(renderStreet(street, base, hours))}
            <p class="report"><button class="report__btn" type="button" ${reportBtn(street, start, end)}>${FLAG} Deze data klopt niet</button></p>
          </div>
          <div class="group">
            <h2 class="group__label">Garages &amp; terreinen${cityLabel}</h2>
            ${raw(garagesHtml)}
          </div>
        </div>
      </section>`;
    el.results.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ════════════════════════════ Compare (controller) ════════════════════════════ */
  async function compare() {
    clearError();
    combobox.close();

    if (!state.place || state.place.rate == null) return showError('Kies eerst een adres uit de lijst, dan verschijnt het gemeentetarief.');
    const start = getStartTime();
    const ms = durationMin * 60_000;
    const end = new Date(start.getTime() + ms);
    setBusy(true);
    try {
      const hours = ms / 3_600_000;
      const street = await resolveStreet(state.place, start);
      const base = round2(street.rate * hours);
      const tip = street.kind === 'paid' ? await findCheaperNearby(state.place.areaId, state.place.coord, street.rate, start) : null;
      const parkingBays = ['paid', 'free'].includes(street.kind)
        ? await checkParkingBays(state.place.municipality, state.place.street)
        : null;

      let garages = null;
      if (state.place.areaId) {
        const list = await loadGarages(state.place.areaId);
        if (list.length) garages = { ranked: rankGarages(list, state.place.coord, hours), total: list.length };
      }
      renderResults({ street, durationMin: Math.round(ms / 60000), base, hours, garages, start, end, tip, parkingBays });
      if (tip?.centroid) {
        reverseGeocode(tip.centroid).then((straat) => {
          const el = document.getElementById('tip-locatie');
          if (el && straat) el.textContent = straat;
        });
      }
    } catch {
      showError('Er ging iets mis bij het ophalen van de parkeerdata. Probeer het zo nog eens.');
    } finally {
      setBusy(false);
    }
  }

  /* ════════════════════════════ Meld-modal ════════════════════════════ */
  const meldOverlay = document.getElementById('meld-overlay');
  const meldForm    = document.getElementById('meld-form');
  let   meldContext = {};   // vastgelegd bij openen

  function openMeldModal(context) {
    meldContext = context;
    document.getElementById('meld-context').value = context.tekst ?? '';
    meldOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    meldForm.reset();
    meldOverlay.querySelector('.meld-modal-inner').style.display = '';
    meldOverlay.querySelector('.meld-bedankt').style.display = 'none';
  }

  function closeMeldModal() {
    meldOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('meld-cancel').addEventListener('click', closeMeldModal);
  meldOverlay.addEventListener('click', (e) => { if (e.target === meldOverlay) closeMeldModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMeldModal(); });

  meldForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = meldForm.querySelector('.meld-submit');
    btn.disabled = true; btn.textContent = 'Versturen…';
    try {
      const data = new FormData(meldForm);
      data.set('context', meldContext.tekst ?? '');
      await fetch('https://formspree.io/f/xwvjzylg', {
        method: 'POST', body: data, headers: { Accept: 'application/json' }
      });
      meldOverlay.querySelector('.meld-modal-inner').style.display = 'none';
      meldOverlay.querySelector('.meld-bedankt').style.display = '';
    } catch {
      btn.disabled = false; btn.textContent = 'Verstuur melding';
      alert('Er ging iets mis. Probeer het opnieuw.');
    }
  });

  /* ════════════════════════════ Boot ════════════════════════════ */
  initWhenDuration();
  el.form.addEventListener('submit', (e) => { e.preventDefault(); compare(); });
  el.results.addEventListener('click', (e) => {
    const btn = e.target.closest('.report__btn');
    if (!btn) return;
    openMeldModal({ tekst: btn.dataset.report ?? '' });
  });
}
