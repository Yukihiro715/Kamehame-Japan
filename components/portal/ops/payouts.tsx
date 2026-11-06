"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";

interface Batch { id: string; pay_date_jst: string; status: string; created_at: string; payouts: number; total_jpy: number | null; paid: number }
interface Payout { id: string; profile_name: string; entity_name: string; payee_name: string | null; bank_details_masked: string | null; statementIds: string[]; gross_jpy: number; bank_fee_jpy: number; transfer_jpy: number; status: string; paid_at: string | null; reference: string | null; note: string | null }
interface Detail { batch: Batch & { exported_at: string | null; recorded_at: string | null }; payouts: Payout[] }
const BATCH_JA: Record<string, [string, "neutral" | "ok" | "warn" | "info"]> = { prepared: ["作成済み", "info"], exported: ["CSV出力済み", "warn"], recorded: ["結果登録済み", "ok"] };
const PAYOUT_JA: Record<string, [string, "neutral" | "ok" | "warn" | "bad"]> = { pending: ["未処理", "neutral"], paid: ["支払済み", "ok"], failed: ["失敗", "bad"], held: ["保留", "warn"] };

/** Payout batches: collect what is due by a pay date, export the transfer list, record what the bank did. */
export function OpsPayouts() {
  const [rows, setRows] = useState<Batch[] | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [payDate, setPayDate] = useState(""), [open, setOpen] = useState<Detail | null>(null);
  const [rec, setRec] = useState<Record<string, { status: string; reference: string; paidAt: string; note: string }>>({});
  const load = useCallback(() => api<{ batches: Batch[] }>("GET", "ops/payouts").then((x) => setRows(x.batches)).catch((e) => setErr(errorText(e))), []);
  const openBatch = useCallback((id: string) => api<Detail>("GET", `ops/payouts/${id}`).then(setOpen).catch((e) => setErr(errorText(e))), []);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string, reopen?: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); if (reopen) await openBatch(reopen); } catch (e) { setErr(errorText(e)); } };
  if (!rows) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">支払日を指定して「支払バッチを作る」と、その日までに支払予定で振込額のある通知書（発行済み・確認済み）が精算先ごとにまとまります。CSV を銀行の振込ツールに取り込み、結果（支払済み・失敗・保留）をここに登録してください。支払済みにすると通知書は「支払済み」になり、パートナーに完了メールが届きます。銀行への自動送金は行いません。</p>
      <Card title="支払バッチを作る">
        <div className="pt-form">
          <Field label="支払日"><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field>
          <div className="pt-row"><Button disabled={!payDate} onClick={() => run(async () => { const r = await api<{ id: string; payouts: number; totalJpy: number }>("POST", "ops/payouts", { payDate }); setMsg(`バッチを作りました: ${r.payouts} 件、合計 ${yen(r.totalJpy)}`); await openBatch(r.id); }, "作成しました。")}>支払バッチを作る</Button></div>
        </div>
      </Card>
      <Card title="支払バッチ">
        <Table head={["支払日", "状態", "件数", "支払済み", "合計振込額", "作成", ""]} rows={rows.map((b) => { const st = BATCH_JA[b.status] ?? [b.status, "neutral" as const]; return [b.pay_date_jst, <Badge key="s" tone={st[1]}>{st[0]}</Badge>, b.payouts, b.paid, yen(b.total_jpy ?? 0), jst(b.created_at), <Button key="o" kind="secondary" small onClick={() => openBatch(b.id)}>開く</Button>]; })} empty="バッチはまだありません。" compact />
      </Card>
      {open && (
        <Card title={`バッチ ${open.batch.pay_date_jst}`} actions={<a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/ops/payouts/${open.batch.id}/csv`}>振込リスト CSV</a>}>
          <p className="pt-small pt-muted">作成 {jst(open.batch.created_at)}{open.batch.exported_at ? ` · CSV出力 ${jst(open.batch.exported_at)}` : ""}{open.batch.recorded_at ? ` · 結果登録 ${jst(open.batch.recorded_at)}` : ""}</p>
          <Table head={["契約先", "精算設定", "振込先名義", "口座", "通知書", "支払対象額", "手数料", "振込額", "状態", "結果の登録"]} rows={open.payouts.map((p) => {
            const st = PAYOUT_JA[p.status] ?? [p.status, "neutral" as const]; const r = rec[p.id] ?? { status: "paid", reference: "", paidAt: open.batch.pay_date_jst, note: "" };
            return [p.entity_name, p.profile_name, p.payee_name ?? "—", p.bank_details_masked ?? "未登録", p.statementIds.length, yen(p.gross_jpy), yen(p.bank_fee_jpy), yen(p.transfer_jpy), <span key="s"><Badge tone={st[1]}>{st[0]}</Badge>{p.paid_at ? ` ${p.paid_at}` : ""}{p.reference ? ` ${p.reference}` : ""}</span>,
              p.status === "paid" ? "" : <div key="f" className="pt-row"><select value={r.status} onChange={(e) => setRec({ ...rec, [p.id]: { ...r, status: e.target.value } })}><option value="paid">支払済み</option><option value="failed">失敗（次回へ）</option><option value="held">保留</option></select><input type="date" value={r.paidAt} onChange={(e) => setRec({ ...rec, [p.id]: { ...r, paidAt: e.target.value } })} /><input placeholder="参照番号" value={r.reference} onChange={(e) => setRec({ ...rec, [p.id]: { ...r, reference: e.target.value } })} /><Button small onClick={() => run(() => api("POST", `ops/payout-items/${p.id}/record`, r), "登録しました。", open.batch.id)}>登録</Button></div>];
          })} compact />
        </Card>
      )}
    </>
  );
}
