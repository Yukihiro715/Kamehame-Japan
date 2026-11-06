import { CASE_FILE_PREFIX, customerFiles } from "@/lib/portal/cases";
import { referralDb } from "@/lib/referral/attach";
import { isBucket, serveMedia } from "@/lib/review-media";

/** A document operations shared with the customer (visibility 'customer'), reachable only through the quote's token. */
export async function GET(request: Request, ctx: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await ctx.params;
  const key = new URL(request.url).searchParams.get("key") ?? "";
  let env: Record<string, unknown> | null = null;
  try { env = (await import("cloudflare:workers")).env as Record<string, unknown>; } catch { env = null; }
  const db = referralDb(env as { DB?: unknown } | null);
  const bucket = env && isBucket(env.MEDIA) ? env.MEDIA : null;
  if (!db || !bucket) return new Response("unavailable", { status: 503 });
  const files = await customerFiles(db, token);
  if (!files.some((f) => f.key === key)) return new Response("not found", { status: 404 });
  return serveMedia(bucket, key, new URL(request.url).searchParams.get("download") === "1", CASE_FILE_PREFIX);
}
