import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import "../qurb.css";
import "./faq.css";

export const metadata: Metadata = {
  title: "Veelgestelde vragen — Qurb",
  description:
    "Veelgestelde vragen over Qurb — hoe werkt de parkeervergelijker, welke apps worden vergeleken en hoe zijn de prijzen berekend?",
};

const linkStyle = { color: "var(--brand-strong)", textUnderlineOffset: "3px" };

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Wat is Qurb?",
    a: "Qurb is een gratis parkeervergelijker die alle grote parkeer-apps vergelijkt op wat je écht betaalt — het gemeentetarief plus de servicekosten van de app. Zo weet je vooraf welke app het goedkoopst is voor jouw situatie.",
  },
  {
    q: "Welke parkeer-apps vergelijkt Qurb?",
    a: "Qurb vergelijkt momenteel Parkmobile, EasyPark, Yellowbrick, ANWB Parkeren en Q-Park. We werken eraan om meer aanbieders toe te voegen.",
  },
  {
    q: "Hoe berekent Qurb de prijs?",
    a: "We tellen het gemeentetarief voor jouw parkeerlocatie op bij de servicekosten van elke app. Servicekosten kunnen per transactie, per minuut of een combinatie van beide zijn. Je ziet altijd de totaalprijs voor de door jou gekozen duur.",
  },
  {
    q: "Gebruikt Qurb live parkeerdata?",
    a: "Ja, Qurb gebruikt open parkeerdata van de RDW (Rijksdienst voor het Wegverkeer). Deze data wordt regelmatig bijgewerkt. Tarieven zijn indicatief — controleer altijd het parkeerbord ter plaatse voor de meest actuele informatie.",
  },
  {
    q: "Is Qurb gratis?",
    a: "Ja, Qurb is volledig gratis voor particulieren en vereist geen account. Je hoeft niets te downloaden — de vergelijker werkt gewoon in je browser.",
  },
  {
    q: "In welke steden werkt Qurb?",
    a: "Qurb werkt momenteel in Amsterdam, Rotterdam, Utrecht, Den Haag, Eindhoven, Haarlem, Leiden en Groningen. We voegen regelmatig nieuwe steden toe.",
  },
  {
    q: "Verkoopt Qurb mijn gegevens?",
    a: (
      <>
        Nee. Qurb verdient niets aan jouw parkeerdata. We slaan geen persoonlijke
        gegevens op en verkopen niets door aan derden. Lees onze{" "}
        <Link href="/privacy" style={linkStyle}>
          privacypagina
        </Link>{" "}
        voor meer details.
      </>
    ),
  },
  {
    q: "Kan ik Qurb ook op mijn telefoon gebruiken?",
    a: "Ja, Qurb werkt volledig in je mobiele browser. Er is geen app nodig. Open gewoon qurb.nl op je telefoon en je kunt direct vergelijken.",
  },
  {
    q: "Staat mijn parkeerzone er niet bij?",
    a: (
      <>
        Stuur ons een berichtje via de{" "}
        <Link href="/contact" style={linkStyle}>
          contactpagina
        </Link>
        . We voegen ontbrekende zones zo snel mogelijk toe.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="qurb-page faq-page">
      <a className="skip-link" href="#main">
        Naar inhoud
      </a>
      <SiteNav variant="page" />

      <main id="main">
        <div className="hero">
          <p className="eyebrow">Veelgestelde vragen</p>
          <h1 className="hero__title">Hoe werkt Qurb?</h1>
          <p className="hero__sub">
            Alles over de parkeervergelijker, de prijsberekening en de data die
            we gebruiken.
          </p>
        </div>

        <div className="faq" role="list">
          {FAQS.map(({ q, a }) => (
            <details className="faq__item" role="listitem" key={q}>
              <summary className="faq__btn">
                {q}
                <span className="faq__icon" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="faq__answer">{a}</p>
            </details>
          ))}
        </div>

        <section className="cta">
          <h2>Peek before you park</h2>
          <p>
            Gratis parkeerkosten vergelijken in Amsterdam, Rotterdam, Utrecht en
            Den Haag.
          </p>
          <Link className="btn" href="/#vergelijker">
            Start vergelijking
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
