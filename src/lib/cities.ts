/** Per-city content for the city landing pages. Copy ported verbatim from the
 *  original <city>.html files. The page template is otherwise identical. */
export type City = {
  slug: string;
  name: string; // display name used in headings / "andere steden" current marker
  title: string; // <title>
  description: string; // meta description
  heroTitle: string;
  heroSub: string;
  tariffLede: string;
};

export const CITIES: City[] = [
  {
    slug: "amsterdam",
    name: "Amsterdam",
    title: "Parkeerkosten vergelijken in Amsterdam — Qurb",
    description:
      "Vergelijk Parkmobile, EasyPark, Yellowbrick en meer in Amsterdam. Zie direct wat je écht betaalt inclusief servicekosten. Gratis, geen account nodig.",
    heroTitle: "Parkeren in Amsterdam: wat betaal je écht?",
    heroSub:
      "Amsterdam heeft een van de duurste parkeertarieven van Nederland. Straatparkeren in het centrum kost al snel €7,50 per uur — maar welke app rekent daar de laagste servicekosten bovenop? Qurb laat het je in één oogopslag zien.",
    tariffLede:
      "In Amsterdam gelden verschillende parkeerzones met elk hun eigen uurtarief. Het centrum (zone A) kent tarieven tot €7,50/uur. De schil eromheen (zone B/C) ligt tussen €3,50 en €5,50/uur. Elke parkeer-app rekent hier zijn eigen servicekosten bovenop — Qurb maakt het verschil zichtbaar.",
  },
  {
    slug: "rotterdam",
    name: "Rotterdam",
    title: "Parkeerkosten vergelijken in Rotterdam — Qurb",
    description:
      "Vergelijk parkeer-apps in Rotterdam op prijs. Inclusief servicekosten van Parkmobile, EasyPark, Yellowbrick en meer. Gratis en zonder account.",
    heroTitle: "Parkeren in Rotterdam: wat betaal je écht?",
    heroSub:
      "Rotterdam combineert grote parkeergarages met betaald straatparkeren in het centrum. De tarieven lopen sterk uiteen per wijk. Met Qurb zie je per locatie welke app het voordeligst uitpakt — inclusief servicekosten.",
    tariffLede:
      "Straatparkeren in Rotterdam centrum kost gemiddeld €3,00–€4,50/uur. In wijken als Kralingen en het Lloydkwartier liggen de tarieven iets lager. Parkeergarages zijn in Rotterdam vaak een goed alternatief voor straatparkeren. Qurb vergelijkt beide.",
  },
  {
    slug: "utrecht",
    name: "Utrecht",
    title: "Parkeerkosten vergelijken in Utrecht — Qurb",
    description:
      "Parkeerkosten vergelijken in Utrecht? Qurb toont wat je écht betaalt met Parkmobile, EasyPark, Yellowbrick en meer. Gratis, geen account nodig.",
    heroTitle: "Parkeren in Utrecht: wat betaal je écht?",
    heroSub:
      "Utrecht heeft een compacte binnenstad met hoge parkeertarieven en beperkte straatparkeerplaatsen. De combinatie van gemeentetarief en app-servicekosten bepaalt wat je écht kwijt bent. Qurb rekent het voor je uit.",
    tariffLede:
      "In de Utrechtse binnenstad betaal je al snel €4,00–€5,50/uur voor straatparkeren. Rondom het centrum zijn de tarieven lager, maar de parkeerdruk is hoog. Qurb toont live welke app het voordeligst is voor jouw tijdslot.",
  },
  {
    slug: "den-haag",
    name: "Den Haag",
    title: "Parkeerkosten vergelijken in Den Haag — Qurb",
    description:
      "Vergelijk parkeer-apps in Den Haag. Qurb toont wat je écht betaalt inclusief servicekosten — van centrum tot Scheveningen. Gratis, geen account.",
    heroTitle: "Parkeren in Den Haag: wat betaal je écht?",
    heroSub:
      "Den Haag heeft een uitgebreid betaald parkeergebied met sterk variërende tarieven per buurt. Van het Centrum tot Scheveningen — elke zone heeft zijn eigen regels. Qurb vergelijkt alle apps op jouw locatie.",
    tariffLede:
      "Parkeren in Den Haag centrum kost gemiddeld €3,50–€5,00/uur. In Scheveningen en rond het Centraal Station kunnen tarieven hoger uitvallen. Verschillende parkeer-apps zijn niet overal even goed gedekt in Den Haag — Qurb toont alleen wat beschikbaar is op jouw locatie.",
  },
  {
    slug: "haarlem",
    name: "Haarlem",
    title: "Parkeerkosten vergelijken in Haarlem — Qurb",
    description:
      "Vergelijk parkeer-apps in Haarlem op prijs. Inclusief servicekosten van Parkmobile, EasyPark, Yellowbrick en meer. Gratis, geen account nodig.",
    heroTitle: "Parkeren in Haarlem: wat betaal je écht?",
    heroSub:
      "Haarlem heeft een compacte binnenstad met betaald parkeren in vrijwel het hele centrum. Met tarieven tot €4,40 per uur telt elke euro — en elke app rekent zijn eigen servicekosten. Qurb laat zien waar je het goedkoopst uitkomt.",
    tariffLede:
      "Straatparkeren in Haarlem centrum kost gemiddeld €3,50–€4,40/uur. De parkeerdruk is hoog, zeker in de buurt van de Grote Markt en het winkelgebied. Qurb vergelijkt alle apps live op jouw locatie en tijdslot.",
  },
  {
    slug: "leiden",
    name: "Leiden",
    title: "Parkeerkosten vergelijken in Leiden — Qurb",
    description:
      "Parkeerkosten vergelijken in Leiden? Qurb toont wat je écht betaalt met Parkmobile, EasyPark, Yellowbrick en meer. Gratis, geen account nodig.",
    heroTitle: "Parkeren in Leiden: wat betaal je écht?",
    heroSub:
      "Leiden heeft een druk centrum met beperkte parkeerruimte en uiteenlopende tarieven per zone. De combinatie van gemeentetarief en app-servicekosten bepaalt wat je écht kwijt bent. Qurb rekent het voor je uit.",
    tariffLede:
      "Straatparkeren in Leiden centrum kost gemiddeld €3,50–€4,00/uur. Rondom het Centraal Station en de binnenstad is de parkeerdruk het hoogst. Qurb toont welke app het voordeligst is voor jouw specifieke locatie en tijdstip.",
  },
  {
    slug: "eindhoven",
    name: "Eindhoven",
    title: "Parkeerkosten vergelijken in Eindhoven — Qurb",
    description:
      "Vergelijk parkeer-apps in Eindhoven. Qurb toont wat je écht betaalt inclusief servicekosten — van centrum tot Strijp-S. Gratis, geen account.",
    heroTitle: "Parkeren in Eindhoven: wat betaal je écht?",
    heroSub:
      "Eindhoven groeit snel en de parkeerdruk in het centrum neemt toe. Met meerdere betaalde zones en wisselende tarieven per buurt loont het om apps te vergelijken. Qurb doet dat automatisch op jouw locatie.",
    tariffLede:
      "Straatparkeren in Eindhoven centrum kost gemiddeld €2,80–€3,20/uur. Rondom het station en de 18 Septemberplein zijn de tarieven het hoogst. In wijken als Strijp-S liggen de tarieven iets lager. Qurb vergelijkt alle beschikbare apps live.",
  },
  {
    slug: "groningen",
    name: "Groningen",
    title: "Parkeerkosten vergelijken in Groningen — Qurb",
    description:
      "Parkeerkosten vergelijken in Groningen? Qurb toont wat je écht betaalt met alle grote parkeer-apps. Gratis, geen account nodig.",
    heroTitle: "Parkeren in Groningen: wat betaal je écht?",
    heroSub:
      "Groningen heeft een autovrij centrum waardoor betaald parkeren vooral aan de rand van de binnenstad plaatsvindt. De tarieven variëren sterk per zone. Qurb vergelijkt alle apps op jouw exacte locatie.",
    tariffLede:
      "Straatparkeren in Groningen kost gemiddeld €2,70–€3,10/uur aan de rand van het centrum. Het stadscentrum zelf is grotendeels autovrij. Parkeergarages zijn in Groningen vaak de meest praktische optie — Qurb vergelijkt ook die.",
  },
];

export const getCity = (slug: string) => CITIES.find((c) => c.slug === slug);
