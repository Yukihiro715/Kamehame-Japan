import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { ListingCard } from "@/components/site/listing-card";
import { articleDate, articlesForCollection } from "@/lib/articles";
import { catalogFor } from "@/lib/catalog";
import { collectionSlugs, getCollection } from "@/lib/collections";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string; collection: string }> }

export function generateStaticParams() {
  return LANGS.flatMap((lang) => collectionSlugs.map((collection) => ({ lang, collection })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, collection } = await params;
  if (!isLang(lang)) return {};
  const data = getCollection(collection, lang);
  if (!data) return {};
  return withAlternates(
    socialMeta({
      lang,
      title: `${data.h1} | KAMEHAME JAPAN`,
      description: data.lead,
      path: `/${lang}/${collection}/`,
      image: data.heroImg,
    }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/${collection}/`])),
  );
}

export default async function CollectionPage({ params }: Props) {
  const { lang, collection } = await params;
  if (!isLang(lang)) notFound();
  const data = getCollection(collection, lang);
  if (!data) notFound();
  const T = t(lang);

  // Articles attached to any experience in this city or category.
  const { experiences, cities } = catalogFor(lang);
  const reading = articlesForCollection(collection, lang, (slug) => experiences.find((e) => e.slug === slug));
  // Hero eyebrow: only the cities this city or category actually runs in.
  const inCollection = experiences.filter((e) => e.city === collection || e.category === collection);
  const heroCities = inCollection.length ? cities.filter((c) => inCollection.some((e) => e.city === c.slug)) : cities;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="subpage" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />

      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: data.crumb }]} />

      <section className="collection-hero">
        <img src={data.heroImg} alt={data.heroAlt} />
        <div className="collection-hero-copy">
          <p className="eyebrow"><span /> {T.eyebrowHero(heroCities.map((c) => c.title))}</p>
          <h1>{data.h1}</h1>
        </div>
      </section>

      <section className="collection-body">
        {collection === "golf" || collection === "sports" ? (
          <div style={{border:"1px solid #d8ded8",padding:"24px",marginBottom:"32px",background:"#f8f8f5"}}>
            <h2>Choose your golf experience</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18,marginTop:15}}>
              <div><h3>1. Shared Bus Golf Tour</h3><p>18-hole golf with round-trip shared coach transfers. Perfect for solo golfers and pairs. See published dates and prices.</p>
                <Link className="underlined-link" href={`/${lang}/golf-bus/`}>Explore bus tours <ArrowRight size={15}/></Link></div>
              <div><h3>2. Custom Golf Booking</h3><p>Choose your course and tee time. Travel independently or request an introduction to a private-transfer provider. Arrangement fees remain unchanged.</p>
                <Link className="underlined-link" href={`/${lang}/tokyo/mt-fuji-golf-day/`}>Explore custom booking <ArrowRight size={15}/></Link></div>
            </div>
          </div>
        ):null}
        <p className="collection-lead">{data.lead}</p>

        <div className="refine-row" aria-label={T.refine}>
          <span className="refine-label">{T.refine}</span>
          {data.refine.map((r) => <Link className="chip" key={r.href + r.label} href={r.href}>{r.label}</Link>)}
          <span className="refine-sort">{T.sort}</span>
        </div>

        <div className="listing-grid">
          {data.items.map((item) => <ListingCard key={item.href} item={item} lang={lang} />)}
        </div>

        {reading.length > 0 && (
          <section className="collection-journal">
            <div className="section-heading horizontal">
              <h2>{T.journalForCollection}</h2>
              <Link className="underlined-link" href={`/${lang}/journal/`}>{T.journalAll} <ArrowRight /></Link>
            </div>
            <div className="journal-grid">
              {reading.map((a) => (
                <Link className="journal-card" key={a.slug} href={`/${lang}/journal/${a.slug}/`}>
                  <img src={a.img} alt={a.alt} loading="lazy" />
                  <div>
                    <p className="journal-meta">{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</p>
                    <h3>{a.copy[lang]!.title}</h3>
                    <p>{a.copy[lang]!.standfirst}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="collection-seo">
          <div>
            <h2>{data.about.heading}</h2>
            <p>{data.about.body}</p>
          </div>
          <div className="collection-faq">
            <h2>{T.frequentlyAsked}</h2>
            {data.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="also-explore">
          <h2>{T.alsoExplore}</h2>
          <div>
            {data.explore.map((r) => <Link className="chip" key={r.href + r.label} href={r.href}>{r.label} <ArrowRight size={13} /></Link>)}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
