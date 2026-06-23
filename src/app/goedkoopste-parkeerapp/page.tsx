import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import "../qurb.css";
import "./goedkoopste.css";

export const metadata: Metadata = {
  title: "Goedkoopste parkeer-app vergelijken — Qurb",
  description:
    "Welke parkeer-app is het goedkoopst in Nederland? Vergelijk Parkmobile, EasyPark, Yellowbrick, ANWB Parkeren en Q-Park op servicekosten. Gratis, geen account.",
};

const mutedLink = { color: "var(--brand-strong)", fontWeight: 600 };
const mutedNote = {
  marginBlockStart: "8px",
  fontSize: "14px",
  color: "var(--muted-soft)",
} as const;

const TABLE_ROWS = [
  {
    dot: "#FF4B00",
    name: "Parkmobile",
    rule: "€0,52 per parkeeractie",
    model: "Vast bedrag per sessie, ongeacht duur of tarief",
    cols: ["€3,52", "€8,02", "€12,52"],
    best: [false, false, false],
  },
  {
    dot: "#1E8AFF",
    name: "EasyPark",
    rule: "15% van tarief, min €0,19/u, max €0,70/u, totaal max €7",
    model: "Percentage van het uurtarief, met onder- en bovengrens",
    cols: ["€3,45", "€8,63", "€13,80"],
    best: [false, false, false],
  },
  {
    dot: "#F5C400",
    name: "Yellowbrick",
    rule: "€0,49 per parkeeractie",
    model: "Vast bedrag per sessie, iets lager dan Parkmobile",
    cols: ["€3,49", "€7,99", "€12,49"],
    best: [false, false, false],
  },
  {
    dot: "#FF8200",
    name: "ANWB Parkeren",
    rule: "€0,33 per actie (alleen voor ANWB-leden)",
    model: "Laagste vaste kosten, maar vereist ANWB-lidmaatschap",
    cols: ["€3,33", "€7,83", "€12,33"],
    best: [true, true, true],
  },
  {
    dot: "#199646",
    name: "Q-Park",
    rule: "Geen transactiekosten op straat",
    model: "Geen servicekosten — alleen het gemeentetarief",
    cols: ["€3,00", "€7,50", "€12,00"],
    best: [true, true, true],
  },
];

const SCENARIOS = [
  {
    title: "Snel boodschappen doen",
    sub: "30 minuten · €3/uur · centrum middelgrote stad",
    winner: "Q-Park — €1,50",
    saving: "Besparing t.o.v. Parkmobile: €0,52",
  },
  {
    title: "Dagje Amsterdam centrum",
    sub: "2 uur · €7,50/uur · binnenstad Amsterdam",
    winner: "Q-Park — €15,00",
    saving: "Besparing t.o.v. EasyPark: €1,40",
  },
  {
    title: "Werkdag parkeren",
    sub: "8 uur · €3/uur · parkeerzone kantoor",
    winner: "Q-Park — €24,00",
    saving: "Besparing t.o.v. Parkmobile: €0,52",
  },
  {
    title: "Doktersbezoek",
    sub: "45 minuten · €4/uur · ziekenhuis omgeving",
    winner: "Q-Park — €3,00",
    saving: "Besparing t.o.v. Yellowbrick: €0,49",
  },
];

