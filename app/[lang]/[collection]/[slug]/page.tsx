import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Languages, MapPin, Users, MessageCircle, Sparkles, Camera, Utensils, Music, CalendarDays } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { BookingBox } from "@/components/site/booking-box";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { VideoFacade } from "@/components/site/video-facade";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { ReviewList } from "@/components/site/review-list";
import { CONTACT_EMAIL } from "@/lib/contact";
import { pricingFor, yen } from "@/lib/pricing";
import {
  cancellationFor, catalogFor, cityBySlug, isLive, SITE_ORIGIN,
  type Experience, type Tour,
} from "@/lib/catalog";
import { articleDate, articlesForExperience } from "@/lib/articles";
import { aggregateFor, REVIEWS_PUBLISHED, reviewsFor } from "@/lib/reviews";
import { RatingSummary } from "@/components/site/reviews";
import { isLang, langHome, LANGS, t, type Lang } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string; collection: string; slug: string }> }

export function generateStaticParams() {
  return LANGS.flatMap((lang) => {
    const { experiences, tours } = catalogFor(lang);
    return [
      ...tours.map((tr) => ({ lang, collection: "tours", slug: tr.slug })),
      ...experiences.map((e) => ({ lang, collection: e.city, slug: e.slug })),
    ];
  });
}

