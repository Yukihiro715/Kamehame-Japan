import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, Flag, UserRound, Languages, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { busCopy } from "@/lib/golfpaq-copy";
import { golfpaqEnabled } from "@/lib/golfpaq-env";
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

        <section className="gb-two gl-two" id="choose" aria-labelledby="gl-two-h">
          <div className="gb-wrap">
            <h2 id="gl-two-h">{C.twoWaysH}</h2>
            <div className="gl-cards">
              <Link className="gl-card" href={busHref}>
                <img src="/images/golf-bus/bus-card.webp" alt="" loading="lazy" />
                <div><span className="gl-num">1</span><h3><Bus size={20} /> {C.sharedH}</h3><p>{C.sharedBody}</p><span className="gb-btn">{C.sharedCta} <ArrowRight size={16} /></span></div>
              </Link>
              <Link className="gl-card" href={customHref}>
                <img src="/images/golf-gallery-07-fuji-fairway.webp" alt="" loading="lazy" />
                <div><span className="gl-num">2</span><h3><Flag size={20} /> {C.customH}</h3><p>{C.customBody}</p><span className="gb-btn gb-btn-outline">{C.customCta} <ArrowRight size={16} /></span></div>
              </Link>
            </div>
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
