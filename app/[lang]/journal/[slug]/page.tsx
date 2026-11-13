import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { articleBySlug, articleDate, articlesFor } from "@/lib/articles";
import { catalogFor, SITE_ORIGIN } from "@/lib/catalog";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { listPrice } from "@/lib/pricing";
import { absolute, socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string; slug: string }> }
const headingId = (index: number) => `section-${index}`;

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
  const relatedReading = (article.relatedArticles ?? []).map((s) => articleBySlug(s, lang)).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const headings = c.body.flatMap((block, index) => typeof block === "string" && block.startsWith("## ") ? [{ title: block.slice(3), id: headingId(index) }] : []);

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
    ...(article.editorial ? { author: { "@type": "Organization", name: article.editorial.author, url: absolute(`/${lang}/about/`) }, dateModified: article.date } : {}),
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
          {article.editorial && <p className="journal-byline">By <Link href={`/${lang}/about/`}>{article.editorial.author}</Link> · Golf planning notes</p>}
          <h1>{c.title}</h1>
          <p className="detail-tagline">{c.standfirst}</p>
          {article.editorial && <p className="journal-image-note">{article.editorial.imageCaption}</p>}
          {article.editorial && <nav className="article-toc" aria-label="In this article"><b>In this article</b><ul>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.title}</a></li>)}</ul></nav>}

          <div className="article-body">
            {c.body.map((block, i) => {
              if (typeof block === "string") return block.startsWith("## ")
                ? <h2 id={headingId(i)} key={i}>{block.slice(3)}</h2>
                : <p key={i}>{block}</p>;
              if (block.type === "link") return <p key={i} className="article-inline-link">{block.text} <a href={block.href}>{block.label}</a>.</p>;
              return <div key={i} className="article-table-scroll" role="region" aria-label={block.caption} tabIndex={0}><table className="article-table"><caption>{block.caption}</caption><thead><tr>{block.headings.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, col) => col === 0 ? <th scope="row" key={col}>{cell}</th> : <td key={col}>{cell}</td>)}</tr>)}</tbody></table></div>;
            })}
          </div>

          {article.cta && <section className="article-booking"><h2>Plan your round</h2><p>{article.cta.text}</p><Link className="underlined-link" href={article.cta.href}>{article.cta.label} <ArrowRight size={18} /></Link></section>}

          {relatedReading.length > 0 && <section className="article-reading"><h2>Continue planning</h2><ul>{relatedReading.map((a) => <li key={a.slug}><Link href={`/${lang}/journal/${a.slug}/`}>{a.copy[lang]!.title}</Link></li>)}</ul></section>}

          {article.editorial && <aside className="article-editorial-note" aria-label="Editorial note"><b>About this guide</b><p>{article.editorial.note}</p></aside>}

          {!article.cta && related.length > 0 && (
            <section className="prose-closing">
              <h2>{T.articleRelatedH}</h2>
              <div className="article-cta">
                {related.map((e) => (
                  <Link className="article-cta-card" key={e.slug} href={`/${lang}/${e.city}/${e.slug}/`}>
                    <img src={e.img} alt={e.alt} loading="lazy" />
                    <span className="article-cta-copy">
                      <b>{e.title}</b>
                      <small>{e.duration} · {e.area}</small>
                      <em>{T.from} {listPrice(e, lang).price} {listPrice(e, lang).unit === "group" ? T.perGroupShort : T.perPerson}{listPrice(e, lang).party ? ` · ${listPrice(e, lang).party}` : ""}</em>
                    </span>
                    <ArrowRight className="article-cta-arrow" size={20} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="journal-back">
            <Link className="underlined-link" href={`/${lang}/journal/`}>{T.journalAll} <ArrowRight /></Link>
          </p>
        </article>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteFooter lang={lang} />
    </main>
  );
}