function resolve(lang: Lang, collection: string, slug: string): { exp?: Experience; tour?: Tour } {
  const { experiences, tours } = catalogFor(lang);
  if (collection === "tours") return { tour: tours.find((tr) => tr.slug === slug) };
  const exp = experiences.find((e) => e.slug === slug);
  if (exp && exp.city === collection) return { exp };
  return {};
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, collection, slug } = await params;
  if (!isLang(lang)) return {};
  const { exp, tour } = resolve(lang, collection, slug);
  const item = exp ?? tour;
  if (!item) return {};
  return withAlternates(
    socialMeta({
      lang,
      title: `${item.title} | KAMEHAME JAPAN`,
      description: exp ? exp.tagline : tour!.description,
      path: `/${lang}/${collection}/${slug}/`,
      // Purpose-built 1200x630 card; the catalog photo itself is often portrait
      // and would be cropped badly by social scrapers (scripts/generate-og-cards.py).
      image: `/og/${slug}.jpg`,
      type: "article",
    }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/${collection}/${slug}/`])),
  );
}

function productJsonLd(
  title: string, description: string, img: string, url: string, price: string,
  slug?: string,
) {
  // An aggregateRating is only emitted once REVIEWS_PUBLISHED is true and real
  // reviews exist. Declaring a rating we invented would breach Google's
  // structured-data policy and risk a manual action against the domain.
  const agg = slug && REVIEWS_PUBLISHED ? aggregateFor(slug) : null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description,
    image: `${SITE_ORIGIN}${img}`,
    url: `${SITE_ORIGIN}${url}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "JPY",
      price: price.replace(/[^\d]/g, ""),
      availability: "https://schema.org/PreOrder",
    },
    ...(agg && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: agg.average,
        reviewCount: agg.count,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export default async function DetailPage({ params }: Props) {
  const { lang, collection, slug } = await params;
  if (!isLang(lang)) notFound();
  const { exp, tour } = resolve(lang, collection, slug);
  if (!exp && !tour) notFound();

  if (tour) return <TourDetail tour={tour} lang={lang} />;
  return <ExperienceDetail exp={exp!} lang={lang} />;
}

const HIGHLIGHT_ICONS = { group: Users, chat: MessageCircle, interpreter: Languages, dance: Music, meal: Utensils, photo: Camera, spark: Sparkles };

function ExperienceDetail({ exp, lang }: { exp: Experience; lang: Lang }) {
  const T = t(lang);
  const D = T.detail;
  const city = cityBySlug(exp.city, lang)!;
  const { experiences } = catalogFor(lang);
  const url = `/${lang}/${exp.city}/${exp.slug}/`;
  const live = isLive(exp);
  const reading = articlesForExperience(exp.slug, lang);

  const photos = [{ img: exp.img, alt: exp.alt }, ...exp.gallery];
  const reviews = reviewsFor(exp.slug);
  const hasReviews = REVIEWS_PUBLISHED && reviews.length > 0;
  const video = exp.video;
  const pricing = pricingFor(exp, lang);
  const perGroup = pricing.unit === "group";
  const first = pricing.rows[0];
  const headlinePrice = perGroup ? yen(first.total) : exp.price;
  const headlineCondition = perGroup ? `${T.perGroupUnit} · ${D.stickyGroupOf(first.party)}` : T.perPersonUnit;

  const highlights = (exp.highlights ?? D.defaultHighlights.map((h, i) => ({ ...h, icon: (["group", "spark", "interpreter"] as const)[i] })));
  const schedule: { time: string; title: string; body?: string; img?: string }[] =
    exp.schedule ?? exp.itinerary.map((step) => {
      const [time, ...rest] = step.split(" — ");
      return { time, title: rest.join(" — ") };
    });
  const faq = [...(exp.faq ?? []), ...D.siteFaq];
  const cancellation = exp.cancellation ?? cancellationFor(lang);
  const ctaLabel = live ? D.requestAvailability : T.comingSoonCta;
  const avail = exp.availability;
  const conditions = [
    { Icon: Clock3, text: exp.duration },
    { Icon: Users, text: exp.group },
    { Icon: Languages, text: T.interpreterGuide },
    { Icon: MapPin, text: T.meetOnSite },
  ];

  return (
    <main className="subpage detail-page xp" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: city.title, href: `/${lang}/${city.slug}/` },
        { label: exp.title },
      ]} />

      {/* ① First view */}
      <section className="xp-hero">
        <div className="xp-hero-photo">
          <HeroCarousel photos={photos} lang={lang}>
            {!live && <span className="soon-badge">{T.comingSoon}</span>}
          </HeroCarousel>
        </div>
        <div className="xp-hero-copy">
          {!live && <p className="soon-flag">{T.comingSoon}</p>}
          <h1>{exp.title}</h1>
          <p className="xp-lede">{exp.tagline}</p>
          <ul className="xp-conditions">
            {conditions.map(({ Icon, text }) => <li key={text}><Icon size={14} /> {text}</li>)}
          </ul>
          {avail && (
            <p className="xp-avail">
              <CalendarDays size={14} />
              <span>{avail.daily ? D.availDaily : ""} · {D.availStart} {avail.startTimes[0]}–{avail.startTimes[avail.startTimes.length - 1]} · {D.availCutoff(avail.cutoffDays, avail.cutoffTime)}</span>
            </p>
          )}
          <div className="xp-price">
            {perGroup ? (
              <>
                <b><span className="xp-price-aff">{D.priceHeadline(first.party)[0]}</span>{headlinePrice}<span className="xp-price-aff">{D.priceHeadline(first.party)[1]}</span></b>
                <span>{D.priceTotalNote}</span>
              </>
            ) : (
              <>
                <b>{headlinePrice}</b>
                <span>{headlineCondition}</span>
              </>
            )}
            {exp.includedShort && (
              <p className="xp-price-incl">
                {exp.includedShort}
                {exp.taxIncluded && <><br />{D.taxIncluded}</>}
              </p>
            )}
            <small>{pricing.highSeason || pricing.moreOnRequest ? D.ratesVary : perGroup ? D.pricingGroupNote : D.pricingPerPersonNote}</small>
          </div>
          <div className="xp-hero-actions">
            <a className="booking-cta as-link" id="hero-cta" href="#request">{ctaLabel}</a>
            {video && <a className="xp-watch" href="#video">{D.watch} <ArrowRight size={14} /></a>}
          </div>
          {live && <p className="xp-no-payment">{D.noPayment}</p>}
        </div>
      </section>

      {/* ② Review summary — only with real reviews */}
      {hasReviews && (
        <section className="xp-review-summary">
          <RatingSummary experience={exp.slug} lang={lang} size={18} />
          <a href="#reviews" className="underlined-link">{D.reviewsSummaryLink} <ArrowRight /></a>
        </section>
      )}

      {/* ③ Video — only when an asset exists */}
      {video && (
        <section className="xp-section xp-video" id="video">
          <h2>{D.seeExperience}</h2>
          <VideoFacade video={video} title={exp.title} />
        </section>
      )}

      {/* ④ Photos */}
      <section className="xp-section xp-photos">
        <h2>{D.gallery}</h2>
        <Gallery photos={photos} lang={lang} note={exp.galleryNote} />
      </section>

      {/* ⑤ Highlights */}
      <section className="xp-section">
        <h2>{D.highlightsH}</h2>
        <div className="xp-highlights">
          {highlights.map((h) => {
            const Icon = HIGHLIGHT_ICONS[h.icon as keyof typeof HIGHLIGHT_ICONS] ?? Sparkles;
            return (
              <div className="xp-highlight" key={h.title}>
                <Icon size={20} />
                <b>{h.title}</b>
                <p>{h.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ⑥ Pricing */}
      <section className="xp-section" id="pricing">
        <h2>{D.pricingH}</h2>
        <table className="xp-pricing">
          <thead><tr><th>{D.partyCol}</th><th>{D.totalCol}</th><th>{D.perPersonCol}</th></tr></thead>
          <tbody>
            {pricing.rows.map((r) => (
              <tr key={r.party}><td>{D.stickyGroupOf(r.party)}</td><td className="total">{yen(r.total)}</td><td>{yen(r.perPerson)}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="xp-pricing-note">{perGroup ? D.pricingGroupNote : D.pricingPerPersonNote}{pricing.moreOnRequest && ` ${D.largerParties}`}</p>
        {pricing.highSeason && (
          <details className="xp-high-season">
            <summary>
              <span><b>{D.highSeasonH}</b> · {pricing.highSeason.window}</span>
              <span className="xp-toggle"><em>{D.highSeasonOpen}</em><em>{D.highSeasonClose}</em></span>
            </summary>
            <table className="xp-pricing compact">
              <thead><tr><th>{D.partyCol}</th><th>{D.totalCol}</th><th>{D.perPersonCol}</th></tr></thead>
              <tbody>
                {pricing.highSeason.rows.map((r) => (
                  <tr key={r.party}><td>{D.stickyGroupOf(r.party)}</td><td className="total">{yen(r.total)}</td><td>{yen(r.perPerson)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className="xp-pricing-note">{D.highSeasonNote(pricing.highSeason.window)}</p>
          </details>
        )}
        {(exp.included || exp.notIncluded) && (
          <div className="xp-included">
            {exp.included && (
              <div>
                <h3>{D.includedH}</h3>
                <ul className="check-list">{exp.included.map((i) => <li key={i}><span className="tick">✓</span><span>{i}</span></li>)}</ul>
              </div>
            )}
            {exp.notIncluded && (
              <div>
                <h3>{D.notIncludedH}</h3>
                <ul className="check-list muted">{exp.notIncluded.map((i) => <li key={i}><span className="tick">—</span><span>{i}</span></li>)}</ul>
              </div>
            )}
            <p className="xp-included-note">{D.includedNote}</p>
          </div>
        )}
        {!exp.included && <p className="xp-included-note">{T.interpreterGuide}. {D.includedNote}</p>}
        <a className="booking-cta as-link inline" href="#request">{ctaLabel}</a>
      </section>

      {/* ⑦ Schedule and venue */}
      <section className="xp-section">
        {avail && (
          <div className="xp-avail-box">
            <h2>{D.availH}</h2>
            <dl>
              <div><dt>{D.availDays}</dt><dd>{avail.daily ? D.availDaily : "—"}{exp.availabilityNote && ` · ${exp.availabilityNote}`}</dd></div>
              <div><dt>{D.availStart}</dt><dd className="xp-times">{avail.startTimes.map((st) => <span key={st}>{st}</span>)}</dd></div>
              <div><dt>{D.availCutoffH}</dt><dd>{D.availCutoff(avail.cutoffDays, avail.cutoffTime)}</dd></div>
            </dl>
          </div>
        )}
        <h2 className={avail ? "xp-sub" : undefined}>{D.scheduleH}</h2>
        {exp.interactionTime && exp.interactionTime !== exp.duration && (
          <p className="xp-note">{D.interactionNote(exp.duration, exp.interactionTime)}</p>
        )}
        {exp.schedule && avail && (
          <p className="xp-note xp-note-sample">{D.scheduleSample(avail.startTimes.includes("18:00") ? "18:00" : avail.startTimes[0])}</p>
        )}
        <ol className="xp-timeline">
          {schedule.map((st) => (
            <li key={st.time + st.title}>
              <span className="xp-time">{st.time}</span>
              <div>
                <b>{st.title}</b>
                {st.body && <p>{st.body}</p>}
                {st.img && <img src={st.img} alt="" loading="lazy" />}
              </div>
            </li>
          ))}
        </ol>

        <h2 className="xp-sub">{D.venueH}</h2>
        <div className="xp-venue">
          {exp.map && (
            <figure className="xp-map">
              <iframe
                src={`https://maps.google.com/maps?q=${exp.map.lat},${exp.map.lng}&z=${exp.map.zoom ?? 15}&hl=${lang === "zh-tw" ? "zh-TW" : lang}&output=embed`}
                title={D.venueH} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen
              />
              <figcaption><MapPin size={13} /> {D.mapNote}</figcaption>
            </figure>
          )}
          <div className="xp-venue-cols">
            <div>
              <h3>{D.venueKnownH}</h3>
              <ul className="know-list">
                {(exp.venue?.known ?? [exp.area, T.meetOnSite]).map((k) => <li key={k}>{k}</li>)}
              </ul>
            </div>
            <div>
              <h3>{D.venueAfterH}</h3>
              <ul className="know-list">
                {(exp.venue?.afterBooking ?? [T.meetingChip(exp.area)]).map((k) => <li key={k}>{k}</li>)}
              </ul>
            </div>
          </div>
          {(exp.venue?.img ?? photos[1]?.img) && (
            <figure className="xp-venue-photo">
              <img src={exp.venue?.img ?? photos[1].img} alt={exp.venue?.alt ?? photos[1]?.alt ?? ""} loading="lazy" />
              <figcaption>{D.venueExampleNote}</figcaption>
            </figure>
          )}
        </div>
      </section>

      {/* ⑧ Reviews — only with real reviews */}
      {hasReviews && (
        <section className="xp-section" id="reviews">
          <h2>{T.reviewsH}</h2>
          <RatingSummary experience={exp.slug} lang={lang} size={16} />
          <ReviewList reviews={reviews} lang={lang} />
        </section>
      )}

      {/* ⑨ FAQ */}
      <section className="xp-section">
        <h2>{D.faqH}</h2>
        <div className="faq-list">
          {faq.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </div>
      </section>

      {/* ⑩ Flow, cancellation, request */}
      <section className="xp-section xp-request" id="request">
        <h2>{D.flowH}</h2>
        <ol className="xp-flow">
          {D.flow.map((f, i) => <li key={f.title}><span>{i + 1}</span><div><b>{f.title}</b><p>{f.body}</p></div></li>)}
        </ol>
        <h3 className="xp-cancel-h">{D.cancellationH}</h3>
        <p className="xp-cancel">{cancellation}</p>

        <h2 className="xp-sub">{live ? D.requestH : T.comingSoonCta}</h2>
        <p className="xp-note">{live ? D.requestLead : T.comingSoonBody}</p>
        <EnquiryForm
          kind="guest" lang={lang} fallbackEmail={CONTACT_EMAIL}
          experience={{ slug: exp.slug, title: exp.title, partySize: exp.partySize, leadDays: avail?.cutoffDays ?? 3, cutoffTime: avail?.cutoffTime, startTimes: avail?.startTimes, closed: avail?.closed }}
        />
        {/* Bókun mount for the day online booking connects; nothing renders until then. */}
        <div id="bokun-widget-mount" data-experience={exp.slug} data-booking-type={exp.bookingType ?? "instant"} hidden />
      </section>

      {reading.length > 0 && (
        <section className="xp-section xp-reading">
          <h2>{T.articleOnThis}</h2>
          <div className="article-links">
            {reading.map((a) => (
              <Link key={a.slug} href={`/${lang}/journal/${a.slug}/`}>
                <img src={a.img} alt={a.alt} loading="lazy" />
                <span>
                  <b>{a.copy[lang]!.title}</b>
                  <small>{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="more-in">
        <h2>{T.moreIn(city.title)}</h2>
        <div className="more-grid">
          {experiences.filter((e) => e.city === exp.city && e.slug !== exp.slug).slice(0, 4).map((e) => (
            <Link key={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
              <img src={e.img} alt={e.alt} loading="lazy" />
              <b>{e.title}</b>
              <small>{e.duration} · {T.from} {e.price}</small>
            </Link>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(exp.title, exp.tagline, exp.img, url, exp.price, exp.slug)),
      }} />
      <StickyRequestBar price={headlinePrice} condition={headlineCondition} label={ctaLabel} />
      <SiteFooter lang={lang} />
    </main>
  );
}

function TourDetail({ tour, lang }: { tour: Tour; lang: Lang }) {
  const T = t(lang);
  const city = cityBySlug(tour.city, lang)!;
  const { experiences } = catalogFor(lang);
  const url = `/${lang}/tours/${tour.slug}/`;
  const inCity = experiences.filter((e) => e.city === tour.city).slice(0, 4);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: T.breadcrumbTours, href: `/${lang}/tours/` },
        { label: tour.title },
      ]} />

      <section className="detail-gallery single">
        <img className="gallery-main" src={tour.img} alt={tour.alt} />
      </section>

      <div className="detail-layout">
        <article className="detail-main">
          <h1>{tour.title}</h1>
          <p className="detail-tagline">{tour.tagline}</p>
          <div className="detail-tags">
            <span><Clock3 size={13} /> {tour.duration}</span>
            <span><MapPin size={13} /> {city.title}</span>
            <span><Languages size={13} /> {T.licensedGuide}</span>
            <span><Users size={13} /> {tour.group}</span>
          </div>

          <section>
            <h2>{T.yourDay}</h2>
            <p>{tour.description}</p>
          </section>

          <section>
            <h2>{T.buildAround}</h2>
            <p>{T.buildBody(city.title)}</p>
            <ul className="know-list">
              {inCity.map((e) => <li key={e.slug}><Link href={`/${lang}/${e.city}/${e.slug}/`}>{e.title}</Link> — {e.duration}, {T.from} {e.price}</li>)}
            </ul>
          </section>

          <section>
            <h2>{T.cancellationH}</h2>
            <p>{cancellationFor(lang)}</p>
          </section>
        </article>

        <aside className="detail-aside">
          <BookingBox price={tour.price} unit={T.perGroup} experienceSlug={tour.slug} lang={lang} bookingType={tour.bookingType} />
          <div className="aside-help">
            <b>{T.questions}</b>
            <p>{T.questionsBody}</p>
          </div>
        </aside>
      </div>

      <section className="more-in">
        <h2>{T.experiencesIn(city.title)}</h2>
        <div className="more-grid">
          {inCity.map((e) => (
            <Link key={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
              <img src={e.img} alt={e.alt} loading="lazy" />
              <b>{e.title}</b>
              <small>{e.duration} · {T.from} {e.price}</small>
            </Link>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(tour.title, tour.tagline, tour.img, url, tour.price)),
      }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
