#!/usr/bin/env python3
"""
qurb · ontdekt automatisch alle gemeenten met betaald straatparkeren.

Geeft op stdout regels "areamanagerid<TAB>gemeentenaam" voor elke gemeente met
voldoende BETAALDP-zones en een bekende naam. De GitHub Action loopt hierover.
"""
import json, sys, urllib.parse, urllib.request

def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "qurb/1.0"}), timeout=60))

def main():
    # areamanagers met >5 BETAALDP-zones (= gemeenten met betaald straatparkeren)
    r = get("https://opendata.rdw.nl/resource/mz4f-59fw.json?" + urllib.parse.urlencode({
        "$select": "areamanagerid,count(areaid)", "$where": "usageid='BETAALDP'",
        "$group": "areamanagerid", "$having": "count(areaid) > 5"}))
    ids = {x["areamanagerid"] for x in r}
    idx = get("https://opendata.rdw.nl/resource/f6v7-gjpa.json?$limit=3000")
    naam = {x["organization_id"]: x.get("organization") for x in idx}
    steden = sorted(((i, naam[i]) for i in ids if naam.get(i)), key=lambda x: x[1])
    for i, n in steden:
        print(f"{i}\t{n}")
    print(f"# {len(steden)} gemeenten met betaald straatparkeren", file=sys.stderr)

if __name__ == "__main__":
    main()
