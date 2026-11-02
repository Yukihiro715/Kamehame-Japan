import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, MapPin, UserRound, Flag, Search, Send, Mail, CreditCard, BadgeCheck } from "lucide-react";
import { BusTours } from "@/components/site/bus-tours";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { busCopy } from "@/lib/golfpaq-copy";
import { golfpaqVisible, publicToursFrom, readGolfpaqSnapshot } from "@/lib/golfpaq";
import { isLang, LANGS } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

/** Shared Bus Golf Tours: the partner's published schedule, priced as one
 *  tax-inclusive total, with a free enquiry instead of a purchase
 *  (docs/GOLFPAQ_BUS_TOURS.md). Shown on staging; on production only once
 *  GOLFPAQ_LIVE is set, so the page cannot leak with an ordinary deploy. */
interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return withAlternates(
    socialMeta({ lang, title: "Shared Bus Golf Tours from Tokyo | KAMEHAME JAPAN", description: "18-hole golf with round-trip shared bus from Tokyo. Browse dates and prices, send a free enquiry; our travel partner emails you the purchase details.", path: `/${lang}/golf-bus/` }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/golf-bus/`])),
  );
}

export default async function GolfBusPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  let env: Record<string, unknown> | null = null;
  try { env = (await import("cloudflare:workers")).env as Record<string, unknown>; } catch { env = null; }
  if (!golfpaqVisible(env as { KH_ENV?: string; GOLFPAQ_LIVE?: string } | null)) notFound();
  const snapshot = await readGolfpaqSnapshot(env?.READY_STATE as Parameters<typeof readGolfpaqSnapshot>[0]);
  const { tours, updatedAt } = publicToursFrom(snapshot);
  const C = busCopy(lang);
  const icons = [Search, Send, Mail, CreditCard, BadgeCheck];
  return (
    <>
      <SiteHeader variant="overlay" lang={lang} />
      <main className="gb" lang={lang}>
        <section className="gb-hero">
          <img src="/images/golf-gallery-01-fuji-aerial.webp" alt="" fetchPriority="high" />
          <div className="gb-hero-text">
            <p className="gb-eyebrow">KAMEHAME JAPAN · GOLF</p>
            <h1>{C.heroTitle}</h1>
            <p className="gb-hero-lede">{C.heroLede}</p>
            <ul className="gb-features">
              {C.features.map((f, i) => <li key={f}>{[<Bus key="b" size={16} />, <UserRound key="u" size={16} />, <Flag key="f" size={16} />, <CheckCircle2 key="c" size={16} />][i]} {f}</li>)}
            </ul>
            <a className="gb-btn gb-btn-big gb-hero-cta" href="#tours">{C.heroCta}</a>
          </div>
        </section>

        <section className="gb-two" aria-labelledby="gb-two-h">
          <div className="gb-wrap">
            <h2 id="gb-two-h">{C.twoWaysH}</h2>
            <div className="gb-two-grid">
              <a className="gb-choice on" href="#tours"><img src="/images/golf-gallery-11-transfer-minivan.webp" alt="" loading="lazy" /><div><h3>{C.sharedH}</h3><p>{C.sharedBody}</p><span className="gb-link">{C.sharedCta} →</span></div></a>
              <Link className="gb-choice" href={`/${lang}/tokyo/mt-fuji-golf-day/`}><img src="/images/golf-gallery-07-fuji-fairway.webp" alt="" loading="lazy" /><div><h3>{C.customH}</h3><p>{C.customBody}</p><span className="gb-link">{C.customCta} →</span></div></Link>
            </div>
          </div>
        </section>

        <BusTours tours={tours} updatedAt={updatedAt} lang={lang} C={C} />

        <section className="gb-steps" aria-labelledby="gb-steps-h">
          <div className="gb-wrap">
            <h2 id="gb-steps-h">{C.stepsH}</h2>
            <ol className="gb-steps-list">
              {C.steps.map((s, i) => { const Icon = icons[i]; return <li key={s.n}><span className="gb-step-icon"><Icon size={22} /></span><span className="gb-step-n">{s.n}</span><b>{s.title}</b><p>{s.body}</p></li>; })}
            </ol>
          </div>
        </section>

        <section className="gb-included" aria-labelledby="gb-incl-h">
          <div className="gb-wrap gb-two-col">
            <div><h2 id="gb-incl-h">{C.includedH}</h2><ul className="gb-list">{C.included.map((x) => <li key={x}><CheckCircle2 size={16} /> {x}</li>)}</ul></div>
            <div><h2>{C.notIncludedH}</h2><ul className="gb-list gb-list-not">{C.notIncluded.map((x) => <li key={x}><MapPin size={16} /> {x}</li>)}</ul></div>
          </div>
        </section>

        <section className="gb-good" aria-labelledby="gb-good-h">
          <div className="gb-wrap">
            <h2 id="gb-good-h">{C.goodH}</h2>
            <div className="gb-good-grid">{C.good.map((g) => <div key={g.title} className="gb-good-card"><b>{g.title}</b><p>{g.body}</p></div>)}</div>
          </div>
        </section>

        <section className="gb-faq" aria-labelledby="gb-faq-h">
          <div className="gb-wrap">
            <h2 id="gb-faq-h">{C.faqH}</h2>
            {C.faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
            <p className="gb-small gb-legal">{lang === "ja" ? "ツアーの契約・販売主体、旅行業登録情報、適用される旅行条件・取消規定は、購入案内に記載します。" : "The seller of the tour, its travel-agency registration and the travel conditions and cancellation rules that apply are stated in the purchase instructions you receive."}</p>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
