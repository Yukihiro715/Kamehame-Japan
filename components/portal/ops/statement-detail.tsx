"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, ReasonAction, Table } from "../ui";
import { STATEMENT_STATUS_JA, StatementSheet, periodJa, type SheetItem, type SheetParty, type SheetProfile, type SheetStatement } from "../statement-sheet";

interface Dispute { id: string; item_id: string | null; raised_by: string; raised_at: string; reason: string; status: string; resolution: string | null; resolved_at: string | null }
interface Detail { statement: SheetStatement & { profile_id: string; issued_by?: string | null; acknowledged_by: string | null; void_reason: string | null }; profile: SheetProfile | null; entity: SheetParty | null; items: SheetItem[]; disputes: Dispute[]; payout: { id: string; status: string; paid_at: string | null; reference: string | null; pay_date_jst: string } | null }
const DISPUTE_JA: Record<string, string> = { open: "未回答", upheld: "認容（訂正）", rejected: "原案どおり", withdrawn: "取り下げ" };

export function OpsStatementDetail({ id }: { id: string }) {
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState<Record<string, { outcome: string; resolution: string }>>({});
  const load = useCallback(() => api<Detail>("GET", `ops/statements/${id}`).then(setD).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); api<{ experiences: { slug: string; title: string }[] }>("GET", "ops/policies").then((x) => setNames(Object.fromEntries(x.experiences.map((e) => [e.slug, e.title])))).catch(() => {}); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); throw e; } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const s = d.statement, st = STATEMENT_STATUS_JA[s.status] ?? [s.status, "neutral" as const];
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{periodJa(s.period)} · {d.entity?.name ?? "—"} <Badge tone={st[1]}>{st[0]}</Badge></span>} className="no-print" actions={<span className="pt-row"><a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/ops/statements/${id}/csv`}>CSV</a><Button kind="secondary" small onClick={() => window.print()}>印刷 / PDF保存</Button></span>}>
        <dl className="pt-kv">
          <dt>発行</dt><dd>{s.issued_at ? `${jst(s.issued_at)}（${s.issued_by ?? ""}）` : "未発行"} · 異議期限 {s.dispute_deadline_jst ?? "—"}</dd>
          <dt>確認</dt><dd>{s.acknowledged_at ? `${jst(s.acknowledged_at)}（${s.acknowledged_by === "system:deadline" ? "期限経過による自動確認" : s.acknowledged_by}）` : "—"}</dd>
          <dt>支払</dt><dd>{d.payout ? `バッチ ${d.payout.pay_date_jst} · ${d.payout.status}${d.payout.paid_at ? ` · ${d.payout.paid_at}` : ""}${d.payout.reference ? ` · ${d.payout.reference}` : ""}` : "—"}{s.settled_at ? ` · 精算完了 ${jst(s.settled_at, false)}` : ""}</dd>
          {s.void_reason && <><dt>無効の理由</dt><dd>{s.void_reason}</dd></>}
        </dl>
        <div className="pt-row">
          {s.status === "draft" && <Button onClick={() => run(async () => { const r = await api<{ notified: number }>("POST", `ops/statements/${id}/issue`); setMsg(`発行しました。通知メール ${r.notified} 件。`); }, "発行しました。")}>発行する（パートナーに通知）</Button>}
          {!["settled", "void"].includes(s.status) && <ReasonAction label="無効にして訂正版を作る" kind="danger" onConfirm={(reason) => run(() => api("POST", `ops/statements/${id}/void`, { reason }), "無効にしました。台帳を訂正してから、精算画面で同じ四半期を締め直すと訂正版ができます。")} />}
        </div>
        {s.status === "disputed" && <p className="pt-small pt-muted">異議に回答してください。「原案どおり」なら発行済みに戻ります。「認容」なら予約の明細・実施記録・料率を訂正し、この通知書を無効にして締め直してください。</p>}
      </Card>

      {d.disputes.length > 0 && (
        <Card title="異議申立て" className="no-print">
          <Table head={["日時", "申立者", "対象明細", "理由", "状態", "回答", ""]} rows={d.disputes.map((x) => [jst(x.raised_at), x.raised_by, x.item_id ? d.items.find((i) => i.id === x.item_id)?.hotel_ref ?? x.item_id : "通知書全体", x.reason, DISPUTE_JA[x.status] ?? x.status, x.resolution ?? "—",
            x.status === "open" ? <div key="f" className="pt-form"><Field label="結果"><select value={answer[x.id]?.outcome ?? "rejected"} onChange={(e) => setAnswer({ ...answer, [x.id]: { outcome: e.target.value, resolution: answer[x.id]?.resolution ?? "" } })}><option value="rejected">原案どおり</option><option value="upheld">認容（訂正する）</option></select></Field><Field label="回答"><input value={answer[x.id]?.resolution ?? ""} onChange={(e) => setAnswer({ ...answer, [x.id]: { outcome: answer[x.id]?.outcome ?? "rejected", resolution: e.target.value } })} /></Field><div className="pt-row"><Button small disabled={!answer[x.id]?.resolution} onClick={() => run(() => api("POST", `ops/disputes/${x.id}/resolve`, { outcome: answer[x.id]?.outcome ?? "rejected", resolution: answer[x.id]?.resolution }), "回答しました（パートナーに通知）。")}>回答する</Button></div></div> : ""])} compact />
        </Card>
      )}

      <StatementSheet s={s} items={d.items} entity={d.entity} profile={d.profile} experienceNames={names} />
    </>
  );
}
