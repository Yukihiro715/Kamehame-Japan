/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { publishCheckoutReady, type ReadyStateKv } from "../lib/experience-checkout";
import { d1Db, isD1Like } from "../lib/referral/db";
import { handleReferralArrival, REFERRAL_PATH } from "../lib/referral/links";

interface Env {
  ASSETS: Fetcher;
  /** D1 (the commission ledger, lib/referral). Absent until the deploy workflow has created the database. */
  DB?: unknown;
  /** "staging" on the verification Worker: every page behind Basic auth, noindex everywhere. */
  KH_ENV?: string;
  /** "user:password" for the staging gate (a Worker secret on the staging Worker only). */
  STAGING_BASIC_AUTH?: string;
  /** Checkout readiness published by the cron (vite.config.ts kv_namespaces); absent until the namespace exists. */
  READY_STATE?: ReadyStateKv;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

// Baseline security headers. next.config headers() only applies to the dev
// server under vinext, so production responses get them here. Values a
// response already carries (the image optimizer sets its own CSP) are kept.
const SECURITY_HEADERS: Record<string, string> = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy": "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'",
};

function withSecurityHeaders(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!out.headers.has(name)) out.headers.set(name, value);
  }
  return out;
}

// Served from the Worker so it never hits the app router's trailing-slash
// redirect. Expires must stay within a year of the deploy date (RFC 9116).
const SECURITY_TXT = [
  "Contact: mailto:hello@kamehame-japan.com",
  "Expires: 2027-10-01T00:00:00.000Z",
  "Preferred-Languages: en, ja",
  "Canonical: https://kamehame-japan.com/.well-known/security.txt",
  "",
].join("\n");

// Confirmation pages reached from a Stripe payment link or the enquiry form.
// They already carry a noindex meta tag; the header covers non-HTML readers.
const PRIVATE_PAGE = /^\/(en|es|ja|fr|zh-tw)\/(booked|thanks)\/?$/;

const HTML_END = "</body></html>";

/** Staging: nothing is served without the shared Basic credentials, except the
 *  provider webhooks, which authenticate with their own signatures. */
async function stagingGate(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (env.KH_ENV !== "staging" || url.pathname.startsWith("/api/webhooks/")) return null;
  const raw = env.STAGING_BASIC_AUTH?.trim();
  const challenge = (status: number, text: string) => new Response(text, { status, headers: { "www-authenticate": 'Basic realm="KAMEHAME staging"', "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
  if (!raw) return challenge(503, "staging locked: STAGING_BASIC_AUTH is not set");
  // "user:password", or just a password for the user "kame".
  const expected = raw.includes(":") ? raw : `kame:${raw}`;
  const given = request.headers.get("authorization") ?? "";
  let ok = false;
  if (given.startsWith("Basic ")) {
    try {
      const enc = new TextEncoder();
      const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(atob(given.slice(6)))), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
      const x = new Uint8Array(a), y = new Uint8Array(b);
      let diff = 0;
      for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
      ok = diff === 0;
    } catch { ok = false; }
  }
  return ok ? null : challenge(401, "staging: sign in");
}

/** A hotel's QR code or link: record the arrival, set the referral session
 *  cookie and send the visitor to the page the link points at (lib/referral/links). */
async function referralArrival(request: Request, env: Env, url: URL): Promise<Response> {
  const token = url.pathname.match(REFERRAL_PATH)![1];
  const headers = new Headers({ "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" });
  let location = "/en/";
  if (isD1Like(env.DB)) {
    try {
      const r = await handleReferralArrival(d1Db(env.DB), { token, userAgent: request.headers.get("user-agent"), test: url.searchParams.get("kh_test") === "1", secure: url.protocol === "https:" });
      location = r.redirect;
      if (r.setCookie) headers.append("set-cookie", r.setCookie);
    } catch (err) {
      console.error("referral: arrival not recorded", err instanceof Error ? err.message : err);
    }
  }
  headers.set("location", new URL(location, url.origin).toString());
  return new Response(null, { status: 302, headers });
}

/**
 * vinext streams the RSC payload as inline <script> tags after React has
 * already closed the document, so the HTML it serves ends with scripts
 * outside </html>. Site scanners read that as an injected script and label
 * the page as malware (Sucuri's "html_anomaly" verdict). Move the closing
 * tags to the real end of the stream so the document is well-formed.
 */
function closeDocumentLast(res: Response): Response {
  const type = res.headers.get("content-type") ?? "";
  if (!res.body || !/^text\/html\b/i.test(type) || res.headers.has("content-encoding")) return res;

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let pending = "";
  let moved = false;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      if (moved) {
        if (text) controller.enqueue(encoder.encode(text));
        return;
      }
      pending += text;
      const at = pending.indexOf(HTML_END);
      if (at >= 0) {
        moved = true;
        controller.enqueue(encoder.encode(pending.slice(0, at) + pending.slice(at + HTML_END.length)));
        pending = "";
        return;
      }
      // Keep enough text back to catch a marker split across two chunks.
      const keep = HTML_END.length - 1;
      if (pending.length > keep) {
        controller.enqueue(encoder.encode(pending.slice(0, pending.length - keep)));
        pending = pending.slice(-keep);
      }
    },
    flush(controller) {
      pending += decoder.decode();
      if (pending) controller.enqueue(encoder.encode(pending));
      if (moved) controller.enqueue(encoder.encode(HTML_END));
    },
  });

  const out = new Response(res.body.pipeThrough(transform), res);
  out.headers.delete("content-length");
  return out;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Plain-http requests reach the Worker as-is unless the zone forces HTTPS;
    // send them to the https URL so search engines see one version of each page.
    if (url.protocol === "http:" && !/^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0)$/.test(url.hostname)) {
      url.protocol = "https:";
      return withSecurityHeaders(new Response(null, { status: 301, headers: { location: url.toString() } }));
    }

    const gate = await stagingGate(request, env, url);
    if (gate) return withSecurityHeaders(gate);

    if (REFERRAL_PATH.test(url.pathname)) return withSecurityHeaders(await referralArrival(request, env, url));

    if (url.pathname === "/.well-known/security.txt" || url.pathname === "/security.txt") {
      return withSecurityHeaders(new Response(SECURITY_TXT, {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" },
      }));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const res = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(res);
    }

    // The document language: the app's root layout cannot see the locale
    // segment of the URL, so it reads it from this header (app/layout.tsx).
    const lang = url.pathname.match(/^\/(en|es|ja|fr|zh-tw)(?:\/|$)/)?.[1];
    const req = lang ? new Request(request, { headers: new Headers([...request.headers, ["x-kh-lang", lang]]) }) : request;
    const res = await handler.fetch(req, env, ctx);
    const out = withSecurityHeaders(closeDocumentLast(res));
    if (PRIVATE_PAGE.test(url.pathname) || env.KH_ENV === "staging") out.headers.set("x-robots-tag", "noindex, nofollow");
    return out;
  },
};

const scheduled = {
  /** Every five minutes (vite.config.ts triggers): ask the ledger whether
   *  checkout is ready and publish the answer to KV for the page renders. */
  async scheduled(_event: unknown, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(publishCheckoutReady(env as unknown as Parameters<typeof publishCheckoutReady>[0]));
  },
};

export default { ...worker, ...scheduled };
