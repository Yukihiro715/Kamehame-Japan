"use client";

/** Pieces both portals use for a booking-relay case (lib/portal/cases.ts):
 *  status badges, the facts block, the quote card and the message thread. */
import { useRef, useState, type ReactNode } from "react";
import { api, errorText, jst, pct, yen } from "./client";
import { Badge, Button, Field, Notice } from "./ui";

export type Kind = "hotel" | "ops";
export interface ExtraField { key: string; label: string; type: "text" | "select" | "bool"; options?: { value: string; label: string }[] }
export interface QuoteLine { kind: "base" | "addon" | "arrangement" | "onsite"; description: string; quantity: number; unitJpy: number; grossJpy: number; taxRateBp: number; commissionable: boolean }
export interface QuoteView { id: string; version: number; status: string; statusJa: string; title: string; lines: QuoteLine[]; totalJpy: number; onsiteJpy: number; includes: string | null; excludes: string | null; onsiteNote: string | null; cancelTerms: string | null; confirmationNote: string | null; validUntil: string | null; paymentMode: string; paymentModeJa: string; shareUrl: string | null; createdBy: string; createdAt: string; sharedAt: string | null; paidAt: string | null; stripeSessionId: string | null; commission: { baseNetJpy: number; rateBp: number | null; estimateNetJpy: number | null; policyMissing: boolean } }
export interface MessageRow { id: string; visibility: "internal" | "partner" | "customer"; visibilityJa: string; author_kind: "ops" | "partner" | "system"; author_email: string | null; body: string; attachment_key: string | null; attachment_name: string | null; attachment_type: string | null; attachment_size: number | null; created_at: string }
export interface CaseView {
  id: string; public_ref: string; partner_ref: string | null; site_id: string; siteName: string; sitePublicId: string; entityName: string; createdBy: string | null; assignee: string | null; assignee_user_id: string | null;
  kind: "experience" | "free"; experience_slug: string | null; experienceTitle: string; preferred_date: string | null; altDates: string[]; time_pref: string | null; guests: number | null; lang: string | null; requirements: string | null;
  customer_name: string; customer_email: string | null; customer_phone: string | null; customer_country: string | null; extra: Record<string, string>; extraFields: ExtraField[];
  status: string; statusJa: string; displayStatus: string; displayStatusJa: string; status_reason: string | null; reservation_id: string | null; assigned_ops: string | null; created_at: string; updated_at: string;
}
export interface CaseDetail { case: CaseView; quotes: QuoteView[]; messages: MessageRow[]; reservation: { id: string; hotel_ref: string | null; status: string; statusJa: string; payment_status: string; paymentJa: string; amount_status: string } | null; entry: { base_net_jpy: number; rate_bp: number | null; commission_net_jpy: number; status: string; statusJa: string; hold_reason: string | null; holdJa: string } | null; members: { userId: string; email: string; name: string | null; role: string }[] }

export const STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { received: "info", checking: "info", proposed: "warn", awaiting_customer: "warn", awaiting_payment: "warn", paid: "ok", confirmed: "ok", performed: "ok", cancelled: "bad", unavailable: "bad" };
export const QUOTE_TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { draft: "neutral", shared: "warn", paid: "ok", superseded: "neutral", expired: "bad", void: "bad" };
export const LINE_KIND_JA: Record<string, string> = { base: "基本料金", addon: "オプション", arrangement: "手配料", onsite: "現地払い" };
export const LANG_JA: Record<string, string> = { en: "英語", ja: "日本語", es: "スペイン語", fr: "フランス語", "zh-tw": "繁体字中国語" };
export const StatusBadge = ({ status, label }: { status: string; label: string }) => <Badge tone={STATUS_TONE[status] ?? "neutral"}>{label}</Badge>;

