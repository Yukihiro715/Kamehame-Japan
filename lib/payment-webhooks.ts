import type { GolfAutomationEnv } from "@/lib/golf-automation";
import type { MailQueueEnv } from "@/lib/mail-queue";
import { experienceReference, handleExperienceEvent, type ExperienceCheckoutEnv } from "@/lib/experience-checkout";

type Provider = "resend" | "stripe";
type Env = GolfAutomationEnv & MailQueueEnv & ExperienceCheckoutEnv & { RESEND_WEBHOOK_SECRET?: string; STRIPE_WEBHOOK_SECRET?: string };
const RESEND_EVENTS = ["email.sent", "email.delivered", "email.delivery_delayed", "email.bounced", "email.failed", "email.suppressed", "email.complained", "email.opened", "email.clicked"];
const gasUrl = (url: string | undefined) => !!url?.startsWith("https://script.google.com/macros/s/");

/** Where a Resend event goes: the golf queue for its own ack/payment/intro mails,
 *  the manual-mail queue for approved individual mails (`kind=manual`), nowhere
 *  for anything else. Each queue is switched on by its own URL and token, so the
 *  manual queue can run while the golf automation stays off, and vice versa. */
export function resendTarget(env: Env, tags: Record<string, unknown>): { url: string; token: string; action: "event" | "mail_event" } | "ignore" | "unconfigured" {
  const kind = String(tags.kind ?? ""), booking = String(tags.booking ?? "");
  if (!booking.startsWith("KJ-")) return "ignore";
  if (kind === "manual") {
    if (!/^[A-Za-z0-9-]{3,60}$/.test(String(tags.mail ?? ""))) return "ignore";
    return gasUrl(env.MAIL_QUEUE_URL) && env.MAIL_QUEUE_TOKEN ? { url: env.MAIL_QUEUE_URL!, token: env.MAIL_QUEUE_TOKEN, action: "mail_event" } : "unconfigured";
  }
  if (/^(ack|payment|intro)$/.test(kind)) return gasUrl(env.GOLF_AUTOMATION_URL) && env.GOLF_AUTOMATION_TOKEN ? { url: env.GOLF_AUTOMATION_URL!, token: env.GOLF_AUTOMATION_TOKEN, action: "event" } : "unconfigured";
  return "ignore";
}
const encoder = new TextEncoder();
const fresh = (timestamp: string, now: number) => /^\d+$/.test(timestamp) && Math.abs(now / 1000 - Number(timestamp)) <= 300;
const fromBase64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

/** Raw-body HMAC verification, including timestamp tolerance and rotated keys.
 * Uses Web Crypto's verification operation instead of string comparisons.
 * https://docs.svix.com/receiving/verifying-payloads/how-manual
 * https://docs.stripe.com/webhooks/signature
 */
export async function verifyWebhook(provider: Provider, raw: string, headers: Headers, secret: string, now = Date.now()) {
  try {
    let keyBytes: Uint8Array, signed: string, signatures: Uint8Array[];
    if (provider === "resend") {
      const id = headers.get("svix-id"), timestamp = headers.get("svix-timestamp") ?? "";
      if (!id || !fresh(timestamp, now) || !secret.startsWith("whsec_")) return false;
      keyBytes = fromBase64(secret.slice(6));
      signed = `${id}.${timestamp}.${raw}`;
      signatures = (headers.get("svix-signature") ?? "").split(" ").filter(s => s.startsWith("v1,")).map(s => fromBase64(s.slice(3)));
    } else {
      const parts = (headers.get("stripe-signature") ?? "").split(",").map(s => s.trim());
      const timestamp = parts.find(s => s.startsWith("t="))?.slice(2) ?? "";
      if (!fresh(timestamp, now)) return false;
      keyBytes = encoder.encode(secret);
      signed = `${timestamp}.${raw}`;
      signatures = parts.filter(s => /^v1=[0-9a-f]{64}$/i.test(s)).map(s => Uint8Array.from(s.slice(3).match(/../g)!, b => parseInt(b, 16)));
    }
    const key = await crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    for (const signature of signatures) if (await crypto.subtle.verify("HMAC", key, signature as BufferSource, encoder.encode(signed))) return true;
    return false;
  } catch { return false; }
}

