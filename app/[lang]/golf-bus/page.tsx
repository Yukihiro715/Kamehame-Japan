import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bus, CheckCircle2, MapPin, UserRound, Flag, Search, Send, Mail, CreditCard, BadgeCheck, Clock, Users, JapaneseYen, CalendarX2, ShieldCheck } from "lucide-react";
import { BusTours } from "@/components/site/bus-tours";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { busCopy } from "@/lib/golfpaq-copy";
import { golfpaqVisible, publicToursFrom, readGolfpaqSnapshot } from "@/lib/golfpaq";
import { displayCourseName, loadCourseNames } from "@/lib/golf-courses-db";
import { d1Db, isD1Like } from "@/lib/referral/db";
import { isLang, LANGS } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

/** Shared Bus Golf Tours: a short "at a glance" strip, then the partner's
 *  published schedule on a calendar (one tax-inclusive price, free enquiry),
 *  then the full explanation (meeting points, the day, what the price covers,
 *  cancellation) and the FAQ. Shown on staging; on production only once
 *  GOLFPAQ_LIVE is set (docs/GOLFPAQ_BUS_TOURS.md). */
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
  const names = await loadCourseNames(isD1Like(env?.DB) ? d1Db(env!.DB) : null, env?.READY_STATE as Parameters<typeof readGolfpaqSnapshot>[0]);
  const { tours: rawTours, updatedAt } = publicToursFrom(snapshot, new Date(), names);
  // courseEn carries the name for the page's language (the component shows the Japanese name on /ja/).
  const tours = rawTours.map((t) => ({ ...t, courseEn: displayCourseName(t.course, lang, names) }));
  const C = busCopy(lang);
  const stepIcons = [Search, Send, Mail, CreditCard, BadgeCheck];
  const featureIcons = [Bus, UserRound, Flag, CheckCircle2];
  const glanceIcons = [MapPin, Flag, JapaneseYen, ShieldCheck];
  return (
    <>
      <SiteHeader variant="overlay" lang={lang} />
      <main className="gb" lang={lang}>
        <section className="gb-hero gb-hero-bus">
          <picture>
            <source media="(max-width: 700px)" srcSet="/images/golf-bus/hero-phone.webp" />
            <img src="/images/golf-bus/hero-wide.webp" alt="" fetchPriority="high" />
          </picture>
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

        <section className="gb-glance" aria-label={C.glanceH}>
          <div className="gb-wrap">
            <ul className="gb-glance-list">
              {C.glance.map((g, i) => { const Icon = glanceIcons[i]; return <li key={g.title}><Icon size={18} /><div><b>{g.title}</b><p>{g.body}</p></div></li>; })}
            </ul>
            <p className="gb-glance-more"><a href="#details">{C.glanceMore} ↓</a></p>
          </div>
        </section>

        <BusTours tours={tours} updatedAt={updatedAt} lang={lang} C={C} />

        <section className="gb-about" id="details" aria-labelledby="gb-about-h">
          <div className="gb-wrap">
            <h2 id="gb-about-h">{C.detailsH}</h2>
            <p className="gb-lede">{C.aboutLede}</p>

            <details className="gb-detail" open>
              <summary><MapPin size={20} /> {C.meetH}</summary>
              <div className="gb-detail-body">
                <p>{C.meetLede}</p>
                <div className="gb-meet gb-meet-row">
                  {C.meetPoints.map((m) => <div key={m.name} className="gb-meet-card"><b>{m.name}</b><p>{m.where}</p><p className="gb-small">{m.access}</p></div>)}
                </div>
                <p className="gb-note"><Clock size={14} /> {C.meetNote}</p>
              </div>
            </details>

            <details className="gb-detail">
              <summary><Clock size={20} /> {C.dayH}</summary>
              <div className="gb-detail-body">
                <ol className="gb-day">
                  {C.day.map((d) => <li key={d.title}><span className="gb-day-time">{d.time}</span><div><b>{d.title}</b><p>{d.body}</p></div></li>)}
                </ol>
                <p className="gb-small">{C.dayNote}</p>
              </div>
            </details>

            <details className="gb-detail">
              <summary><Users size={20} /> {C.playH}</summary>
              <div className="gb-detail-body">
                <div className="gb-good-grid">{C.play.map((g) => <div key={g.title} className="gb-good-card"><b>{g.title}</b><p>{g.body}</p></div>)}</div>
              </div>
            </details>

            <details className="gb-detail">
              <summary><JapaneseYen size={20} /> {C.costH}</summary>
              <div className="gb-detail-body">
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
                {C.costNote && <p className="gb-note"><ShieldCheck size={14} /> {C.costNote}</p>}
              </div>
            </details>

            <details className="gb-detail">
              <summary><CalendarX2 size={20} /> {C.cancelH}</summary>
              <div className="gb-detail-body">
                <p>{C.cancelLede}</p>
                <ul className="gb-list gb-cancel">{C.cancel.map((x) => <li key={x}><CheckCircle2 size={16} /> {x}</li>)}</ul>
                <p className="gb-small">{C.cancelNote}</p>
              </div>
            </details>
          </div>
        </section>

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
            <div className="gb-cta-row">
              <div className="gb-cta-card"><b>{C.customLinkH}</b><Link className="gb-btn gb-btn-outline" href={`/${lang}/tokyo/mt-fuji-golf-day/`}>{C.customLinkBtn} →</Link></div>
              <div className="gb-cta-card"><b>{C.twoWaysH}</b><Link className="gb-btn gb-btn-ghost" href={`/${lang}/golf-tours/`}>{C.compareBtn} →</Link></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
