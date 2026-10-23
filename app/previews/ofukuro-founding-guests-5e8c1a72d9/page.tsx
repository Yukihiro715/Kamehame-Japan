import type { Metadata } from "next";
import { Camera, Clock3, Home, Sparkles, UtensilsCrossed } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { OfukuroHeroCta, OfukuroMenuPicker, OfukuroMenuProvider, OfukuroSticky } from "@/components/site/ofukuro-menu";
import { OfukuroForm } from "@/components/site/ofukuro-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { OFUKURO, OFUKURO_FOUNDING, OFUKURO_PATH, ofukuroFoundingRows, yenOf } from "@/lib/ofukuro-dinner";
import { t } from "@/lib/i18n";

// Ofukuro Dinner, founding-guest offer: a separate unlisted URL for the
// launch, where the first dinners we photograph are 30% off in return for
// the photos (owner, 2026-10-23; terms in lib/ofukuro-dinner.ts). Built on
// the same components as the regular preview; honest about the illustrative
// photos. noindex, not in the catalog, sitemap or navigation; the form is
// not connected yet.

export const metadata: Metadata = {
  title: `${OFUKURO_FOUNDING.title} — 30% off for the first ten dinners | KAMEHAME JAPAN — Preview`,
  robots: { index: false, follow: false, noarchive: true },
};

