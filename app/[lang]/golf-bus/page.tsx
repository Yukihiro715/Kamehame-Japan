import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, MapPin, UserRound, Flag, Search, Send, Mail, CreditCard, BadgeCheck, Clock, Users, ShieldCheck, JapaneseYen, CalendarX2 } from "lucide-react";
import { BusTours } from "@/components/site/bus-tours";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { busCopy } from "@/lib/golfpaq-copy";
import { golfpaqVisible, publicToursFrom, readGolfpaqSnapshot } from "@/lib/golfpaq";
import { isLang, LANGS } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

/** Shared Bus Golf Tours: how the tour works (meeting points, the day, what
 *  the price covers, cancellation), then the partner's published schedule on
 *  a calendar, priced as one tax-inclusive total, with a free enquiry instead
 *  of a purchase (docs/GOLFPAQ_BUS_TOURS.md). Shown on staging; on production
 *  only once GOLFPAQ_LIVE is set. */
interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return withAlternates(
    socialMeta({ lang, title: "Shared Bus Golf Tours from Tokyo | KAMEHAME JAPAN", description: "18-hole golf with a round-trip shared coach from Shinjuku or Oimachi. Pick a date on the calendar, see the all-in price, send a free enquiry; our travel partner emails you the purchase details.", path: `/${lang}/golf-bus/` }),
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
  const stepIcons = [Search, Send, Mail, CreditCard, BadgeCheck];
  const featureIcons = [Bus, UserRound, Flag, CheckCircle2];
  return (
    <>
      <SiteHeader variant="overlay" lang={lang} />
      <main className="gb" lang={lang}>
        <section className="gb-hero gb-hero-bus">
          <img src="/images/golf-bus/bus-coach-wide.webp" alt="" fetchPriority="high" />
          <div className="gb-hero-text">
            <p className="gb-eyebrow">KAMEHAME JAPAN · GOLF · SHARED BUS TOURS</p>
            <h1>{C.heroTitle}</h1>
            <p className="gb-hero-lede">{C.heroLede}</p>
            <ul className="gb-features">
              {C.features.map((f, i) => { const Icon = featureIcons[i]; return <li key={f}><Icon size={16} /> {f}</li>; })}
            </ul>
            <a className="gb-btn gb-btn-big gb-hero-cta" href="#tours">{C.heroCta}</a>
          </div>
        </section>

        <section className="gb-about" aria-labelledby="gb-about-h">
          <div className="gb-wrap">
            <h2 id="gb-about-h">{C.aboutH}</h2>
            <p className="gb-lede">{C.aboutLede}</p>

            <div className="gb-about-grid">
              <div className="gb-about-block">
                <h3><MapPin size={20} /> {C.meetH}</h3>
                <p>{C.meetLede}</p>
                <div className="gb-meet">
                  {C.meetPoints.map((m) => <div key={m.name} className="gb-meet-card"><b>{m.name}</b><p>{m.where}</p><p className="gb-small">{m.access}</p></div>)}
                </div>
                <p className="gb-note"><Clock size={14} /> {C.meetNote}</p>
              </div>
              <div className="gb-about-block">
                <h3><Clock size={20} /> {C.dayH}</h3>
                <ol className="gb-day">
                  {C.day.map((d) => <li key={d.title}><span className="gb-day-time">{d.time}</span><div><b>{d.title}</b><p>{d.body}</p></div></li>)}
                </ol>
                <p className="gb-small">{C.dayNote}</p>
              </div>
            </div>

            <h3 className="gb-about-h3"><Users size={20} /> {C.playH}</h3>
            <div className="gb-good-grid">{C.play.map((g) => <div key={g.title} className="gb-good-card"><b>{g.title}</b><p>{g.body}</p></div>)}</div>

            <h3 className="gb-about-h3"><JapaneseYen size={20} /> {C.costH}</h3>
            <p>{C.costLede}</p>
            <div className="gb-two-col gb-cost">
              <div>
                <h4>{C.costIncludedH}</h4>
                <table className="gb-cost-table"><tbody>{C.costIncluded.map((r) => <tr key={r.item}><th scope="row"><CheckCircle2 size={15} /> {r.item}</th><td>{r.note}</td></tr>)}</tbody></table>
              </div>
              <div>
                <h4>{C.costExtraH}</h4>
                <table className="gb-cost-table gb-cost-extra"><tbody>{C.costExtra.map((r) => <tr key={r.item}><th scope="row"><MapPin size={15} /> {r.item}</th><td>{r.note}</td></tr>)}</tbody></table>
              </div>
            </div>
            <p className="gb-note"><ShieldCheck size={14} /> {C.costNote}</p>

            <h3 className="gb-about-h3"><CalendarX2 size={20} /> {C.cancelH}</h3>
            <p>{C.cancelLede}</p>
            <ul className="gb-list gb-cancel">{C.cancel.map((x) => <li key={x}><CheckCircle2 size={16} /> {x}</li>)}</ul>
            <p className="gb-small">{C.cancelNote}</p>
          </div>
        </section>

        <BusTours tours={tours} updatedAt={updatedAt} lang={lang} C={C} />

        <section className="gb-steps" aria-labelledby="gb-steps-h">
          <div className="gb-wrap">
            <h2 id="gb-steps-h">{C.stepsH}</h2>
            <ol className="gb-steps-list">
              {C.steps.map((s, i) => { const Icon = stepIcons[i]; return <li key={s.n}><span className="gb-step-icon"><Icon size={22} /></span><span className="gb-step-n">{s.n}</span><b>{s.title}</b><p>{s.body}</p></li>; })}
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
            <p className="gb-crosslink"><Link href={`/${lang}/tokyo/mt-fuji-golf-day/`}>{C.customLink} →</Link> · <Link href={`/${lang}/golf-tours/`}>{C.twoWaysH} →</Link></p>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
