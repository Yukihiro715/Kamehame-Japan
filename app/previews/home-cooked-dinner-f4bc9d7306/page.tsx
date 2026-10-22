import type { Metadata } from "next";
import { Clock3, Home, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { OfukuroHeroCta, OfukuroMenuPicker, OfukuroMenuProvider, OfukuroSticky } from "@/components/site/ofukuro-menu";
import { OfukuroCooks } from "@/components/site/ofukuro-cooks";
import { OfukuroForm } from "@/components/site/ofukuro-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { OFUKURO, OFUKURO_PRICE_ROWS, yenOf } from "@/lib/ofukuro-dinner";
import { t } from "@/lib/i18n";

// Ofukuro Dinner — unlisted preview built on the experience detail-page
// system (app/[lang]/[collection]/[slug]/page.tsx): same header, footer,
// breadcrumbs, preview banner, hero, chips, side card, sections, FAQ and
// sticky bar. Not in the catalog, the sitemap, any listing or the
// navigation; noindex. Price, area and cancellation terms are the owner's
// of 2026-10-22 (lib/ofukuro-dinner.ts); the form is still not connected.

export const metadata: Metadata = {
  title: `${OFUKURO.title} — ${OFUKURO.subtitle} | KAMEHAME JAPAN — Concept preview`,
  robots: { index: false, follow: false, noarchive: true },
};

const CONDITION_ICONS = [Home, Clock3, UtensilsCrossed, ShoppingBasket];

export default function OfukuroDinnerPreviewPage() {
  const lang = "en" as const;
  const T = t(lang);
  const D = T.detail;
  const x = OFUKURO;
  const photos = [
    { img: "/images/ofukuro-hero-table.webp", alt: "Illustrative image of a Japanese home-cooked dinner being served at an accommodation (AI-generated placeholder)" },
    { img: "/images/ofukuro-cooking.webp", alt: "Illustrative image of a local home cook preparing dinner while talking with a guest (AI-generated placeholder)" },
    { img: "/images/ofukuro-menu-karaage.webp", alt: "Example chicken karaage set with rice, miso soup and one small side dish (illustrative)" },
    { img: "/images/ofukuro-menu-nikujaga.webp", alt: "Example nikujaga set with rice, miso soup and two small side dishes (illustrative)" },
    { img: "/images/ofukuro-menu-grilled-fish.webp", alt: "Example grilled fish set with rice, miso soup and two small side dishes (illustrative)" },
  ];

  return (
    <main className="subpage detail-page xp xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: "/" }, { label: "Tokyo", href: "/en/tokyo/" }, { label: x.title }]} />

      <p className="xp-preview-banner" role="status">Concept preview — not published and not bookable. Illustrative AI-generated photos and sample cook profiles; the form is not connected and sends nothing.</p>

      <OfukuroMenuProvider>
        <header className="xp-head">
          <p className="soon-flag">Concept preview · at your accommodation</p>
          <h1>{x.title}</h1>
          <p className="xp-lede ofk-subtitle">{x.subtitle}</p>
        </header>

        <section className="xp-mv" aria-label={D.gallery}>
          <div className="xp-hero-photo">
            <HeroCarousel photos={photos} lang={lang}>
              <span className="soon-badge">Sample</span>
            </HeroCarousel>
          </div>
          <Gallery photos={photos} lang={lang} note="Illustrative AI-generated photos: the people are fictional models, and the dishes are examples — side dishes and fish vary by cook and season. Real service photography replaces them before publication." />
          <ul className="xp-conditions">
            {x.conditions.map((text, i) => { const Icon = CONDITION_ICONS[i]; return <li key={text}><Icon size={14} /> {text}</li>; })}
          </ul>
        </section>

        <div className="xp-cols">
          <aside className="xp-side">
            <div className="bk-card" id="booking">
              <div className="bk-price"><small>{D.fromPrice}</small> <b>{yenOf(OFUKURO_PRICE_ROWS[1].total)}</b> <small>{D.minPriceNote(2)}</small></div>
              <p className="xp-note" style={{ margin: 0 }}>Tax and ingredients included · third and fourth guest +¥6,000 each, from the fifth +¥8,000 · children under 10 +¥3,000</p>
              <p className="xp-lede" style={{ margin: 0 }}>{x.lede}</p>
              <p className="xp-note" style={{ margin: 0 }}>{x.note}</p>
              <OfukuroHeroCta />
              <p className="xp-note" style={{ margin: 0 }}>The total for your group is confirmed with your request, before any payment.</p>
            </div>
          </aside>

          <div className="xp-main">
            {/* 2. Ofukuro no aji */}
            <section className="xp-section" id="overview">
              <h2>{x.intro.heading}</h2>
              {x.intro.body.map((p, i) => <p key={i} className={i === 0 ? "xp-lede" : "xp-overview-p"}>{p}</p>)}
              <ul className="xp-overview-facts">
                <li><Home size={15} /><span>In the kitchen of your accommodation, not at a venue</span></li>
                <li><UtensilsCrossed size={15} /><span>One menu per group, chosen from seven</span></li>
                <li><Clock3 size={15} /><span>About two hours from arrival to clean-up; shopping happens before</span></li>
                <li><ShoppingBasket size={15} /><span>Ingredients included in the prepaid price</span></li>
              </ul>
            </section>

            {/* 3. Menus */}
            <section className="xp-section" id="menus">
              <h2>The seven menus</h2>
              <p className="xp-note">One set for the whole group. You choose it in the request form below.</p>
              <OfukuroMenuPicker />
              <p className="xp-dietary-note">{x.menuNote}</p>
            </section>

            {/* 4. Price and what's included */}
            <section className="xp-section" id="pricing">
              <h2>{D.includedH}</h2>
              <p className="xp-lede">{x.included.body}</p>
              <div className="xp-included">
                <div><ul className="check-list">{x.included.items.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul></div>
                <div>
                  <h3>{x.pricing.heading}</h3>
                  <p className="xp-note">{x.included.price}</p>
                  <p className="xp-note">{x.included.time}</p>
                </div>
              </div>
              <p className="xp-lede" style={{ marginTop: 24 }}>{x.pricing.lede}</p>
              <table className="xp-pricing">
                <thead><tr><th>{D.partyCol}</th><th>{D.totalCol}</th><th>{D.perPersonCol}</th></tr></thead>
                <tbody>
                  {OFUKURO_PRICE_ROWS.map((r) => <tr key={r.party}><td>{D.estimateFor(r.party)}</td><td><b>{yenOf(r.total)}</b></td><td>{yenOf(Math.round(r.total / r.party))}</td></tr>)}
                </tbody>
              </table>
              <p className="xp-pricing-note">Adults, tax and ingredients included. Larger groups: ¥8,000 for each guest from the fifth.</p>
              <ul className="check-list muted">{x.pricing.notes.map((n) => <li key={n}><span className="tick">✓</span><span>{n}</span></li>)}</ul>
            </section>

            {/* 5. The visit */}
            <section className="xp-section" id="visit">
              <h2>{D.scheduleH}</h2>
              <p className="xp-note">About two hours at your accommodation; the shopping is done before your cook arrives. Times are a guide.</p>
              <ol className="xp-timeline">
                {x.flow.map((st) => (
                  <li key={st.time}>
                    <span className="xp-time">{st.time}</span>
                    <div><b>{st.cook}</b><p>{st.guest}</p></div>
                  </li>
                ))}
              </ol>
              <figure className="xp-overview-fig">
                {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
                <img src="/images/ofukuro-cooking.webp" alt="Illustrative image of a local home cook preparing dinner while talking with a guest (AI-generated placeholder)" loading="lazy" width={1400} height={933} />
                <figcaption>Illustrative image. Cooking and conversation, not a hands-on class.</figcaption>
              </figure>
              <h3 className="xp-cancel-h">{x.kitchen.heading}</h3>
              <ul className="know-list">{x.kitchen.items.map((k) => <li key={k}>{k}</li>)}</ul>
              <p className="xp-note">{x.kitchen.condition}</p>
            </section>

            {/* 6. Cooks */}
            <section className="xp-section" id="cooks">
              <h2>{x.cooks.heading}</h2>
              <p className="xp-note">{x.cooks.lead}</p>
              <OfukuroCooks />
              <p className="xp-note xp-note-sample">{x.cooks.sampleNote}</p>
            </section>

            {/* 7. FAQ */}
            <section className="xp-section">
              <h2>{D.faqH}</h2>
              <div className="faq-list">{x.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
            </section>

            {/* 8. Request form */}
            <section className="xp-section xp-request" id="request">
              <h2 className="xp-sub" id="request-form">Request your dinner</h2>
              <p className="xp-note">Four short steps. We check the arrangements with a cook, then confirm the total and the conditions with you before any payment.</p>
              <OfukuroForm fallbackEmail={CONTACT_EMAIL} />
            </section>

            <section className="xp-section">
              <ul className="check-list muted">
                <li><span className="tick"><Sparkles size={14} /></span><span>Preview only: not listed on the site, not in the sitemap, not indexed. The request form is not connected yet; payment and the cook roster are set up before publication.</span></li>
              </ul>
            </section>
          </div>
        </div>
        <OfukuroSticky />
      </OfukuroMenuProvider>
      <SiteFooter lang={lang} />
    </main>
  );
}
