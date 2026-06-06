#!/usr/bin/env python3
"""
qurb · bouwt data/gemeenten.json — koppeling PDOK-gemeentenaam -> RDW areamanager-id.

De frontend bepaalt via PDOK de gemeente van een adres en laadt dan data/<id>/.
Niet-gemeente-organisaties (Q-Park e.d.) staan ook in de RDW-index maar matchen
nooit op een PDOK-gemeentenaam, dus die filteren we impliciet weg.
"""
import json, os, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "data", "gemeenten.json")

# PDOK-gemeentenaam die afwijkt van de RDW-organisatienaam.
ALIASSEN = {
    "'s-gravenhage": "den haag",
    "'s-hertogenbosch": "s-hertogenbosch",
}

def get(u):
    return json.load(urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "qurb/1.0"}), timeout=40))

def main():
    idx = get("https://opendata.rdw.nl/resource/f6v7-gjpa.json?$limit=3000")
    namen = {}
    for r in idx:
        if not r.get("static_parking_data"):
            continue
        naam = (r.get("organization") or "").strip().lower()
        if naam and naam not in namen:
            namen[naam] = r["organization_id"]
    # aliassen toevoegen
    for pdok, rdw in ALIASSEN.items():
        if rdw in namen and pdok not in namen:
            namen[pdok] = namen[rdw]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"gemeenten": namen}, f, ensure_ascii=False, indent=0)
    print(f"Geschreven: {os.path.relpath(OUT)} — {len(namen)} gemeenten")

if __name__ == "__main__":
    main()
