import { checkoutReady, openExperienceCheckout, parseExperienceOrder } from "@/lib/experience-checkout";
const headers = { "cache-control": "no-store" };
export async function GET() {
  try { const { env } = await import("cloudflare:workers"); return Response.json({ ready: await checkoutReady(env) }, { headers }); }
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
    const result = await openExperienceCheckout(env, order);
    return Response.json(result, { status: result.ok ? 200 : 409, headers });
  } catch {
    // Never return upstream errors, request bodies or credentials.
    return Response.json({ ok: false, error: "unavailable" }, { status: 503, headers });
  }
}
