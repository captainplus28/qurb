import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import "../qurb.css";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact — Qurb",
  description:
    "Neem contact op met Qurb — vragen, feedback of een ontbrekende parkeerzone? We horen het graag.",
};

export default function ContactPage() {
  return (
    <div className="qurb-page contact-page">
      <a className="skip-link" href="#main">
        Naar inhoud
      </a>
      <SiteNav variant="page" />

      <main id="main">
        <div className="hero">
          <p className="eyebrow">Contact</p>
          <h1 className="hero__title">We horen graag van je</h1>
          <p className="hero__sub">
            Vragen, feedback of een samenwerking? Stuur ons een berichtje — we
            reageren binnen 2 werkdagen.
          </p>
        </div>

        <div className="form-wrap">
          <div className="partner-card">
            <div className="partner-card__eyebrow">Samenwerking</div>
            <h2 className="partner-card__title">Interesse in een partnership?</h2>
            <p className="partner-card__body">
              Ben je een parkeeroperator, gemeente of mobiliteitsplatform en wil
              je samenwerken met Qurb? Neem dan direct contact op via{" "}
              <a
                href="mailto:hello@qurb.nl?subject=Partnership"
                className="partner-card__link"
              >
                hello@qurb.nl
              </a>{" "}
              — we horen graag wat je in gedachten hebt.
            </p>
          </div>

          <ContactForm />
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
