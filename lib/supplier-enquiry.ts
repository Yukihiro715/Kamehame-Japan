import { SUPPLIER_POLICY_VERSION, SUPPLIER_PRICE_NOTE, SUPPLIER_SCOPE_NOTE } from "./supplier-policy";
import { recipientAllowed, type PortalMailEnv } from "./portal/mail";

export const SUPPLIER_FIELD_LABELS = {
  company: "会社・施設名", name: "ご担当者名", email: "メールアドレス", phone: "電話番号",
  location: "所在地", websiteUrl: "公式サイト・紹介ページ", message: "ご相談内容",
  title: "体験名", category: "体験の種類", description: "体験の内容・魅力", duration: "所要時間",
  capacity: "最少・最大人数", availability: "受入可能日時・予約締切", languages: "当日の対応言語・通訳",
  meetingPoint: "開催・集合場所", included: "料金に含まれるもの", excluded: "含まれないもの",
  cancellation: "キャンセル条件", priceUnit: "料金の単位・人数条件", retailPrice: "一般販売価格（税込・円）",
  wholesalePrice: "希望卸価格（税込・円）", photosUrl: "写真・資料の共有URL", notes: "補足事項",
} as const;
type Field = keyof typeof SUPPLIER_FIELD_LABELS;
type Submission = { kind: "consult" | "apply"; requestId: string; fields: Partial<Record<Field, string>> };
const LIMITS: Record<Field, number> = {
  company: 160, name: 120, email: 200, phone: 60, location: 300, websiteUrl: 1000, message: 3000,
  title: 160, category: 80, description: 4000, duration: 160, capacity: 160, availability: 1000,
  languages: 300, meetingPoint: 1000, included: 1500, excluded: 1500, cancellation: 2000,
  priceUnit: 160, retailPrice: 9, wholesalePrice: 9, photosUrl: 1000, notes: 3000,
};
const COMMON: Field[] = ["company", "name", "email"];
const APPLY: Field[] = ["location", "category", "title", "description", "duration", "capacity", "availability", "languages", "meetingPoint", "included", "cancellation", "priceUnit", "retailPrice", "wholesalePrice"];
const CONSULT: Field[] = [...COMMON, "phone", "title", "websiteUrl", "message"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseSupplierSubmission(body: Record<string, unknown>): Submission | null {
  if ((body.kind !== "consult" && body.kind !== "apply") || body.consent !== true || !UUID.test(String(body.requestId ?? ""))) return null;
  if (body.kind === "apply" && body.policyVersion !== SUPPLIER_POLICY_VERSION) return null;
  const fields: Submission["fields"] = {};
  for (const key of body.kind === "consult" ? CONSULT : Object.keys(LIMITS) as Field[]) {
    const value = body[key];
    if (value != null && typeof value !== "string") return null;
    const text = (value as string | undefined)?.trim() ?? "";
    if (text.length > LIMITS[key] || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) return null;
    if (text) fields[key] = text;
  }
  for (const key of [...COMMON, ...(body.kind === "consult" ? ["title", "message"] as Field[] : APPLY)]) if (!fields[key]) return null;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email!)) return null;
  if (/[\r\n]/.test(fields.name! + fields.company!)) return null;
  for (const key of ["websiteUrl", "photosUrl"] as const) {
    if (!fields[key]) continue;
    try { const url = new URL(fields[key]); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null; } catch { return null; }
  }
  if (body.kind === "apply") for (const key of ["retailPrice", "wholesalePrice"] as const) {
    if (!/^\d+$/.test(fields[key]!) || Number(fields[key]) < 1 || Number(fields[key]) > 100_000_000) return null;
  }
  return { kind: body.kind, requestId: String(body.requestId).toLowerCase(), fields };
}

