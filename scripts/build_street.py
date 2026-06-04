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
import json, sys, time, os, urllib.parse, urllib.request

AREAMANAGER = "363"
SOCRATA = "https://opendata.rdw.nl/resource"
NPR_STATIC = "https://npropendata.rdw.nl/parkingdata/v2/static"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "amsterdam-straat.json")
NOW = time.time()
DAYMAP = {"Mon":1,"Tue":2,"Wed":3,"Thu":4,"Fri":5,"Sat":6,"Sun":7}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent":"qurb-datapijplijn/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def soql(dataset, where, select=None, limit=5000):
    p = {"$where": where, "$limit": str(limit)}
    if select: p["$select"] = select
    return get(f"{SOCRATA}/{dataset}.json?" + urllib.parse.urlencode(p))

def current_rate(interval_rates):
    """Kies de intervalRate die nu geldig is en de basis-duurband dekt."""
    cands = [r for r in interval_rates
             if r.get("validityStartOfPeriod",0) <= NOW
             and (r.get("validityEndOfPeriod") is None or r["validityEndOfPeriod"] > NOW)]
    if not cands: return None
    # voorkeur voor de open-eind duurband (durationUntil == -1), anders de eerste
    flat = [r for r in cands if r.get("durationUntil",-1) in (-1, None)]
    r = (flat or cands)[0]
    if r.get("durationType") != "Minutes": return None
    cp = r.get("chargePeriod") or 0
    if cp <= 0: return None
    return round(float(r["charge"]) / (cp/60.0), 2)

def windows_for_zone(tariffs):
    out = []
    for t in tariffs:
        eur = current_rate(t.get("intervalRates") or [])
        if eur is None: continue
        days = [DAYMAP[d] for d in t.get("validityDays",[]) if d in DAYMAP]
        if not days: continue
        vf, vu = t.get("validityFromTime",{}), t.get("validityUntilTime",{})
        out.append({
            "days": days,
            "from": vf.get("h",0)*60 + vf.get("m",0),
            "to":   vu.get("h",0)*60 + vu.get("m",0),
            "eur":  eur,
        })
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
            geom = specs[0].get("areaGeometry") if specs else None
            if not geom or geom.get("type") != "Polygon":
                continue
            ring = geom["coordinates"][0]  # buitenring [[lon,lat],...]
            wins = windows_for_zone(info.get("tariffs") or [])
            if not wins:
                continue
            # comprimeer coords tot 5 decimalen (~1 m)
            poly = [[round(c[0],5), round(c[1],5)] for c in ring]
            out.append({
                "areaid": areaid,
                "naam": info.get("name") or areaid,
                "poly": poly,
                "vensters": wins,
            })
            dag = next((w["eur"] for w in wins if 1 in w["days"] and w["from"]<=720<=w["to"]), None)
            print(f"  ✓ {areaid} {info.get('name','')[:40]}: {len(wins)} vensters"
                  + (f", ma-middag €{dag}/uur" if dag else "") + f", {len(poly)} pt", file=sys.stderr)
            time.sleep(0.08)
        except Exception as e:
            print(f"  ! {areaid} ({uuid}): {e}", file=sys.stderr)

    payload = {"stad":"Amsterdam","areamanagerid":AREAMANAGER,
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
