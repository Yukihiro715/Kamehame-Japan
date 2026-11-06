"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { label, t } from "../i18n";
import { Button, Card, Field, Loading, Notice, ReasonAction } from "../ui";
import { CaseFacts, CaseLedger, CaseMessages, QuoteCard, StatusBadge, caseTitle, type CaseDetail } from "../case-common";

export function HotelCaseDetail({ id }: { id: string }) {
  const K = t().cases, C = t().common;
  const [d, setD] = useState<CaseDetail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState(false), [f, setF] = useState({ customerName: "", customerEmail: "", customerPhone: "", customerCountry: "", requirements: "", preferredDate: "", guests: "" });
  const load = useCallback(() => api<CaseDetail>("GET", `hotel/cases/${id}`).then((x) => { setD(x); setF({ customerName: x.case.customer_name, customerEmail: x.case.customer_email ?? "", customerPhone: x.case.customer_phone ?? "", customerCountry: x.case.customer_country ?? "", requirements: x.case.requirements ?? "", preferredDate: x.case.preferred_date ?? "", guests: x.case.guests ? String(x.case.guests) : "" }); }).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const c = d.case;
  const open = !["paid", "confirmed", "performed", "cancelled", "unavailable"].includes(c.displayStatus);
  const current = d.quotes.find((q) => ["shared", "paid"].includes(q.status));
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{c.public_ref} · {caseTitle(c)} <StatusBadge status={c.displayStatus} /></span>} actions={<Link className="pt-btn pt-btn-link pt-btn-small" href="/hotel/cases/">{C.back}</Link>}>
        <p className="pt-note-box">{label(K.next, c.displayStatus, "")}</p>
        {current?.shareUrl && open && <p className="pt-small">{K.customerUrl}: <a href={current.shareUrl} target="_blank" rel="noreferrer">{current.shareUrl}</a></p>}
        {!edit ? <CaseFacts c={c} /> : (
          <div className="pt-form">
            <Field label={K.customerName}><input value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>
            <Field label={K.email}><input type="email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} /></Field>
            <Field label={K.phone}><input value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} /></Field>
            <Field label={K.country}><input value={f.customerCountry} onChange={(e) => setF({ ...f, customerCountry: e.target.value })} /></Field>
            <Field label={K.date}><input type="date" value={f.preferredDate} onChange={(e) => setF({ ...f, preferredDate: e.target.value })} /></Field>
            <Field label={K.guests}><input type="number" min={1} max={99} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></Field>
            <div className="pt-form-full"><Field label={K.requirements}><textarea value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></Field></div>
            <div className="pt-row pt-form-full"><Button onClick={() => run(async () => { await api("POST", `hotel/cases/${id}/update`, { ...f, guests: f.guests ? Number(f.guests) : null }); setEdit(false); }, K.saved)}>{C.save}</Button><Button kind="link" onClick={() => setEdit(false)}>{C.cancel}</Button></div>
          </div>
        )}
        <p className="pt-small pt-muted">{K.meta(jst(c.created_at), jst(c.updated_at), c.createdBy ?? "—")}</p>
        {open && !edit && <div className="pt-row"><Button kind="secondary" small onClick={() => setEdit(true)}>{K.edit}</Button><ReasonAction label={K.withdraw} kind="danger" confirmLabel={K.withdrawConfirm} placeholder={K.withdrawPh} onConfirm={(reason) => run(() => api("POST", `hotel/cases/${id}/cancel`, { reason }), K.withdrawn)} /></div>}
      </Card>
      <Card title={K.quotes}>
        {d.quotes.length === 0 ? <p className="pt-small pt-muted">{K.noQuotes}</p> : d.quotes.map((q) => <QuoteCard key={q.id} q={q} kind="hotel" />)}
      </Card>
      <Card title={K.ledger}><CaseLedger d={d} kind="hotel" /></Card>
      <Card title={K.messagesH}><CaseMessages kind="hotel" caseId={id} messages={d.messages} onPosted={load} /></Card>
    </>
  );
}
