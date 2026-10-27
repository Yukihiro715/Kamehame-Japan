import { checkoutReady, openExperienceCheckout, parseExperienceOrder, publishCheckoutReady } from "@/lib/experience-checkout";
import { attachExperienceOrder } from "@/lib/referral/attach";
const headers = { "cache-control": "no-store" };
/** A fresh answer from the ledger, published to KV for the page renders (the cron does the same every five minutes). */
export async function GET() {
  try { const { env } = await import("cloudflare:workers"); const { value, at } = await publishCheckoutReady(env); return Response.json({ ready: value, at, published: !!env.READY_STATE }, { headers }); }
  catch { return Response.json({ ready: false }, { headers }); }
}
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return Response.json({ ok: false }, { status: 403, headers });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({ ok: false }, { status: 415, headers });
  try {
    const text = await request.text();
    if (text.length > 12000) return Response.json({ ok: false }, { status: 413, headers });
    let body: Record<string, unknown>;
    try { body = JSON.parse(text); } catch { return Response.json({ ok: false, error: "invalid" }, { status: 400, headers }); }
    const order = body && parseExperienceOrder(body);
    if (!order) return Response.json({ ok: false, error: "invalid" }, { status: 400, headers });
    const { env } = await import("cloudflare:workers");
    if (!await checkoutReady(env)) return Response.json({ ok: false, error: "unavailable" }, { status: 503, headers });
    // The commission ledger: the reservation and its referral are fixed before the payment page opens.
    const referral = await attachExperienceOrder(env, request, order);
    if (referral) order.referral = { reservationId: referral.reservationId, hotelPublicId: referral.hotelPublicId };
    const result = await openExperienceCheckout(env, order);
    return Response.json(result, { status: result.ok ? 200 : 409, headers });
  } catch {
    // Never return upstream errors, request bodies or credentials.
    return Response.json({ ok: false, error: "unavailable" }, { status: 503, headers });
  }
}
