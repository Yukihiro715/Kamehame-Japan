import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, Flag, UserRound, Languages, ArrowRight, Circle, X } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { busCopy } from "@/lib/golfpaq-copy";
import { golfpaqEnabled } from "@/lib/golfpaq-env";
import { publicToursFrom, readGolfpaqSnapshot, yen } from "@/lib/golfpaq";
import { isLang, LANGS } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

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
            <a className="gb-btn gb-btn-big gb-hero-cta" href="#choose">{C.landCta}</a>
          </div>
        </section>

        <section className="gl-options" id="choose" aria-labelledby="gl-opt-h">
          <div className="gb-wrap">
            <h2 id="gl-opt-h">{C.twoWaysH}</h2>
            <div className="gl-hero-cards">
              <Link className="gl-hcard gl-hcard-custom" href={customHref}>
                <span className="gl-hcard-tag">{C.heroCustomTag}</span>
                <img src="/images/golf-gallery-07-fuji-fairway.webp" alt="" fetchPriority="high" />
                <div><h2><Flag size={16} /> {C.customH}</h2><p className="gl-hcard-who">{C.heroCustomWho}</p><p className="gl-hcard-price">{C.heroCustomPrice}</p><ul className="gl-hcard-items">{C.heroCustomItems.map((it) => <li key={it.text} className={it.ok ? "ok" : "no"}><span aria-hidden="true">{it.ok ? <Circle size={13} strokeWidth={2.75} /> : <X size={13} strokeWidth={2.75} />}</span>{it.text}</li>)}</ul><span className="gb-btn gb-btn-small">{C.customCta} <ArrowRight size={14} /></span></div>
              </Link>
              <Link className="gl-hcard" href={busHref}>
                <img src="/images/golf-bus/bus-card.webp" alt="" fetchPriority="high" />
                <div><h2><Bus size={16} /> {C.sharedH}</h2><p className="gl-hcard-who">{C.heroBusWho}</p><p className="gl-hcard-price">{C.heroBusPrice.replace("{price}", fromPrice)}</p><ul className="gl-hcard-items">{C.heroBusItems.map((it) => <li key={it.text} className={it.ok ? "ok" : "no"}><span aria-hidden="true">{it.ok ? <Circle size={13} strokeWidth={2.75} /> : <X size={13} strokeWidth={2.75} />}</span>{it.text}</li>)}</ul><span className="gb-btn gb-btn-small gb-btn-dark">{C.sharedCta} <ArrowRight size={14} /></span></div>
              </Link>
            </div>
            <p className="gl-options-note">{C.heroCardsNote}</p>
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

        <section className="gl-estimate" aria-labelledby="gl-est-h">
          <div className="gb-wrap">
            <h2 id="gl-est-h">{C.estimateH}</h2>
            <p className="gb-lede">{C.estimateLede}</p>
            <div className="gl-table-wrap">
              <table className="gl-table gl-table-est">
                <thead><tr><th scope="col"></th><th scope="col">{C.estimateCols[0]}</th><th scope="col">{C.estimateCols[1]}</th></tr></thead>
                <tbody>{C.estimateRows.map((r, i) => <tr key={r.label} className={i >= C.estimateRows.length - 2 ? "total" : ""}><th scope="row">{r.label}</th><td>{r.feeOnly}</td><td>{r.withTransfer}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="gb-small">{C.estimateNote}</p>
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
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
