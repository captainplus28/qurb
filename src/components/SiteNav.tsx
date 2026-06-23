import Link from "next/link";

/**
 * Shared top nav.
 * - variant "home": in-page anchor tabs + Over/Contact links (index.html).
 * - variant "page": logo + Vergelijker/Contact links + "Vergelijk nu" CTA
 *   (faq/contact/over-ons/city pages).
 */
export default function SiteNav({
  variant = "page",
}: {
  variant?: "home" | "page";
}) {
  if (variant === "home") {
    return (
      <header className="nav">
        <div className="nav__inner">
          <a className="nav__logo" href="#top">
            qurb
          </a>
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
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link className="nav__logo" href="/">
          qurb
        </Link>
        <nav aria-label="Hoofdmenu">
          <Link className="nav__link" href="/#vergelijker">
            Vergelijker
          </Link>
          <Link className="nav__link" href="/contact">
            Contact
          </Link>
        </nav>
        <Link className="nav__cta" href="/#vergelijker">
          Vergelijk nu
        </Link>
      </div>
    </header>
  );
}
