import type { GolfAutomationEnv } from "@/lib/golf-automation";

type Provider = "resend" | "stripe";
type Env = GolfAutomationEnv & { RESEND_WEBHOOK_SECRET?: string; STRIPE_WEBHOOK_SECRET?: string };
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
  const secret = provider === "resend" ? env.RESEND_WEBHOOK_SECRET : env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !env.GOLF_AUTOMATION_TOKEN || !env.GOLF_AUTOMATION_URL?.startsWith("https://script.google.com/macros/s/")) return Response.json({ ok: false }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 512_000) return new Response(null, { status: 413 });
  if (!await verifyWebhook(provider, raw, request.headers, secret)) return Response.json({ ok: false }, { status: 400 });
  try {
    const event = JSON.parse(raw);
    const eventId = provider === "resend" ? request.headers.get("svix-id") : event.id;
    if (!eventId || !event.data) return Response.json({ ok: false }, { status: 400 });
    if (provider === "resend") {
      const tags = event.data.tags ?? {};
      // Existing/operations emails do not belong to this queue.
      if (!/^(ack|payment|intro)$/.test(tags.kind ?? "") || !String(tags.booking ?? "").startsWith("KJ-")) return Response.json({ ok: true, ignored: true });
      if (!["email.sent", "email.delivered", "email.delivery_delayed", "email.bounced", "email.failed", "email.suppressed", "email.complained", "email.opened", "email.clicked"].includes(event.type)) return Response.json({ ok: true, ignored: true });
      // IP addresses, user agents and mail contents are unnecessary in the ledger.
      event.data = { email_id: event.data.email_id, click: event.data.click ? { link: event.data.click.link } : undefined };
    } else {
      if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type)) return Response.json({ ok: true, ignored: true });
      const s = event.data.object;
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
    const result = await fetch(env.GOLF_AUTOMATION_URL, { method: "POST", headers: { "content-type": "application/json" }, redirect: "follow", signal: AbortSignal.timeout(25000), body: JSON.stringify({ action: "event", token: env.GOLF_AUTOMATION_TOKEN, provider, eventId: `${provider}:${eventId}`, event }) });
    const data = result.ok ? await result.json() as { ok?: boolean } : null;
    return Response.json({ ok: !!data?.ok }, { status: data?.ok ? 200 : 503 });
  } catch { return Response.json({ ok: false }, { status: 503 }); }
}
