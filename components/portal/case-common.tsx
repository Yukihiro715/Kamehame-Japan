"use client";

/** Pieces both portals use for a booking-relay case (lib/portal/cases.ts):
 *  status badges, the facts block, the quote card and the message thread. */
import { useRef, useState, type ReactNode } from "react";
import { api, errorText, jst, pct, yen } from "./client";
import { label, portalLang, t } from "./i18n";
import { Badge, Button, Field, Notice } from "./ui";

export type Kind = "hotel" | "ops";
export interface ExtraField { key: string; label: string; type: "text" | "select" | "bool"; options?: { value: string; label: string }[] }
export interface QuoteLine { kind: "base" | "addon" | "arrangement" | "onsite"; description: string; quantity: number; unitJpy: number; grossJpy: number; taxRateBp: number; commissionable: boolean }
export interface QuoteView { id: string; version: number; status: string; statusJa: string; title: string; lines: QuoteLine[]; totalJpy: number; onsiteJpy: number; includes: string | null; excludes: string | null; onsiteNote: string | null; cancelTerms: string | null; confirmationNote: string | null; validUntil: string | null; paymentMode: string; paymentModeJa: string; shareUrl: string | null; createdBy: string; createdAt: string; sharedAt: string | null; paidAt: string | null; stripeSessionId: string | null; commission: { baseNetJpy: number; rateBp: number | null; estimateNetJpy: number | null; policyMissing: boolean } }
export interface MessageRow { id: string; visibility: "internal" | "partner" | "customer"; visibilityJa: string; author_kind: "ops" | "partner" | "system"; author_email: string | null; body: string; attachment_key: string | null; attachment_name: string | null; attachment_type: string | null; attachment_size: number | null; created_at: string }
export interface CaseView {
  id: string; public_ref: string; partner_ref: string | null; site_id: string; siteName: string; sitePublicId: string; entityName: string; createdBy: string | null; assignee: string | null; assignee_user_id: string | null;
  kind: "experience" | "free"; experience_slug: string | null; experienceTitle: string; experienceTitleEn: string; preferred_date: string | null; altDates: string[]; time_pref: string | null; guests: number | null; lang: string | null; requirements: string | null;
  customer_name: string; customer_email: string | null; customer_phone: string | null; customer_country: string | null; extra: Record<string, string>; extraFields: ExtraField[];
  status: string; statusJa: string; displayStatus: string; displayStatusJa: string; status_reason: string | null; reservation_id: string | null; assigned_ops: string | null; created_at: string; updated_at: string;
}
export interface CaseDetail { case: CaseView; quotes: QuoteView[]; messages: MessageRow[]; reservation: { id: string; hotel_ref: string | null; status: string; statusJa: string; payment_status: string; paymentJa: string; amount_status: string } | null; entry: { base_net_jpy: number; rate_bp: number | null; commission_net_jpy: number; status: string; statusJa: string; hold_reason: string | null; holdJa: string } | null; members: { userId: string; email: string; name: string | null; role: string }[] }

