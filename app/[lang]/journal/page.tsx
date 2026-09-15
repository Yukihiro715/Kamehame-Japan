import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { articleDate, articlesFor } from "@/lib/articles";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const T = t(lang);
  return withAlternates(
    socialMeta({
      lang,
      title: `${T.journalH} | KAMEHAME JAPAN`,
      description: T.journalLead,
      path: `/${lang}/journal/`,
    }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/journal/`])),
  );
}

export default async function JournalIndex({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);
  const articles = articlesFor(lang);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: T.journalH }]} />

      <div className="prose-layout wide">
        <article className="detail-main">
          <h1>{T.journalH}</h1>
          <p className="detail-tagline">{T.journalLead}</p>

          {articles.length === 0 ? (
            <div className="journal-empty">
              <BookOpen size={20} />
              <div>
                <b>{T.journalEmptyH}</b>
                <p>{T.journalEmpty}</p>
                <Link className="underlined-link" href={`/${lang}/experiences/`}>{T.journalEmptyCta}</Link>
              </div>
            </div>
          ) : (
            <div className="journal-grid">
              {articles.map((a) => {
                const c = a.copy[lang]!;
                return (
                  <Link className="journal-card" key={a.slug} href={`/${lang}/journal/${a.slug}/`}>
                    <img src={a.img} alt={a.alt} loading="lazy" />
                    <div>
                      <p className="journal-meta">{articleDate(a.date, lang)} · {T.readMinutes(a.minutes)}</p>
                      <h2>{c.title}</h2>
                      <p>{c.standfirst}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
