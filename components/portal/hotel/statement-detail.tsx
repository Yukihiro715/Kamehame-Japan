"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { label, portalLang, t } from "../i18n";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";
import { StatementSheet, periodLabel, statementStatus, type SheetItem, type SheetParty, type SheetProfile, type SheetStatement } from "../statement-sheet";

interface Dispute { id: string; item_id: string | null; raised_at: string; reason: string; status: string; resolution: string | null; resolved_at: string | null }
interface Detail { statement: SheetStatement & { acknowledged_by: string | null }; profile: SheetProfile | null; entity: SheetParty | null; items: SheetItem[]; disputes: Dispute[]; billing: boolean }

/** The partner's view of one payment notice: read, print, acknowledge or dispute (billing users). */
export function HotelStatementDetail({ id }: { id: string }) {
  const M = t().statement, S = t().status, C = t().common;
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reason, setReason] = useState(""), [itemId, setItemId] = useState("");
  const load = useCallback(() => api<Detail>("GET", `hotel/statements/${id}`).then(setD).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); api<{ experiences: { slug: string; title: string; titleEn: string }[] }>("GET", "hotel/experiences").then((x) => setNames(Object.fromEntries(x.experiences.map((e) => [e.slug, portalLang() === "en" ? e.titleEn : e.title])))).catch(() => {}); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const s = d.statement, st = statementStatus(s.status);
  const canAct = d.billing && (s.status === "issued" || s.status === "acknowledged") && (!s.dispute_deadline_jst || new Date().toISOString().slice(0, 10) <= s.dispute_deadline_jst);
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{periodLabel(s.period)} <Badge tone={st[1]}>{st[0]}</Badge></span>} className="no-print" actions={<span className="pt-row"><a className="pt-btn pt-btn-secondary pt-btn-small" href={`/api/portal/hotel/statements/${id}/csv`}>{M.csv}</a><Button kind="secondary" small onClick={() => window.print()}>{M.print}</Button><Link className="pt-btn pt-btn-link pt-btn-small" href="/hotel/settlement/">{C.back}</Link></span>}>
        <p className="pt-small pt-muted">{M.issued} {jst(s.issued_at, false)}{s.dispute_deadline_jst ? ` · ${M.deadline} ${s.dispute_deadline_jst}` : ""}{s.acknowledged_at ? ` · ${M.acknowledged} ${jst(s.acknowledged_at, false)}` : ""}{s.settled_at ? ` · ${M.settled} ${jst(s.settled_at, false)}` : ""}</p>
        {s.status === "issued" && d.billing && <div className="pt-row"><Button onClick={() => run(() => api("POST", `hotel/statements/${id}/acknowledge`), M.ackDone)}>{M.ack}</Button></div>}
        {canAct && (
          <div className="pt-form" style={{ marginTop: 12 }}>
            <Field label={M.disputeTarget}><select value={itemId} onChange={(e) => setItemId(e.target.value)}><option value="">{M.whole}</option>{d.items.map((i) => <option key={i.id} value={i.id}>{i.performed_on_jst} · {i.hotel_ref ?? ""} · {(i.experience_slug && names[i.experience_slug]) || i.experience_slug}</option>)}</select></Field>
            <Field label={M.reason}><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={M.reasonPh} /></Field>
            <div className="pt-row"><Button kind="secondary" disabled={!reason.trim()} onClick={() => run(() => api("POST", `hotel/statements/${id}/dispute`, { reason, itemId: itemId || undefined }), M.disputeDone)}>{M.dispute}</Button></div>
          </div>
        )}
        {!d.billing && <p className="pt-small pt-muted">{M.billingOnly}</p>}
        {d.disputes.length > 0 && <Table head={M.disputesHead} rows={d.disputes.map((x) => [jst(x.raised_at), x.item_id ? d.items.find((i) => i.id === x.item_id)?.hotel_ref ?? M.item : M.whole, x.reason, label(S.dispute, x.status), x.resolution ?? "—"])} compact />}
      </Card>
      <StatementSheet s={s} items={d.items} entity={d.entity} profile={d.profile} experienceNames={names} />
    </>
  );
}
