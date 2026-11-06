"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";
import { STATEMENT_STATUS_JA, StatementSheet, periodJa, type SheetItem, type SheetParty, type SheetProfile, type SheetStatement } from "../statement-sheet";

interface Dispute { id: string; item_id: string | null; raised_at: string; reason: string; status: string; resolution: string | null; resolved_at: string | null }
interface Detail { statement: SheetStatement & { acknowledged_by: string | null }; profile: SheetProfile | null; entity: SheetParty | null; items: SheetItem[]; disputes: Dispute[]; billing: boolean }
const DISPUTE_JA: Record<string, string> = { open: "回答待ち", upheld: "訂正されます", rejected: "原案どおり", withdrawn: "取り下げ" };

/** The partner's view of one payment notice: read, print, acknowledge or dispute (billing users). */
export function HotelStatementDetail({ id }: { id: string }) {
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reason, setReason] = useState(""), [itemId, setItemId] = useState("");
  const load = useCallback(() => api<Detail>("GET", `hotel/statements/${id}`).then(setD).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); api<{ experiences: { slug: string; title: string }[] }>("GET", "hotel/experiences").then((x) => setNames(Object.fromEntries(x.experiences.map((e) => [e.slug, e.title])))).catch(() => {}); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const s = d.statement, st = STATEMENT_STATUS_JA[s.status] ?? [s.status, "neutral" as const];
  const canAct = d.billing && (s.status === "issued" || s.status === "acknowledged") && (!s.dispute_deadline_jst || new Date().toISOString().slice(0, 10) <= s.dispute_deadline_jst);
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{periodJa(s.period)} <Badge tone={st[1]}>{st[0]}</Badge></span>} className="no-print" actions={<span className="pt-row"><a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/statements/${id}/csv`}>明細 CSV</a><Button kind="secondary" small onClick={() => window.print()}>印刷 / PDF保存</Button><Link className="pt-btn pt-btn-link pt-btn-small" href="/hotel/settlement/">一覧へ</Link></span>}>
        <p className="pt-small pt-muted">発行 {jst(s.issued_at, false)}{s.dispute_deadline_jst ? ` · 異議申立て期限 ${s.dispute_deadline_jst}` : ""}{s.acknowledged_at ? ` · 確認 ${jst(s.acknowledged_at, false)}` : ""}{s.settled_at ? ` · お支払い完了 ${jst(s.settled_at, false)}` : ""}</p>
        {s.status === "issued" && d.billing && <div className="pt-row"><Button onClick={() => run(() => api("POST", `hotel/statements/${id}/acknowledge`), "確認しました。記載の予定日にお振込みします。")}>内容を確認しました</Button></div>}
        {canAct && (
          <div className="pt-form" style={{ marginTop: 12 }}>
            <Field label="異議の対象"><select value={itemId} onChange={(e) => setItemId(e.target.value)}><option value="">通知書全体</option>{d.items.map((i) => <option key={i.id} value={i.id}>{i.performed_on_jst} · {i.hotel_ref ?? ""} · {(i.experience_slug && names[i.experience_slug]) || i.experience_slug}</option>)}</select></Field>
            <Field label="理由"><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="相違点をお書きください" /></Field>
            <div className="pt-row"><Button kind="secondary" disabled={!reason.trim()} onClick={() => run(() => api("POST", `hotel/statements/${id}/dispute`, { reason, itemId: itemId || undefined }), "異議を受け付けました。KAMEHAME JAPAN から回答します。")}>異議を申し立てる</Button></div>
          </div>
        )}
        {!d.billing && <p className="pt-small pt-muted">確認・異議申立ては請求担当者の権限が必要です。</p>}
        {d.disputes.length > 0 && <Table head={["日時", "対象", "理由", "状態", "回答"]} rows={d.disputes.map((x) => [jst(x.raised_at), x.item_id ? d.items.find((i) => i.id === x.item_id)?.hotel_ref ?? "明細" : "通知書全体", x.reason, DISPUTE_JA[x.status] ?? x.status, x.resolution ?? "—"])} compact />}
      </Card>
      <StatementSheet s={s} items={d.items} entity={d.entity} profile={d.profile} experienceNames={names} />
    </>
  );
}
