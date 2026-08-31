import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Languages, MapPin, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { BookingBox, MobileBookingBar } from "@/components/site/booking-box";
import {
  CANCELLATION, SITE_ORIGIN, cityBySlug,
  experienceBySlug, experiencesInCity, tourBySlug, tours,
  type Experience, type Tour,
} from "@/lib/catalog";

interface Props { params: Promise<{ collection: string; slug: string }> }

export function generateStaticParams() {
  return [
    ...tours.map((t) => ({ collection: "tours", slug: t.slug })),
    ...experiencesInCity("tokyo").map((e) => ({ collection: "tokyo", slug: e.slug })),
    ...experiencesInCity("kyoto").map((e) => ({ collection: "kyoto", slug: e.slug })),
  ];
}

function resolve(collection: string, slug: string): { exp?: Experience; tour?: Tour } {
  if (collection === "tours") return { tour: tourBySlug(slug) };
  const exp = experienceBySlug(slug);
  if (exp && exp.city === collection) return { exp };
  return {};
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection, slug } = await params;
  const { exp, tour } = resolve(collection, slug);
  const item = exp ?? tour;
  if (!item) return {};
  return {
    title: `${item.title} | KAMEHAME JAPAN`,
    description: exp ? exp.tagline : tour!.description,
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
  const { collection, slug } = await params;
  const { exp, tour } = resolve(collection, slug);
  if (!exp && !tour) notFound();

  if (tour) return <TourDetail tour={tour} />;
  return <ExperienceDetail exp={exp!} />;
}

function ExperienceDetail({ exp }: { exp: Experience }) {
  const city = cityBySlug(exp.city)!;
  const url = `/en/${exp.city}/${exp.slug}/`;
  const cityTour = tours.find((t) => t.city === exp.city);
  const more = experiencesInCity(exp.city).filter((e) => e.slug !== exp.slug).slice(0, 4);

  return (
    <main className="subpage detail-page">
      <SiteHeader variant="solid" />
      <Breadcrumbs trail={[
        { label: "Home", href: "/" },
        { label: city.title, href: `/en/${city.slug}/` },
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
            <span><Languages size={13} /> Interpreter guide included</span>
            <span><Users size={13} /> {exp.group}</span>
            <span>{exp.ages}</span>
          </div>

          <section>
            <h2>What you&apos;ll do</h2>
            <ul className="do-list">
              {exp.whatYoullDo.map((w, i) => <li key={i}><span>{String(i + 1).padStart(2, "0")}</span>{w}</li>)}
            </ul>
          </section>

          <section className="master-block">
            <h2>Your master</h2>
            <div className="bubble tail-bottom master-bubble">
              <p>&ldquo;{exp.master.quote}&rdquo;</p>
            </div>
            <p className="master-title">— {exp.master.title}</p>
            <p>{exp.master.bio}</p>
          </section>

          <section>
            <h2>Itinerary</h2>
            <ul className="itinerary">
              {exp.itinerary.map((step) => {
                const [time, ...rest] = step.split(" — ");
                return <li key={step}><b>{time}</b><span>{rest.join(" — ")}</span></li>;
              })}
            </ul>
          </section>

          <section>
            <h2>Good to know</h2>
            <ul className="know-list">
              {exp.goodToKnow.map((g) => <li key={g}>{g}</li>)}
            </ul>
          </section>

          <section>
            <h2>Meeting point &amp; access</h2>
            <p>You will meet your interpreter guide in the {exp.area} area. Out of respect for our partners&apos; working venues, the exact address and map are sent with your booking confirmation.</p>
            <div className="map-placeholder"><MapPin size={16} /> {exp.area} — exact location shared after booking</div>
          </section>

          <section>
            <h2>{exp.story.heading}</h2>
            <p>{exp.story.body}</p>
          </section>

          <section>
            <h2>Cancellation</h2>
            <p>{CANCELLATION}</p>
          </section>
        </article>

        <aside className="detail-aside">
          <BookingBox price={exp.price} unit="per person" experienceSlug={exp.slug} />
          <div className="aside-help">
            <b>Questions?</b>
            <p>WhatsApp and email support details will appear here at launch.</p>
          </div>
        </aside>
      </div>

      {cityTour && (
        <section className="crosssell">
          <div>
            <p className="eyebrow"><span /> Make it a full day</p>
            <h2>Pair it with a private {city.title} day tour.</h2>
            <p>Put this experience at the heart of an eight-hour day with a licensed guide — transport, timing and the route around it all handled.</p>
            <Link className="underlined-link" href={`/en/tours/${cityTour.slug}/`}>{cityTour.title} <ArrowRight /></Link>
          </div>
          <img src={cityTour.img} alt={cityTour.alt} loading="lazy" />
        </section>
      )}

      <section className="more-in">
        <h2>More in {city.title}</h2>
        <div className="more-grid">
          {more.map((e) => (
            <Link key={e.slug} href={`/en/${e.city}/${e.slug}/`}>
              <img src={e.img} alt={e.alt} loading="lazy" />
              <b>{e.title}</b>
              <small>{e.duration} · from {e.price}</small>
            </Link>
          ))}
        </div>
      </section>

      <div className="review-note"><ShieldCheck size={16} /> Verified Google guest reviews for this experience will be shown here after launch.</div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(exp.title, exp.tagline, exp.img, url, exp.price)),
      }} />
      <MobileBookingBar price={exp.price} />
      <SiteFooter />
    </main>
  );
}

function TourDetail({ tour }: { tour: Tour }) {
  const city = cityBySlug(tour.city)!;
  const url = `/en/tours/${tour.slug}/`;
  const inCity = experiencesInCity(tour.city).slice(0, 4);

  return (
    <main className="subpage detail-page">
      <SiteHeader variant="solid" />
      <Breadcrumbs trail={[
        { label: "Home", href: "/" },
        { label: "Guided tours", href: "/en/tours/" },
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
            <span><Languages size={13} /> Licensed guide</span>
            <span><Users size={13} /> {tour.group}</span>
          </div>

          <section>
            <h2>Your day, your route</h2>
            <p>{tour.description}</p>
          </section>

          <section>
            <h2>Build it around a masterclass</h2>
            <p>Any {city.title} experience below can anchor the day. Tell us which one when you enquire, and the route, meals and pace are planned around its schedule.</p>
            <ul className="know-list">
              {inCity.map((e) => <li key={e.slug}><Link href={`/en/${e.city}/${e.slug}/`}>{e.title}</Link> — {e.duration}, from {e.price}</li>)}
            </ul>
          </section>

          <section>
            <h2>Cancellation</h2>
            <p>{CANCELLATION}</p>
          </section>
        </article>

        <aside className="detail-aside">
          <BookingBox price={tour.price} unit="per group / day" experienceSlug={tour.slug} />
          <div className="aside-help">
            <b>Questions?</b>
            <p>WhatsApp and email support details will appear here at launch.</p>
          </div>
        </aside>
      </div>

      <section className="more-in">
        <h2>Experiences in {city.title}</h2>
        <div className="more-grid">
          {inCity.map((e) => (
            <Link key={e.slug} href={`/en/${e.city}/${e.slug}/`}>
              <img src={e.img} alt={e.alt} loading="lazy" />
              <b>{e.title}</b>
              <small>{e.duration} · from {e.price}</small>
            </Link>
          ))}
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify(productJsonLd(tour.title, tour.tagline, tour.img, url, tour.price)),
      }} />
      <MobileBookingBar price={tour.price} />
      <SiteFooter />
    </main>
  );
}
