import Link from "next/link";
import { Clock3, Wine } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { BookingProvider, type BookingExperience } from "@/components/site/booking-context";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { ReviewList } from "@/components/site/review-list";
import { ReviewSummaryPanel } from "@/components/site/reviews";
import { CancellationTable } from "@/components/site/cancellation-table";
import { GolfGallery, type GolfPhoto } from "@/components/site/golf-gallery";
import { GolfOptions } from "@/components/site/golf-options";
import { GolfRequestForm } from "@/components/site/golf-request-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { countOf, perPersonOf, perPersonRefText, pricingForVariant, tierTotal, yen } from "@/lib/pricing";
import { cancellationFor, catalogFor, cityBySlug, previewsFor, type Experience } from "@/lib/catalog";
import { articleDate, articlesForExperience } from "@/lib/articles";
import { REVIEWS_PUBLISHED, reviewsFor } from "@/lib/reviews";
import { langHome, t, type Lang } from "@/lib/i18n";
import { productJsonLd } from "@/lib/seo";

/** The golf page (one URL, two areas, three party sizes). In order: a short
 *  title block, the photos, the one options panel (beside the photos on wide
 *  screens, under them on phones), what the day is and includes, reviews,
 *  how the day goes, FAQ with the read-only price table, the single request
 *  form, the terms. The panel, the sticky bar and the form share one booking
 *  state, so the area and the party size are chosen once. */
