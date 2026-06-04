#!/usr/bin/env python3
"""
qurb · Fase 1 datapijplijn — echte Amsterdam-garages uit RDW open data.

Bronnen (allemaal CC-0 / open, geen sleutel nodig):
  - Socrata PARKEERGEBIED  mz4f-59fw : garagezones (usageid=GARAGEP) + uuid-brug
  - Socrata GEBIED         adw6-9hsg : nette omschrijving/naam
  - Socrata TIJDVAK        ixf8-gtwq : regulationid -> farecalculationcode (huidig)
  - Socrata TARIEFDEEL     534e-5vdg : tariefdelen -> uurtarief / dagmax
  - NPR v2 static feed                : coordinaten, capaciteit, operator, adres

Tariefregel (gevalideerd, zie FASE1-bevindingen.md):
  uurtarief = amountfarepart / (stepsizefarepart / 60)   # stepsize in minuten

Uitvoer: data/amsterdam-garages.json
Draai periodiek opnieuw om de data te verversen:  python3 scripts/build_garages.py
"""
import json, sys, urllib.parse, urllib.request, os, time

AREAMANAGER = "363"  # Amsterdam
SOCRATA = "https://opendata.rdw.nl/resource"
NPR_STATIC = "https://npropendata.rdw.nl/parkingdata/v2/static"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "amsterdam-garages.json")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "qurb-datapijplijn/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def soql(dataset, where, select=None, order=None, limit=5000):
    p = {"$where": where, "$limit": str(limit)}
    if select: p["$select"] = select
    if order:  p["$order"] = order
    return get(f"{SOCRATA}/{dataset}.json?" + urllib.parse.urlencode(p))

def hourly_from_code(code):
    """Uurtarief uit het hoofd-tariefdeel van een farecalculationcode (huidig)."""
    rows = soql("534e-5vdg",
                f"areamanagerid='{AREAMANAGER}' AND farecalculationcode='{code}' AND enddatefarepart='29991231'",
                order="startdurationfarepart")
    if not rows: return None
    r = rows[0]
    amount = float(r["amountfarepart"]); step = float(r["stepsizefarepart"])
    if step <= 0: return None
    return round(amount / (step / 60.0), 2)

def main():
    # 1) garagezones + uuid-brug
    gar = soql("mz4f-59fw",
               f"areamanagerid='{AREAMANAGER}' AND usageid='GARAGEP'",
               select="areaid,uuid,areaname")
    # 2) nette namen
    names = {r["areaid"]: r.get("areadesc", "") for r in
             soql("adw6-9hsg", f"areamanagerid='{AREAMANAGER}'", select="areaid,areadesc")}

    out = []
    for g in gar:
        areaid = g["areaid"]; uuid = g.get("uuid")
        naam = names.get(areaid) or g.get("areaname") or areaid

        # 3) huidig tariefcode via TIJDVAK
        tv = soql("ixf8-gtwq",
                  f"areamanagerid='{AREAMANAGER}' AND regulationid='{areaid}' "
                  f"AND enddatetimeframe='29991231235959' AND claimrightpossible='J'",
                  select="farecalculationcode", limit=1)
        uur = hourly_from_code(tv[0]["farecalculationcode"]) if tv else None

        # 4) dagmax: zoek bijbehorende _DK-regeling (dagkaart) met 1440-min stap
        dagmax = None
        dk = soql("ixf8-gtwq",
                  f"areamanagerid='{AREAMANAGER}' AND regulationid='{areaid}DK' "
                  f"AND enddatetimeframe='29991231235959'",
                  select="farecalculationcode", limit=1)
        if dk:
            rows = soql("534e-5vdg",
                        f"areamanagerid='{AREAMANAGER}' AND farecalculationcode='{dk[0]['farecalculationcode']}' "
                        f"AND enddatefarepart='29991231'")
            if rows:
                dagmax = round(float(rows[0]["amountfarepart"]), 2)

        # 5) coordinaten + capaciteit + operator uit NPR static
        lat = lon = capaciteit = operator = adres = None
        if uuid:
            try:
                s = get(f"{NPR_STATIC}/{uuid}")
                info = s.get("parkingFacilityInformation", {})
                specs = info.get("specifications") or []
                if specs: capaciteit = specs[0].get("capacity")
                op = info.get("operator") or {}
                operator = op.get("name")
                aa = (op.get("administrativeAddresses") or [{}])[0]
                if aa.get("streetName"):
                    adres = f"{aa.get('streetName','')} {aa.get('houseNumber','')}, {aa.get('city','')}".strip()
                for ap in info.get("accessPoints", []):
                    for loc in ap.get("accessPointLocation", []):
                        if loc.get("coordinatesType") == "WGS84":
                            lat, lon = loc.get("latitude"), loc.get("longitude"); break
                    if lat: break
                time.sleep(0.1)  # vriendelijk voor de feed
            except Exception as e:
                print(f"  ! NPR static faalde voor {areaid} ({uuid}): {e}", file=sys.stderr)

        if uur is None or lat is None:
            print(f"  - overslaan {areaid} '{naam}' (uur={uur} lat={lat})", file=sys.stderr)
            continue

        out.append({
            "areaid": areaid, "naam": naam, "operator": operator, "adres": adres,
            "lat": lat, "lon": lon, "capaciteit": capaciteit,
            "uur": uur, "dagmax": dagmax,
        })
        print(f"  ✓ {naam}: €{uur}/uur"
              + (f", dagmax €{dagmax}" if dagmax else "")
              + f", cap {capaciteit}, ({lat},{lon})", file=sys.stderr)

    out.sort(key=lambda x: x["naam"])
    payload = {"stad": "Amsterdam", "areamanagerid": AREAMANAGER,
               "bron": "RDW Open Data Parkeren (CC-0)",
               "gegenereerd": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
               "garages": out}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f"\nGeschreven: {os.path.relpath(OUT)} — {len(out)} garages", file=sys.stderr)

if __name__ == "__main__":
    main()
