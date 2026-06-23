import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import "../qurb.css";
import "./over-ons.css";

export const metadata: Metadata = {
  title: "Over Qurb — Peek before you park",
  description:
    "Qurb is een gratis parkeervergelijker die alle grote parkeer-apps vergelijkt op wat je écht betaalt, inclusief servicekosten.",
};

export default function OverOnsPage() {
  return (
    <div className="qurb-page over-ons-page">
      <a className="skip-link" href="#main">
        Naar inhoud
      </a>
      <SiteNav variant="page" />

      <main id="main">
        {/* Hero */}
        <div className="hero">
          <p className="eyebrow">Over Qurb</p>
          <h1 className="hero__title">
            Eerlijk parkeren begint met eerlijke prijzen
          </h1>
          <p className="hero__sub">
            Parkeer-apps maken parkeren makkelijker. Maar elke app rekent zijn
            eigen servicekosten bovenop het gemeentetarief — en dat verschil zie
            je pas op je bankafschrift. Qurb maakt het verschil vooraf
            zichtbaar.
          </p>
          <Link className="hero__cta" href="/#vergelijker">
            Probeer het gratis
          </Link>
        </div>

        {/* Missie */}
        <section className="band">
          <div className="section">
            <div className="mission">
              <div className="mission__body">
                <p className="eyebrow">Onze missie</p>
                <h2 className="mission__title">Geen verrassingen meer achteraf</h2>
                <div className="mission__body">
                  <p>
                    Parkeren in Nederland is de afgelopen jaren flink duurder
                    geworden. Gemeenten verhogen de tarieven, en parkeer-apps
                    voegen daar hun eigen kosten aan toe. Het resultaat: je weet
                    pas wat je betaalt als de transactie al gedaan is.
                  </p>
                  <p>
                    Qurb is gebouwd om daar verandering in te brengen. We
                    vergelijken alle grote parkeer-apps op de werkelijke prijs —
                    gemeentetarief plus servicekosten — zodat jij vóóraf de beste
                    keuze maakt.
                  </p>
                  <p>
                    We gebruiken open data van de RDW en houden die zo actueel
                    mogelijk. Qurb is gratis, vraagt geen account en verdient
                    niets aan jouw parkeerdata.
                  </p>
                </div>
              </div>
              <div className="mission__visual">
                <div className="stat">
                  <span className="stat__val">5</span>
                  <span className="stat__label">Parkeer-apps vergeleken</span>
                </div>
                <div className="stat">
                  <span className="stat__val">€0,50</span>
                  <span className="stat__label">
                    Gemiddelde besparing per sessie
                  </span>
                </div>
                <div className="stat">
                  <span className="stat__val">100%</span>
                  <span className="stat__label">Gratis, altijd</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Waarden */}
        <section className="section">
          <p className="eyebrow">Waar we voor staan</p>
          <h2 className="section__title">Onze principes</h2>
          <p className="section__sub">
            Drie dingen die we nooit zullen doen, en drie dingen die we altijd
            zullen doen.
          </p>
          <div className="values">
            <div className="value">
              <div className="value__icon">🔍</div>
              <h3 className="value__title">Transparantie eerst</h3>
              <p className="value__body">
                We laten zien hoe we tot een prijs komen. Welk tarief, welke
                servicekosten, welke databron. Geen zwarte dozen.
              </p>
            </div>
            <div className="value">
              <div className="value__icon">🆓</div>
              <h3 className="value__title">Gratis voor particulieren</h3>
              <p className="value__body">
                Qurb is gratis voor iedereen, zonder account en zonder verborgen
                verdienmodel op jouw data. Voor zakelijke gebruikers werken we
                aan een pro-versie met parkeerinzichten en accountbeheer.
              </p>
            </div>
            <div className="value">
              <div className="value__icon">📡</div>
              <h3 className="value__title">Open data</h3>
              <p className="value__body">
                We bouwen op open parkeerdata van de RDW. Publieke data, publiek
                toegankelijk — wij maken het alleen begrijpelijk.
              </p>
            </div>
            <div className="value">
              <div className="value__icon">⚡</div>
              <h3 className="value__title">Snel en simpel</h3>
              <p className="value__body">
                Adres invullen, tijdstip kiezen, vergelijken. Geen registratie,
                geen app, geen gedoe. Qurb werkt gewoon in je browser.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
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
