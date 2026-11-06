"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Button, Card, Field, Loading, Notice, Stat, Table } from "../ui";
import { StatusBadge } from "../case-common";

interface Row { id: string; publicRef: string; partnerRef: string | null; siteName: string; experienceTitle: string; preferredDate: string | null; guests: number | null; customerName: string; status: string; statusJa: string; assignee: string | null; assignedOps: string | null; updatedAt: string; quoteVersion: number | null; totalJpy: number | null }
interface Data { rows: Row[]; total: number; counts: Record<string, number> }

export function OpsCases() {
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState(""), [q, setQ] = useState(""), [all, setAll] = useState(false);
  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>([]);
  const load = useCallback(() => api<Data>("GET", `ops/cases?${status ? `status=${status}` : all ? "" : "open=1"}&q=${encodeURIComponent(q)}`).then(setD).catch((e) => setErr(errorText(e))), [status, q, all]);
  useEffect(() => { void load(); api<{ statuses: { value: string; label: string }[] }>("GET", "ops/case-options").then((o) => setStatuses(o.statuses)).catch(() => {}); }, [load]);
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const n = (k: string) => d.counts[k] ?? 0;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      <div className="pt-grid">
        <Stat label="受付済み（未着手）" value={n("received")} tone={n("received") ? "warn" : undefined} />
        <Stat label="確認・提案中" value={n("checking") + n("proposed") + n("awaiting_customer") + n("awaiting_payment")} />
        <Stat label="決済済み・確定待ち" value={n("paid")} tone={n("paid") ? "accent" : undefined} />
        <Stat label="予約確定" value={n("confirmed")} />
      </div>
      <Card title="取り次ぎ案件">
        <div className="pt-form">
          <Field label="状態"><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{all ? "すべて" : "進行中"}</option>{[...statuses, { value: "paid", label: "決済済み・予約確定待ち" }, { value: "confirmed", label: "予約確定" }, { value: "performed", label: "実施済み" }].map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
          <Field label="検索（案件番号・お客様名・管理番号）"><input value={q} onChange={(e) => setQ(e.target.value)} /></Field>
          <div className="pt-row"><Button kind="secondary" small onClick={() => setAll((v) => !v)}>{all ? "進行中のみ" : "終了分も表示"}</Button></div>
        </div>
        <Table head={["案件", "状態", "拠点", "体験", "希望日", "人数", "お客様", "見積もり", "担当（運営）", "更新", ""]} rows={d.rows.map((r) => [
          <span key="r">{r.publicRef}{r.partnerRef ? <span className="pt-muted"> / {r.partnerRef}</span> : null}</span>, <StatusBadge key="s" status={r.status} label={r.statusJa} />, r.siteName, r.experienceTitle, r.preferredDate ?? "未定", r.guests ?? "—", r.customerName,
          r.quoteVersion ? `第${r.quoteVersion}版 ${yen(r.totalJpy)}` : "—", r.assignedOps ?? "—", jst(r.updatedAt), <a key="a" href={`/ops/cases/${r.id}/`}>詳細</a>,
        ])} compact />
        <p className="pt-small pt-muted">{d.total} 件</p>
      </Card>
    </>
  );
}
