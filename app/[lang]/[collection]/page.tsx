import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { ListingCard } from "@/components/site/listing-card";
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
    { en: `/en/${collection}/`, es: `/es/${collection}/`, ja: `/ja/${collection}/` },
  );
}

export default async function CollectionPage({ params }: Props) {
  const { lang, collection } = await params;
  if (!isLang(lang)) notFound();
  const data = getCollection(collection, lang);
  if (!data) notFound();
  const T = t(lang);

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
          <p className="eyebrow"><span /> {T.eyebrowHero}</p>
          <h1>{data.h1}</h1>
        </div>
      </section>

      <section className="collection-body">
        <p className="collection-lead">{data.lead}</p>

        <div className="refine-row" aria-label={T.refine}>
          <span className="refine-label">{T.refine}</span>
          {data.refine.map((r) => <Link className="chip" key={r.href + r.label} href={r.href}>{r.label}</Link>)}
          <span className="refine-sort">{T.sort}</span>
        </div>

        <div className="listing-grid">
          {data.items.map((item) => <ListingCard key={item.href} item={item} lang={lang} />)}
        </div>

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
