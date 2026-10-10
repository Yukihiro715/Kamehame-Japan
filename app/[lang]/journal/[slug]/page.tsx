import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { ArticleBlocks } from "@/components/site/article-blocks";
import { ArticleProductLink } from "@/components/site/article-product-link";
import { articleBySlug, articleDate, articlesFor } from "@/lib/articles";
import { catalogFor, SITE_ORIGIN } from "@/lib/catalog";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { listPrice } from "@/lib/pricing";
import { absolute, socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string; slug: string }> }

export function generateStaticParams() {
  return LANGS.flatMap((lang) => articlesFor(lang).map((a) => ({ lang, slug: a.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const article = articleBySlug(slug, lang);
  if (!article) return {};
  const c = article.copy[lang]!;
  return withAlternates(
    socialMeta({
      lang,
      title: `${c.title} | KAMEHAME JAPAN`,
      description: c.standfirst,
      path: `/${lang}/journal/${slug}/`,
      image: article.img,
      type: "article",
    }),
    Object.fromEntries(LANGS.filter((l) => article.copy[l]).map((l) => [l, `/${l}/journal/${slug}/`])),
  );
}

export default async function ArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const article = articleBySlug(slug, lang);
  if (!article) notFound();
  const c = article.copy[lang]!;
  const T = t(lang);

  const { experiences } = catalogFor(lang);
  const related = article.experiences
    .map((s) => experiences.find((e) => e.slug === s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.title,
    description: c.standfirst,
    image: absolute(article.img),
    datePublished: article.date,
    ...(article.editorial ? {
      dateModified: article.editorial.updatedAt,
      author: { "@type": "Organization", name: article.editorial.author, url: `${SITE_ORIGIN}/en/about/` },
      citation: article.editorial.sources.map((s) => s.url),
    } : {}),
    inLanguage: lang,
    publisher: { "@type": "Organization", name: "KAMEHAME JAPAN", url: SITE_ORIGIN },
    mainEntityOfPage: absolute(`/${lang}/journal/${slug}/`),
  };

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: T.journalH, href: `/${lang}/journal/` },
        { label: c.title },
      ]} />

      <section className="detail-gallery single">
        <img className="gallery-main" src={article.img} alt={article.alt} />
      </section>

      <div className="prose-layout">
        <article className="detail-main">
          <p className="journal-meta">{articleDate(article.date, lang)} · {T.readMinutes(article.minutes)}</p>
          {article.editorial && <p className="journal-meta">By {article.editorial.author} · Updated {articleDate(article.editorial.updatedAt, lang)}</p>}
          <h1>{c.title}</h1>
          <p className="detail-tagline">{c.standfirst}</p>

          <div className="article-body">
            {c.blocks && <ArticleBlocks blocks={c.blocks} />}
            {c.body.map((para, i) =>
              para.startsWith("## ")
                ? <h2 key={i}>{para.slice(3)}</h2>
                : <p key={i}>{para}</p>,
            )}
          </div>
          {article.editorial && (
            <section className="prose-closing">
              <h2>Sources and further reading</h2>
              <ul>{article.editorial.sources.map((source) => <li key={source.id}><a className="underlined-link" href={source.url}>{source.title}</a> · Checked {articleDate(source.retrievedAt, lang)}</li>)}</ul>
              {article.editorial.imageCredit && <p>{article.editorial.imageCredit}</p>}
            </section>
          )}

          {related.length > 0 && (
            <section className="prose-closing">
              <h2>{T.articleRelatedH}</h2>
              <div className="article-cta">
                {related.map((e) => (
                  <ArticleProductLink key={e.slug} article={slug} product={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
                    <img src={e.img} alt={e.alt} loading="lazy" />
                    <span className="article-cta-copy">
                      <b>{e.title}</b>
                      <small>{e.duration} · {e.area}</small>
                      <em>{T.from} {listPrice(e, lang).price} {listPrice(e, lang).unit === "group" ? T.perGroupShort : T.perPerson}{listPrice(e, lang).party ? ` · ${listPrice(e, lang).party}` : ""}</em>
                    </span>
                    <ArrowRight className="article-cta-arrow" size={20} />
                  </ArticleProductLink>
                ))}
              </div>
            </section>
          )}

          <p className="journal-back">
            <Link className="underlined-link" href={`/${lang}/journal/`}>{T.journalAll} <ArrowRight /></Link>
          </p>
        </article>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
