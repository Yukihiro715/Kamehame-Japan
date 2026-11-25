import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { legalFor } from "@/lib/legal";
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
  const copy = legalFor(lang);
  return withAlternates(
    socialMeta({ lang, title: `${copy.title} | KAMEHAME JAPAN`, description: copy.metaDescription, path: `/${lang}/legal/` }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/legal/`])),
  );
}

export default async function LegalPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = legalFor(lang);
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
          <dl className="legal-table">
            {copy.rows.map(([label, value]) => {
              const prior = value.indexOf(disclosure.priorIntro);
              const isMethod = label === "Payment methods" || label === "お支払方法";
              return <div key={label}><dt>{label}</dt><dd>
                {isMethod ? disclosure.methods : prior >= 0 ? <>
                  <p><strong>{disclosure.paidTitle}</strong><br />{disclosure.paid}</p>
                  <p><strong>{disclosure.enquiryTitle}</strong><br />{value.slice(0, prior).trim()}</p>
                </> : /^https?:\/\/\S+$/.test(value) ? <a href={value} rel="noreferrer">{value}</a> : value}
              </dd></div>;
            })}
          </dl>
        </article>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
