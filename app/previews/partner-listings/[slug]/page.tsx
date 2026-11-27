import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Clock3, Languages, MapPin, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { Fx } from "@/components/site/money";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import factsStyles from "@/components/site/experience-facts.module.css";
import { FACT_COPY } from "@/lib/experience-seo";
import { langHome, t } from "@/lib/i18n";
import { partnerListingDrafts, sumiEPreviewSlug } from "@/lib/partner-listing-drafts";
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
  // The idol live became a catalog product (lib/catalog.ts tokyo-idol-live-night); the review link keeps working.
  if (slug === "tokyo-underground-idol-live") redirect(`/${lang === "ja" ? "ja" : "en"}/tokyo/tokyo-idol-live-night/`);
  // These became catalog products (lib/catalog.ts); the review links keep working.
  const productCity: Record<string, string> = {"matsuyama-tobe-pottery-full-course":"matsuyama","yakushima-jomonsugi-trekking":"yakushima","yakushima-shiratani-moss-forest":"yakushima","yakushima-shiratani-taikoiwa":"yakushima","yakushima-shiratani-taikoiwa-old-growth":"yakushima","yakushima-sea-turtle-snorkeling":"yakushima","yakushima-discover-scuba-one-dive":"yakushima","yakushima-discover-scuba-extended-dive":"yakushima","yakushima-discover-scuba-two-dives":"yakushima","tokyo-ninja-zen-night-walk":"tokyo","tokyo-matcha-cultural-experience":"tokyo"};
  if (productCity[slug]) redirect(`/${lang === "ja" ? "ja" : "en"}/${productCity[slug]}/${slug}/`);
  const draft = partnerListingDrafts.find((d) => d.slug === slug);
  if (!draft) notFound();
  const locale = lang === "ja" ? "ja" : "en";
  const ja = locale === "ja";
  const copy = draft[locale];
  const T = t(locale);
  const isSumiE = draft.slug === sumiEPreviewSlug;
  const photos = (draft.images ?? []).map(photo => ({ img: photo.src, alt: photo[locale] }));
  const prices = draft.prices ?? [];
  const hasPrices = prices.length > 0;
  const hasSoloPrices = prices.some(price => price.solo !== undefined);
  const cityName = draft.city === "kyoto" ? (ja ? "京都" : "Kyoto") : (ja ? "東京" : "Tokyo");
  const priceLabel = isSumiE
    ? (ja ? "販売価格案（税込）" : "Proposed retail prices (tax included)")
    : (ja ? "チケット料金（税込）" : "Ticket prices (tax included)");
  const bookingStatus = isSumiE
    ? (ja ? "お問い合わせ・予約受付停止中" : "Closed to enquiries and bookings")
    : (ja ? "予約受付前" : "Not open for booking");
  // The condition chips under the photos, as on a product page, read from the
  // confirmed details: length, party and language, with the area first.
  const detail = (re: RegExp) => copy.details.find(([label]) => re.test(label))?.[1];
  const chips = [
    { Icon: MapPin, text: copy.area },
    { Icon: Clock3, text: detail(/所要時間|Duration/i) },
    { Icon: Users, text: detail(/参加条件|参加人数|人数|Participants|Capacity/i) },
    { Icon: Languages, text: detail(/対応言語|Language/i) },
  ].filter((c): c is { Icon: typeof MapPin; text: string } => !!c.text);
  const priceStatus = draft.priceOnRequest
    ? (ja ? "個別見積もり" : "Price on request")
    : (ja ? "販売価格を確認中" : "Pricing is being confirmed");
  // A confirmed per-person price in the details (the "料金" / "Price" row) is shown
  // in the booking card like a product page, so reviewers see it at a glance.
  const priceRow = copy.details.find(([label]) => /^(料金|Price)$/.test(label))?.[1] ?? "";
  const confirmedPrice = !hasPrices && !draft.priceOnRequest ? priceRow.match(/¥([\d,]+)/)?.[1] : undefined;

  return (
    <main className="subpage detail-page xp xp2" lang={locale}>
      <SiteHeader variant="solid" lang={locale} languageLinks={{ en: "?lang=en", ja: "?lang=ja" }} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(locale) },
        ...(draft.city ? [{ label: cityName, href: `/${locale}/${draft.city}/` }] : []),
        { label: copy.title },
      ]} />
      <p className="xp-preview-banner" role="status">{ja ? "掲載内容の確認用プレビュー" : "Listing review preview"} · {bookingStatus}</p>
      <header className="xp-head">
        <h1>{copy.title}</h1>
      </header>
      <section className={`xp-mv${draft.gallery === "photo" || photos.length === 0 ? "" : " listing-artwork-gallery"}`} aria-label={T.detail.gallery}>
        {photos.length > 0 ? (
          <>
            <div className="xp-hero-photo"><HeroCarousel photos={photos} lang={locale} /></div>
            <Gallery photos={photos} lang={locale} note={draft.mediaNote?.[locale]} />
          </>
        ) : (
          /* No licensed photos yet: the photo grid keeps its place so the page reads like the product page it will become. */
          <div className="listing-photo-pending" role="img" aria-label={ja ? "掲載写真を準備中" : "Photos to follow"}>
            <div className="listing-photo-pending-main"><b>{ja ? "掲載写真を準備中" : "Photos to follow"}</b><small>{ja ? "主催者から写真が届き次第、ここに掲載します" : "Added as soon as the organiser's photos arrive"}</small></div>
            <div /><div /><div /><div />
          </div>
        )}
        {chips.length > 0 && <ul className="xp-conditions">{chips.map(({ Icon, text }) => <li key={text}><Icon size={14} /> {text}</li>)}</ul>}
      </section>
      <div className="xp-cols">
        <aside className="xp-side" aria-labelledby="preview-price-label">
          <div className="bk-card" id="booking">
            {hasPrices ? (
              <>
                <div className="bk-price">
                  <small id="preview-price-label">{priceLabel}</small>
                  <b>
                    <Fx>{`${ja ? "" : "From "}${yen(Math.min(...prices.map(price => price.perGuest)))}${ja ? "〜" : ""}`}</Fx>
                    <span className="bk-unit">{T.perPerson}</span>
                  </b>
                  {isSumiE && <small className="bk-total">{ja
                    ? "色紙・コースター、2〜6名で参加の場合"
                    : "Shikishi art board or coasters, for groups of 2–6"}</small>}
                </div>
                <a className="underlined-link" href="#pricing">{ja ? "料金を見る" : "Compare prices"}</a>
              </>
            ) : confirmedPrice ? (
              <div className="bk-price">
                <small id="preview-price-label">{ja ? "料金（税込）" : "Price (tax included)"}</small>
                <b><Fx>{`¥${confirmedPrice}`}</Fx><span className="bk-unit">{T.perPerson}</span></b>
              </div>
            ) : <strong className="bk-quote-heading" id="preview-price-label">{priceStatus}</strong>}
            <p className="xp-note">{isSumiE
              ? (ja ? "表示は参考価格案です。現在お申し込みいただけません。" : "These proposed prices are for reference only. This experience is unavailable.")
              : bookingStatus}</p>
          </div>
          <div className="bk-card listing-pending-card">
            <strong className="bk-quote-heading">{ja ? "確認中の内容" : "Details being confirmed"}</strong>
            <ul className="check-list muted">{copy.pending.map(item => <li key={item}><span className="tick" aria-hidden="true">—</span><span>{item}</span></li>)}</ul>
          </div>
        </aside>
        <div className="xp-main">
          <section className="xp-section" id="overview">
            <h2>{T.detail.overviewH}</h2>
            <p className="xp-lede">{copy.lead}</p>
            <ul className="check-list">{copy.highlights.map(highlight => (
              <li key={highlight}><span className="tick" aria-hidden="true">✓</span><span>{highlight}</span></li>
            ))}</ul>
          </section>
          {hasPrices && (
            <section className="xp-section" id="pricing">
              <h2>{isSumiE ? (ja ? "コースと料金" : "Courses and prices") : (ja ? "チケットと料金" : "Tickets and prices")}</h2>
              {isSumiE && <p className="plan-compare-lead">
                {ja ? "2027年1月1日以降を想定した税込価格案です。現在販売していません。" : "Proposed prices for sessions from 1 January 2027. Tax included. Not available for sale."}
              </p>}
              <table className="xp-pricing compact preview-pricing">
                <thead>
                  <tr>
                    <th scope="col">{isSumiE ? (ja ? "コース" : "Course") : (ja ? "チケット" : "Ticket")}</th>
                    {hasSoloPrices && <th scope="col">{ja ? "1名参加（総額）" : "1 guest (total)"}</th>}
                    <th scope="col">{hasSoloPrices
                      ? (ja ? "2〜6名参加（1名あたり）" : "2–6 guests (per person)")
                      : (ja ? "1名あたり（税込）" : "Per person (tax included)")}</th>
                  </tr>
                </thead>
                <tbody>{prices.map(price => (
                  <tr key={price.name.en}>
                    <th scope="row">{price.name[locale]}</th>
                    {hasSoloPrices && <td className="total">{price.solo === undefined ? "—" : <Fx>{yen(price.solo)}</Fx>}</td>}
                    <td className="total"><Fx>{yen(price.perGuest)}</Fx></td>
                  </tr>
                ))}</tbody>
              </table>
            </section>
          )}
          <section className={`xp-section ${factsStyles.facts}`} id="booking-facts">
            <h2>{FACT_COPY[locale].heading}</h2>
            <dl>{copy.details.map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}</dl>
          </section>
        </div>
      </div>
      <SiteFooter lang={locale} />
    </main>
  );
}
