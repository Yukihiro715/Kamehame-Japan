import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { ListingCard } from "@/components/site/listing-card";
import { collectionSlugs, getCollection } from "@/lib/collections";

interface Props { params: Promise<{ collection: string }> }

export function generateStaticParams() {
  return collectionSlugs.map((collection) => ({ collection }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const data = getCollection(collection);
  if (!data) return {};
  return {
    title: `${data.h1} | OMOTENASHI JAPAN`,
    description: data.lead,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { collection } = await params;
  const data = getCollection(collection);
  if (!data) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main className="subpage">
      <SiteHeader variant="solid" />

      <Breadcrumbs trail={[{ label: "Home", href: "/" }, { label: data.crumb }]} />

      <section className="collection-hero">
        <img src={data.heroImg} alt={data.heroAlt} />
        <div className="collection-hero-copy">
          <p className="eyebrow"><span /> Tokyo · Kyoto · With the masters</p>
          <h1>{data.h1}</h1>
        </div>
      </section>

      <section className="collection-body">
        <p className="collection-lead">{data.lead}</p>

        <div className="refine-row" aria-label="Refine">
          <span className="refine-label">Refine</span>
          {data.refine.map((r) => <Link className="chip" key={r.href + r.label} href={r.href}>{r.label}</Link>)}
          <span className="refine-sort">Sort: Recommended</span>
        </div>

        <div className="listing-grid">
          {data.items.map((item) => <ListingCard key={item.href} item={item} />)}
        </div>

        <div className="collection-seo">
          <div>
            <h2>{data.about.heading}</h2>
            <p>{data.about.body}</p>
          </div>
          <div className="collection-faq">
            <h2>Frequently asked</h2>
            {data.faq.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="also-explore">
          <h2>Also explore</h2>
          <div>
            {data.explore.map((r) => <Link className="chip" key={r.href + r.label} href={r.href}>{r.label} <ArrowRight size={13} /></Link>)}
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SiteFooter />
    </main>
  );
}