export default function OfukuroFoundingGuestsPage() {
  const lang = "en" as const;
  const T = t(lang);
  const D = T.detail;
  const f = OFUKURO_FOUNDING;
  const offer = { discount: f.discount, label: "Founding-guest price (30% off)" };
  const photos = [
    { img: "/images/ofukuro-hero-table.webp", alt: "Illustration of a Japanese home-cooked dinner served at an accommodation (AI-generated; real photos are what this offer is for)" },
    { img: "/images/ofukuro-cooking.webp", alt: "Illustration of a home cook preparing dinner while talking with a guest (AI-generated)" },
    { img: "/images/ofukuro-menu-nikujaga.webp", alt: "Example nikujaga set with rice, miso soup and two small side dishes (illustrative)" },
  ];
  const two = ofukuroFoundingRows[1];

  return (
    <main className="subpage detail-page xp xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: "/" }, { label: "Tokyo", href: "/en/tokyo/" }, { label: f.title }]} />

      <p className="xp-preview-banner" role="status">Preview — not bookable yet. The photos are illustrations; the form is not connected and sends nothing.</p>

      <OfukuroMenuProvider>
        <header className="xp-head">
          <p className="soon-flag">{f.flag}</p>
          <h1>{f.title}</h1>
          <p className="xp-lede ofk-subtitle">{f.subtitle}</p>
        </header>

        <section className="xp-mv" aria-label={D.gallery}>
          <div className="xp-hero-photo">
            <HeroCarousel photos={photos} lang={lang}>
              <span className="soon-badge">Illustration</span>
            </HeroCarousel>
          </div>
          <Gallery photos={photos} lang={lang} note="Illustrations, not photographs of real dinners: that is exactly what this offer is for. Your dinner's photos replace them." />
          <ul className="xp-conditions">
            <li><Camera size={14} /> 30% off for a 20-minute photo session</li>
            <li><Home size={14} /> At your accommodation · Tokyo 23 wards</li>
            <li><Clock3 size={14} /> About 2 hours</li>
            <li><UtensilsCrossed size={14} /> One menu per group</li>
          </ul>
        </section>

        <div className="xp-cols">
          <aside className="xp-side">
            <div className="bk-card" id="booking">
              <div className="bk-price"><small>Founding-guest price</small> <b>{yenOf(two.founding)} <s className="ofk-regular">{yenOf(two.regular)}</s></b> <small>{D.minPriceNote(2)} · tax and ingredients included</small></div>
              <p className="xp-note" style={{ margin: 0 }}>30% off every part of the price: third and fourth guest +¥4,200 each, from the fifth +¥5,600, children under 10 +¥2,100. Ten dinners only.</p>
              <p className="xp-lede" style={{ margin: 0 }}>{f.lede}</p>
              <OfukuroHeroCta />
              <p className="xp-note" style={{ margin: 0 }}>Request first; pay only after we confirm a cook, the date and the photo arrangements with you.</p>
            </div>
          </aside>

          <div className="xp-main">
            <section className="xp-section" id="why">
              <h2>{f.why.heading}</h2>
              {f.why.body.map((p, i) => <p key={i} className={i === 0 ? "xp-lede" : "xp-overview-p"}>{p}</p>)}
              <div className="ofk-offer">
                <div>
                  <h3>{f.give.heading}</h3>
                  <ul>{f.give.items.map((i) => <li key={i}><Camera size={15} className="tick" /><span>{i}</span></li>)}</ul>
                </div>
                <div>
                  <h3>{f.get.heading}</h3>
                  <ul>{f.get.items.map((i) => <li key={i}><Sparkles size={15} className="tick" /><span>{i}</span></li>)}</ul>
                </div>
              </div>
            </section>

            <section className="xp-section" id="pricing">
              <h2>Founding-guest price</h2>
              <p className="xp-lede">Tax and ingredients included; the first two guests, adults or children, are covered by the base price.</p>
              <table className="xp-pricing">
                <thead><tr><th>{D.partyCol}</th><th>Founding guests</th><th>Regular price</th></tr></thead>
                <tbody>
                  {ofukuroFoundingRows.map((r) => <tr key={r.party}><td>{D.estimateFor(r.party)}</td><td><b>{yenOf(r.founding)}</b></td><td><s>{yenOf(r.regular)}</s></td></tr>)}
                </tbody>
              </table>
              <p className="xp-pricing-note">Adults. Children under 10 beyond the first two guests: ¥2,100 each (regular ¥3,000). From the fifth guest ¥5,600 each (regular ¥8,000). Tokyo&apos;s 23 wards, with the cook&apos;s travel included.</p>
            </section>

            <section className="xp-section" id="menus">
              <h2>The seven menus</h2>
              <p className="xp-note">One set for the whole group; you choose it in the request form below. Side dishes and soups vary by cook and season.</p>
              <OfukuroMenuPicker />
            </section>

            <section className="xp-section" id="dinner">
              <h2>The dinner itself</h2>
              <p className="xp-lede">{OFUKURO.included.body}</p>
              <ul className="check-list">{OFUKURO.included.items.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul>
              <p className="xp-note">{OFUKURO.included.time} A usable kitchen and your accommodation&apos;s permission for a visiting cook are required; we check both before confirming. <a href={OFUKURO_PATH}>Full details of the regular dinner</a>.</p>
            </section>

            <section className="xp-section" id="faq">
              <h2>Questions founding guests ask</h2>
              <div className="faq-list">{f.faq.map((q) => <details key={q.q}><summary>{q.q}</summary><p>{q.a}</p></details>)}</div>
            </section>

            <section className="xp-section xp-request" id="request">
              <h2 className="xp-sub" id="request-form">Request a founding-guest dinner</h2>
              <p className="xp-note">Five short steps. We check a cook and the date, confirm the total and the photo arrangements with you, and only then send a prepayment link.</p>
              <OfukuroForm fallbackEmail={CONTACT_EMAIL} offer={offer} />
            </section>

            <section className="xp-section">
              <ul className="check-list muted">
                <li><span className="tick"><Sparkles size={14} /></span><span>Preview only: not listed on the site, not in the sitemap, not indexed. The request form is not connected yet; the number of founding-guest dinners and the photographer&apos;s visit are confirmed before publication.</span></li>
              </ul>
            </section>
          </div>
        </div>
        <OfukuroSticky price={yenOf(two.founding)} note="30% off · up to 2 guests" />
      </OfukuroMenuProvider>
      <SiteFooter lang={lang} />
    </main>
  );
}
