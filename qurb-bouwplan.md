# qurb · Bouwplan voor livegang

*peek before you park*

## Wat het is
Een web-app waarin je een adres of plek (bijv. "Rijksmuseum") plus een tijdvak invoert, en ziet wat parkeren kost en met welke app of garage je het goedkoopst uit bent. Voor heel Nederland.

## Kernprincipe
- Straatparkeren: de gemeente bepaalt het uurtarief, identiek voor elke app. Apps verschillen alleen in hun servicekosten erbovenop.
- Garages: je betaalt het tarief van de exploitant zelf, zonder app-servicekosten.

## Wat er al staat (prototype, klaar)
Bestand: `qurb-parkeren.html`. Dient als ontwerp en functioneel bestek voor de voorkant.
- Adresaanvulling via PDOK (overheid, gratis).
- Adres, gemeente, indicatief uurtarief (niet zelf instelbaar).
- App-vergelijking: Parkmobile, EasyPark, Yellowbrick, ANWB, Q-Park.
- Garages per stad met echte namen, indicatieve tarieven, gesimuleerde beschikbaarheid (Utrecht, Amsterdam, Rotterdam, Den Haag).
- Licht- en donker-thema, qurb-huisstijl en logo.

## Wat er nog moet voor live
1. **Backend** opzetten (data ophalen, opschonen, klaarzetten; sleutels verbergen; mag klein beginnen).
2. **Live straattarief per zone** uit de RDW-data, vervangt de indicatieve tabel. Inclusief zone-bepaling: van coördinaat naar de juiste parkeerzone.
3. **Live garages** uit de RDW-data: statisch (locatie, capaciteit, tarief) en dynamisch (vrije plekken).
4. **App-servicekostentabel** beheren (geen API, handmatig bijhouden, verandert af en toe).
5. **"Kan ik hier echt staan"** via NDW-parkeervakken en -verkeersborden (parkeerverbod), plus het dichtstbijzijnde geldige alternatief voorstellen.
6. **Zoeken op een plek/POI** ("Rijksmuseum") via OpenStreetMap (Nominatim) naast PDOK, dan nabije parkeeropties op loopafstand.
7. **Hosting en domein**.

## Databronnen (allemaal gratis en open)
- **RDW Nationaal Parkeer Register** (`opendata.rdw.nl` + dynamische feed): zones, tarieven, garages statisch en dynamisch (vrije plekken, begint bij Q-Park, daarna meer exploitanten).
- **NDW**: landelijke parkeervakken (waar liggen vakken) en verkeersborden (o.a. parkeerverbod E1).
- **PDOK Locatieserver**: adressen, straten, postcodes, plaatsen.
- **OpenStreetMap / Nominatim**: bezienswaardigheden en plekken op naam. Let op fair-use-grenzen bij groei (zelf hosten of via aanbieder).

## Aanpak in fasen
- **Fase 0** — Prototype. Klaar.
- **Fase 1 (MVP, één stad)** — Live straattarief + app-vergelijking + "kan ik hier staan". Bewijst het concept echt.
- **Fase 2** — Garages live (statisch + dynamische vrije plekken).
- **Fase 3** — Zoeken op een plek (POI) + dichtstbijzijnde geldige straat voorstellen.
- **Fase 4** — Uitrol naar meer steden (komt grotendeels vanzelf mee met de landelijke data), polish en lancering.

## Aandachtspunten
- Dekking en actualiteit van NDW-data zijn wisselend: sterke indicatie, geen sluitende garantie. Tijdelijke verboden (verhuizing, evenement, wegwerk) zitten er meestal niet in.
- Dynamische garagedata van private exploitanten heeft gebruiksvoorwaarden (bijv. alleen voor navigatie, beperkte bewaartermijn).
- App-servicekostentabel vraagt doorlopend klein onderhoud.
- AVG wordt relevant zodra je accounts of betalingen toevoegt. Voor een eerste publieke versie zonder inlog is dat licht.

## Kosten (grof)
- Domeinnaam: circa 10 tot 15 euro per jaar.
- Hosting: gratis tot bescheiden.
- Data: gratis (RDW, NDW, PDOK, OpenStreetMap).
- Grootste post: een ontwikkelaar, als je die inhuurt.
- Doorlopend: kleine onderhoudslast (kostentabel, af en toe een datawijziging).

## Bouwroute (zonder codeerervaring)
- **Zelf doen** met Claude Code, stap voor stap begeleid. Goedkoopst in geld, kost tijd, leercurve.
- **Ontwikkelaar inhuren**, met dit plan plus het prototype als bestek. Snelst naar iets robuusts, geschikt nu er een potentiële klant is.
- **Hybride**: samen een werkende eerste versie bouwen, ontwikkelaar hardt het af en doet de lastige dataonderdelen.

*Advies: begin smal (Fase 1, één stad) en bewijs het live, bouw de rest daarop voort.*