export async function receiveWebhook(provider: Provider, request: Request, env: Env): Promise<Response> {
  // Keep the legacy endpoint credential valid when adding the new Stripe destination.
  // Both Stripe destinations belong to the same KAMEHAME account; routing and
  // payment reconciliation remain unchanged after signature verification.
  const secrets = (provider === "resend" ? [env.RESEND_WEBHOOK_SECRET] :
    [env.STRIPE_WEBHOOK_SECRET, env.STRIPE_EXPERIENCE_WEBHOOK_SECRET]).filter((s): s is string => !!s);
  if (!secrets.length) return Response.json({ ok: false }, { status: 503 });
  if (provider === "stripe" && (!env.GOLF_AUTOMATION_TOKEN || !gasUrl(env.GOLF_AUTOMATION_URL))) return Response.json({ ok: false }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 512_000) return new Response(null, { status: 413 });
  const verified = await Promise.all(secrets.map(secret => verifyWebhook(provider, raw, request.headers, secret)));
  if (!verified.some(Boolean)) return Response.json({ ok: false }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    const eventId = provider === "resend" ? request.headers.get("svix-id") : event.id;
    if (!eventId || !event.data) return Response.json({ ok: false }, { status: 400 });
    let url = env.GOLF_AUTOMATION_URL!, token = env.GOLF_AUTOMATION_TOKEN!, action: "event" | "mail_event" = "event";
    if (provider === "resend") {
      const tags = (event.data.tags && typeof event.data.tags === "object" ? event.data.tags : {}) as Record<string, unknown>;
      // Existing/operations emails do not belong to either queue.
      const target = resendTarget(env, tags);
      if (target === "ignore" || !RESEND_EVENTS.includes(event.type)) return Response.json({ ok: true, ignored: true });
      // A queue that is not configured yet: answer 503 so the provider retries later
      // rather than acknowledging an event the ledger never saw.
      if (target === "unconfigured") return Response.json({ ok: false }, { status: 503 });
      ({ url, token, action } = target);
      // IP addresses, user agents and mail contents are unnecessary in the ledger.
      event.data = {
        email_id: event.data.email_id,
        tags: { kind: String(tags.kind), booking: String(tags.booking), ...(tags.mail ? { mail: String(tags.mail) } : {}) },
        click: event.data.click ? { link: event.data.click.link, timestamp: event.data.click.timestamp } : undefined,
      };
    } else {
      const s = event.data.object;
      if (experienceReference(s?.client_reference_id) && ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"].includes(event.type)) {
        await handleExperienceEvent(env, event);
        return Response.json({ ok: true });
      }
      if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type)) return Response.json({ ok: true, ignored: true });
      if (!s || !/^KJ-\d{6}-G[0-9a-f]{8}$/i.test(s.client_reference_id ?? "")) return Response.json({ ok: true, ignored: true });
      const discountRef = (value: unknown) => {
        if (typeof value === "string") return { id: value };
        if (!value || typeof value !== "object") return undefined;
        const ref = value as { id?: unknown; code?: unknown };
        return { id: typeof ref.id === "string" ? ref.id : undefined, code: typeof ref.code === "string" ? ref.code : undefined };
      };
      event.data = { object: {
        id: s.id, client_reference_id: s.client_reference_id, payment_status: s.payment_status,
        payment_link: s.payment_link, currency: s.currency, amount_total: s.amount_total,
        amount_subtotal: s.amount_subtotal, livemode: s.livemode,
        total_details: s.total_details ? { amount_discount: s.total_details.amount_discount, amount_tax: s.total_details.amount_tax, amount_shipping: s.total_details.amount_shipping } : undefined,
        discounts: Array.isArray(s.discounts) ? s.discounts.map((d: { promotion_code?: unknown; coupon?: unknown }) => ({ promotion_code: discountRef(d?.promotion_code), coupon: discountRef(d?.coupon) })) : undefined,
      } };
    }
    const result = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000), body: JSON.stringify({ action, token, provider, eventId: `${provider}:${eventId}`, event }) });
    const data = result.ok ? await result.json() as { ok?: boolean } : null;
    return Response.json({ ok: !!data?.ok }, { status: data?.ok ? 200 : 503 });
  } catch { return Response.json({ ok: false }, { status: 503 }); }
}