export default function GoedkoopsteParkeerappPage() {
  return (
    <div className="qurb-page goedkoopste-page">
      <a className="skip-link" href="#main">
        Naar inhoud
      </a>
      <SiteNav variant="page" />

      <main id="main">
        {/* Hero */}
        <div className="hero">
          <p className="eyebrow">Parkeer-app vergelijking</p>
          <h1 className="hero__title">Welke parkeer-app is het goedkoopst?</h1>
          <p className="hero__sub">
            Elke parkeer-app rekent servicekosten bovenop het gemeentetarief.
            Parkmobile, EasyPark, Yellowbrick, ANWB Parkeren en Q-Park hanteren
            allemaal een ander model. Dit is het overzicht.
          </p>
          <p style={mutedNote}>
            Wil je zien wat je op jouw exacte locatie betaalt? Gebruik de{" "}
            <Link href="/#vergelijker" style={mutedLink}>
              live vergelijker op de homepage →
            </Link>
          </p>
          <Link className="hero__cta" href="/#vergelijker">
            Bereken jouw parkeerkosten
          </Link>
        </div>

        {/* Vergelijkingstabel */}
        <section className="band">
          <div className="section">
            <p className="eyebrow">Servicekosten overzicht</p>
            <h2 className="section__title">Hoe berekent elke app de kosten?</h2>
            <p className="section__sub">
              De servicekosten verschillen sterk per app en per situatie.
              Sommige apps rekenen een vast bedrag per sessie, andere een
              percentage van het tarief.
            </p>
            <p style={{ marginBlockStart: "16px", fontSize: "14px", color: "var(--muted-soft)" }}>
              Wil je zien wat je op jouw exacte locatie betaalt? Gebruik de{" "}
              <Link href="/#vergelijker" style={mutedLink}>
                live vergelijker op de homepage →
              </Link>
            </p>

            <div style={{ overflowX: "auto", marginBlockStart: "32px" }}>
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>App</th>
                    <th>Servicekostenmodel</th>
                    <th>1 uur (€3/u)</th>
                    <th>1 uur (€7,50/u)</th>
                    <th>4 uur (€3/u)</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((r) => (
                    <tr key={r.name}>
                      <td>
                        <div className="app-name">
                          <span
                            className="app-dot"
                            style={{ background: r.dot }}
                          ></span>
                          {r.name}
                        </div>
                        <div className="fee-rule">{r.rule}</div>
                      </td>
                      <td>{r.model}</td>
                      {r.cols.map((c, i) => (
                        <td
                          key={i}
                          className={
                            "cost-cell" + (r.best[i] ? " cost-cell--best" : "")
                          }
                        >
                          {c}
                          {r.best[i] ? (
                            <>
                              {" "}
                              <span className="best-tag">goedkoopst</span>
                            </>
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Scenario's */}
        <section className="section">
          <p className="eyebrow">Praktijkscenario&apos;s</p>
          <h2 className="section__title">Wat kost het in de praktijk?</h2>
          <p className="section__sub">
            De goedkoopste app hangt af van hoe lang je parkeert en in welke
            stad. Hier zijn een paar veelvoorkomende situaties.
          </p>
          <div className="scenarios">
            {SCENARIOS.map((s) => (
              <div className="scenario" key={s.title}>
                <h3 className="scenario__title">{s.title}</h3>
                <p className="scenario__sub">{s.sub}</p>
                <div className="scenario__winner">
                  <span
                    className="app-dot"
                    style={{ background: "#199646" }}
                  ></span>
                  {s.winner}
                </div>
                <p className="scenario__saving">{s.saving}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Uitleg */}
        <section className="band">
          <div className="section">
            <p className="eyebrow">Achtergrond</p>
            <h2 className="section__title">Waarom verschilt de prijs per app?</h2>
            <p className="section__sub">
              Parkeer-apps verdienen geld door een toeslag te rekenen op het
              gemeentetarief. Hoe dat model eruitziet verschilt per aanbieder —
              en dat maakt vergelijken de moeite waard.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                marginBlockStart: "32px",
              }}
            >
              {[
                {
                  h: "Vast bedrag per sessie",
                  p: "Parkmobile (€0,52) en Yellowbrick (€0,49) rekenen een vast bedrag per parkeeractie, ongeacht hoe lang je parkeert. Voordelig bij lange sessies, relatief duur bij korte stops.",
                },
                {
                  h: "Percentage van het tarief",
                  p: "EasyPark rekent 15% van het uurtarief, met een minimum van €0,19/uur en een maximum van €0,70/uur (totaal max €7). In dure steden als Amsterdam pakt dit relatief duur uit.",
                },
                {
                  h: "Geen of lage servicekosten",
                  p: "Q-Park rekent geen transactiekosten op straat — je betaalt alleen het gemeentetarief. ANWB Parkeren rekent €0,33 maar vereist een ANWB-lidmaatschap (vanaf ~€72/jaar).",
                },
              ].map((c) => (
                <div
                  key={c.h}
                  style={{
                    padding: "24px",
                    background: "var(--canvas)",
                    border: "1px solid var(--hairline)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--ink)",
                      marginBlockEnd: "8px",
                    }}
                  >
                    {c.h}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--muted-soft)",
                      lineHeight: 1.6,
                    }}
                  >
                    {c.p}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <h2>Bekijk het voor jouw locatie</h2>
          <p>
            De goedkoopste app hangt af van waar en hoe lang je parkeert. Qurb
            berekent het live voor jouw adres.
          </p>
          <Link className="btn" href="/#vergelijker">
            Start live vergelijking
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
