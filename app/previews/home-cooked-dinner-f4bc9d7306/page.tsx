import type { Metadata } from "next";
import { Check, Clock3, Home, Languages, Leaf, MapPin, MessageCircle, ShieldCheck, Sparkles, Users, Utensils } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { Fx, FxNote } from "@/components/site/money";
import { HomeDinnerForm } from "@/components/site/home-dinner-form";
import { HOME_DINNER, homeDinnerTotal } from "@/lib/home-dinner-preview";
import { yen } from "@/lib/pricing";
import { t } from "@/lib/i18n";

// Unlisted concept preview, built from the same sections and components as
// the experience detail pages (app/[lang]/[collection]/[slug]/page.tsx).
// Not in the catalog, the sitemap, any listing or the navigation; noindex.
// The form is a demo: it posts nowhere (components/site/home-dinner-form.tsx).

export const metadata: Metadata = {
  title: `${HOME_DINNER.title} | KAMEHAME JAPAN — Concept preview`,
  robots: { index: false, follow: false, noarchive: true },
};

const ICONS = { home: Home, meal: Utensils, chat: MessageCircle, leaf: Leaf } as const;
const CONDITION_ICONS = [MapPin, Clock3, Users, Languages, Home];
const PARTIES = [2, 3, 4, 6];

