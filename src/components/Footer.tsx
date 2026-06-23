import Link from "next/link";

/** Site footer — ported verbatim from the original index.html <footer>. */
export default function Footer() {
  return (
    <footer>
      <div className="footer__cols">
        <section>
          <h2 className="footer__title">Ondersteuning</h2>
          <ul className="footer__links">
            <li>
              <Link href="/over-ons">Over Qurb</Link>
            </li>
            <li>
              <Link href="/hoe-het-werkt">Hoe het werkt</Link>
            </li>
            <li>
              <Link href="/faq">Veelgestelde vragen</Link>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Data</h2>
          <ul className="footer__links">
            <li>
              <a href="https://www.rdw.nl/" rel="noopener" target="_blank">
                RDW Open Data
              </a>
            </li>
            <li>
              <Link href="/#vergelijker">Gemeentetarieven</Link>
            </li>
            <li>
              <Link href="/#vergelijker">Garagedata</Link>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Qurb</h2>
          <ul className="footer__links">
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <a
                href="https://github.com/captainplus28/qurb"
                rel="noopener"
                target="_blank"
              >
                GitHub
              </a>
            </li>
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Steden</h2>
          <ul className="footer__links">
            <li>
              <Link href="/amsterdam">Amsterdam</Link>
            </li>
            <li>
              <Link href="/rotterdam">Rotterdam</Link>
            </li>
            <li>
              <Link href="/utrecht">Utrecht</Link>
            </li>
            <li>
              <Link href="/den-haag">Den Haag</Link>
            </li>
            <li>
              <Link href="/haarlem">Haarlem</Link>
            </li>
            <li>
              <Link href="/leiden">Leiden</Link>
            </li>
            <li>
              <Link href="/eindhoven">Eindhoven</Link>
            </li>
            <li>
              <Link href="/groningen">Groningen</Link>
            </li>
          </ul>
        </section>
      </div>
      <div className="legal">
        <p>
          © 2026 Qurb · Beta · peek before you park. Tarieven zijn indicatief en
          gebaseerd op de open parkeerdata van de RDW; tijdvakken zoals
          koopavond en zondag worden nog niet volledig meegerekend.
        </p>
        <span className="legal__logo">qurb</span>
      </div>
    </footer>
  );
}