/** What the partner wrote about the customer and the request. */
export function CaseFacts({ c, showCustomer = true }: { c: CaseView; showCustomer?: boolean }) {
  const extra = c.extraFields.filter((f) => c.extra[f.key]).map((f) => [f.label, f.type === "select" ? f.options?.find((o) => o.value === c.extra[f.key])?.label ?? c.extra[f.key] : c.extra[f.key]] as const);
  return (
    <dl className="pt-kv">
      <dt>体験</dt><dd>{c.experienceTitle}{c.kind === "free" && <span className="pt-muted">（自由相談・運営が商品を決めます）</span>}</dd>
      <dt>希望日</dt><dd>{c.preferred_date ?? "未定"}{c.altDates.length ? <span className="pt-muted">（代替 {c.altDates.join("、")}）</span> : null}{c.time_pref ? ` · ${c.time_pref}` : ""}</dd>
      <dt>人数</dt><dd>{c.guests ?? "未定"}</dd>
      <dt>希望言語</dt><dd>{c.lang ? LANG_JA[c.lang] ?? c.lang : "—"}</dd>
      {showCustomer && <><dt>お客様</dt><dd>{c.customer_name}{c.customer_country ? `（${c.customer_country}）` : ""}<br /><span className="pt-small">{c.customer_email ?? "メール未登録"}{c.customer_phone ? ` · ${c.customer_phone}` : ""}</span></dd></>}
      {c.requirements && <><dt>希望条件・備考</dt><dd style={{ whiteSpace: "pre-wrap" }}>{c.requirements}</dd></>}
      {extra.map(([k, v]) => <ExtraRow key={k} k={k} v={v} />)}
      <dt>担当</dt><dd>{c.assignee ?? "—"}{c.partner_ref ? ` · 管理番号 ${c.partner_ref}` : ""}</dd>
    </dl>
  );
}
const ExtraRow = ({ k, v }: { k: string; v: string }) => <><dt>{k}</dt><dd>{v}</dd></>;

