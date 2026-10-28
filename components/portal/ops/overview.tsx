"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Card, Loading, Notice, Stat, Table } from "../ui";

interface Row { id: string; hotel_ref: string; experience: string; experience_date: string | null; status: string; statusJa: string; paymentJa: string; hotel_name: string | null; entryJa: string; holdJa: string | null; commission_net_jpy: number | null; created_at: string }
interface Data { activeHotels: number; entries: Record<string, { count: number; net: number }>; exceptions: Record<string, number>; recent: Row[] }

export const EXCEPTION_LABEL: Record<string, string> = { rateMissing: "料率未設定", payeeMissing: "精算先未設定", amountPending: "対象金額未確定", awaitingAttendance: "実施確認待ち", refundAllocation: "返金配賦未確定", disputes: "紛争中", unmatched: "連携の未突合・異常" };

export function OpsOverview() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { api<Data>("GET", "ops/overview").then(setData).catch((e) => setErr(errorText(e))); }, []);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  const e = (k: string) => data.entries[k] ?? { count: 0, net: 0 };
  return (
    <>
      <Card title="紹介料台帳の状態">
        <div className="pt-grid">
          <Stat label="提携中のホテル" value={data.activeHotels} />
          <Stat label="見込（未実施）" value={e("estimated").count} note={yen(e("estimated").net)} tone="muted" />
          <Stat label="確認待ち" value={e("pending").count} note={yen(e("pending").net)} tone="warn" />
          <Stat label="確定（未精算含む）" value={e("confirmed").count + e("adjusted").count} note={yen(e("confirmed").net + e("adjusted").net)} tone="accent" />
          <Stat label="取消" value={e("voided").count} />
        </div>
      </Card>
      <Card title="例外（対応が必要なもの）" actions={<Link className="pt-btn pt-btn-secondary pt-btn-small" href="/ops/exceptions/">一覧へ</Link>}>
        <div className="pt-grid">
          {Object.entries(EXCEPTION_LABEL).map(([k, label]) => <Stat key={k} label={label} value={data.exceptions[k] ?? 0} tone={(data.exceptions[k] ?? 0) > 0 ? "warn" : undefined} />)}
        </div>
      </Card>
      <Card title="最近の予約" actions={<Link className="pt-btn pt-btn-secondary pt-btn-small" href="/ops/reservations/">すべて</Link>}>
        <Table head={["照合番号", "予約日", "体験", "体験日", "ホテル", "予約", "決済", "紹介料", "状態"]} rows={data.recent.map((r) => [<a key="a" href={`/ops/reservations/${r.id}/`}>{r.hotel_ref}</a>, jst(r.created_at, false), r.experience, r.experience_date ?? "—", r.hotel_name ?? <span className="pt-muted">紹介なし</span>, r.statusJa, r.paymentJa, yen(r.commission_net_jpy), <span key="e">{r.entryJa}{r.holdJa && <Badge tone="warn">{r.holdJa}</Badge>}</span>])} />
      </Card>
    </>
  );
}