export function VariantDetail({ exp, lang }: { exp: Experience; lang: Lang }) {
  const T = t(lang);
  const D = T.detail;
  const vc = exp.variantCopy!;
  const variants = exp.variants!;
  const H = vc.headings;
  const O = vc.options;
  const city = cityBySlug(exp.city, lang) ?? previewsFor(lang).cities.find((c) => c.slug === exp.city)!;
  const { experiences } = catalogFor(lang);
  const url = `/${lang}/${exp.city}/${exp.slug}/`;
  const reading = articlesForExperience(exp.slug, lang);
  const moreInCity = experiences.filter((e) => e.city === exp.city && e.slug !== exp.slug).slice(0, 4);
  const photos: GolfPhoto[] = [{ img: exp.img, alt: exp.alt, area: variants.find((v) => v.img === exp.img)?.id }, ...exp.gallery];
  const reviews = reviewsFor(exp.slug);
  const hasReviews = REVIEWS_PUBLISHED && reviews.length > 0;
  const pricings = Object.fromEntries(variants.map((v) => [v.id, pricingForVariant(exp, v, lang)]));
  const avail = exp.availability;
  const size = exp.partySize ?? { min: 2, max: 4 };
  const parties = Array.from({ length: size.max - size.min + 1 }, (_, i) => size.min + i);
  const flow = exp.flow ?? D.flow;
  const faq = exp.faq ?? [];
  const cancellation = exp.cancellation ?? cancellationFor(lang);
  const totals = variants.flatMap((v) => v.tiers.map((x) => x.total));
  const minPrice = Math.min(...totals);
  const maxPrice = Math.max(...totals);
  const addOns = exp.addOns ?? [];
  const ctaLabel = exp.cta?.label ?? D.requestCta;
  const stop = lang === "ja" || lang === "zh-tw" ? "。" : ".";

  const booking: BookingExperience = {
    slug: exp.slug, title: exp.title,
    leadDays: avail?.cutoffDays ?? 3, cutoffTime: avail?.cutoffTime ?? "17:00",
    startTimes: avail?.startTimes, defaultTime: avail?.defaultTime, closed: avail?.closed,
    minGuests: size.min, defaultGuests: size.default, listedMax: size.max, maxGuests: size.max,
    interpreter: false,
    ctaLabel, ctaNote: exp.cta?.note, timeLabel: exp.timeLabel,
    variants: variants.map((v) => ({ id: v.id, title: v.title, short: v.short, tiers: v.tiers, defaultTime: v.defaultTime })),
    defaultVariant: exp.defaultVariant, coursePreference: true, eventPrefix: exp.category,
  };

  return (
    <main className="subpage detail-page xp xp2 xp-variant" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: city.title, href: cityBySlug(exp.city, lang) ? `/${lang}/${city.slug}/` : undefined },
        { label: vc.crumb },
      ]} />

      <BookingProvider experience={booking} pricings={pricings} lang={lang}>
        {/* 1. Title block: a short H1 and one line, then straight to the photos */}
        <header className="xp-head vh-head">
          <h1>{exp.title}</h1>
          <p className="vh-sub">{vc.sub}</p>
        </header>

        <div className="xp-cols vh-cols">
          <section className="xp-mv vh-mv" aria-label={D.gallery}>
            <GolfGallery photos={photos} variants={variants} lang={lang} note={vc.photoNote} />
          </section>

          {/* 2. The one place to choose the party size and the area */}
          <aside className="xp-side vh-side">
            <GolfOptions variants={variants} copy={O} lang={lang} ctaLabel={ctaLabel} parties={parties} />
          </aside>

          <div className="xp-main">
            {/* 3. What the day is, what it includes, what the guide does */}
            <section className="xp-section" id="about">
              <h2>{H.about}</h2>
              {exp.overview?.[0] && <p className="xp-lede">{exp.overview[0]}</p>}
              <div className="xp-included vh-included">
                {exp.included && <div><h3>{H.included}</h3><ul className="check-list">{exp.included.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul></div>}
                {exp.notIncluded && <div><h3>{D.notIncludedH}</h3><ul className="check-list muted">{exp.notIncluded.map((i) => <li key={i}><span className="tick">—</span><span>{i}</span></li>)}</ul></div>}
              </div>
              <p className="xp-note vh-guide-note">{vc.intro.guideNote}</p>
            </section>

            {/* 4. Reviews (as supplied; not rewritten for the new packages) */}
            {hasReviews && (
              <section className="xp-section" id="reviews">
                <h2>{T.reviewsH}</h2>
                <ReviewSummaryPanel experience={exp.slug} lang={lang} />
                <ReviewList reviews={reviews} lang={lang} />
              </section>
            )}

            {/* 5. The day, the sample timings folded away, then how booking works */}
            <section className="xp-section" id="how">
              <h2>{H.day}</h2>
              <ol className="xp-flow vh-day">
                {vc.day.steps.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
              </ol>
              <p className="xp-note">{vc.day.note}</p>
              {exp.schedule && (
                <details className="vh-timings" open>
                  <summary>{vc.day.timingsH}</summary>
                  {exp.scheduleNote && <p className="xp-note xp-note-sample">{exp.scheduleNote}</p>}
                  <ol className="xp-timeline">
                    {exp.schedule.map((st) => (
                      <li key={st.time + st.title}><span className="xp-time">{st.time}</span><div><b>{st.title}</b>{st.body && <p>{st.body}</p>}</div></li>
                    ))}
                  </ol>
                </details>
              )}
              <h3 className="xp-sub-h">{vc.day.bookingH}</h3>
              <ol className="xp-flow">
                {flow.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
              </ol>
            </section>

            {/* 6. FAQ, with the read-only price table (no choices here) */}
            <section className="xp-section" id="faq">
              <h2>{H.faq}</h2>
              <div className="faq-list">
                {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
                <details id="prices" className="vh-prices">
                  <summary>{vc.prices.heading}</summary>
                  <p className="xp-note">{vc.prices.only}</p>
                  <table className="xp-pricing vp-table vh-table">
                    <thead><tr><th>{vc.prices.golfersCol}</th>{variants.map((v) => <th key={v.id}>{v.short}</th>)}</tr></thead>
                    <tbody>
                      {parties.map((n) => (
                        <tr key={n}>
                          <td data-label={vc.prices.golfersCol}><b>{countOf(O.golfers, n)}</b></td>
                          {variants.map((v) => {
                            const total = tierTotal(v.tiers, n);
                            if (total === null) return <td key={v.id} className="quote" data-label={v.short}><span>{O.customQuote}</span></td>;
                            const pp = perPersonOf(total, n);
                            return (
                              <td key={v.id} className="total" data-label={v.short}>
                                <span><b>{yen(total)}</b><small>{perPersonRefText(O, pp.perPerson, pp.approximate)}</small></span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <ul className="vp-notes">
                    <li>{vc.prices.approxNote}</li>
                    {vc.prices.notes.map((x) => <li key={x}>{x}</li>)}
                    {exp.taxIncluded && <li>{D.taxIncluded}{stop}</li>}
                  </ul>
                  {addOns.length > 0 && (
                    <>
                      <h3 className="xp-sub-h">{D.addOnsH}</h3>
                      <div className="vp-addons">
                        {addOns.map((a) => (
                          <div className="addon" key={a.id}>
                            <Wine size={18} />
                            <div><b>{a.name}</b><p>{a.description}</p><small>{a.price ? yen(a.price) : D.priceOnRequest}</small></div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </details>
              </div>
            </section>

            {/* 7. The one request form */}
            <section className="xp-section xp-request" id="request">
              <h2 id="request-form">{H.request}</h2>
              <p className="xp-note">{exp.cta?.lead ?? D.requestLead}</p>
              <GolfRequestForm lang={lang} fallbackEmail={CONTACT_EMAIL} experience={{ slug: exp.slug, title: exp.title }} variants={variants} copy={vc} addOns={addOns} parties={parties} />
            </section>

            {/* 8. Terms, linked from under the form's button */}
            <section className="xp-section" id="terms">
              <h2>{H.terms}</h2>
              <CancellationTable exp={exp} text={cancellation} lang={lang} />
              {avail && <p className="vh-note vh-known"><Clock3 size={14} /> {D.availCutoff(avail.cutoffDays, avail.cutoffTime)}</p>}
            </section>

            {reading.length > 0 && (
              <section className="xp-section xp-reading">
                <h2>{T.articleOnThis}</h2>
                <div className="article-links">
                  {reading.map((a) => (
                    <Link key={a.slug} href={`/${lang}/journal/${a.slug}/`}>
                      <img src={a.img} alt={a.alt} loading="lazy" />
                      <span><b>{a.copy[lang]!.title}</b><small>{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</small></span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <StickyRequestBar price={yen(minPrice)} condition={countOf(O.golfers, size.min)} label={ctaLabel} lang={lang} watchHero="#golf-options" watchTarget="#request" golf={O} />
      </BookingProvider>

      {moreInCity.length > 0 && (
        <section className="more-in">
          <h2>{T.moreIn(city.title)}</h2>
          <div className="more-grid">
            {moreInCity.map((e) => (
              <Link key={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
                <img src={e.img} alt={e.alt} loading="lazy" />
                <b>{e.title}</b>
                <small>{e.duration} · {T.from} {e.price}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(exp.title, exp.metaDescription ?? exp.tagline, exp.img, url, exp.price, exp.slug, maxPrice)),
      }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