export const STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { received: "info", checking: "info", proposed: "warn", awaiting_customer: "warn", awaiting_payment: "warn", paid: "ok", confirmed: "ok", performed: "ok", cancelled: "bad", unavailable: "bad" };
export const QUOTE_TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { draft: "neutral", shared: "warn", paid: "ok", superseded: "neutral", expired: "bad", void: "bad" };
export const LINE_KIND_JA: Record<string, string> = { base: "基本料金", addon: "オプション", arrangement: "手配料", onsite: "現地払い" };
export const LANG_JA: Record<string, string> = { en: "英語", ja: "日本語", es: "スペイン語", fr: "フランス語", "zh-tw": "繁体字中国語" };
export const StatusBadge = ({ status }: { status: string; label?: string }) => <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label(t().status.kase, status)}</Badge>;
/** The experience title in the portal's language. */
export const caseTitle = (c: Pick<CaseView, "experienceTitle" | "experienceTitleEn" | "kind">) => (portalLang() === "en" ? (c.kind === "free" ? "Open request" : c.experienceTitleEn) : c.experienceTitle);
/** Product-specific field labels are stored in Japanese; English partners get the fixed list. */
const EXTRA_EN: Record<string, string> = { area: "Preferred area / course", transfer: "Transfer needed", pickup: "Departure point (hotel name etc.)", rental_clubs: "Rental clubs", rental_shoes: "Rental shoes", handed_sizes: "Handedness, club preferences, shoe sizes", caddie: "Caddie", budget: "Budget (per person or total)", join_others: "Playing with other guests" };
const OPTION_EN: Record<string, string> = { needed: "Needed", not_needed: "Not needed", undecided: "Undecided", none: "None", some: "Some", all: "All", ok: "Fine", no: "No (private group)" };
export const extraLabel = (f: ExtraField) => (portalLang() === "en" ? EXTRA_EN[f.key] ?? f.label : f.label);
export const optionLabel = (o: { value: string; label: string }) => (portalLang() === "en" ? OPTION_EN[o.value] ?? o.label : o.label);

/** What the partner wrote about the customer and the request. */
export function CaseFacts({ c, showCustomer = true }: { c: CaseView; showCustomer?: boolean }) {
  const F = t().cases.facts, S = t().status, C = t().common;
  const extra = c.extraFields.filter((f) => c.extra[f.key]).map((f) => { const o = f.options?.find((x) => x.value === c.extra[f.key]); return [extraLabel(f), f.type === "select" && o ? optionLabel(o) : c.extra[f.key]] as const; });
  return (
    <dl className="pt-kv">
      <dt>{F.experience}</dt><dd>{caseTitle(c)}{c.kind === "free" && <span className="pt-muted">{F.free}</span>}</dd>
      <dt>{F.date}</dt><dd>{c.preferred_date ?? C.undecided}{c.altDates.length ? <span className="pt-muted">{F.alt(c.altDates.join(", "))}</span> : null}{c.time_pref ? ` · ${c.time_pref}` : ""}</dd>
      <dt>{F.guests}</dt><dd>{c.guests ?? C.undecided}</dd>
      <dt>{F.lang}</dt><dd>{label(S.lang, c.lang)}</dd>
      {showCustomer && <><dt>{F.customer}</dt><dd>{c.customer_name}{c.customer_country ? ` (${c.customer_country})` : ""}<br /><span className="pt-small">{c.customer_email ?? F.noEmail}{c.customer_phone ? ` · ${c.customer_phone}` : ""}</span></dd></>}
      {c.requirements && <><dt>{F.requirements}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{c.requirements}</dd></>}
      {extra.map(([k, v]) => <ExtraRow key={k} k={k} v={v} />)}
      <dt>{F.assignee}</dt><dd>{c.assignee ?? "—"}{c.partner_ref ? ` · ${F.ref} ${c.partner_ref}` : ""}</dd>
    </dl>
  );
}
const ExtraRow = ({ k, v }: { k: string; v: string }) => <><dt>{k}</dt><dd>{v}</dd></>;

