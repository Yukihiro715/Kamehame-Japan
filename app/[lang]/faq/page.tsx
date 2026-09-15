import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { faqFor } from "@/lib/static-pages";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = faqFor(lang);
  return withAlternates(
    socialMeta({
      lang,
      title: `${copy.title} | KAMEHAME JAPAN`,
      description: copy.metaDescription,
      path: `/${lang}/faq/`,
    }),
    { en: "/en/faq/", es: "/es/faq/" },
  );
}

export default async function FaqPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = faqFor(lang);
  const T = t(lang);

  // One FAQPage entity across every group, which is what rich results expect.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.groups.flatMap((g) =>
      g.items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    ),
  };

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: copy.title }]} />

      <div className="prose-layout">
        <article className="detail-main">
          <h1>{copy.title}</h1>
          <p className="detail-tagline">{copy.lead}</p>

          {copy.groups.map((g) => (
            <section key={g.heading}>
              <h2>{g.heading}</h2>
              <div className="faq-list">
                {g.items.map((f) => (
                  <details key={f.q}>
                    <summary>{f.q}</summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="prose-closing">
            <h2>{copy.closing.heading}</h2>
            <p>{copy.closing.body}</p>
            <Link className="underlined-link" href={`/${lang}/experiences/`}>
              {copy.closing.cta} <ArrowRight />
            </Link>
          </section>
        </article>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
