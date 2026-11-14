import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { partnerListingDrafts } from "@/lib/partner-listing-drafts";
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
      <p className="listing-draft-photo">{ja ? "実際の体験写真を準備中" : "Experience photos are being prepared"}</p>
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
