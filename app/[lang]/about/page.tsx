import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { aboutFor } from "@/lib/static-pages";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = aboutFor(lang);
  return withAlternates(
    socialMeta({
      lang,
      title: `${copy.title} | KAMEHAME JAPAN`,
      description: copy.metaDescription,
      path: `/${lang}/about/`,
    }),
    { en: "/en/about/", es: "/es/about/" },
  );
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = aboutFor(lang);
  const T = t(lang);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: copy.title }]} />

      <div className="prose-layout">
        <article className="detail-main">
          <h1>{copy.title}</h1>
          <p className="detail-tagline">{copy.lead}</p>

          {copy.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((para, i) => <p key={i}>{para}</p>)}
            </section>
          ))}

          <section>
            <div className="promise-grid">
              {copy.promises.map((p) => (
                <div className="promise" key={p.heading}>
                  <b>{p.heading}</b>
                  <p>{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="prose-closing">
            <h2>{copy.closing.heading}</h2>
            <p>{copy.closing.body}</p>
            <Link className="underlined-link" href={`/${lang}/experiences/`}>
              {copy.closing.cta} <ArrowRight />
            </Link>
          </section>
        </article>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
