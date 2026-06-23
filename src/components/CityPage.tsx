import Link from "next/link";
import Footer from "@/components/Footer";
import QurbEngine from "@/components/QurbEngine";
import MeldClose from "@/components/MeldClose";
import { CITIES, type City } from "@/lib/cities";
import "../app/qurb.css";

/** Shared city landing page — the homepage vergelijker with per-city hero +
 *  local-tariff copy. Markup ported verbatim from the original <city>.html. */
export default function CityPage({ city }: { city: City }) {
  return (
    <div className="qurb-page">
      <a className="skip-link" href="#vergelijker">
        Naar de vergelijker
      </a>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          <span className="ticker__item">🅿️ 5 parkeer-apps vergeleken</span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">
            💰 Gemiddeld €0,50 besparing per sessie
          </span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">
            📍 Amsterdam · Rotterdam · Utrecht · Den Haag
          </span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">✅ Gratis · geen account nodig</span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">
            ⚡ peek <span className="kicker">before</span> you park
          </span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">🅿️ 5 parkeer-apps vergeleken</span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">
            💰 Gemiddeld €0,50 besparing per sessie
          </span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">
            📍 Amsterdam · Rotterdam · Utrecht · Den Haag
          </span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">✅ Gratis · geen account nodig</span>
          <span className="ticker__dot"></span>
          <span className="ticker__item">⚡ peek before you park</span>
          <span className="ticker__dot"></span>
        </div>
      </div>

      <header className="nav">
        <div className="nav__inner">
          <Link className="nav__logo" href="/">
            qurb
          </Link>
          <nav className="nav__tabs" aria-label="Hoofdmenu">
            <a className="nav__tab" href="#vergelijker" aria-current="page">
              Vergelijker
            </a>
            <a className="nav__tab" href="#hoe">
              Hoe het werkt
            </a>
            <a className="nav__tab" href="#apps">
              Apps
            </a>
          </nav>
          <div className="nav__right">
            <Link className="nav__link" href="/over-ons">
              Over Qurb
            </Link>
            <Link className="nav__link" href="/contact">
              Contact
            </Link>
            <button className="nav__account" type="button" aria-label="Account">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="1" y="3" width="14" height="1.5" rx=".75" />
                <rect x="1" y="7.25" width="14" height="1.5" rx=".75" />
                <rect x="1" y="11.5" width="14" height="1.5" rx=".75" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        <section
          className="search"
          id="vergelijker"
          aria-label="Parkeren vergelijken"
        >
          <form
            className="search__shell"
            id="search-form"
            autoComplete="off"
            noValidate
          >
            <div className="search__bar">
              <div className="field field--addr">
                <label className="field__label" htmlFor="addr">
                  Bestemming
                </label>
                <input
                  className="field__input"
                  id="addr"
                  name="addr"
                  type="text"
                  placeholder="Bijv. Coolsingel 40 Rotterdam"
                  role="combobox"
                  aria-expanded="false"
                  aria-controls="suggest"
                  aria-autocomplete="list"
                  aria-describedby="addr-help"
                />
                <ul
                  className="suggest"
                  id="suggest"
                  role="listbox"
                  aria-label="Adressuggesties"
                ></ul>
              </div>
              <div className="field field--when">
                <span className="field__label" id="when-label">
                  Wanneer
                </span>
                <div
                  className="field__toggle"
                  id="when-choice"
                  aria-labelledby="when-label"
                >
                  <button
                    type="button"
                    className="toggle-btn toggle-btn--active"
                    id="when-now"
                    aria-pressed="true"
                  >
                    Nu
                  </button>
                  <button
                    type="button"
                    className="toggle-btn"
                    id="when-specific"
                    aria-pressed="false"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Plan vooruit
                  </button>
                </div>
                <div id="when-at-wrap" hidden>
                  <input
                    className="field__input field__datetime"
                    id="start"
                    name="van"
                    type="datetime-local"
                    aria-label="Vertrektijd"
                  />
                </div>
              </div>
              <div className="field field--dur">
                <span className="field__label" id="dur-label">
                  Hoe lang
                </span>
                <div className="dur" role="group" aria-labelledby="dur-label">
                  <button
                    type="button"
                    className="dur__btn"
                    id="dur-minus"
                    aria-label="Korter parkeren"
                  >
                    −
                  </button>
                  <span className="dur__val" id="dur-val" aria-live="polite">
                    1 uur
                  </span>
                  <button
                    type="button"
                    className="dur__btn"
                    id="dur-plus"
                    aria-label="Langer parkeren"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="orb"
                id="go"
                type="submit"
                aria-label="Vergelijk parkeerkosten"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </button>
            </div>
            <p className="search__meta">
              <span id="found" className="found" hidden></span>
              <span id="tarief" aria-live="polite"></span>
            </p>
            <div
              className="shortcuts"
              role="group"
              aria-label="Snelle duratie-keuze"
            >
              <button type="button" className="shortcut" data-min="60">
                1 uur
              </button>
              <button type="button" className="shortcut" data-min="120">
                2 uur
              </button>
              <button type="button" className="shortcut" data-min="240">
                4 uur
              </button>
              <button type="button" className="shortcut" data-min="1440">
                Hele dag
              </button>
              <button
                type="button"
                className="shortcut shortcut--more"
                id="shortcut-longer"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Langer parkeren
              </button>
            </div>
            <span id="addr-help" className="visually-hidden">
              Begin te typen en kies een adres uit de lijst met pijltjestoetsen.
            </span>
          </form>
        </section>

        {/* Per-city hero */}
        <section className="hero">
          <p className="hero__kicker">qurb · {city.name}</p>
          <p className="hero__eyebrow">Parkeervergelijker · {city.name}</p>
          <h1 className="hero__title">{city.heroTitle}</h1>
          <p className="hero__sub">{city.heroSub}</p>
        </section>

        <div
          className="status"
          id="error"
          role="alert"
          aria-live="assertive"
        ></div>
        <div id="results" aria-live="polite" aria-busy="false"></div>

        <section className="band">
          <div className="section" id="hoe">
            <p className="eyebrow">Zo werkt het</p>
            <h2 className="title">Drie stappen. Eén eerlijk antwoord.</h2>
            <div className="steps">
              <article className="step">
                <p className="step__n">01</p>
                <h3 className="step__t">Vul je bestemming in</h3>
                <p className="step__b">
                  Waar ga je naartoe? Qurb zoekt alle parkeeropties in de buurt —
                  van straatparkeren tot garages.
                </p>
              </article>
              <article className="step">
                <p className="step__n">02</p>
                <h3 className="step__t">Kies je tijdslot</h3>
                <p className="step__b">
                  Geef aan hoe lang je parkeert. Qurb rekent alles door,
                  inclusief de servicekosten van elke parkeer-app.
                </p>
              </article>
              <article className="step">
                <p className="step__n">03</p>
                <h3 className="step__t">Peek — en kies slim</h3>
                <p className="step__b">
                  In één oogopslag zie je wat elke optie écht kost. Geen
                  verrassingen achteraf.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section" id="apps">
          <p className="eyebrow">Gedekte apps</p>
          <h2 className="title">Parkeer-apps vergelijken: de grote vijf</h2>
          <p className="lede">
            Van marktleider tot challenger — alle grote parkeer-apps in één
            overzicht.
          </p>
          <ul className="chips">
            <li className="chip">
              <span className="chip__dot" style={{ background: "#FF4B00" }}></span>
              Parkmobile
            </li>
            <li className="chip">
              <span className="chip__dot" style={{ background: "#1E8AFF" }}></span>
              EasyPark
            </li>
            <li className="chip">
              <span className="chip__dot" style={{ background: "#F5C400" }}></span>
              Yellowbrick
            </li>
            <li className="chip">
              <span className="chip__dot" style={{ background: "#FF8200" }}></span>
              ANWB Parkeren
            </li>
            <li className="chip">
              <span className="chip__dot" style={{ background: "#199646" }}></span>
              Q-Park
            </li>
          </ul>
        </section>

        {/* Per-city local tariffs */}
        <section className="band">
          <div className="section">
            <p className="eyebrow">Lokale tarieven</p>
            <h2 className="title">Parkeertarieven in {city.name}</h2>
            <p className="lede">{city.tariffLede}</p>
            <p
              style={{
                marginBlockStart: "16px",
                fontSize: "14px",
                color: "var(--muted-soft)",
              }}
            >
              Welke app is generiek het goedkoopst?{" "}
              <Link
                href="/goedkoopste-parkeerapp"
                style={{ color: "var(--brand-strong)", fontWeight: 600 }}
              >
                Bekijk de volledige parkeer-app vergelijking →
              </Link>
            </p>
          </div>
        </section>

        {/* Andere steden */}
        <section className="section">
          <p className="eyebrow">Andere steden</p>
          <h2 className="title">Qurb werkt ook in</h2>
          <ul className="chips">
            {CITIES.map((c) =>
              c.slug === city.slug ? (
                <li className="chip" aria-current="page" key={c.slug}>
                  <span
                    className="chip__dot"
                    style={{ background: "var(--brand)" }}
                  ></span>
                  {c.name}
                </li>
              ) : (
                <li key={c.slug}>
                  <Link className="chip" href={`/${c.slug}`}>
                    <span
                      className="chip__dot"
                      style={{ background: "var(--brand)" }}
                    ></span>
                    {c.name}
                  </Link>
                </li>
              )
            )}
          </ul>
        </section>

        <section className="cta" id="over">
          <h2>Goedkoop parkeren begint met vergelijken</h2>
          <p>Qurb is gratis. Altijd. Geen account, geen gedoe.</p>
          <a className="btn" href="#vergelijker">
            Start vergelijking
          </a>
        </section>
      </main>

      <Footer />

      {/* ── Meld-modal ── */}
      <div
        id="meld-overlay"
        className="meld-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meld-titel"
      >
        <div className="meld-modal">
          <div className="meld-modal-inner">
            <h2 id="meld-titel">Data klopt niet?</h2>
            <p>Laat het ons weten — we verbeteren de data zo snel mogelijk.</p>
            <form id="meld-form">
              <input type="hidden" name="context" id="meld-context" />
              <label htmlFor="meld-soort">Wat klopt er niet?</label>
              <select name="soort" id="meld-soort" required defaultValue="">
                <option value="">— kies een optie —</option>
                <option value="prijs">Tarief / prijs klopt niet</option>
                <option value="locatie">
                  Locatie bestaat niet of is verkeerd
                </option>
                <option value="zone">Zone of vergunningsgebied klopt niet</option>
                <option value="garage">Garage-informatie klopt niet</option>
                <option value="anders">Anders</option>
              </select>
              <label htmlFor="meld-toelichting">Toelichting (optioneel)</label>
              <textarea
                name="toelichting"
                id="meld-toelichting"
                placeholder="Wat is er volgens jou het juiste tarief of de juiste situatie?"
              ></textarea>
              <div className="meld-actions">
                <button type="button" id="meld-cancel" className="meld-cancel">
                  Annuleren
                </button>
                <button type="submit" className="meld-submit">
                  Verstuur melding
                </button>
              </div>
            </form>
          </div>
          <div className="meld-bedankt" style={{ display: "none" }}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h2>Bedankt!</h2>
            <p>
              Je melding is ontvangen. We kijken ernaar zo snel als we kunnen.
            </p>
            <div className="meld-actions" style={{ justifyContent: "center" }}>
              <MeldClose />
            </div>
          </div>
        </div>
      </div>

      <QurbEngine />
    </div>
  );
}
