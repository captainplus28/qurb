#!/usr/bin/env python3
"""
qurb · Fase 1 datapijplijn — echte Amsterdam-garages (gemeente + privaat) uit RDW.

Bron: NPR v2 facility-index + per-faciliteit static feed (CC-0).
We filteren op faciliteiten met 'amsterdam' in de naam en valideren op coordinaten
(Amsterdam bounding box). Per faciliteit: naam, operator, coordinaten, capaciteit,
uurtarief en dagmax uit de gepubliceerde tarieven.

Tarief (zie FASE1-bevindingen.md):
  uurtarief = charge / (chargePeriod/60)          # kleinste chargePeriod < 24u
  dagmax    = charge van een ~1440-min (24u) tariefdeel

Garages zonder gepubliceerd tarief (bv. Q-Park) worden overgeslagen.
Uitvoer: data/amsterdam-garages.json
Gebruik:  python3 scripts/build_garages.py
"""
import json, sys, time, os, re, urllib.request

NPR = "https://npropendata.rdw.nl/parkingdata/v2"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "amsterdam-garages.json")
NOW = time.time()
# Amsterdam bounding box (WGS84)
LAT0, LAT1, LON0, LON1 = 52.27, 52.43, 4.72, 5.05
PARKEER_TYPES = {"Garage parkeren", "Parkeergarage", "Terreinparkeren", "P+R"}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "qurb-datapijplijn/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def kort_operator(op):
    """'Q-Park Nederland BV' -> 'Q-Park', 'APCOA Parking' -> 'APCOA'."""
    if not op: return op
    return re.sub(r"\s+(Nederland\s+B\.?V\.?|B\.?V\.?|Parking)$", "", op.strip(), flags=re.I).strip()

def nette_naam(raw, merk):
    """Exploitantnaam vooraan, geen '(Amsterdam)'/'AMSTERDAM-'/stad."""
    n = (raw or "").strip()
    n = re.sub(r"\s*\(Amsterdam\)\s*$", "", n, flags=re.I).strip()   # stad-suffix weg
    n = re.sub(r"^AMSTERDAM[-\s]+", "", n, flags=re.I).strip()       # Q-Park-prefix weg
    plaats = re.sub(r"^(Parkeergarage|Garage|Terrein)\s+", "", n, flags=re.I).strip()
    if merk and merk.lower() not in ("amsterdam", "gemeente amsterdam"):
        return plaats if plaats.lower().startswith(merk.lower()) else f"{merk} {plaats}"
    return n  # gemeente: beschrijvende naam zonder stad

def tarief_uit_npr(tariffs):
    """uurtarief (kleinste intra-uur stap) en dagmax (24u-kaart) uit huidige rates."""
    uur = None; best_cp = None; dag = None
    for t in tariffs or []:
        for ir in t.get("intervalRates") or []:
            if not (ir.get("validityStartOfPeriod", 0) <= NOW and
                    (ir.get("validityEndOfPeriod") is None or ir["validityEndOfPeriod"] > NOW)):
                continue
            cp = ir.get("chargePeriod") or 0
            ch = ir.get("charge")
            if cp <= 0 or ch is None:
                continue
            df = ir.get("durationFrom", 0) or 0
            if df <= 0 and cp < 1440:
                if best_cp is None or cp < best_cp:
                    best_cp = cp; uur = round(ch / (cp / 60.0), 2)
            if cp >= 1440:
                d = round(ch, 2)
                if dag is None or d < dag:
                    dag = d
    return uur, dag

def coords_capaciteit_operator(info):
    specs = info.get("specifications") or [{}]
    cap = specs[0].get("capacity")
    operator = info.get("operator") or {}
    op, url = operator.get("name"), operator.get("url")
    lat = lon = None
    for ap in info.get("accessPoints", []):
        for l in ap.get("accessPointLocation", []):
            if l.get("coordinatesType") == "WGS84":
                lat, lon = l.get("latitude"), l.get("longitude")
        if lat is not None:
            break
    usage = specs[0].get("usage")
    return lat, lon, cap, op, url, usage

def main():
    idx = get(NPR)
    fac = [f for f in idx.get("ParkingFacilities", []) if "amsterdam" in (f.get("name") or "").lower()]
    print(f"Amsterdam-kandidaten in index: {len(fac)}", file=sys.stderr)

    out = []
    for f in fac:
        try:
            s = get(f"{NPR}/static/{f['identifier']}")
            info = s.get("parkingFacilityInformation", {})
            lat, lon, cap, op, url, usage = coords_capaciteit_operator(info)
            if lat is None or not (LAT0 < lat < LAT1 and LON0 < lon < LON1):
                continue
            if usage not in PARKEER_TYPES:
                continue
            uur, dag = tarief_uit_npr(info.get("tariffs"))
            # Garages zonder gepubliceerd tarief (bv. Q-Park) tonen we tóch:
            # met locatie/capaciteit en een link naar de exploitant (uur=null).
            merk = kort_operator(op)
            out.append({
                "naam": nette_naam(info.get("name") or f.get("name"), merk),
                "operator": merk, "type": usage, "url": url,
                "lat": lat, "lon": lon, "capaciteit": cap,
                "uur": uur, "dagmax": dag,
            })
            print(f"  ✓ {info.get('name','')[:40]}: "
                  + (f"€{uur}/uur" + (f", dagmax €{dag}" if dag else "") if uur is not None
                     else "tarief bij exploitant")
                  + f", {op}, cap {cap}", file=sys.stderr)
            time.sleep(0.04)
        except Exception as e:
            print(f"  ! {f.get('name','?')[:30]}: {e}", file=sys.stderr)

    if len(out) < 10:
        sys.exit(f"FOUT: slechts {len(out)} garages — RDW mogelijk onbereikbaar; bestaande data niet overschreven.")
    out.sort(key=lambda x: x["naam"])
    payload = {"stad": "Amsterdam", "bron": "RDW NPR Open Parkeerdata (CC-0)",
               "gegenereerd": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "garages": out}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=False, indent=1)
    print(f"\nGeschreven: {os.path.relpath(OUT)} — {len(out)} garages", file=sys.stderr)

if __name__ == "__main__":
    main()
