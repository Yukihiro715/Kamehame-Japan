import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { LEGAL_UPDATED, termsFor } from "@/lib/legal";
import { paymentDisclosure } from "@/lib/booking-legal-display";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = termsFor(lang);
  return withAlternates(
    socialMeta({ lang, title: `${copy.title} | KAMEHAME JAPAN`, description: copy.metaDescription, path: `/${lang}/terms/` }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/terms/`])),
  );
}

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = termsFor(lang);
  const T = t(lang);
  const disclosure = paymentDisclosure(lang);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: copy.title }]} />
      <div className="prose-layout">
        <article className="detail-main">
          <h1>{copy.title}</h1>
          <p className="detail-tagline">{copy.lead}</p>
          <p className="privacy-updated">{copy.updated}: {LEGAL_UPDATED}</p>
          {copy.sections.map((section) => {
            const paid = section.body.some((paragraph) => paragraph.startsWith(disclosure.priorIntro));
            const paragraphs = section.body.filter((paragraph) => !paragraph.startsWith(disclosure.priorIntro));
            return <section key={section.heading}>
              <h2>{section.heading}</h2>
              {paid && <>
                <p><strong>{disclosure.paidTitle}</strong><br />{disclosure.paid}</p>
                <p><strong>{disclosure.enquiryTitle}</strong></p>
              </>}
              {paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
            </section>;
          })}
        </article>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
