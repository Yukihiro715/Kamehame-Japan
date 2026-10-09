import Link from "next/link";
import { ArrowRight, Brush, Camera, Car, Check, Clock3, Flag, Languages, MapPin, MessageCircle, Music, ShieldCheck, Sparkles, Users, Utensils, Wine } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { BookingProvider, type BookingExperience } from "@/components/site/booking-context";
import { Gallery } from "@/components/site/gallery";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { ReviewList } from "@/components/site/review-list";
import { ReviewSummaryPanel } from "@/components/site/reviews";
import { CancellationTable } from "@/components/site/cancellation-table";
import { VariantPhoto, VariantPicker } from "@/components/site/variant-picker";
import { CoursePreference } from "@/components/site/course-preference";
import { CONTACT_EMAIL } from "@/lib/contact";
import { countOf, fromPrice, pricingForVariant, yen } from "@/lib/pricing";
import { cancellationFor, catalogFor, cityBySlug, previewsFor, type Experience } from "@/lib/catalog";
import { articleDate, articlesForExperience } from "@/lib/articles";
import { REVIEWS_PUBLISHED, reviewsFor } from "@/lib/reviews";
import { langHome, t, type Lang } from "@/lib/i18n";
import { productJsonLd } from "@/lib/seo";

const ICONS = { group: Users, chat: MessageCircle, interpreter: Languages, dance: Music, meal: Utensils, photo: Camera, spark: Sparkles, brush: Brush, car: Car, flag: Flag };

/** The two-plan page (one URL, two products): first view with both prices,
 *  the plan cards, what is included, why us, how the day works, reviews, how
 *  the course is chosen, pricing, FAQ, terms and the stepped request form.
 *  Every plan card, the sticky bar and the form share one booking state. */
