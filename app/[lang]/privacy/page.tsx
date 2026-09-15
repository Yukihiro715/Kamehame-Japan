import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { privacyFor, privacyUpdated } from "@/lib/privacy";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = privacyFor(lang);
  return withAlternates(
    socialMeta({ lang, title: `${copy.title} | KAMEHAME JAPAN`, description: copy.metaDescription, path: `/${lang}/privacy/` }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/privacy/`])),
  );
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = privacyFor(lang);
  const T = t(lang);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: copy.title }]} />

      <div className="prose-layout">
        <article className="detail-main">
          <h1>{copy.title}</h1>
          <p className="detail-tagline">{copy.lead}</p>
          <p className="privacy-updated">{copy.updated}: {privacyUpdated}</p>

          {copy.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((para, i) => <p key={i}>{para}</p>)}
              {s.list && <ul className="know-list">{s.list.map((li) => <li key={li}>{li}</li>)}</ul>}
            </section>
          ))}

          <section>
            <h2>{copy.cookies.heading}</h2>
            <p>{copy.cookies.intro}</p>
            <div className="table-scroll">
              <table className="cookie-table">
                <thead><tr>{copy.cookies.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>
                  {copy.cookies.rows.map((r) => (
                    <tr key={r[0]}><td><code>{r[0]}</code></td><td>{r[1]}</td><td>{r[2]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </article>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