/** One quote version. Partners see the commission preview; customers never see this card. */
export function QuoteCard({ q, kind, actions }: { q: QuoteView; kind: Kind; actions?: ReactNode }) {
  void kind;
  const Q = t().cases.quote, S = t().status, C = t().common;
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!q.shareUrl) return; try { await navigator.clipboard.writeText(q.shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt(C.copy, q.shareUrl); } };
  return (
    <div className="pt-quote">
      <div className="pt-row" style={{ justifyContent: "space-between" }}>
        <b>{Q.version(q.version)} · {q.title} <Badge tone={QUOTE_TONE[q.status] ?? "neutral"}>{label(S.quote, q.status)}</Badge></b>
        <span className="pt-small pt-muted">{Q.created} {jst(q.createdAt)}{q.sharedAt ? ` · ${Q.shared} ${jst(q.sharedAt)}` : ""}{q.paidAt ? ` · ${Q.paid} ${jst(q.paidAt)}` : ""}</span>
      </div>
      <table className="pt-table pt-table-compact">
        <thead><tr>{Q.head.map((h, i) => <th key={h} className={i >= 2 && i <= 4 ? "num" : undefined}>{h}</th>)}</tr></thead>
        <tbody>
          {q.lines.map((l, i) => <tr key={i}><td>{label(S.lineKind, l.kind)}</td><td style={{ whiteSpace: "normal" }}>{l.description}</td><td className="num">{yen(l.unitJpy)}</td><td className="num">{l.quantity}</td><td className="num">{l.kind === "onsite" ? <span className="pt-muted">{yen(l.grossJpy)}{Q.onsite}</span> : yen(l.grossJpy)}</td><td>{l.commissionable ? C.yes : "—"}</td></tr>)}
          <tr><td colSpan={4}><b>{Q.total}</b></td><td className="num"><b>{yen(q.totalJpy)}</b></td><td /></tr>
          {q.onsiteJpy > 0 && <tr><td colSpan={4} className="pt-muted">{Q.onsiteTotal}</td><td className="num pt-muted">{yen(q.onsiteJpy)}</td><td /></tr>}
        </tbody>
      </table>
      <dl className="pt-kv">
        <dt>{Q.payment}</dt><dd>{label(S.paymentMode, q.paymentMode)}</dd>
        <dt>{Q.validUntil}</dt><dd>{q.validUntil ?? "—"}</dd>
        {q.includes && <><dt>{Q.includes}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.includes}</dd></>}
        {q.excludes && <><dt>{Q.excludes}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.excludes}</dd></>}
        {q.onsiteNote && <><dt>{Q.onsiteNote}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.onsiteNote}</dd></>}
        {q.cancelTerms && <><dt>{Q.cancel}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.cancelTerms}</dd></>}
        {q.confirmationNote && <><dt>{Q.confirmation}</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.confirmationNote}</dd></>}
        <dt>{Q.commissionL}</dt><dd>{q.commission.policyMissing ? <span className="pt-muted">{Q.noPolicy}</span> : Q.commissionV(yen(q.commission.baseNetJpy), pct(q.commission.rateBp), yen(q.commission.estimateNetJpy))}</dd>
      </dl>
      {q.shareUrl && (
        <div className="pt-row">
          <span className="pt-small">{t().cases.customerUrl}: <a href={q.shareUrl} target="_blank" rel="noreferrer">{q.shareUrl}</a></span>
          <Button kind="secondary" small onClick={() => void copy()}>{copied ? C.copied : C.copy}</Button>
        </div>
      )}
      {actions && <div className="pt-row">{actions}</div>}
    </div>
  );
}

/** Raw-body upload to the case: the server names the key; the message that references it is posted separately. */
export async function uploadCaseFile(kind: Kind, caseId: string, file: File): Promise<{ key: string; name: string; type: string; size: number }> {
  const res = await fetch(`/api/portal/${kind}/cases/${caseId}/upload?name=${encodeURIComponent(file.name)}`, { method: "POST", credentials: "same-origin", headers: { "x-kh-portal": "1", "content-type": file.type || "application/octet-stream" }, body: file });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; file?: { key: string; name: string; type: string; size: number }; error?: string; message?: string };
  const E = t().errors as Record<string, string>;
  if (!res.ok || !data.file) throw new Error((data.error && E[data.error]) ?? data.message ?? t().cases.thread.uploadFail);
  return data.file;
}

