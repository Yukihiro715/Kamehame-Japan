"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Badge, Card, Loading, Notice } from "../ui";

interface Media { key: string; name: string; type: string; size: number }
interface Row { id: string; at: string; experience: string; rating: number; title?: string; body: string; name: string; email?: string; country?: string; party?: string; date?: string; ref?: string; lang: string; consent: boolean; mediaConsent: boolean; media: Media[] }
interface Data { configured: boolean; rows: Row[] }
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;
const fileUrl = (key: string, download = false) => `/api/portal/ops/media?key=${encodeURIComponent(key)}${download ? "&download=1" : ""}`;

/** Reviews sent through the site with their photos and videos and the
 *  permissions the guest gave. Publishing the text is still done by hand in
 *  lib/reviews.ts once the booking is matched. */
export function OpsReviews() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { api<Data>("GET", "ops/reviews").then(setData).catch((e) => setErr(errorText(e))); }, []);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  if (!data.configured) return <Notice tone="warn">写真・動画の保存先（R2 バケット MEDIA）がまだこのワーカーに接続されていません。デプロイの「Ensure the R2 bucket」ステップのログを確認してください。それまでレビューは従来どおり写真付きメールで届きます。</Notice>;
  return (
    <>
      <p className="pt-note-box">レビューフォームから届いた内容と、ゲストがアップロードした写真・動画です。「SNS・サイト利用: 許諾あり」のものだけを Instagram やサイトに使えます。許諾なしの素材はレビュー掲載の確認用にとどめてください。本文の掲載は従来どおり予約と照合のうえ lib/reviews.ts に追加します。</p>
      {data.rows.length === 0 && <Notice>まだ届いていません。</Notice>}
      {data.rows.map((r) => (
        <Card key={r.id} title={<span>{r.experience} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.name}{r.country ? `（${r.country}）` : ""} {r.mediaConsent ? <Badge tone="ok">SNS・サイト利用: 許諾あり</Badge> : <Badge tone="warn">SNS・サイト利用: 許諾なし</Badge>}</span>}>
          <p className="pt-small">受付 {jst(r.at)}{r.date ? ` · 体験日 ${r.date}` : ""}{r.ref ? ` · 予約番号 ${r.ref}` : ""} · 言語 {r.lang}{r.party ? ` · ${r.party}` : ""}{r.email ? ` · ${r.email}` : ""}</p>
          {r.title && <p><b>{r.title}</b></p>}
          <p style={{ whiteSpace: "pre-wrap" }}>{r.body}</p>
          {r.media.length > 0 ? (
            <div className="pt-media-grid">
              {r.media.map((m) => (
                <figure key={m.key} className="pt-media">
                  {m.type.startsWith("video/") ? <video src={fileUrl(m.key)} controls preload="metadata" /> : <a href={fileUrl(m.key)} target="_blank" rel="noreferrer"><img src={fileUrl(m.key)} alt={m.name} loading="lazy" /></a>}
                  <figcaption><a href={fileUrl(m.key, true)}>{m.name}</a> · {mb(m.size)}</figcaption>
                </figure>
              ))}
            </div>
          ) : <p className="pt-small">写真・動画のアップロードはありません（メール添付の写真があればそちらを確認）。</p>}
        </Card>
      ))}
    </>
  );
}