export default function HomeDinnerPreviewPage() {
  const lang = "en" as const;
  const T = t(lang);
  const D = T.detail;
  const x = HOME_DINNER;
  const photos = [
    { img: "/images/hcd-home-table.webp", alt: "Homestyle nikujaga, miso soup, rice and tamagoyaki on a family table (illustrative)" },
    { img: "/images/hcd-host-sample.webp", alt: "A Japanese home cook in a blue apron (illustrative sample host)" },
    { img: "/images/hcd-karaage.webp", alt: "Japanese karaage fried chicken with rice, soup and side dishes (illustrative)" },
    { img: "/images/hcd-plant-based.webp", alt: "Plant-forward Japanese home cooking: mushroom rice, simmered vegetables and tofu (illustrative)" },
    { img: "/images/hcd-host-keiko.webp", alt: "A Japanese home cook ready to start (illustrative sample host)" },
  ];
  const headline = yen(x.price.base);
  const condition = `+${yen(x.price.extraAdult)} per further adult · groceries included`;

  return (
    <main className="subpage detail-page xp xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: "/" }, { label: "Tokyo", href: "/en/tokyo/" }, { label: x.title }]} />

      <p className="xp-preview-banner" role="status">Concept preview — not published and not bookable. Sample hosts, dishes, photos and prices; the form sends nothing.</p>

      <header className="xp-head">
        <p className="soon-flag">Concept preview · Tokyo · visiting-host service</p>
        <h1>{x.title}</h1>
      </header>

      <section className="xp-mv" aria-label={D.gallery}>
        <div className="xp-hero-photo">
          <HeroCarousel photos={photos} lang={lang}>
            <span className="soon-badge">Sample</span>
          </HeroCarousel>
        </div>
        <Gallery photos={photos} lang={lang} note="Illustrative AI-generated photos. The hosts and meals pictured are samples, not confirmed providers or dishes." />
        <ul className="xp-conditions">
          {x.conditions.map((text, i) => { const Icon = CONDITION_ICONS[i]; return <li key={text}><Icon size={14} /> {text}</li>; })}
        </ul>
      </section>

      <div className="xp-cols">
        <aside className="xp-side">
          <div className="bk-card" id="booking">
            <div className="bk-price">
              <small>Sample price · not a quote</small>
              <b><Fx>{headline}</Fx><span className="bk-unit">per group of {x.price.baseGuests}</span></b>
              <small className="bk-total">{condition}</small>
            </div>
            <p className="xp-note">{yen(x.price.base)} for two guests, then +{yen(x.price.extraAdult)} per further adult and +{yen(x.price.extraChild)} per child under 12. Groceries, cooking and clean-up included. Final pricing, tax treatment and host terms are still being set.</p>
            <a className="bk-cta" href="#request-form">Try the enquiry form (demo)</a>
            <p className="xp-note" style={{ margin: 0 }}>No payment, no booking: the form shows what we would ask, and sends nothing.</p>
          </div>
        </aside>

        <div className="xp-main">
          {/* Overview */}
          <section className="xp-section" id="overview">
            <h2>{D.overviewH}</h2>
            <p className="xp-lede">{x.tagline}</p>
            {x.overview.map((p) => <p key={p} className="xp-overview-p">{p}</p>)}
            <ul className="xp-overview-facts">
              <li><Clock3 size={15} /><span>Lunch or dinner · usual start 12:00, 18:00 or 19:00 · 2–3 hours</span></li>
              <li><Sparkles size={15} /><span>{x.includedShort}</span></li>
              <li><Home size={15} /><span>A visiting-host service: it happens in your accommodation&apos;s kitchen, not at a venue</span></li>
              <li><ShieldCheck size={15} /><span>Dietary requests confirmed with the host before the day</span></li>
            </ul>
          </section>

          {/* Highlights */}
          <section className="xp-section">
            <h2>{D.highlightsH}</h2>
            <div className="xp-highlights">
              {x.highlights.map((h) => { const Icon = ICONS[h.icon]; return (
                <div className="xp-highlight" key={h.title}><Icon size={20} /><b>{h.title}</b><p>{h.body}</p></div>
              ); })}
            </div>
          </section>

          {/* How it works */}
          <section className="xp-section" id="how">
            <h2>How it works</h2>
            <ol className="xp-flow">
              {x.flow.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
            </ol>
          </section>

          {/* Hosts */}
          <section className="xp-section" id="hosts">
            <h2>Meet the hosts (sample profiles)</h2>
            <p className="xp-note">Not chefs: people who cook for their families every day and like having guests at the table. You can name a preferred host in the form, or leave the match to us.</p>
            <div className="xp-highlights xp-cards">
              {x.hosts.map((h) => (
                <div className="xp-highlight" key={h.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
                  <img src={h.img} alt={h.alt} loading="lazy" />
                  <b>{h.name} · {h.age}</b>
                  <ul className="xp-card-facts">
                    <li><MapPin size={13} /> {h.area}</li>
                    <li><Languages size={13} /> {h.languages}</li>
                    <li><Utensils size={13} /> {h.specialities}</li>
                    <li><Leaf size={13} /> {h.dietary}</li>
                  </ul>
                  <p>{h.bio}</p>
                  <small className="xp-card-tag">Sample host · fictional profile</small>
                </div>
              ))}
            </div>
            <p className="xp-note xp-note-sample">All three profiles, names, ages, areas and photos are fictional examples. Real host profiles are verified before launch; no reviews or ratings are shown until real guests have written them.</p>
          </section>

          {/* Menus */}
          <section className="xp-section" id="menus">
            <h2>What&apos;s for dinner</h2>
            <p className="xp-note">Three directions to give you an idea. The host plans the actual dishes around the season, your requests and your kitchen.</p>
            <div className="xp-highlights xp-cards">
              {x.menus.map((m) => (
                <div className="xp-highlight" key={m.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
                  <img src={m.img} alt={m.alt} loading="lazy" />
                  <b>{m.title}</b>
                  <p>{m.dishes}</p>
                  <small className="xp-card-tag">{m.tags}</small>
                </div>
              ))}
            </div>
            <p className="xp-dietary-note">{x.menuNote}</p>
          </section>

          {/* Pricing */}
          <section className="xp-section" id="pricing">
            <h2>{D.pricingH} (sample)</h2>
            <table className="xp-pricing">
              <thead><tr><th>{D.partyCol}</th><th>{D.totalCol}</th><th>{D.perPersonCol}</th></tr></thead>
              <tbody>
                {PARTIES.map((n) => { const total = homeDinnerTotal(n, 0); return (
                  <tr key={n}><td>{D.stickyGroupOf(n)}</td><td className="total"><Fx>{yen(total)}</Fx></td><td><Fx>{yen(Math.round(total / n))}</Fx></td></tr>
                ); })}
              </tbody>
            </table>
            <p className="xp-pricing-note">Illustrative prices for adults; children under 12 are +{yen(x.price.extraChild)} each. {D.largerParties} Tax treatment, host pay and grocery budgets are not finalised.</p>
            <FxNote lang={lang} />
          </section>

          {/* Included */}
          <section className="xp-section">
            <h2>{D.includedH}</h2>
            <div className="xp-included">
              <div><ul className="check-list">{x.included.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul></div>
              <div><h3>{D.notIncludedH}</h3><ul className="check-list muted">{x.notIncluded.map((i) => <li key={i}><span className="tick">—</span><span>{i}</span></li>)}</ul></div>
            </div>
          </section>

          {/* Where */}
          <section className="xp-section">
            <h2>Where it happens</h2>
            <div className="xp-venue">
              <figure className="xp-venue-photo">
                {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, as the detail pages use */}
                <img src="/images/hcd-host-sample.webp" alt="A Japanese home cook in a blue apron (illustrative sample host)" loading="lazy" />
                <figcaption>Illustrative photo. The dinner happens in your own accommodation, so there is no venue to show.</figcaption>
              </figure>
              <div className="xp-venue-cols">
                <div><h3>{D.venueKnownH}</h3><ul className="know-list">{x.venue.known.map((k) => <li key={k}>{k}</li>)}</ul></div>
                <div><h3>{D.venueAfterH}</h3><ul className="know-list">{x.venue.afterBooking.map((k) => <li key={k}>{k}</li>)}</ul></div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="xp-section">
            <h2>{D.faqH}</h2>
            <div className="faq-list">
              {x.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          </section>

          {/* Terms and the demo form */}
          <section className="xp-section xp-request" id="request">
            <h3 className="xp-cancel-h">{D.cancellationH}</h3>
            <p className="xp-cancel">{x.cancellation}</p>

            <h2 className="xp-sub" id="request-form">Plan your home dinner (demo form)</h2>
            <p className="xp-note">The questions the live form will ask, split into three short steps. Try it with sample details: the button shows a preview of your entries and the sample estimate, and nothing is sent.</p>
            <HomeDinnerForm />
          </section>

          <section className="xp-section">
            <ul className="check-list muted">
              <li><span className="tick"><Check size={14} /></span><span>Not listed on the site, not in the sitemap, not indexed. Share the URL only with people who should see it.</span></li>
            </ul>
          </section>
        </div>
      </div>

      <StickyRequestBar price={headline} condition="for 2 · sample price" label="Plan a dinner (demo)" lang={lang} watchHero="#booking" watchTarget="#request-form" />
      <SiteFooter lang={lang} />
    </main>
  );
}
