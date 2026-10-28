"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Button, Card, Loading, Notice, Table } from "../ui";

interface Row { id: string; hotel_ref: string; external_ref: string | null; flow: string; experience: string; experience_date: string | null; guests: number | null; status: string; statusJa: string; paymentJa: string; amount_status: string; created_at: string; hotel_name: string | null; referral_status: string | null; entryJa: string; holdJa: string | null; commission_net_jpy: number | null }
interface Hotel { id: string; name: string }

export function OpsReservations() {
  const [f, setF] = useState({ from: "", to: "", hotel: "", status: "", q: "" });
  const [loaded, setLoaded] = useState<{ key: string; rows: Row[] } | null>(null), [hotels, setHotels] = useState<Hotel[]>([]), [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState(f);
  const key = JSON.stringify(applied);
  useEffect(() => {
    let live = true;
    const qs = Object.entries(applied).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api<{ rows: Row[] }>("GET", `ops/reservations?limit=200${qs ? `&${qs}` : ""}`).then((d) => { if (live) setLoaded({ key, rows: d.rows }); }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, [applied, key]);
  useEffect(() => { api<{ hotels: Hotel[] }>("GET", "ops/partners").then((d) => setHotels(d.hotels)).catch(() => {}); }, []);
  const rows = loaded?.key === key ? loaded.rows : null;
  const load = () => setApplied({ ...f });
  if (err) return <Notice tone="bad">{err}</Notice>;
  return (
    <Card title="予約一覧" actions={<Link className="pt-btn pt-btn-secondary pt-btn-small" href="/ops/export/">CSV出力</Link>}>
      <div className="pt-form">
        <label className="pt-field"><span className="pt-field-l">予約日（から）</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">予約日（まで）</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">ホテル</span><select value={f.hotel} onChange={(e) => setF({ ...f, hotel: e.target.value })}><option value="">すべて</option>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
        <label className="pt-field"><span className="pt-field-l">予約状況</span><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">すべて</option><option value="provisional">仮予約</option><option value="arranging">手配中</option><option value="confirmed">予約確定</option><option value="completed">実施済み</option><option value="cancelled">キャンセル</option><option value="no_show">未実施</option></select></label>
        <label className="pt-field"><span className="pt-field-l">照合番号 / 外部参照 / 申込ID</span><input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></label>
        <div className="pt-row"><Button onClick={load}>検索</Button></div>
      </div>
      {!rows ? <Loading /> : (
        <Table head={["照合番号", "予約日", "経路", "体験", "体験日", "人数", "ホテル", "予約", "決済", "金額", "紹介料", "状態"]} rows={rows.map((r) => [
          <a key="a" href={`/ops/reservations/${r.id}/`}>{r.hotel_ref}</a>, jst(r.created_at, false), r.flow, r.experience, r.experience_date ?? "—", r.guests ?? "—",
          r.hotel_name ? <span key="h">{r.hotel_name}{r.referral_status && r.referral_status !== "attributed" && <Badge tone="warn">{r.referral_status}</Badge>}</span> : <span key="h" className="pt-muted">紹介なし</span>,
          r.statusJa, r.paymentJa, r.amount_status === "pending" ? <Badge key="m" tone="warn">未確定</Badge> : "確定", yen(r.commission_net_jpy),
          <span key="e">{r.entryJa}{r.holdJa && <> <Badge tone="warn">{r.holdJa}</Badge></>}</span>,
        ])} />
      )}
    </Card>
  );
}