/** One quote version. Partners see the commission preview; customers never see this card. */
export function QuoteCard({ q, kind, actions }: { q: QuoteView; kind: Kind; actions?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { if (!q.shareUrl) return; try { await navigator.clipboard.writeText(q.shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("URL をコピーしてください", q.shareUrl); } };
  return (
    <div className="pt-quote">
      <div className="pt-row" style={{ justifyContent: "space-between" }}>
        <b>第{q.version}版 · {q.title} <Badge tone={QUOTE_TONE[q.status] ?? "neutral"}>{q.statusJa}</Badge></b>
        <span className="pt-small pt-muted">作成 {jst(q.createdAt)}{q.sharedAt ? ` · 共有 ${jst(q.sharedAt)}` : ""}{q.paidAt ? ` · 決済 ${jst(q.paidAt)}` : ""}</span>
      </div>
      <table className="pt-table pt-table-compact">
        <thead><tr><th>区分</th><th>内容</th><th className="num">単価</th><th className="num">数量</th><th className="num">金額（税込）</th>{kind !== "hotel" || true ? <th>紹介対象</th> : null}</tr></thead>
        <tbody>
          {q.lines.map((l, i) => <tr key={i}><td>{LINE_KIND_JA[l.kind] ?? l.kind}</td><td style={{ whiteSpace: "normal" }}>{l.description}</td><td className="num">{yen(l.unitJpy)}</td><td className="num">{l.quantity}</td><td className="num">{l.kind === "onsite" ? <span className="pt-muted">{yen(l.grossJpy)}（現地）</span> : yen(l.grossJpy)}</td><td>{l.commissionable ? "○" : "—"}</td></tr>)}
          <tr><td colSpan={4}><b>お支払い総額（税込）</b></td><td className="num"><b>{yen(q.totalJpy)}</b></td><td /></tr>
          {q.onsiteJpy > 0 && <tr><td colSpan={4} className="pt-muted">現地払い合計</td><td className="num pt-muted">{yen(q.onsiteJpy)}</td><td /></tr>}
        </tbody>
      </table>
      <dl className="pt-kv">
        <dt>お支払い</dt><dd>{q.paymentModeJa}</dd>
        <dt>有効期限</dt><dd>{q.validUntil ?? "—"}</dd>
        {q.includes && <><dt>含まれるもの</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.includes}</dd></>}
        {q.excludes && <><dt>含まれないもの</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.excludes}</dd></>}
        {q.onsiteNote && <><dt>現地払いの条件</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.onsiteNote}</dd></>}
        {q.cancelTerms && <><dt>キャンセル条件</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.cancelTerms}</dd></>}
        {q.confirmationNote && <><dt>予約確定の条件</dt><dd style={{ whiteSpace: "pre-wrap" }}>{q.confirmationNote}</dd></>}
        <dt>紹介料（パートナー限定）</dt><dd>{q.commission.policyMissing ? <span className="pt-muted">料率未設定（運営が設定すると表示されます）</span> : <>対象額 {yen(q.commission.baseNetJpy)}（税抜） × {pct(q.commission.rateBp)} = 見込み <b>{yen(q.commission.estimateNetJpy)}</b>（税抜）。実施確認後に確定します。</>}</dd>
      </dl>
      {q.shareUrl && (
        <div className="pt-row">
          <span className="pt-small">お客様向け URL: <a href={q.shareUrl} target="_blank" rel="noreferrer">{q.shareUrl}</a></span>
          <Button kind="secondary" small onClick={() => void copy()}>{copied ? "コピーしました" : "URL をコピー"}</Button>
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
  if (!res.ok || !data.file) throw new Error(data.message ?? (data.error === "too_large" ? "15MB までのファイルを添付できます。" : data.error === "bad_type" ? "PDF・画像・テキストのみ添付できます。" : data.error === "media_unavailable" ? "添付の保存先が未設定です。" : "アップロードに失敗しました。"));
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
  return (
    <div className="pt-thread">
      {messages.length === 0 && <p className="pt-small pt-muted">まだ連絡はありません。</p>}
      {messages.map((m) => (
        <div key={m.id} className={`pt-msg pt-msg-${m.author_kind}${m.visibility === "internal" ? " pt-msg-internal" : ""}`}>
          <div className="pt-small pt-muted">{m.author_kind === "ops" ? "KAMEHAME 運営" : m.author_kind === "partner" ? "パートナー" : "システム"}{m.author_email ? `（${m.author_email}）` : ""} · {jst(m.created_at)} · <Badge tone={m.visibility === "internal" ? "bad" : m.visibility === "customer" ? "info" : "neutral"}>{m.visibilityJa}</Badge></div>
          {m.body && <p style={{ whiteSpace: "pre-wrap", margin: "4px 0" }}>{m.body}</p>}
          {m.attachment_key && <p className="pt-small" style={{ margin: 0 }}>📎 <a href={`/api/portal/${kind}/case-file?key=${encodeURIComponent(m.attachment_key)}`} target="_blank" rel="noreferrer">{m.attachment_name}</a>{m.attachment_size ? <span className="pt-muted">（{Math.round(m.attachment_size / 1024)} KB）</span> : null}</p>}
        </div>
      ))}
      <div className="pt-form" style={{ marginTop: 8 }}>
        <Field label={kind === "ops" ? "連絡・メモ" : "運営への連絡"}><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={kind === "ops" ? "条件の確認、集合場所、当日の連絡先など" : "質問、条件の変更、お客様からの回答など"} /></Field>
        <Field label="表示範囲">
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as MessageRow["visibility"])}>
            {kind === "ops" && <option value="internal">運営内部（パートナーに見えない）</option>}
            <option value="partner">パートナーと運営</option>
            <option value="customer">お客様にも表示（見積もりページに添付を掲載）</option>
          </select>
        </Field>
        <Field label="添付（PDF・画像、15MB まで）"><input type="file" ref={fileRef} accept="application/pdf,image/*,text/plain" onChange={(e) => setHasFile(!!e.target.files?.length)} /></Field>
        <div className="pt-row"><Button disabled={busy || (!body.trim() && !hasFile)} onClick={() => void post()}>{busy ? "送信中…" : "送信"}</Button></div>
      </div>
      {err && <Notice tone="bad">{err}</Notice>}
    </div>
  );
}

/** The ledger side of the case, read-only: the reservation, the payment and the commission entry. */
export function CaseLedger({ d, kind }: { d: CaseDetail; kind: Kind }) {
  if (!d.reservation) return <p className="pt-small pt-muted">見積もりを共有すると予約台帳に仮予約が作られ、紹介元はこの案件の拠点に固定されます。</p>;
  const r = d.reservation, e = d.entry;
  return (
    <dl className="pt-kv">
      <dt>予約</dt><dd>{r.hotel_ref ?? "—"} · {r.statusJa} · {r.paymentJa}{r.amount_status === "pending" ? <Badge tone="warn">金額要確認</Badge> : null}{kind === "ops" && <> · <a href={`/ops/reservations/${r.id}/`}>台帳を開く</a></>}</dd>
      {e && <><dt>紹介料</dt><dd>対象額 {yen(e.base_net_jpy)}（税抜） × {pct(e.rate_bp)} = {yen(e.commission_net_jpy)}（税抜） · {e.statusJa}{e.holdJa ? <span className="pt-muted">（{e.holdJa}）</span> : null}</dd></>}
    </dl>
  );
}
