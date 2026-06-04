# qurb · Beveiliging

*Eerlijk uitgangspunt: niemand kan "onhackbaar" garanderen. Wel kun je de
aanvalsoppervlakte klein houden en de bekende risico's afdekken. Dit document
is de checklist daarvoor — per fase, met de zwaarste risico's bovenaan.*

## Huidige situatie (statisch prototype) — aanvalsoppervlakte is klein
- Eén statisch HTML-bestand, geen backend, geen login, geen betaling, geen database.
- Geen geheime sleutels in de code. Enige externe aanroep: PDOK (open overheids-API, geen sleutel).
- Er valt dus weinig te "hacken": er is geen server om binnen te dringen en geen data om te stelen.

### Al gedaan voor livegang
- [x] **XSS afgedekt**: tekst uit de PDOK-API wordt ge-escaped (`esc()`) voordat die in de pagina komt.
- [x] **Content-Security-Policy** als meta-tag in de pagina (baseline, werkt ook zonder hosting-config).
- [x] **Beveiligingsheaders** in `_headers` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).

### Nog doen rond livegang (statisch)
- [ ] **HTTPS afdwingen** + automatisch certificaat (standaard bij Netlify/Cloudflare Pages).
- [ ] **Domein vastzetten**: registrar-lock aan, DNS bij een betrouwbare partij, 2FA op het account.
- [ ] **2FA op alle accounts**: GitHub, hosting, domeinregistrar, e-mail. Dit is in de praktijk het grootste echte risico — een gekaapt account, niet de code.
- [ ] **Headers controleren** na deploy via https://securityheaders.com en https://observatory.mozilla.org.
- [ ] **Geen geheimen in git**: nooit sleutels/wachtwoorden committen (zie backend-fase).

## Backend-fase — hier begint het echte beveiligingswerk
Zodra er een server bijkomt (RDW/NDW ophalen, sleutels verbergen) gelden deze punten:

- [ ] **Sleutels server-side**, nooit in de frontend. Gebruik environment variables, niet de code. `.env` in `.gitignore`.
- [ ] **Rate limiting** op elke eigen endpoint, zodat niemand de boel kan platleggen of leegtrekken.
- [ ] **Input-validatie** op alles wat van de gebruiker komt (adres, coördinaten, tijdvak): strak typen en begrenzen.
- [ ] **CORS** krap zetten: alleen het eigen domein mag de API aanroepen.
- [ ] **Caching** van RDW/NDW-data server-side, zodat je niet bij elke bezoeker de bron aanroept (kosten + fair-use).
- [ ] **CSP aanscherpen**: `'unsafe-inline'` voor scripts vervangen door een nonce of hash zodra er een build-stap is.
- [ ] **Afhankelijkheden bijhouden**: `npm audit` / Dependabot aanzetten tegen kwetsbare pakketten (supply chain).
- [ ] **Logging zonder persoonsgegevens**; bewaartermijnen kort.

## Als er accounts of betalingen bijkomen (later)
- [ ] **AVG** wordt dan pas echt relevant: privacyverklaring, dataminimalisatie, verwerkersovereenkomsten.
- [ ] **Betalingen** nooit zelf afhandelen — via een PSD2-/PCI-conforme partij (Mollie, Stripe, Adyen).
- [ ] **Wachtwoorden** nooit zelf opslaan zonder hashing (bcrypt/argon2), of beter: inlog uitbesteden.

## Vuistregel
Het grootste praktische risico voor een project als dit is niet een geniale hack
op de code, maar een **gekaapt account** (e-mail, GitHub, hosting, domein).
Zet daarom als eerste overal 2FA aan. Dat levert het meeste op voor de minste moeite.
