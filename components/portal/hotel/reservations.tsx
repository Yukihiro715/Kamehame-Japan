"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, pct, yen } from "../client";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice, Table } from "../ui";

interface Row { hotelRef: string; createdAt: string; experience: string; experienceDate: string | null; guests: number | null; status: string; statusJa: string; paymentStatus: string; paymentJa: string; baseNet: number | null; rateBp: number | null; commissionNet: number | null; commissionGrossRef: number | null; entryStatus: string | null; entryJa: string; hold: string | null; performedOn: string | null }

const tone = (s: string | null) => (s === "confirmed" || s === "adjusted" ? "ok" : s === "pending" ? "warn" : s === "voided" ? "bad" : "neutral");

export function HotelReservations() {
  const { hotel } = usePortal();
  const [f, setF] = useState({ from: "", to: "", experienceFrom: "", experienceTo: "", status: "", ref: "" });
  const [loaded, setLoaded] = useState<{ key: string; value: { rows: Row[]; total: number } } | null>(null), [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState(f);
  const key = `${hotel?.id ?? ""}|${JSON.stringify(applied)}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    const qs = Object.entries(applied).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api<{ rows: Row[]; total: number }>("GET", `hotel/reservations?hotel=${hotel.id}&limit=200${qs ? `&${qs}` : ""}`).then((value) => { if (live) setLoaded({ key, value }); }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, [hotel, applied, key]);
  const data = loaded?.key === key ? loaded.value : null;
  const load = () => setApplied({ ...f });
  if (err) return <Notice tone="bad">{err}</Notice>;
  return (
    <Card title="紹介予約一覧">
      <div className="pt-form">
        <label className="pt-field"><span className="pt-field-l">予約日（から）</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">予約日（まで）</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">体験日（から）</span><input type="date" value={f.experienceFrom} onChange={(e) => setF({ ...f, experienceFrom: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">体験日（まで）</span><input type="date" value={f.experienceTo} onChange={(e) => setF({ ...f, experienceTo: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">予約状況</span>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">すべて</option><option value="provisional">仮予約</option><option value="arranging">手配中</option><option value="confirmed">予約確定</option><option value="completed">実施済み</option><option value="cancelled">キャンセル</option><option value="no_show">未実施</option></select>
        </label>
        <label className="pt-field"><span className="pt-field-l">照合番号</span><input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="R-XXXXXX" /></label>
        <div className="pt-row"><Button onClick={load}>検索</Button><Button kind="link" onClick={() => { const empty = { from: "", to: "", experienceFrom: "", experienceTo: "", status: "", ref: "" }; setF(empty); setApplied(empty); }}>条件を消す</Button></div>
      </div>
      {!data ? <Loading /> : (
        <>
          <p className="pt-small pt-muted">{data.total} 件 · 税込参考額は目安で、正式な税額は精算書に表示します。お客様の個人情報は表示しません。</p>
          <Table
            head={["照合番号", "予約日", "体験", "体験日", "人数", "予約状況", "決済状況", "対象額（税抜）", "料率", "紹介料（税抜）", "税込参考", "精算状態"]}
            rows={data.rows.map((r) => [
              <code key="r">{r.hotelRef}</code>, jst(r.createdAt, false), r.experience, r.experienceDate ?? "—", r.guests ?? "—",
              <Badge key="s" tone={r.status === "completed" || r.status === "confirmed" ? "ok" : r.status === "cancelled" || r.status === "no_show" ? "bad" : "neutral"}>{r.statusJa}</Badge>,
              <Badge key="p" tone={r.paymentStatus === "paid" ? "ok" : r.paymentStatus === "unpaid" ? "neutral" : "warn"}>{r.paymentJa}</Badge>,
              yen(r.baseNet), pct(r.rateBp), yen(r.commissionNet), yen(r.commissionGrossRef),
              <span key="e"><Badge tone={tone(r.entryStatus)}>{r.entryJa}</Badge>{r.hold && <small className="pt-muted"> {r.hold}</small>}{r.entryStatus === "estimated" && <small className="pt-muted"> 見込・精算対象外</small>}</span>,
            ])}
          />
        </>
      )}
    </Card>
  );
}