/** The thread: every message the viewer may see, and a composer. Operations choose the visibility; partners write to operations (and the customer when asked). */
export function CaseMessages({ kind, caseId, messages, onPosted }: { kind: Kind; caseId: string; messages: MessageRow[]; onPosted: () => Promise<void> | void }) {
  const [body, setBody] = useState(""), [visibility, setVisibility] = useState<MessageRow["visibility"]>("partner"), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [hasFile, setHasFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const post = async () => {
    setBusy(true); setErr(null);
    try {
      const f = fileRef.current?.files?.[0];
      const attachment = f ? await uploadCaseFile(kind, caseId, f) : null;
      await api("POST", `${kind}/cases/${caseId}/message`, { body, visibility, attachment });
      setBody(""); setHasFile(false); if (fileRef.current) fileRef.current.value = "";
      await onPosted();
    } catch (e) { setErr(errorText(e)); } finally { setBusy(false); }
  };
  const M = t().cases.thread, S = t().status, C = t().common;
  return (
    <div className="pt-thread">
      {messages.length === 0 && <p className="pt-small pt-muted">{M.none}</p>}
      {messages.map((m) => (
        <div key={m.id} className={`pt-msg pt-msg-${m.author_kind}${m.visibility === "internal" ? " pt-msg-internal" : ""}`}>
          <div className="pt-small pt-muted">{m.author_kind === "ops" ? M.ops : m.author_kind === "partner" ? M.partner : M.system}{m.author_email ? ` (${m.author_email})` : ""} · {jst(m.created_at)} · <Badge tone={m.visibility === "internal" ? "bad" : m.visibility === "customer" ? "info" : "neutral"}>{label(S.visibility, m.visibility)}</Badge></div>
          {m.body && <p style={{ whiteSpace: "pre-wrap", margin: "4px 0" }}>{m.body}</p>}
          {m.attachment_key && <p className="pt-small" style={{ margin: 0 }}>📎 <a href={`/api/portal/${kind}/case-file?key=${encodeURIComponent(m.attachment_key)}`} target="_blank" rel="noreferrer">{m.attachment_name}</a>{m.attachment_size ? <span className="pt-muted">（{Math.round(m.attachment_size / 1024)} KB）</span> : null}</p>}
        </div>
      ))}
      <div className="pt-form" style={{ marginTop: 8 }}>
        <Field label={kind === "ops" ? M.composeOps : M.compose}><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={kind === "ops" ? M.composePhOps : M.composePh} /></Field>
        <Field label={M.visibility}>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as MessageRow["visibility"])}>
            {kind === "ops" && <option value="internal">{M.visInternal}</option>}
            <option value="partner">{M.visPartner}</option>
            <option value="customer">{M.visCustomer}</option>
          </select>
        </Field>
        <Field label={M.attach}><input type="file" ref={fileRef} accept="application/pdf,image/*,text/plain" onChange={(e) => setHasFile(!!e.target.files?.length)} /></Field>
        <div className="pt-row"><Button disabled={busy || (!body.trim() && !hasFile)} onClick={() => void post()}>{busy ? C.sending : C.send}</Button></div>
      </div>
      {err && <Notice tone="bad">{err}</Notice>}
    </div>
  );
}

/** The ledger side of the case, read-only: the reservation, the payment and the commission entry. */
export function CaseLedger({ d, kind }: { d: CaseDetail; kind: Kind }) {
  const K = t().cases, S = t().status;
  if (!d.reservation) return <p className="pt-small pt-muted">{K.ledgerNote}</p>;
  const r = d.reservation, e = d.entry;
  return (
    <dl className="pt-kv">
      <dt>{K.reservation}</dt><dd>{r.hotel_ref ?? "—"} · {label(S.reservation, r.status)} · {label(S.payment, r.payment_status)}{r.amount_status === "pending" ? <Badge tone="warn">{K.amountCheck}</Badge> : null}{kind === "ops" && <> · <a href={`/ops/reservations/${r.id}/`}>台帳を開く</a></>}</dd>
      {e && <><dt>{K.commission}</dt><dd>{K.ledgerRow(yen(e.base_net_jpy), pct(e.rate_bp), yen(e.commission_net_jpy))} · {label(S.entry, e.status)}{e.hold_reason ? <span className="pt-muted">（{e.hold_reason.split(",").map((h) => label(S.hold, h)).join(", ")}）</span> : null}</dd></>}
    </dl>
  );
}
