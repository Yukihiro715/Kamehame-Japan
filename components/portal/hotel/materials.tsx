"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { usePortal } from "../shell";
import { Button, Card, Loading, Notice, Table } from "../ui";

interface Link { id: string; experience: string | null; medium: string; kind: string; label: string | null; url: string; createdAt: string }
interface Data { hotelName: string; brochureUrl: string | null; links: Link[] }

const MEDIUM: Record<string, string> = { brochure: "パンフレット", room_tv: "客室TV", front: "フロント", web: "Web", other: "共通" };

export function HotelMaterials() {
  const { hotel } = usePortal();
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const load = () => { if (hotel) api<Data>("GET", `hotel/materials?hotel=${hotel.id}`).then(setData).catch((e) => setErr(errorText(e))); };
  useEffect(load, [hotel]); // eslint-disable-line react-hooks/exhaustive-deps
  const ensureAll = async () => { if (!hotel) return; setBusy(true); try { await api("POST", "hotel/materials", { hotel: hotel.id }); load(); } finally { setBusy(false); } };
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  const general = data.links.filter((l) => !l.experience);
  const qr = general.find((l) => l.kind === "qr"), url = general.find((l) => l.kind === "url");
  return (
    <>
      <Card title="全体験一覧へのQRコードとリンク">
        <p className="pt-note-box">QRは印刷物に、リンクはメールやWebに。QRとリンクは別の識別子で、どちらから来たかを区別します（QR用URLをそのまま共有された場合もQR経由に数えます）。印刷後に掲載する体験を変えても、同じQRのまま使えます。QRにお客様や口座の情報は入りません。</p>
        {!qr ? <Button onClick={() => void ensureAll()} disabled={busy}>QRコードとリンクを発行する</Button> : (
          <div className="pt-grid-2">
            <div className="pt-row" style={{ alignItems: "flex-start" }}>
              <img className="pt-qr" src={`/api/portal/hotel/qr?link=${qr.id}`} alt="全体験一覧のQRコード" />
              <div>
                <b>QRコード（印刷用）</b>
                <div className="pt-row" style={{ marginTop: 6 }}>
                  <a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/qr?link=${qr.id}&format=svg&download=1`} download>SVG</a>
                  <a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/qr?link=${qr.id}&format=png`} download>PNG</a>
                </div>
                <p className="pt-small pt-muted" style={{ marginTop: 6 }}>QRの中身: {qr.url}</p>
              </div>
            </div>
            <div>
              <b>紹介リンク（コピー用）</b>
              <p><a href={url?.url} target="_blank" rel="noreferrer">{url?.url}</a></p>
              <Button kind="secondary" small onClick={() => { if (url) void navigator.clipboard?.writeText(url.url); }}>リンクをコピー</Button>
            </div>
          </div>
        )}
      </Card>
      <Card title="体験別のQRコードとリンク">
        <p className="pt-small pt-muted">「体験一覧」の各体験で「紹介リンクを取得」を押すと、ここに並びます。</p>
        <Table head={["対象", "種類", "URL", "QR", "発行日"]} rows={data.links.filter((l) => l.experience).map((l) => [l.experience, l.kind === "qr" ? "QR" : "リンク", <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, l.kind === "qr" ? <span key="q" className="pt-row"><a href={`/api/portal/hotel/qr?link=${l.id}&format=svg&download=1`} download>SVG</a><a href={`/api/portal/hotel/qr?link=${l.id}&format=png`} download>PNG</a></span> : "—", jst(l.createdAt, false)])} empty="体験別のリンクはまだありません。" />
      </Card>
      <Card title="パンフレット">
        {data.brochureUrl ? <p><a href={data.brochureUrl} target="_blank" rel="noreferrer">最新のパンフレット（PDF）を開く</a></p> : <p className="pt-muted">準備中です。用意でき次第ここに表示されます。</p>}
      </Card>
      {data.links.filter((l) => l.medium !== "other").length > 0 && (
        <Card title="KAMEHAME JAPAN が発行した媒体別リンク">
          <Table head={["ラベル", "媒体", "対象", "種類", "URL", "QR"]} rows={data.links.filter((l) => l.medium !== "other").map((l) => [l.label ?? "—", MEDIUM[l.medium] ?? l.medium, l.experience ?? "全体験一覧", l.kind === "qr" ? "QR" : "リンク", <a key="u" href={l.url} target="_blank" rel="noreferrer">{l.url}</a>, l.kind === "qr" ? <span key="q" className="pt-row"><a href={`/api/portal/hotel/qr?link=${l.id}&format=svg&download=1`} download>SVG</a><a href={`/api/portal/hotel/qr?link=${l.id}&format=png`} download>PNG</a></span> : "—"])} />
        </Card>
      )}
    </>
  );
}
