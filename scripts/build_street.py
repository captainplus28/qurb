#!/usr/bin/env python3
"""
qurb · Fase 1 datapijplijn — echt straat-tarief per zone (Amsterdam) uit RDW.

Bron: NPR v2 static feed per tariefzone (CC-0). Elke BETAALDP-zone levert:
  - specifications[0].areaGeometry : GeoJSON-polygon (zonegrens, WGS84)
  - tariffs[] : per dag/tijd-venster intervalRates {charge, chargePeriod, durationType}

Uurtarief = charge / (chargePeriod/60)   (durationType 'Minutes')
We bewaren per zone de actuele vensters: {days, from, to, eurPerHour}.
Hiermee rekent de app dag/avond/zondag/gratis-uren correct mee.

Uitvoer: data/amsterdam-straat.json
Gebruik:  python3 scripts/build_street.py [--limit N]
"""
import json, sys, time, os, re, urllib.parse, urllib.request

# Areamanager-id als eerste argument (default Amsterdam 363). Uitvoer per gemeente: data/<id>/.
AREAMANAGER = next((a for a in sys.argv[1:] if not a.startswith("--")), "363")
SOCRATA = "https://opendata.rdw.nl/resource"
NPR_STATIC = "https://npropendata.rdw.nl/parkingdata/v2/static"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", AREAMANAGER, "straat.json")
NOW = time.time()
DAYMAP = {"Mon":1,"Tue":2,"Wed":3,"Thu":4,"Fri":5,"Sat":6,"Sun":7}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent":"qurb-datapijplijn/1.0"})
    for poging in range(4):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except Exception:
            if poging == 3: raise
            time.sleep(2 + poging)

def soql(dataset, where, select=None, limit=5000):
    p = {"$where": where, "$limit": str(limit)}
    if select: p["$select"] = select
    return get(f"{SOCRATA}/{dataset}.json?" + urllib.parse.urlencode(p))

def r5(c):  # rond coordinaat op ~1 m
    return [round(float(c[0]),5), round(float(c[1]),5)]

def polys_from_geojson(geom):
    """GeoJSON Polygon/MultiPolygon -> lijst van buitenringen [[lon,lat],...]."""
    if not geom: return []
    t = geom.get("type"); co = geom.get("coordinates") or []
    if t == "Polygon" and co:
        return [[r5(p) for p in co[0]]]
    if t == "MultiPolygon":
        return [[r5(p) for p in poly[0]] for poly in co if poly]
    return []

def polys_from_wkt(wkt):
    """WKT POLYGON/MULTIPOLYGON -> lijst van buitenringen [[lon,lat],...]. Robuust."""
    out = []
    if not wkt: return out
    for ring in re.findall(r"\(\(([^()]*?)\)", wkt):   # buitenring van elk (sub)polygoon
        pts = []
        for pt in ring.split(","):
            xy = pt.replace("(","").replace(")","").split()
            if len(xy) >= 2:
                try: pts.append([round(float(xy[0]),5), round(float(xy[1]),5)])
                except ValueError: pass
        if len(pts) >= 3: out.append(pts)
    return out

def geometrie_socrata(areaid):
    rows = soql("nsk3-v9n7",
                f"areamanagerid='{AREAMANAGER}' AND areaid='{areaid}'",
                select="areageometryastext", limit=10)
    polys = []
    for r in rows:
        polys += polys_from_wkt(r.get("areageometryastext",""))
    return polys

# Een chargePeriod van >= 8 uur in één blok = feitelijk een dagtarief:
# je betaalt het hele dagbedrag direct, ook voor een kort bezoek, en er is
# geen uur-optie beschikbaar. Zones met kortere blokken (bijv. 6 uur) hebben
# naast het blok ook een per-minuuttarief — dat zijn gewone betaalzones.
DAGBLOK_MIN = 480

