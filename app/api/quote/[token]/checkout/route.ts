import { openQuoteCheckout } from "@/lib/portal/cases";
import { referralDb } from "@/lib/referral/attach";
import { resolvePublicOrigin } from "@/lib/portal/util";

/** The customer presses "pay" on a shared quote (lib/portal/cases.ts): a
 *  Checkout session for that version, or the reason there is none. */
export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin) return Response.json({ ok: false, error: "origin" }, { status: 403 });
  let env: Record<string, unknown> | null = null;
  try { env = (await import("cloudflare:workers")).env as Record<string, unknown>; } catch { env = null; }
  const db = referralDb(env as { DB?: unknown } | null);
  if (!db) return Response.json({ ok: false, error: "unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  const r = await openQuoteCheckout(db, env as Parameters<typeof openQuoteCheckout>[1], token, await resolvePublicOrigin(db, env as { KH_ENV?: string }, origin));
  return Response.json(r, { status: r.ok ? 200 : r.error === "not_found" ? 404 : 409, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
}
