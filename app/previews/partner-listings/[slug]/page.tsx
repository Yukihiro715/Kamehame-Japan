import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { Fx } from "@/components/site/money";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import factsStyles from "@/components/site/experience-facts.module.css";
import { FACT_COPY } from "@/lib/experience-seo";
import { langHome, t } from "@/lib/i18n";
import { partnerListingDrafts, sumiEPreviewSlug, sumiEProposedPrices, type ListingDraft } from "@/lib/partner-listing-drafts";
import { yen } from "@/lib/pricing";
import "./preview.css";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> };
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const draft = partnerListingDrafts.find((d) => d.slug === slug);
  return {
    title: `${draft?.[lang === "ja" ? "ja" : "en"].title ?? "Listing preview"} | KAMEHAME JAPAN`,
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function PartnerListingPreview({ params, searchParams }: Props) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const draft = partnerListingDrafts.find((d) => d.slug === slug);
  if (!draft) notFound();
  const ja = lang === "ja";
  if (slug === sumiEPreviewSlug) return <SumiEReview draft={draft} lang={ja ? "ja" : "en"} />;
  const copy = draft[ja ? "ja" : "en"];
  return <main className="listing-draft" lang={ja ? "ja" : "en"}>
    <header className="listing-draft-header">
      <span>KAMEHAME JAPAN</span>
      <nav aria-label="Language"><a href="?lang=en" aria-current={!ja ? "page" : undefined}>English</a><a href="?lang=ja" aria-current={ja ? "page" : undefined}>日本語</a></nav>
    </header>
    <div className="listing-draft-notice">{ja ? "掲載内容の確認用プレビュー · 予約受付前" : "Listing review preview · Not open for booking"}</div>
    <section className="listing-draft-hero">
      <p className="listing-draft-eyebrow">{copy.area}</p>
      <h1>{copy.title}</h1>
      <p className="listing-draft-lead">{copy.lead}</p>
      {draft.images && <div className={`listing-draft-gallery${draft.gallery === "photo" ? " photo" : ""}`}>{draft.images.map((photo) => <figure key={photo.src}>
        {/* Provider-supplied static assets; preserve the full artwork without cropping. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo[ja ? "ja" : "en"]} width={photo.width} height={photo.height} loading="lazy" />
        <figcaption>{photo[ja ? "ja" : "en"]}</figcaption>
      </figure>)}</div>}
      <p className="listing-draft-photo">{draft.mediaNote?.[ja ? "ja" : "en"] ?? (ja ? "掲載写真を選定・準備中" : "Listing photos are being selected and prepared")}</p>
    </section>
    <div className="listing-draft-grid">
      <section><h2>{ja ? "体験の内容" : "The experience"}</h2><ul>{copy.highlights.map((x) => <li key={x}>{x}</li>)}</ul>
        <dl>{copy.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <aside><p className="listing-draft-eyebrow">{ja ? "掲載準備中" : "In preparation"}</p><h2>{ja ? "確認中の内容" : "Details being confirmed"}</h2><ul>{copy.pending.map((x) => <li key={x}>{x}</li>)}</ul><p>{ja ? "このページから予約・決済はできません。確定した内容を反映してから販売を開始します。" : "Reservations and payments are not available on this page. Booking will open after the details are confirmed."}</p></aside>
    </div>
    <footer>KAMEHAME JAPAN · {ja ? "確認用ページ" : "Review preview"}</footer>
  </main>;
}

function SumiEReview({ draft, lang }: { draft: ListingDraft; lang: "en" | "ja" }) {
  const ja = lang === "ja";
  const copy = draft[lang];
  const T = t(lang);
  const photos = (draft.images ?? []).map(photo => ({ img: photo.src, alt: photo[lang] }));
  const startingPrice = Math.min(...sumiEProposedPrices.map(course => course.perGuest));
  const status = ja ? "販売価格案（税込）" : "Proposed retail prices (tax included)";

  return (
    <main className="subpage detail-page xp xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} languageLinks={{ en: "?lang=en", ja: "?lang=ja" }} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: ja ? "東京" : "Tokyo", href: `/${lang}/tokyo/` },
        { label: copy.title },
      ]} />
      <p className="xp-preview-banner" role="status">{ja ? "掲載内容の確認用プレビュー · お問い合わせ・予約受付停止中" : "Listing review preview · Closed to enquiries and bookings"}</p>
      <header className="xp-head">
        <p className="eyebrow">{copy.area}</p>
        <h1>{copy.title}</h1>
      </header>
      <section className="xp-mv sumi-e-review-gallery" aria-label={T.detail.gallery}>
        <div className="xp-hero-photo"><HeroCarousel photos={photos} lang={lang} /></div>
        <Gallery photos={photos} lang={lang} note={draft.mediaNote?.[lang]} />
      </section>
      <div className="xp-cols">
        <aside className="xp-side" aria-labelledby="sumi-e-price-label">
          <div className="bk-card" id="booking">
            <div className="bk-price">
              <small id="sumi-e-price-label">{status}</small>
              <b><Fx>{`${ja ? "" : "From "}${yen(startingPrice)}${ja ? "〜" : ""}`}</Fx><span className="bk-unit">{T.perPerson}</span></b>
              <small className="bk-total">
                {ja ? "色紙・コースター、2〜6名で参加の場合" : "Shikishi art board or coasters, for groups of 2–6"}
              </small>
            </div>
            <a className="underlined-link" href="#pricing">{ja ? "4コースの料金を見る" : "Compare all four course prices"}</a>
            <p className="xp-note">{ja ? "表示は参考価格案です。現在お申し込みいただけません。" : "These proposed prices are for reference only. This experience is unavailable."}</p>
          </div>
        </aside>
        <div className="xp-main">
          <section className="xp-section">
            <h2>{T.detail.overviewH}</h2>
            <p className="xp-lede">{copy.lead}</p>
            <ul className="check-list">{copy.highlights.map(highlight => (
              <li key={highlight}><span className="tick" aria-hidden="true">✓</span><span>{highlight}</span></li>
            ))}</ul>
          </section>
          <section className="xp-section" id="pricing">
            <h2>{ja ? "コースと料金" : "Courses and prices"}</h2>
            <p className="plan-compare-lead">
              {ja ? "2027年1月1日以降を想定した税込価格案です。現在販売していません。" : "Proposed prices for sessions from 1 January 2027. Tax included. Not available for sale."}
            </p>
            <table className="xp-pricing compact sumi-e-pricing">
              <thead>
                <tr>
                  <th scope="col">{ja ? "コース" : "Course"}</th>
                  <th scope="col">{ja ? "1名参加（総額）" : "1 guest (total)"}</th>
                  <th scope="col">{ja ? "2〜6名参加（1名あたり）" : "2–6 guests (per person)"}</th>
                </tr>
              </thead>
              <tbody>{sumiEProposedPrices.map(course => (
                <tr key={course.name.en}>
                  <th scope="row">{course.name[lang]}</th>
                  <td className="total"><Fx>{yen(course.solo)}</Fx></td>
                  <td className="total"><Fx>{yen(course.perGuest)}</Fx></td>
                </tr>
              ))}</tbody>
            </table>
          </section>
          <section className={`xp-section ${factsStyles.facts}`} id="booking-facts">
            <h2>{FACT_COPY[lang].heading}</h2>
            <dl>{copy.details.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}</dl>
          </section>
          <section className="xp-section faq-list">
            <details>
              <summary>{ja ? "確認中の内容" : "Details being confirmed"}</summary>
              <ul className="check-list">{copy.pending.map(item => <li key={item}>{item}</li>)}</ul>
            </details>
          </section>
        </div>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
