import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Languages, MapPin, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { BookingBox, MobileBookingBar } from "@/components/site/booking-box";
import {
  cancellationFor, catalogFor, cityBySlug, SITE_ORIGIN,
  type Experience, type Tour,
} from "@/lib/catalog";
import { isLang, langHome, LANGS, t, type Lang } from "@/lib/i18n";

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
  return {
    title: `${item.title} | KAMEHAME JAPAN`,
    description: exp ? exp.tagline : tour!.description,
    alternates: { languages: { en: `/en/${collection}/${slug}/`, es: `/es/${collection}/${slug}/` } },
  };
}

function productJsonLd(title: string, description: string, img: string, url: string, price: string) {
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

function ExperienceDetail({ exp, lang }: { exp: Experience; lang: Lang }) {
  const T = t(lang);
  const city = cityBySlug(exp.city, lang)!;
  const { experiences, tours } = catalogFor(lang);
  const url = `/${lang}/${exp.city}/${exp.slug}/`;
  const cityTour = tours.find((tr) => tr.city === exp.city);
  const more = experiences.filter((e) => e.city === exp.city && e.slug !== exp.slug).slice(0, 4);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: city.title, href: `/${lang}/${city.slug}/` },
        { label: exp.title },
      ]} />

      <section className={`detail-gallery ${exp.gallery.length === 0 ? "single" : ""}`}>
        <img className="gallery-main" src={exp.img} alt={exp.alt} />
        {exp.gallery.map((g) => <img key={g.img} src={g.img} alt={g.alt} loading="lazy" />)}
      </section>

      <div className="detail-layout">
        <article className="detail-main">
          <h1>{exp.title}</h1>
          <p className="detail-tagline">{exp.tagline}</p>
          <div className="detail-tags">
            <span><Clock3 size={13} /> {exp.duration}</span>
            <span><MapPin size={13} /> {exp.area}</span>
            <span><Languages size={13} /> {T.interpreterGuide}</span>
            <span><Users size={13} /> {exp.group}</span>
            <span>{exp.ages}</span>
          </div>

          <section>
            <h2>{T.whatYoullDo}</h2>
            <ul className="do-list">
              {exp.whatYoullDo.map((w, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span>{w}</li>)}
            </ul>
          </section>

          <section className="master-block">
            <h2>{T.yourMaster}</h2>
            <div className="bubble tail-bottom master-bubble">
              <p>&ldquo;{exp.master.quote}&rdquo;</p>
            </div>
            <p className="master-title">— {exp.master.title}</p>
            <p>{exp.master.bio}</p>
          </section>

          <section>
            <h2>{T.itinerary}</h2>
            <ul className="itinerary">
              {exp.itinerary.map((step) => {
                const [time, ...rest] = step.split(" — ");
                return <li key={step}><b>{time}</b><span>{rest.join(" — ")}</span></li>;
              })}
            </ul>
          </section>

          <section>
            <h2>{T.goodToKnow}</h2>
            <ul className="know-list">
              {exp.goodToKnow.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </section>

          <section>
            <h2>{T.meetingPoint}</h2>
            <p>{T.meetingBody(exp.area)}</p>
            <div className="map-placeholder"><MapPin size={16} /> {T.meetingChip(exp.area)}</div>
          </section>

          <section>
            <h2>{exp.story.heading}</h2>
            <p>{exp.story.body}</p>
          </section>

          <section>
            <h2>{T.cancellationH}</h2>
            <p>{exp.cancellation ?? cancellationFor(lang)}</p>
          </section>
        </article>

        <aside className="detail-aside">
          <BookingBox price={exp.price} unit={exp.priceUnit === "group" ? T.perGroupUnit : T.perPersonUnit} experienceSlug={exp.slug} lang={lang} bookingType={exp.bookingType} fine={exp.cancellation ? T.bookingFineTerms : undefined} />
          <div className="aside-help">
            <b>{T.questions}</b>
            <p>{T.questionsBody}</p>
          </div>
        </aside>
      </div>

      {cityTour && (
        <section className="crosssell">
          <div>
            <p className="eyebrow"><span /> {T.makeItFullDay}</p>
            <h2>{T.pairWith(city.title)}</h2>
            <p>{T.pairBody}</p>
            <Link className="underlined-link" href={`/${lang}/tours/${cityTour.slug}/`}>{cityTour.title} <ArrowRight /></Link>
          </div>
          <img src={cityTour.img} alt={cityTour.alt} loading="lazy" />
        </section>
      )}

      <section className="more-in">
        <h2>{T.moreIn(city.title)}</h2>
        <div className="more-grid">
          {more.map((e) => (
            <Link key={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
              <img src={e.img} alt={e.alt} loading="lazy" />
              <b>{e.title}</b>
              <small>{e.duration} · {T.from} {e.price}</small>
            </Link>
          ))}
        </div>
      </section>

      <div className="review-note"><ShieldCheck size={16} /> {T.reviewNote}</div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(exp.title, exp.tagline, exp.img, url, exp.price)),
      }} />
      <MobileBookingBar price={exp.price} lang={lang} bookingType={exp.bookingType} />
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
      <MobileBookingBar price={tour.price} lang={lang} bookingType={tour.bookingType} />
      <SiteFooter lang={lang} />
    </main>
  );
}