export function supplierNotification(s: Submission) {
  const reference = `KHS-${s.requestId}`;
  const title = s.kind === "consult" ? "掲載のご相談" : "体験情報の登録・審査待ち";
  return {
    subject: `【${title}】${s.fields.company}｜${reference}`,
    text: [
      title, `受付番号: ${reference}`, "",
      ...Object.entries(s.fields).map(([key, value]) => `${SUPPLIER_FIELD_LABELS[key as Field]}: ${value}`), "",
      "プライバシーポリシーと対応のための情報利用に同意済み。",
      ...(s.kind === "apply" ? [`確認した条件: ${SUPPLIER_POLICY_VERSION}`, SUPPLIER_PRICE_NOTE, SUPPLIER_SCOPE_NOTE,
        "審査と掲載条件の合意が必要です。この登録による自動公開はありません。"] : [
        "担当者からご相談に返信してください。掲載をご希望の場合は、以下の登録URLをご案内ください。",
        "https://kamehame-japan.com/partners-lp/register/", "登録URLは相談者へ自動送信していません。",
      ]),
    ].join("\n"), reference,
  };
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

/** A receipt only: staff separately send the registration link after consultation. */
export function supplierAcknowledgement(s: Submission) {
  const reference = `KHS-${s.requestId}`;
  const paragraphs = [
    `${s.fields.company}\n${s.fields.name} 様`,
    "このたびは、KAMEHAME JAPANへ掲載のご相談をいただき、ありがとうございます。",
    "ご相談を受け付けました。担当者が内容を確認し、こちらのメールアドレスへあらためてご連絡いたします。",
    "掲載に向けた詳しい体験情報や条件は、ご相談の後にご案内する登録フォームからお伺いします。",
    "ご質問や補足したい内容がございましたら、このメールにそのままご返信ください。",
    `受付番号：${reference}`,
    "KAMEHAME JAPAN\n株式会社プロセント\nhello@kamehame-japan.com",
  ];
  return {
    subject: "【KAMEHAME JAPAN】掲載のご相談ありがとうございます",
    text: paragraphs.join("\n\n"),
    html: `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#faf8f1;color:#242d29"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#fffdf8;border-radius:12px"><tr><td style="padding:32px 28px;font:16px/1.9 Arial,Meiryo,sans-serif;word-break:break-word"><p style="margin:0 0 28px;color:#c95025;font-size:13px;font-weight:bold;letter-spacing:2px">KAMEHAME JAPAN</p><h1 style="font-size:23px;line-height:1.6;margin:0 0 28px">ご相談ありがとうございます。</h1>${paragraphs.map(p => `<p style="margin:0 0 20px">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("")}</td></tr></table></td></tr></table></body></html>`,
  };
}

export interface SupplierEnv extends PortalMailEnv { CONTACT_TO?: string; ARCHIVE_TO?: string }
const MAX_BODY_BYTES = 96_000;
const reply = (body: object, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
// A bounded, per-isolate burst guard, in addition to the honeypot and origin check.
const attempts = new Map<string, { count: number; expires: number }>();
function rateAllowed(ip: string | null) {
  if (!ip) return true;
  const now = Date.now(), old = attempts.get(ip);
  if (old && old.expires > now) { old.count++; return old.count <= 10; }
  if (attempts.size >= 4096) for (const [key, value] of attempts) if (value.expires <= now) attempts.delete(key);
  if (attempts.size >= 4096) return false;
  attempts.set(ip, { count: 1, expires: now + 15 * 60_000 });
  return true;
}

/** Consultations send a team notification and thank-you receipt together; registration links remain manual. */
export async function handleSupplierSubmission(request: Request, env: SupplierEnv, fetchImpl: typeof fetch = fetch): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return reply({ ok: false, error: "origin" }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply({ ok: false, error: "content_type" }, 415);
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) return reply({ ok: false, error: "too_large" }, 413);
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply({ ok: false, error: "too_large" }, 413);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply({ ok: false, error: "invalid" }, 400);
    body = parsed as Record<string, unknown>;
  } catch { return reply({ ok: false, error: "bad_json" }, 400); }
  if (body.website) return reply({ ok: true, reference: "KHS-RECEIVED" });
  const submission = parseSupplierSubmission(body);
  if (!submission) return reply({ ok: false, error: "invalid" }, 400);
  if (!rateAllowed(request.headers.get("cf-connecting-ip"))) return reply({ ok: false, error: "rate_limited" }, 429);
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) return reply({ ok: false, error: "unconfigured" }, 503);
  const to = [...new Set([env.CONTACT_TO, env.ARCHIVE_TO].filter((x): x is string => !!x))];
  const consult = submission.kind === "consult";
  if (![...to, ...(consult ? [submission.fields.email!] : [])].every(x => recipientAllowed(env, x))) return reply({ ok: false, error: "unconfigured" }, 503);
  const { subject, text, reference } = supplierNotification(submission);
  const notification = { from: "KAMEHAME JAPAN <enquiries@kamehame-japan.com>", to, reply_to: submission.fields.email,
    subject, text, tags: [{ name: "kind", value: `supplier-${submission.kind}` }] };
  const payload = consult ? [notification, {
    from: "KAMEHAME JAPAN <hello@kamehame-japan.com>", to: [submission.fields.email!], reply_to: "hello@kamehame-japan.com",
    ...supplierAcknowledgement(submission), tags: [{ name: "kind", value: "supplier-ack" }],
  }] : notification;
  try {
    const response = await fetchImpl(`https://api.resend.com/emails${consult ? "/batch" : ""}`, {
      method: "POST", signal: AbortSignal.timeout(15_000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `supplier/${consult ? "consult-v2" : "apply"}/${submission.requestId}` },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return reply({ ok: false, error: "send_failed" }, 502);
    const sent = await response.json() as { id?: string; data?: { id?: string }[] };
    const accepted = consult ? Array.isArray(sent.data) && sent.data.length === 2 && sent.data.every(mail => typeof mail?.id === "string" && mail.id.length > 0) : !!sent.id;
    if (!accepted) return reply({ ok: false, error: "send_failed" }, 502);
    return reply({ ok: true, reference });
  } catch { return reply({ ok: false, error: "send_failed" }, 502); }
}
