import { handlePortalApi } from "@/lib/portal/api";

/** The hotel and operations portal API (lib/portal/api.ts). Every answer is
 *  no-store and noindex; access is decided from the session cookie and the
 *  memberships table on each call. */
async function handle(request: Request, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  try {
    const { env } = await import("cloudflare:workers");
    return handlePortalApi(request, env, path);
  } catch {
    return Response.json({ ok: false, error: "ledger_unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
export async function GET(request: Request, ctx: { params: Promise<{ path: string[] }> }) { return handle(request, ctx.params); }
export async function POST(request: Request, ctx: { params: Promise<{ path: string[] }> }) { return handle(request, ctx.params); }
