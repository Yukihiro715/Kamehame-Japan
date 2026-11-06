/** Guest photos and videos sent with a review (/{lang}/review/). They go
 *  straight from the browser into the MEDIA bucket (R2, vite.config.ts),
 *  one object per file under reviews/<month>/<upload id>/, and the review
 *  itself leaves a meta.json beside them with the text, the rating and the
 *  permissions the guest gave. /ops/reviews/ lists those and streams the
 *  files to staff. Nothing here is public: the bucket has no public URL. */

export interface R2ObjectLike { key: string; size: number; uploaded?: Date | string; httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }
export interface R2BodyLike extends R2ObjectLike { body: ReadableStream | null; text(): Promise<string> }
export interface R2Like {
  put(key: string, value: ReadableStream | ArrayBuffer | string | null, options?: { httpMetadata?: { contentType?: string }; customMetadata?: Record<string, string> }): Promise<unknown>;
  get(key: string): Promise<R2BodyLike | null>;
  head(key: string): Promise<R2ObjectLike | null>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<{ objects: R2ObjectLike[]; truncated: boolean; cursor?: string }>;
  delete(key: string | string[]): Promise<void>;
}
export const isBucket = (x: unknown): x is R2Like => !!x && typeof x === "object" && typeof (x as R2Like).put === "function" && typeof (x as R2Like).list === "function";

export const MEDIA_PREFIX = "reviews/";
export const MAX_FILES = 5;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };
const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-m4v": "m4v", "video/3gpp": "3gp" };
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const month = (now: Date) => now.toISOString().slice(0, 7);

export interface MediaItem { key: string; name: string; type: string; size: number }
export const mediaKind = (type: string): "image" | "video" | null => (IMAGE_TYPES[type] ? "image" : VIDEO_TYPES[type] ? "video" : null);
export const safeName = (name: string) => name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
export const mediaKey = (uploadId: string, index: number, name: string, type: string, now = new Date()) =>
  `${MEDIA_PREFIX}${month(now)}/${uploadId.toLowerCase()}/${index}-${safeName(name).replace(/\.[^.]*$/, "")}.${IMAGE_TYPES[type] ?? VIDEO_TYPES[type]}`;
/** A key the review may claim: inside this upload's folder, not the meta file. */
export const isMediaKeyFor = (key: string, uploadId: string) => key.startsWith(`${MEDIA_PREFIX}`) && key.includes(`/${uploadId.toLowerCase()}/`) && !key.endsWith("/meta.json") && /^[A-Za-z0-9/._-]+$/.test(key);

/** POST /api/review/upload?id=<upload id>&n=<index>&name=<file name>: the raw file as the body. */
export async function handleReviewUpload(request: Request, bucket: R2Like | null, now = new Date()): Promise<Response> {
  const bad = (error: string, status = 400) => Response.json({ ok: false, error }, { status });
  if (!bucket) return bad("unconfigured", 503);
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "", n = Number(url.searchParams.get("n")), name = url.searchParams.get("name") ?? "";
  const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const kind = mediaKind(type);
  if (!UPLOAD_ID.test(id) || !Number.isInteger(n) || n < 0 || n >= MAX_FILES) return bad("invalid");
  if (!kind) return bad("type");
  const size = Number(request.headers.get("content-length"));
  const limit = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!Number.isFinite(size) || size <= 0 || size > limit) return bad("too_large", 413);
  if (!request.body) return bad("invalid");
  const key = mediaKey(id, n, name, type, now);
  try {
    await bucket.put(key, request.body, { httpMetadata: { contentType: type }, customMetadata: { name: safeName(name), kind, uploadId: id.toLowerCase(), at: now.toISOString() } });
  } catch (err) { console.error("review upload:", err instanceof Error ? err.message : err); return bad("store_failed", 502); }
  return Response.json({ ok: true, key, size, type, kind });
}

export interface ReviewMeta {
  id: string; at: string; experience: string; rating: number; title?: string; body: string; name: string; email?: string; country?: string; party?: string; date?: string; ref?: string; lang: string;
  /** Publishing the review on the site with the first name (always required). */
  consent: boolean;
  /** Using the photos and videos on the website and social media. */
  mediaConsent: boolean;
  media: MediaItem[];
}
export const metaKey = (uploadId: string, now: Date) => `${MEDIA_PREFIX}${month(now)}/${uploadId.toLowerCase()}/meta.json`;

/** Keeps the submission beside its files; only media the guest actually uploaded under this id is kept. */
export async function writeReviewMeta(bucket: R2Like, meta: ReviewMeta, now = new Date()): Promise<string> {
  const checked: MediaItem[] = [];
  for (const m of meta.media.slice(0, MAX_FILES)) {
    if (!isMediaKeyFor(m.key, meta.id)) continue;
    const head = await bucket.head(m.key);
    if (head) checked.push({ key: m.key, name: m.name, type: head.httpMetadata?.contentType ?? m.type, size: head.size });
  }
  const key = metaKey(meta.id, now);
  await bucket.put(key, JSON.stringify({ ...meta, media: checked }), { httpMetadata: { contentType: "application/json" } });
  return key;
}

export async function listReviewSubmissions(bucket: R2Like, limit = 200): Promise<ReviewMeta[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: MEDIA_PREFIX, cursor, limit: 1000 });
    for (const o of page.objects) if (o.key.endsWith("/meta.json")) keys.push(o.key);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor && keys.length < 5000);
  const out: ReviewMeta[] = [];
  for (const k of keys.sort().reverse().slice(0, limit)) {
    const o = await bucket.get(k);
    if (!o) continue;
    try { out.push(JSON.parse(await o.text()) as ReviewMeta); } catch { /* skip a broken file */ }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}

/** Streams one object to staff; inline for images and videos, download otherwise. */
export async function serveMedia(bucket: R2Like, key: string, download = false, prefix: string = MEDIA_PREFIX): Promise<Response> {
  if (!key.startsWith(prefix) || key.includes("..")) return new Response("not found", { status: 404 });
  const o = await bucket.get(key);
  if (!o || !o.body) return new Response("not found", { status: 404 });
  const type = o.httpMetadata?.contentType ?? "application/octet-stream";
  const name = o.customMetadata?.name ?? key.split("/").pop() ?? "file";
  return new Response(o.body, { headers: { "content-type": type, "content-length": String(o.size), "cache-control": "private, no-store", "x-robots-tag": "noindex", "content-disposition": `${download ? "attachment" : "inline"}; filename="${name}"` } });
}