export function VariantDetail({ exp, lang }: { exp: Experience; lang: Lang }) {
  const T = t(lang);
  const D = T.detail;
  const vc = exp.variantCopy!;
  const variants = exp.variants!;
  const H = vc.headings ?? {};
  const city = cityBySlug(exp.city, lang) ?? previewsFor(lang).cities.find((c) => c.slug === exp.city)!;
  const { experiences } = catalogFor(lang);
  const url = `/${lang}/${exp.city}/${exp.slug}/`;
  const reading = articlesForExperience(exp.slug, lang);
  const moreInCity = experiences.filter((e) => e.city === exp.city && e.slug !== exp.slug).slice(0, 4);
  const photos = [{ img: exp.img, alt: exp.alt }, ...exp.gallery];
  const reviews = reviewsFor(exp.slug);
  const hasReviews = REVIEWS_PUBLISHED && reviews.length > 0;
  const pricings = Object.fromEntries(variants.map((v) => [v.id, pricingForVariant(exp, v, lang)]));
  const avail = exp.availability;
  const size = exp.partySize ?? { min: 2, max: 4 };
  const parties = Array.from({ length: size.max - size.min + 1 }, (_, i) => size.min + i);
  const flow = exp.flow ?? D.flow;
  const faq = exp.faq ?? [];
  const cancellation = exp.cancellation ?? cancellationFor(lang);
  const minPrice = Math.min(...variants.map((v) => v.price));
  const baseParty = Math.max(...variants.map((v) => v.basePartySize));
  const addOns = exp.addOns ?? [];
  const ctaLabel = exp.cta?.label ?? D.requestCta;

  const booking: BookingExperience = {
    slug: exp.slug, title: exp.title,
    leadDays: avail?.cutoffDays ?? 3, cutoffTime: avail?.cutoffTime ?? "17:00",
    startTimes: avail?.startTimes, defaultTime: avail?.defaultTime, closed: avail?.closed,
    minGuests: size.min, listedMax: baseParty, maxGuests: size.max,
    interpreter: false,
    notesLabel: exp.notesLabel, notesHint: exp.notesHint,
    ctaLabel, ctaNote: exp.cta?.note, timeLabel: exp.timeLabel,
    variants: variants.map((v) => ({ id: v.id, title: v.title, short: v.short, price: v.price, basePartySize: v.basePartySize, defaultTime: v.defaultTime })),
    defaultVariant: exp.defaultVariant, coursePreference: true, eventPrefix: exp.category,
    priceCopy: { from: vc.pricing.from, fromSuffix: vc.pricing.fromSuffix, customQuote: vc.pricing.customQuote, golfers: vc.pricing.golfers },
  };

  return (
    <main className="subpage detail-page xp xp2 xp-variant" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: city.title, href: cityBySlug(exp.city, lang) ? `/${lang}/${city.slug}/` : undefined },
        { label: exp.title },
      ]} />

      <BookingProvider experience={booking} pricings={pricings} lang={lang}>
        {/* 1. First view: title, one line, benefits, the photo of the chosen plan, both prices, one button */}
        <header className="vh" id="booking">
          <div className="vh-copy">
            <h1>{exp.title}</h1>
            <p className="vh-lede">{exp.tagline}</p>
            <ul className="vh-benefits">
              {vc.benefits.map((x) => <li key={x}><Check size={13} /> {x}</li>)}
            </ul>
          </div>
          <VariantPhoto variants={variants} />
          <div className="vh-pick">
            <VariantPicker variants={variants} copy={vc.pricing} name="hero-variant" />
            <a className="bk-cta vh-cta" href="#request-form">{ctaLabel} <ArrowRight size={16} /></a>
            <p className="vh-note"><ShieldCheck size={14} /> {exp.cta?.note ?? D.noPaymentNow}</p>
          </div>
        </header>

        <section className="xp-mv" aria-label={D.gallery}>
          <Gallery photos={photos} lang={lang} note={exp.galleryNote} />
        </section>

        <div className="xp-cols">
          <div className="xp-main">
            {/* 2. Choose */}
            <section className="xp-section" id="choose">
              <h2>{vc.variantsH}</h2>
              <p className="xp-note">{vc.variantsLead}</p>
              <VariantPicker variants={variants} copy={vc.pricing} detailed name="section-variant" />
            </section>

            {/* 3. Included */}
            {(exp.included || exp.notIncluded) && (
              <section className="xp-section" id="included">
                <h2>{H.included ?? D.includedH}</h2>
                <div className="xp-included">
                  {exp.included && <div><ul className="check-list">{exp.included.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul></div>}
                  {exp.notIncluded && <div><h3>{D.notIncludedH}</h3><ul className="check-list muted">{exp.notIncluded.map((i) => <li key={i}><span className="tick">—</span><span>{i}</span></li>)}</ul></div>}
                </div>
                {exp.overview?.[1] && <p className="xp-note vh-guide-note">{exp.overview[1]}</p>}
              </section>
            )}

            {/* 4. Why */}
            {exp.highlights && (
              <section className="xp-section" id="why">
                <h2>{H.highlights ?? D.highlightsH}</h2>
                <div className="xp-highlights four">
                  {exp.highlights.map((h) => {
                    const Icon = ICONS[h.icon as keyof typeof ICONS] ?? Sparkles;
                    return <div className="xp-highlight" key={h.title}><Icon size={20} /><b>{h.title}</b><p>{h.body}</p></div>;
                  })}
                </div>
              </section>
            )}

            {/* 5. How the day works: booking steps, then the day itself */}
            <section className="xp-section" id="how">
              <h2>{H.flow ?? D.flowH}</h2>
              <ol className="xp-flow">
                {flow.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
              </ol>
              {exp.schedule && (
                <>
                  <h3 className="xp-sub-h">{D.scheduleH}</h3>
                  {exp.scheduleNote && <p className="xp-note xp-note-sample">{exp.scheduleNote}</p>}
                  <ol className="xp-timeline">
                    {exp.schedule.map((st) => (
                      <li key={st.time + st.title}><span className="xp-time">{st.time}</span><div><b>{st.title}</b>{st.body && <p>{st.body}</p>}</div></li>
                    ))}
                  </ol>
                </>
              )}
            </section>

            {/* 6. Reviews */}
            {hasReviews && (
              <section className="xp-section" id="reviews">
                <h2>{T.reviewsH}</h2>
                <ReviewSummaryPanel experience={exp.slug} lang={lang} />
                <ReviewList reviews={reviews} lang={lang} />
              </section>
            )}

            {/* 7. How the course is chosen */}
            <section className="xp-section" id="course">
              <h2>{vc.coursePreference.heading}</h2>
              {vc.coursePreference.lead && <p className="xp-note">{vc.coursePreference.lead}</p>}
              <CoursePreference copy={vc.coursePreference} name="section-course" />
              {exp.venue?.known && exp.venue.afterBooking && (
                <div className="xp-venue-cols vh-known">
                  <div><h3>{exp.venue.knownHeading ?? D.venueKnownH}</h3><ul className="know-list">{exp.venue.known.map((k) => <li key={k}>{k}</li>)}</ul></div>
                  <div><h3>{exp.venue.afterHeading ?? D.venueAfterH}</h3><ul className="know-list">{exp.venue.afterBooking.map((k) => <li key={k}>{k}</li>)}</ul></div>
                </div>
              )}
            </section>

            {/* 8. Pricing & booking */}
            <section className="xp-section" id="pricing">
              <h2>{vc.pricing.heading}</h2>
              <table className="xp-pricing vp-table">
                <thead><tr><th>{vc.pricing.packageCol}</th>{parties.map((n) => <th key={n}>{countOf(vc.pricing.golfers, n)}</th>)}</tr></thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id}>
                      <td><b>{v.title}</b></td>
                      {parties.map((n) => n === v.basePartySize
                        ? <td key={n} className="total">{fromPrice(vc.pricing, v.price)}<small>{yen(Math.round(v.price / n))} {vc.pricing.perGolferNote}</small></td>
                        : <td key={n} className="quote">{vc.pricing.customQuote}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="vp-notes">
                {vc.pricing.notes.map((n) => <li key={n}>{n}</li>)}
                {exp.taxIncluded && <li>{D.taxIncluded}.</li>}
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
              <p className="vp-cta-row"><a className="bk-cta" href="#request-form">{ctaLabel} <ArrowRight size={16} /></a><span className="vh-note"><ShieldCheck size={14} /> {exp.cta?.note ?? D.noPaymentNow}</span></p>
            </section>

            {/* 9. FAQ */}
            {faq.length > 0 && (
              <section className="xp-section" id="faq">
                <h2>{H.faq ?? D.faqH}</h2>
                <div className="faq-list">
                  {faq.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
                </div>
              </section>
            )}

            {/* 10. Terms */}
            <section className="xp-section" id="terms">
              <h2>{H.terms ?? D.cancellationH}</h2>
              <CancellationTable exp={exp} text={cancellation} lang={lang} />
              {avail && <p className="vh-note vh-known"><Clock3 size={14} /> {D.availCutoff(avail.cutoffDays, avail.cutoffTime)}</p>}
            </section>

            {/* 11. Request */}
            <section className="xp-section xp-request" id="request">
              <h2 id="request-form">{H.request ?? exp.cta?.heading ?? D.requestH}</h2>
              <p className="xp-note">{exp.cta?.lead ?? D.requestLead}</p>
              <EnquiryForm kind="guest" lang={lang} fallbackEmail={CONTACT_EMAIL} experience={{ slug: exp.slug, title: exp.title }} golf={{ variants, copy: vc }} />
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
        <StickyRequestBar price={fromPrice(vc.pricing, minPrice)} condition={countOf(vc.pricing.golfers, baseParty)} label={ctaLabel} lang={lang} watchHero="#booking" watchTarget="#request-form" />
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
        __html: JSON.stringify(productJsonLd(exp.title, exp.metaDescription ?? exp.tagline, exp.img, url, exp.price, exp.slug)),
      }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
