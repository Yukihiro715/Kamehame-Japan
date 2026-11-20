import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { terraceCopy, terraceName, terracePath } from "@/lib/bamboo-sky-terrace";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { SITE_NAME, socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = terraceCopy[lang];
  return withAlternates(
    socialMeta({ lang, title: `${terraceName} · ${copy.kyoto} | ${SITE_NAME}`, description: copy.lead, path: terracePath(lang) }),
    Object.fromEntries(LANGS.map((locale) => [locale, terracePath(locale)])),
  );
}

export default async function BambooSkyTerracePage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = terraceCopy[lang];

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: t(lang).home, href: langHome(lang) },
        { label: copy.kyoto, href: `/${lang}/kyoto/` },
        { label: terraceName },
      ]} />
      <div className="prose-layout">
        <article className="detail-main">
          <h1>{terraceName}</h1>
          <p className="detail-tagline">{copy.lead}</p>
          <section>
            <h2>{copy.details}</h2>
            <dl className="promise-grid">
              {copy.facts.map(([label, value]) => (
                <div className="promise" key={label}>
                  <dt><b>{label}</b></dt>
                  <dd style={{ margin: 0 }}><p>{value}</p></dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="prose-closing">
            <h2>{copy.quote}</h2>
            <p>{copy.prompt}</p>
            <Link className="contact-cta" href={`/${lang}/contact/#enquiry`}>{copy.link}</Link>
          </section>
        </article>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
