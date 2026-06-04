#!/usr/bin/env python3
"""
qurb · Fase 1 — vergunninghouderszones (VERGUNP) Amsterdam uit RDW, voor "kan ik hier staan".

Bron: Socrata GEOMETRIE GEBIED (nsk3-v9n7) + PARKEERGEBIED (mz4f-59fw), CC-0.
Levert de polygonen van vergunninghouderszones, zodat de app kan zeggen:
"hier geldt vergunninghoudersparkeren" wanneer een adres niet in een betaalde zone valt.

Uitvoer: data/amsterdam-vergunning.json (apart bestand; frontend laadt het lazy).
Gebruik:  python3 scripts/build_permit.py
"""
import json, os, re, time, urllib.parse, urllib.request

AREAMANAGER = "363"
SOCRATA = "https://opendata.rdw.nl/resource"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "amsterdam-vergunning.json")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "qurb-datapijplijn/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def soql(ds, where, sel, lim=80000):
    return get(f"{SOCRATA}/{ds}.json?" + urllib.parse.urlencode({"$where": where, "$select": sel, "$limit": lim}))

def polys_from_wkt(wkt):
    out = []
    if not wkt: return out
    for ring in re.findall(r"\(\(([^()]*?)\)", wkt):
        pts = []
        for pt in ring.split(","):
            xy = pt.replace("(", "").replace(")", "").split()
            if len(xy) >= 2:
                try: pts.append([round(float(xy[0]), 5), round(float(xy[1]), 5)])
                except ValueError: pass
        if len(pts) >= 3: out.append(pts)
    return out

def main():
    pg = soql("mz4f-59fw", f"areamanagerid='{AREAMANAGER}' AND usageid='VERGUNP'", "areaid,areaname")
    permit_ids = {r["areaid"]: r.get("areaname") for r in pg}
    geo = soql("nsk3-v9n7", f"areamanagerid='{AREAMANAGER}'", "areaid,areageometryastext")

    byid = {}
    for r in geo:
        aid = r["areaid"]
        if aid not in permit_ids: continue
        polys = polys_from_wkt(r.get("areageometryastext", ""))
        if not polys: continue
        byid.setdefault(aid, {"areaid": aid, "naam": permit_ids.get(aid) or aid, "polys": []})
        byid[aid]["polys"] += polys

    zones = list(byid.values())
    if len(zones) < 50:
        raise SystemExit(f"FOUT: slechts {len(zones)} vergunningzones — RDW mogelijk onbereikbaar; bestaande data niet overschreven.")
    payload = {"stad": "Amsterdam", "regime": "vergunninghouders",
               "bron": "RDW Open Data Parkeren (CC-0)",
               "gegenereerd": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "zones": zones}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    sz = os.path.getsize(OUT) / 1024
    print(f"Geschreven: {os.path.relpath(OUT)} — {len(zones)} vergunningzones, {sz:.0f} kB")

if __name__ == "__main__":
    main()
