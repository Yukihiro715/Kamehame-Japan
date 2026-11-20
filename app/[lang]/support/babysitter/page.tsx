import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Baby, CalendarDays, Clock3, Globe2, Languages, MapPin, Moon, ShieldCheck, Sparkles, Utensils, Wallet } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { SupportForm } from "@/components/site/support-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { BABYSITTER_PHOTOS, supportCopy } from "@/lib/support";
import { BABYSITTER_FEES as FEES, feeYen } from "@/lib/support-fees";
import { Fx, FxNote } from "@/components/site/money";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const S = supportCopy(lang);
  return withAlternates(
    socialMeta({ lang, title: `${S.baby.h1} | KAMEHAME JAPAN`, description: S.baby.tagline, path: `/${lang}/support/babysitter/`, image: "/images/support-babysitter.webp", type: "article" }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/support/babysitter/`])),
  );
}

const SCENE_ICONS = [Sparkles, Moon, Globe2, Clock3];
const CONDITION_ICONS = [MapPin, Baby, Languages, Wallet];

/** Babysitting at the guest's hotel: KAMEHAME JAPAN's own product, arranged
 *  with vetted agencies that are never named here. Same bones as an
 *  experience page (title, photos, facts, a card beside the copy, the form at
 *  the end) without a price, since every request is quoted. */
export default async function BabysitterPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);
  const D = T.detail;
  const S = supportCopy(lang);
  const B = S.baby;
  const photos = BABYSITTER_PHOTOS.map((p, i) => ({ img: p.img, alt: B.photoAlts[i] ?? B.photoAlts[0] }));
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: B.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <main className="subpage detail-page xp xp2 sp" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: S.nav, href: `/${lang}/support/` }, { label: B.h1 }]} />

      <header className="xp-head">
        <p className="soon-flag sp-flag">{S.category}</p>
        <h1>{B.h1}</h1>
      </header>

      <section className="xp-mv" aria-label={D.gallery}>
        <div className="xp-hero-photo"><HeroCarousel photos={photos} lang={lang} /></div>
        <Gallery photos={photos} lang={lang} />
        <ul className="xp-conditions">
          {B.conditions.map((text, i) => { const Icon = CONDITION_ICONS[i] ?? Sparkles; return <li key={text}><Icon size={14} /> {text}</li>; })}
        </ul>
      </section>

      <div className="xp-cols">
        <aside className="xp-side">
          <div className="bk-card sp-card" id="booking">
            <div className="bk-price">
              <small>{B.card.eyebrow}</small>
              <b>{B.card.from && <span className="sp-from">{B.card.from} </span>}<Fx brief>{feeYen(FEES.fromTotal)}</Fx>{!B.card.from && <span className="from-suffix">〜</span>}</b>
              <small className="sp-from-note">{B.card.fromNote(FEES.minHours)}</small>
            </div>
            <b className="bk-quote-heading sp-card-title">{B.card.title}</b>
            <p className="sp-card-body">{B.card.body}</p>
            <a className="bk-cta" href="#request-form">{B.card.cta}</a>
            <ul className="bk-points">
              <li><ShieldCheck size={14} /> {B.card.points[0]}</li>
              <li><Clock3 size={14} /> {B.card.points[1]}</li>
              <li><CalendarDays size={14} /> {B.card.points[2]}</li>
            </ul>
          </div>
        </aside>

        <div className="xp-main">
          <section className="xp-section" id="overview">
            <h2>{B.aboutH}</h2>
            <p className="xp-lede">{B.tagline}</p>
            {B.about.map((p) => <p key={p} className="xp-overview-p">{p}</p>)}
          </section>

          <section className="xp-section" id="scenes">
            <h2>{B.scenesH}</h2>
            <div className="xp-highlights">
              {B.scenes.map((s, i) => { const Icon = SCENE_ICONS[i] ?? Sparkles; return <div className="xp-highlight" key={s.title}><Icon size={20} /><b>{s.title}</b><p>{s.body}</p></div>; })}
            </div>
          </section>

          <section className="xp-section" id="care">
            <h2>{B.careH}</h2>
            <p className="xp-note">{B.careLead}</p>
            <ul className="check-list">{B.care.map((c) => <li key={c}><span className="tick">✓</span><span>{c}</span></li>)}</ul>
            <p className="xp-note sp-not"><Utensils size={14} /> {B.notCare}</p>
          </section>

          <section className="xp-section" id="pricing">
            <h2>{B.priceH}</h2>
            <p className="xp-note">{B.priceLead}</p>
            <table className="xp-pricing sp-fees">
              <tbody>
                <tr><td><b>{B.fee.english}</b><small>{B.fee.minimum(FEES.minHours)}</small></td><td className="total"><Fx>{feeYen(FEES.hourEn)}</Fx> <span className="sp-unit">{B.fee.perHour}</span></td></tr>
                <tr><td><b>{B.fee.japanese}</b><small>{B.fee.minimum(FEES.minHours)}</small></td><td className="total"><Fx>{feeYen(FEES.hourJa)}</Fx> <span className="sp-unit">{B.fee.perHour}</span></td></tr>
                <tr><td>{B.fee.night}</td><td>+<Fx>{feeYen(FEES.night)}</Fx> <span className="sp-unit">{B.fee.perHour}</span></td></tr>
                <tr><td>{B.fee.weekend}</td><td>+<Fx>{feeYen(FEES.weekend)}</Fx> <span className="sp-unit">{B.fee.perHour}</span></td></tr>
                <tr><td>{B.fee.peak}</td><td>+<Fx>{feeYen(FEES.peak)}</Fx> <span className="sp-unit">{B.fee.perHour}</span></td></tr>
                <tr><td>{B.fee.bath}</td><td>+<Fx>{feeYen(FEES.bath)}</Fx> <span className="sp-unit">{B.fee.perTime}</span></td></tr>
                <tr><td>{B.fee.second(FEES.secondPct, FEES.secondOlderPct)}<small>{B.fee.third}</small></td><td /></tr>
                <tr><td>{B.fee.notice2}</td><td>+<Fx>{feeYen(FEES.notice2)}</Fx></td></tr>
                <tr><td>{B.fee.notice1}</td><td>+<Fx>{feeYen(FEES.notice1)}</Fx></td></tr>
                <tr><td>{B.fee.transport}</td><td>{B.fee.transportNote}</td></tr>
              </tbody>
            </table>
            <p className="xp-pricing-note">{B.fee.note}</p>
            <FxNote lang={lang} />
            <h3 className="sp-cancel-h">{B.fee.cancelH}</h3>
            <ul className="check-list">{B.fee.cancel.map((c) => <li key={c}><span className="tick">·</span><span>{c}</span></li>)}</ul>
          </section>

          <section className="xp-section">
            <h2>{B.faqH}</h2>
            <div className="faq-list">
              {B.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            </div>
          </section>

          <section className="xp-section xp-request" id="request">
            <h2>{B.flowH}</h2>
            <ol className="xp-flow sp-flow">
              {B.flow.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
            </ol>
            <h2 className="xp-sub" id="request-form">{B.requestH}</h2>
            <p className="xp-note">{B.requestLead}</p>
            <SupportForm lang={lang} fallbackEmail={CONTACT_EMAIL} />
          </section>
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
