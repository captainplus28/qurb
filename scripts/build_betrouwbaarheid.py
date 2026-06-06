#!/usr/bin/env python3
"""
qurb · bouwt data/betrouwbaarheid.json — classificeert per gemeente hoe betrouwbaar
het live straattarief uit de open RDW-data is.

Drie niveaus (tiers):
  - "geverifieerd": handmatig gecontroleerd tegen de gemeentebron (zie VOORTGANG.md).
  - "compleet":     structureel volledig — genoeg zones, met geometrie én tariefvensters,
                    zodat de zone-resolutie betrouwbaar werkt. Niet handmatig geverifieerd.
  - "onvoldoende":  te weinig zones, of zones zonder geometrie/tarief. De app mag hier
                    GEEN straattarief claimen (voorkomt valse "gratis"/verkeerde prijs).

De frontend laadt dit bestand en schakelt het live-tariefpad uit voor "onvoldoende"
gemeenten; "compleet" krijgt een indicatief-label, "geverifieerd" geldt als zeker.

Regenereerbaar: draai dit script opnieuw na elke data-refresh.
"""
import datetime as dt
import glob
import json
import os

DATA = os.path.join(os.path.dirname(__file__), "..", "data")
OUT = os.path.join(DATA, "betrouwbaarheid.json")

# Handmatig gevalideerd tegen de gemeentebron (amsterdam.nl e.a.).
GEVERIFIEERD = {"363": "Amsterdam", "599": "Rotterdam", "344": "Utrecht", "518": "Den Haag"}

# Structurele drempels voor "compleet".
MIN_ZONES = 3        # minder dan dit is te dun om op te vertrouwen
MIN_GEOM_RATIO = 0.95  # vrijwel alle zones moeten geometrie hebben (punt-in-polygon)
MIN_TARIEF_RATIO = 0.90  # vrijwel alle zones moeten een tariefvenster (eur > 0) hebben


def audit_city(area_id):
    """Lees de straatzones en bepaal aantallen + ratio's voor één gemeente."""
    path = os.path.join(DATA, area_id, "straat.json")
    try:
        with open(path, encoding="utf-8") as f:
            zones = json.load(f).get("zones", [])
    except (OSError, ValueError):
        zones = []
    n = len(zones)
    geom = sum(1 for z in zones if z.get("polys"))
    tarief = sum(1 for z in zones if any(w.get("eur", 0) > 0 for w in z.get("vensters", [])))
    return n, geom, tarief


def classify(area_id):
    if area_id in GEVERIFIEERD:
        return "geverifieerd"
    n, geom, tarief = audit_city(area_id)
    if n < MIN_ZONES:
        return "onvoldoende"
    if geom / n < MIN_GEOM_RATIO or tarief / n < MIN_TARIEF_RATIO:
        return "onvoldoende"
    return "compleet"


def main():
    tiers = {}
    for path in sorted(glob.glob(os.path.join(DATA, "*", ""))):
        area_id = os.path.basename(path.rstrip(os.sep))
        if not area_id.isdigit():
            continue
        tiers[area_id] = classify(area_id)

    payload = {
        "gegenereerd": dt.date.today().isoformat(),
        "criteria": {
            "min_zones": MIN_ZONES,
            "min_geom_ratio": MIN_GEOM_RATIO,
            "min_tarief_ratio": MIN_TARIEF_RATIO,
        },
        "tiers": tiers,
    }
    os.makedirs(DATA, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

    counts = {t: sum(1 for v in tiers.values() if v == t) for t in ("geverifieerd", "compleet", "onvoldoende")}
    print(f"Geschreven: {os.path.relpath(OUT)} — {len(tiers)} gemeenten")
    print(f"  geverifieerd: {counts['geverifieerd']}  compleet: {counts['compleet']}  onvoldoende: {counts['onvoldoende']}")


if __name__ == "__main__":
    main()