def current_interval(interval_rates):
    """Kies de meest representatieve intervalRate die nu geldig is.

    Strategie: als er zowel een kort (per-minuut/uur) als een lang blok beschikbaar
    zijn, kies dan het kortste — dat is het feitelijke uurtarief. Alleen als álle
    open-eind-tarieven een lang blok zijn (>= DAGBLOK_MIN) spreken we van een
    dagtarief-zone zonder uur-optie.
    """
    cands = [r for r in interval_rates
             if r.get("validityStartOfPeriod",0) <= NOW
             and (r.get("validityEndOfPeriod") is None or r["validityEndOfPeriod"] > NOW)]
    if not cands: return None
    # voorkeur voor de open-eind duurband (durationUntil == -1), anders de eerste
    flat = [r for r in cands if r.get("durationUntil",-1) in (-1, None)]
    pool = flat or cands
    # Onder de open-eind-tarieven: kies het kortste chargePeriod.
    # Zo pakken we het uur-/minuuttarief als dat naast een dagtarief-blok bestaat.
    pool = [r for r in pool if r.get("durationType") == "Minutes"
            and (r.get("chargePeriod") or 0) > 0]
    if not pool: return None
    r = min(pool, key=lambda x: x["chargePeriod"])
    return r

def windows_for_zone(tariffs):
    out = []
    for t in tariffs:
        ir = current_interval(t.get("intervalRates") or [])
        if ir is None: continue
        cp = ir["chargePeriod"]; charge = round(float(ir["charge"]), 2)
        days = [DAYMAP[d] for d in t.get("validityDays",[]) if d in DAYMAP]
        if not days: continue
        vf, vu = t.get("validityFromTime",{}), t.get("validityUntilTime",{})
        w = {
            "days": days,
            "from": vf.get("h",0)*60 + vf.get("m",0),
            "to":   vu.get("h",0)*60 + vu.get("m",0),
            "eur":  round(charge / (cp/60.0), 2),   # uurtarief-equivalent (back-compat + sortering)
        }
        if cp >= DAGBLOK_MIN:   # vast dag-/bloktarief: bedrag geldt per blok, niet per uur
            w["dag"] = charge
            w["blok"] = cp
        out.append(w)
    return out

def main():
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit")+1])

    zones = soql("mz4f-59fw",
                 f"areamanagerid='{AREAMANAGER}' AND usageid='BETAALDP'",
                 select="areaid,uuid,areaname")
    if limit: zones = zones[:limit]

    out = []
    for z in zones:
        uuid = z.get("uuid"); areaid = z["areaid"]
        if not uuid: continue
        try:
            s = get(f"{NPR_STATIC}/{uuid}")
            info = s.get("parkingFacilityInformation", {})
            specs = info.get("specifications") or []
            # Socrata-geometrie is primair: bevat álle (multi-part) ringen van de zone.
            polys = geometrie_socrata(areaid)
            if not polys:
                polys = polys_from_geojson(specs[0].get("areaGeometry") if specs else None)
            if not polys:
                continue
            wins = windows_for_zone(info.get("tariffs") or [])
            if not wins:
                continue
            out.append({
                "areaid": areaid,
                "naam": info.get("name") or areaid,
                "polys": polys,
                "vensters": wins,
            })
            dag = next((w["eur"] for w in wins if 1 in w["days"] and w["from"]<=720<=w["to"]), None)
            pts = sum(len(p) for p in polys)
            print(f"  ✓ {areaid} {info.get('name','')[:38]}: {len(wins)} vensters"
                  + (f", ma-middag €{dag}/uur" if dag else "") + f", {pts} pt/{len(polys)} poly", file=sys.stderr)
            time.sleep(0.06)
        except Exception as e:
            print(f"  ! {areaid} ({uuid}): {e}", file=sys.stderr)

    if zones and not out:
        sys.exit(f"FOUT: {len(zones)} BETAALDP-zones gevonden maar 0 bruikbaar — RDW mogelijk onbereikbaar; niet overschreven.")
    payload = {"areamanagerid":AREAMANAGER,
               "bron":"RDW NPR Open Parkeerdata (CC-0)",
               "gegenereerd": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "zones": out}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",",":"))
    sz = os.path.getsize(OUT)/1024
    print(f"\nGeschreven: {os.path.relpath(OUT)} — {len(out)} zones, {sz:.0f} kB", file=sys.stderr)

if __name__ == "__main__":
    main()
