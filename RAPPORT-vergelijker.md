# Qurb parkeervergelijker — rapport in gewone taal

*Voor iedereen, ook zonder technische achtergrond. Laatste herziening: juni 2026.*

---

## Wat doet deze tool?

Qurb laat in één oogopslag zien **wat je écht betaalt om ergens te parkeren**. Je vult een
adres en een tijdvak in, en Qurb rekent voor je uit:

1. **Op straat** — wat kost een parkeerplek op die plek, en hoeveel rekent elke parkeer-app
   (Parkmobile, EasyPark, Yellowbrick, ANWB, Q-Park) daar bovenop aan servicekosten.
2. **In een garage** — welke parkeergarages en P+R-terreinen er in de buurt zijn, hoe ver weg,
   en wat ze kosten.

De kern van het idee: **de gemeente bepaalt het straattarief, maar elke app rekent zijn eigen
opslag.** Voor exact dezelfde plek en tijd kun je dus bij de ene app duurder uit zijn dan bij de
andere. Qurb maakt dat verschil zichtbaar. Vandaar de slogan: *peek before you park.*

---

## Hoe werkt het, stap voor stap?

1. **Je typt een adres.** Vanaf drie letters begint Qurb adressen te zoeken en toont een lijstje.
2. **Je kiest een adres uit de lijst.** Qurb zoekt direct de exacte locatie (de coördinaten) en
   de gemeente erbij op.
3. **Je kiest een begin- en eindtijd.** Standaard staat dit op "nu" tot "over twee uur"; je kunt
   het aanpassen.
4. **Je klikt op de zoekknop (het groene rondje).** Qurb berekent en toont het resultaat in een
   donkere overzichtskaart: eerst de straatkosten per app, daarna de garages in de buurt.

---

## Welke gegevens gebruikt de tool, en waar komen die vandaan?

Qurb gebruikt **open overheidsdata** — geen geheime sleutels, geen betaalde diensten:

| Gegevensbron | Wat het levert | Hoe Qurb het ophaalt |
|---|---|---|
| **PDOK Locatieserver** (een open kaartdienst van de overheid) | Adressen tijdens het typen, plus de exacte coördinaten en gemeente van een gekozen adres | Live opgevraagd terwijl je typt |
| **Open parkeerdata van de RDW** | Het echte straattarief per zone en per tijdvak, de vergunningsgebieden, en de garages met hun tarieven | Vooraf klaargezet als databestanden per gemeente |

De RDW-data is vooraf verwerkt tot compacte bestanden, **één set per gemeente**. Qubrb laadt
alleen de gemeente die bij jouw adres hoort — dat houdt de tool snel, ook als heel Nederland erin
zit.

---

## Wat gebeurt er precies als je een adres typt?

1. Je typt minstens drie letters.
2. Qurb wacht heel even (een kwart seconde) zodat het niet bij élke toetsaanslag gaat zoeken —
   dat scheelt onnodige verzoeken en maakt het soepeler.
3. Qurb vraagt de adreslijst op bij PDOK. Eerdere zoekopdrachten worden onthouden, dus dezelfde
   tekst nogmaals typen gaat meteen.
4. Kies je een adres, dan haalt Qurb de **exacte plek** op en bepaalt in welke gemeente die ligt.
5. Meteen verschijnt het indicatieve gemeentetarief. Zodra de precieze locatie binnen is, kan dat
   verfijnd worden naar het **zone-exacte** tarief voor dat specifieke punt en tijdstip.

Je kunt de lijst ook volledig met het toetsenbord bedienen: pijltjes omhoog/omlaag, Enter om te
kiezen, Escape om te sluiten.

---

## Hoe wordt de prijsvergelijking berekend?

**Op straat:**

- Qubrb bepaalt het tarief per uur voor jouw plek en tijdstip. In steden met volledige RDW-data is
  dat het **echte zonetarief** (inclusief avond-, zondag- en gratis-uren). Elders gebruikt Qurb een
  indicatief gemeentegemiddelde.
- De basisprijs = tarief per uur × aantal uren. Die is voor élke app gelijk.
- Daar bovenop komt per app de **servicekost**: een vast bedrag per parkeeractie, of een
  percentage, afhankelijk van de app.
- De apps worden gesorteerd van goedkoop naar duur, met een "goedkoopst"-label bij de winnaar.

**Bijzondere situaties** worden eerlijk benoemd in plaats van een prijs te verzinnen:

- **Vergunninghoudersgebied** → je kunt er als bezoeker meestal niet parkeren; kies een garage.
- **Gratis op dit moment** → buiten de betaalde uren.
- **Zone niet te bepalen** → de gemeente kent betaald parkeren, maar de open data is hier te dun;
  Qurb zegt dan "controleer de automaat" in plaats van ten onrechte "gratis".

**Garages:** Qurb toont de dichtstbijzijnde garages, gesorteerd op afstand. Per garage zie je het
uurtarief en het dagmaximum. Garages zonder openbaar tarief (zoals sommige Q-Parks) krijgen een
nette link naar de exploitant in plaats van een verzonnen bedrag.

---

## Wat is er verbeterd, en waarom merk jij dat?

Deze versie is volledig herschreven naar moderne productiekwaliteit. Voor jou als gebruiker betekent
dat concreet:

- **Sneller en soepeler.** Zoekopdrachten worden afgeremd en onthouden, en lopende verzoeken worden
  netjes afgebroken als je verder typt. Minder wachten, minder gehapper.
- **Betrouwbaarder.** Elke internetbevraging heeft nu een tijdslimiet en nette foutafhandeling. Gaat
  er iets mis, of ben je offline, dan krijg je een rustige uitleg in plaats van een doodlopende pagina.
- **Veiliger.** Alle tekst die van buiten komt (adressen, garagenamen, links) wordt onschadelijk
  gemaakt voordat die op het scherm verschijnt. Links worden gecontroleerd voordat ze klikbaar worden.
- **Toegankelijker.** De tool is nu volledig met het toetsenbord te bedienen, werkt met
  schermlezers, en de kleuren en contrasten voldoen aan de toegankelijkheidsnorm (WCAG AA).
- **Rustiger bij voorkeur.** Wie in zijn systeem "minder beweging" heeft ingesteld, krijgt de
  animaties automatisch uitgeschakeld.

---

## Bekende beperkingen en aannames

Qurb is eerlijk over wat het (nog) niet kan — dat is een bewuste keuze:

- **Tijdvakken** zoals koopavond, zondag of de eerste gratis uren worden nog niet volledig in de
  eindprijs meegerekend. Het uurtarief is leidend.
- **Kleine gemeenten** ontbreken vaak in de open data (geen zonegeometrie of straattarieven). Dat is
  een fundamentele grens van de openbare dataset, niet van Qurb zelf.
- **Servicekosten van de apps** zijn gebaseerd op openbaar bekende informatie en kunnen wijzigen.
- **Beschikbaarheid van garageplekken** (vol/vrij) is in deze versie nog niet live.
- De getoonde bedragen zijn **indicatief**. Controleer bij twijfel altijd de automaat of de app ter
  plekke — de cijfercodes daar zijn de officiële zonecodes.

Voor échte landelijke betrouwbaarheid is een aansluiting op de volledige parkeerdata (via SHPV) de
logische vervolgstap; dat valt buiten deze versie.
