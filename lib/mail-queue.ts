// Individually written customer emails (quotes, replies, reminders) that the
// team approves in the ledger's「メール送信キュー」tab. The Apps Script queue
// posts each approved mail here; this module sends it through Resend with
// the tags the webhook receiver uses to route delivery, open and click
// events back to that queue row. Nothing here enqueues an acknowledgement,
// a follow-up or a payment mail, and nothing here creates a ledger case.

/** RESEND_READ_KEY is optional: a key allowed to read emails (Resend "full access"),
 *  used only for lookups when the sending key is restricted to sending. */
export interface MailQueueEnv { MAIL_QUEUE_TOKEN?: string; MAIL_QUEUE_URL?: string; RESEND_API_KEY?: string; RESEND_READ_KEY?: string }
export const readKeyOf = (env: MailQueueEnv) => env.RESEND_READ_KEY || env.RESEND_API_KEY || "";

export const MAIL_FROM = "Yukihiro, KAMEHAME JAPAN <hello@kamehame-japan.com>";
export const MAIL_REPLY_TO = "hello@kamehame-japan.com";
const RESEND = "https://api.resend.com";

/** The case id rules the ledger uses: KJ-YYMMDD-NN, KJ-INQ-YYMMDD-NN, KJ-YYMMDD-Gxxxxxxxx. */
export const CASE_ID = /^KJ-[A-Z0-9-]{6,40}$/;
export const MAIL_ID = /^[A-Za-z0-9-]{3,60}$/;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const MESSAGE_ID = /^<[^\s<>]+@[^\s<>]+>$/;

export interface SendRequest {
  mailId: string; caseId: string; to: string; subject: string; text: string; html?: string;
  inReplyTo?: string; references?: string; bcc?: string;
  /** Unique per approved content; the Apps Script derives it from the approval hash. */
  idempotencyKey: string;
}

/** Validates the queue's payload. Returns the cleaned request or the field that fails. */
export function parseSendRequest(body: unknown): { ok: true; req: SendRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "body" };
  const b = body as Record<string, unknown>;
  const str = (k: string, max: number) => (typeof b[k] === "string" && (b[k] as string).length <= max ? (b[k] as string).trim() : undefined);
  const mailId = str("mailId", 60), caseId = str("caseId", 40), to = str("to", 200), subject = str("subject", 300);
  const text = typeof b.text === "string" && b.text.length <= 60_000 ? b.text : undefined;
  const html = typeof b.html === "string" && b.html.length <= 250_000 ? b.html : undefined;
  const inReplyTo = str("inReplyTo", 300), references = str("references", 2000), bcc = str("bcc", 200), idempotencyKey = str("idempotencyKey", 200);
  if (!mailId || !MAIL_ID.test(mailId)) return { ok: false, error: "mailId" };
  if (!caseId || !CASE_ID.test(caseId)) return { ok: false, error: "caseId" };
  if (!to || !EMAIL.test(to)) return { ok: false, error: "to" };
  if (!subject || /[\r\n]/.test(subject)) return { ok: false, error: "subject" };
  if (!text || !text.trim()) return { ok: false, error: "text" };
  if (html !== undefined && html !== "" && !/<[a-z][\s\S]*>/i.test(html)) return { ok: false, error: "html" };
  if (inReplyTo && !MESSAGE_ID.test(inReplyTo)) return { ok: false, error: "inReplyTo" };
  if (references && !references.split(/\s+/).every((r) => MESSAGE_ID.test(r))) return { ok: false, error: "references" };
  if (bcc && !EMAIL.test(bcc)) return { ok: false, error: "bcc" };
  if (!idempotencyKey || !/^[A-Za-z0-9_./:-]{8,200}$/.test(idempotencyKey)) return { ok: false, error: "idempotencyKey" };
  return { ok: true, req: { mailId, caseId, to, subject, text, html: html || undefined, inReplyTo: inReplyTo || undefined, references: references || undefined, bcc: bcc || undefined, idempotencyKey } };
}

/** Bearer-token check in constant time (both sides hashed, then compared byte by byte). */
export async function authorized(headers: Headers, token: string | undefined): Promise<boolean> {
  if (!token || token.length < 24) return false;
  const given = headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!given) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(token))]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/** The Resend payload for one approved mail: our own From/Reply-To, the case and
 *  mail ids as tags (the webhook routes on `kind=manual`), threading headers when
 *  the queue found the original message, and the plain text alongside any HTML. */
export function resendPayload(req: SendRequest) {
  const headers: Record<string, string> = { "X-KJ-Reference": req.caseId, "X-KJ-Mail": req.mailId };
  if (req.inReplyTo) { headers["In-Reply-To"] = req.inReplyTo; headers["References"] = req.references ?? req.inReplyTo; }
  return {
    from: MAIL_FROM, to: [req.to], reply_to: MAIL_REPLY_TO, subject: req.subject,
    text: req.text, ...(req.html ? { html: req.html } : {}), ...(req.bcc ? { bcc: [req.bcc] } : {}),
    headers,
    tags: [{ name: "kind", value: "manual" }, { name: "booking", value: req.caseId }, { name: "mail", value: req.mailId }],
  };
}

export type SendResult = { ok: true; id: string; messageId?: string } | { ok: false; status: number; error: string };

/** Sends once per idempotency key (Resend keeps keys for 24 hours), then reads the
 *  Message-ID back so later replies can thread onto this mail. */
export async function sendQueuedMail(key: string, req: SendRequest, fetchImpl: typeof fetch = fetch, readKey = key): Promise<SendResult> {
  const res = await fetchImpl(`${RESEND}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": req.idempotencyKey },
    body: JSON.stringify(resendPayload(req)),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return { ok: false, status: res.status, error: `resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
  const { id } = (await res.json()) as { id?: string };
  if (!id) return { ok: false, status: 502, error: "resend answered without an id" };
  return { ok: true, id, messageId: await messageIdOf(readKey, id, fetchImpl) };
}

/** The sent mail's Message-ID header, for threading; best effort. */
async function messageIdOf(key: string, id: string, fetchImpl: typeof fetch): Promise<string | undefined> {
  try {
    const res = await fetchImpl(`${RESEND}/emails/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { message_id?: string };
    return typeof data.message_id === "string" && MESSAGE_ID.test(data.message_id) ? data.message_id : undefined;
  } catch { return undefined; }
}

/** The provider's view of one mail (its last event), for the queue's hourly
 *  reconciliation when a webhook never arrived. */
export async function mailStatus(key: string, id: string, fetchImpl: typeof fetch = fetch): Promise<{ ok: true; lastEvent: string; messageId?: string; createdAt?: string } | { ok: false; status: number; upstream?: number }> {
  if (!/^[A-Za-z0-9-]{10,80}$/.test(id)) return { ok: false, status: 400 };
  const res = await fetchImpl(`${RESEND}/emails/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(10_000) });
  // The provider's status is passed on so the ledger can tell a restricted key (401/403) from an outage.
  if (!res.ok) return { ok: false, status: res.status === 404 ? 404 : 502, upstream: res.status };
  const data = (await res.json()) as { last_event?: string; message_id?: string; created_at?: string };
  return { ok: true, lastEvent: String(data.last_event ?? ""), messageId: data.message_id, createdAt: data.created_at };
}
