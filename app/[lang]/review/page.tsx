import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { ReviewForm } from "@/components/site/review-form";
import { catalogFor } from "@/lib/catalog";
import { CONTACT_EMAIL } from "@/lib/contact";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** Reached from the thank-you email, not from search: kept out of the index. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: `${t(lang).reviewForm.h} | KAMEHAME JAPAN`, robots: { index: false, follow: false } };
}

export default async function ReviewPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);
  const R = T.reviewForm;
  const experiences = catalogFor(lang).experiences.map((e) => ({ slug: e.slug, title: e.title }));

  return (
    <main className="subpage detail-page xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: T.reviewsH }]} />
      <div className="prose-layout">
        <article className="detail-main">
          <h1>{R.h}</h1>
          <p className="detail-tagline">{R.lead}</p>
          <ReviewForm lang={lang} experiences={experiences} fallbackEmail={CONTACT_EMAIL} />
        </article>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
