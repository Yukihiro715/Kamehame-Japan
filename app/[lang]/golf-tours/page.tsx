import { JOURNAL_COPY } from "@/lib/journal-copy";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, Flag, UserRound, Languages, ArrowRight, Circle, Plus } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { GolfGuestQuote } from "@/components/site/golf-guest-review";
import { GolfTravelComparison } from "@/components/site/golf-travel-choice";
import { busCopy, type BusCopy } from "@/lib/golfpaq-copy";
import { golfpaqEnabled } from "@/lib/golfpaq-env";
import { publicToursFrom, readGolfpaqSnapshot, yen } from "@/lib/golfpaq";
import { isLang, LANGS } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";
import { articlesForExperience } from "@/lib/articles";

/** The golf landing page for advertising: the two ways to play (shared bus
 *  tour vs. custom booking) explained side by side, each leading to its own
 *  page. Visible on staging, and on production once GOLFPAQ_LIVE is set. */
interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return withAlternates(
    socialMeta({ lang, title: "Golf in Japan, Made Easy | KAMEHAME JAPAN", description: "Two ways to play golf near Tokyo: a shared bus tour on a published date, or a course and tee time booked for your group. Compare and choose.", path: `/${lang}/golf-tours/` }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/golf-tours/`])),
  );
}

/** "Included" with a circle, then "Optional, extra" with a plus: what the price covers and what can be added. */
function ItemList({ items, C }: { items: { ok: boolean; text: string }[]; C: BusCopy }) {
  const inc = items.filter((i) => i.ok), opt = items.filter((i) => !i.ok);
  return (
    <div className="gl-hcard-lists">
      <p className="gl-hcard-lh">{C.heroIncludedH}</p>
      <ul className="gl-hcard-items">{inc.map((it) => <li key={it.text} className="ok"><span aria-hidden="true"><Circle size={13} strokeWidth={2.75} /></span>{it.text}</li>)}</ul>
      {opt.length > 0 && <><p className="gl-hcard-lh">{C.heroOptionalH}</p>
      <ul className="gl-hcard-items">{opt.map((it) => <li key={it.text} className="opt"><span aria-hidden="true"><Plus size={13} strokeWidth={3} /></span>{it.text}</li>)}</ul></>}
    </div>
  );
}

export default async function GolfToursPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  if (!(await golfpaqEnabled())) notFound();
  const C = busCopy(lang);
  const icons = [Flag, UserRound, Languages, CheckCircle2];
  // The lowest open bus-tour price for the hero card; a rounded figure when the feed is not available.
  let fromPrice = "¥30,000";
  try {
    const { env } = await import("cloudflare:workers");
    const { tours } = publicToursFrom(await readGolfpaqSnapshot((env as { READY_STATE?: Parameters<typeof readGolfpaqSnapshot>[0] }).READY_STATE));
    const open = tours.filter((t) => !t.soldOut).map((t) => t.perPersonYen);
    if (open.length) fromPrice = yen(Math.min(...open));
  } catch { /* keep the rounded figure */ }
  const busHref = `/${lang}/golf-bus/`, customHref = `/${lang}/tokyo/mt-fuji-golf-day/`;
  return (
    <>
      <SiteHeader variant="overlay" lang={lang} />
      <main className="gb gl" lang={lang}>
        <section className="gb-hero gl-hero">
          <img src="/images/golf-gallery-01-fuji-aerial.webp" alt="" fetchPriority="high" />
          <div className="gb-hero-text">
            <p className="gb-eyebrow">KAMEHAME JAPAN · GOLF</p>
            <h1>{C.landTitle}</h1>
            <p className="gb-hero-lede">{C.landLede}</p>
            <ul className="gb-features">
              {C.landFeatures.map((f, i) => { const Icon = icons[i]; return <li key={f}><Icon size={16} /> {f}</li>; })}
            </ul>
          </div>
        </section>

        <section className="gl-options" id="choose" aria-labelledby="gl-opt-h">
          <div className="gb-wrap">
            <h2 id="gl-opt-h">{C.twoWaysH}</h2>
            <div className="gl-hero-cards">
              <Link className="gl-hcard gl-hcard-custom" href={customHref}>
                <span className="gl-hcard-tag">{C.heroCustomTag}</span>
                <img src="/images/golf-gallery-07-fuji-fairway.webp" alt="" fetchPriority="high" />
                <div><h2><Flag size={16} /> {C.customH}</h2><p className="gl-hcard-who">{C.heroCustomWho}</p><p className="gl-hcard-price">{C.heroCustomPrice}</p><ItemList items={C.heroCustomItems} C={C} /><span className="gb-btn gb-btn-small">{C.customCta} <ArrowRight size={14} /></span></div>
              </Link>
              <Link className="gl-hcard" href={busHref}>
                <img src="/images/golf-bus/bus-card.webp" alt="" fetchPriority="high" />
                <div><h2><Bus size={16} /> {C.sharedH}</h2><p className="gl-hcard-who">{C.heroBusWho}</p><p className="gl-hcard-price">{C.heroBusPrice.replace("{price}", fromPrice)}</p><ItemList items={C.heroBusItems} C={C} /><span className="gb-btn gb-btn-small">{C.sharedCta} <ArrowRight size={14} /></span></div>
              </Link>
            </div>
            <p className="gl-options-note">{C.heroCardsNote}</p>
            <GolfGuestQuote lang={lang} landing />
          </div>
        </section>

        <section className="gl-compare" aria-labelledby="gl-cmp-h">
          <div className="gb-wrap">
            <h2 id="gl-cmp-h">{C.compareH}</h2>
            <p className="gb-lede">{C.compareLede}</p>
            <div className="gl-table-wrap">
              <table className="gl-table">
                <thead><tr><th scope="col"></th><th scope="col"><Bus size={16} /> {C.compareCols[0]}</th><th scope="col"><Flag size={16} /> {C.compareCols[1]}</th></tr></thead>
                <tbody>{C.compare.map((r) => <tr key={r.label}><th scope="row">{r.label}</th><td>{r.shared}</td><td>{r.custom}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="gl-estimate">
          <div className="gb-wrap">
            <GolfTravelComparison lang={lang} />
          </div>
        </section>

        <section className="gl-choose" aria-labelledby="gl-ch-h">
          <div className="gb-wrap">
            <h2 id="gl-ch-h">{C.chooseH}</h2>
            <div className="gl-choose-grid">
              <div className="gl-choose-card"><p>{C.chooseShared}</p><Link className="gb-btn" href={busHref}>{C.sharedCta} <ArrowRight size={16} /></Link></div>
              <div className="gl-choose-card"><p>{C.chooseCustom}</p><Link className="gb-btn gb-btn-outline" href={customHref}>{C.customCta} <ArrowRight size={16} /></Link></div>
            </div>
          </div>
        </section>
        {articlesForExperience("mt-fuji-golf-day", lang, 3).length > 0 && <section className="golf-journal-links gb-wrap" aria-labelledby="golf-reading-heading">
          <h2 id="golf-reading-heading">{JOURNAL_COPY[lang].planningGuides}</h2>
          <ul>{articlesForExperience("mt-fuji-golf-day", lang, 3).map((article) => <li key={article.slug}><Link href={`/${lang}/journal/${article.slug}/`}>{article.copy[lang]!.title} <ArrowRight size={16} /></Link></li>)}</ul>
          <Link href={`/${lang}/journal/`}>{JOURNAL_COPY[lang].all} <ArrowRight size={16} /></Link>
        </section>}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
