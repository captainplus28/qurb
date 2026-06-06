#!/usr/bin/env python3
"""
qurb · bouwt data/dekking.json — per gemeente het aantal BETAALDP-zones.

Doel: voorkomen dat de app valselijk "gratis" zegt. Heeft een gemeente betaalde
zones (ongeacht of wij de geometrie hebben), dan tonen we bij een niet-gevonden
zone "controleer de automaat" i.p.v. "gratis".
"""
import json, os, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "dekking.json")

def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "qurb/1.0"}), timeout=60))

def main():
    r = get("https://opendata.rdw.nl/resource/mz4f-59fw.json?" + urllib.parse.urlencode({
        "$select": "areamanagerid,count(areaid)", "$where": "usageid='BETAALDP'",
        "$group": "areamanagerid", "$limit": 5000}))
    betaald = {x["areamanagerid"]: int(x["count_areaid"]) for x in r if int(x["count_areaid"]) > 0}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"betaald_zones": betaald}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Geschreven: {os.path.relpath(OUT)} — {len(betaald)} gemeenten met betaald parkeren")

if __name__ == "__main__":
    main()
