import { referralDb } from "@/lib/referral/attach";
import { publicGuide } from "@/lib/portal/guest-guide";
import { CASE_FILE_PREFIX } from "@/lib/portal/cases";
import { isBucket, serveMedia } from "@/lib/review-media";

const headers = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "private, no-store",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
};
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function GET(
  request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  let env: Record<string, unknown> | null = null;
  try {
    env = (await import("cloudflare:workers")).env as Record<string, unknown>;
  } catch {
    /* local bindings can be absent */
  }
  const db = referralDb(env as { DB?: unknown } | null);
  if (!db) return new Response("Unavailable", { status: 503, headers });
  const g = await publicGuide(db, token);
  if (!g) return new Response("Guide unavailable", { status: 404, headers });
  if (new URL(request.url).searchParams.has("file")) {
    if (!g.fileKey || !env || !isBucket(env.MEDIA))
      return new Response("File unavailable", { status: 404, headers });
    return serveMedia(env.MEDIA, g.fileKey, true, CASE_FILE_PREFIX);
  }
  const title = g.en ? "Your booking guide" : "ご予約のご案内";
  return new Response(
    `<!doctype html><html lang="${g.en ? "en" : "ja"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} | KAMEHAME JAPAN</title><style>body{font:16px/1.7 system-ui;color:#302b27;max-width:680px;margin:48px auto;padding:0 20px}h1{border-bottom:3px solid #ee7c18}p{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#93400e}</style><body><strong>KAMEHAME JAPAN</strong><h1>${title}</h1><h2>${escape(g.title)}</h2><p>${escape(g.date ?? "")}</p><p>${escape(g.instructions ?? "")}</p>${g.fileKey ? `<a href="?file=1">${g.en ? "Download guide or ticket" : "案内・チケットをダウンロード"}</a>` : ""}</body></html>`,
    { headers },
  );
}
