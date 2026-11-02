"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Card, Loading, Notice, Table } from "../ui";

interface Row { id: string; reference: string; tour_date: string; course: string; departure_area: string | null; departure_time: string | null; people: number; renters: number; total_yen: number; marginYen: number; name: string; email: string; status: string; statusJa: string; customer_mail: string | null; partner_mail: string | null; created_at: string }
interface Data { rows: Row[]; counts: Record<string, number> }

const TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { received: "warn", handed_over: "info", guidance_sent: "info", purchased: "ok", confirmed: "ok", cancelled: "neutral", unavailable: "bad" };
const FILTERS: [string, string][] = [["open", "進行中"], ["", "すべて"], ["received", "受付"], ["handed_over", "引き継ぎ済み"], ["guidance_sent", "案内送付済み"], ["purchased", "購入済み"], ["confirmed", "確定"], ["cancelled", "キャンセル"], ["unavailable", "手配不可"]];
const MAIL: Record<string, string> = { sent: "送信", blocked: "ブロック", failed: "失敗", unconfigured: "未設定" };

export function OpsBusTours() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("open"), [q, setQ] = useState(""), [term, setTerm] = useState("");
  useEffect(() => {
    api<Data>("GET", `ops/bus-tours?status=${encodeURIComponent(status)}&q=${encodeURIComponent(term)}`).then(setData).catch((e) => setErr(errorText(e)));
  }, [status, term]);
  if (err) return <Notice tone="bad">{err}</Notice>;
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  return (
    <>
      <p className="pt-note-box">乗合バスゴルフツアー（提携先の公開日程）への問い合わせです。お客様は総額のみを見ています。ここに出る仕入価格・上乗せ分・粗利は社内限りで、公開ページやお客様向けメールには出しません。流れ: 受付 → 提携先へ引き継ぎ → 購入案内送付 → 購入 → 予約確定。</p>
      <div className="pt-row pt-filters">
        {FILTERS.map(([v, label]) => <button key={v} type="button" className={`pt-chip${status === v ? " on" : ""}`} onClick={() => setStatus(v)}>{label}{v && data?.counts[v] ? `（${data.counts[v]}）` : v === "" && total ? `（${total}）` : ""}</button>)}
        <form onSubmit={(e) => { e.preventDefault(); setTerm(q); }} className="pt-row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="受付番号・名前・メール・コース" aria-label="検索" /><button type="submit" className="pt-btn pt-btn-secondary pt-btn-small">検索</button></form>
      </div>
      {!data ? <Loading /> : (
        <Card>
          <Table head={["受付番号", "受付日時", "開催日", "コース", "出発", "人数", "レンタル", "お客様総額", "粗利相当", "お客様", "状態", "顧客メール", "提携先メール"]}
            rows={data.rows.map((r) => [
              <a key="a" href={`/ops/bus-tours/${r.id}/`}>{r.reference}</a>, jst(r.created_at), r.tour_date, r.course, `${r.departure_area ?? "—"}${r.departure_time ? ` ${r.departure_time}` : ""}`,
              `${r.people}名`, r.renters ? `${r.renters}名` : "—", yen(r.total_yen), yen(r.marginYen), <span key="n">{r.name}<br /><small>{r.email}</small></span>,
              <Badge key="s" tone={TONE[r.status] ?? "neutral"}>{r.statusJa}</Badge>, MAIL[r.customer_mail ?? ""] ?? "—", MAIL[r.partner_mail ?? ""] ?? "—",
            ])} empty="問い合わせはまだありません。" compact />
        </Card>
      )}
    </>
  );
}
