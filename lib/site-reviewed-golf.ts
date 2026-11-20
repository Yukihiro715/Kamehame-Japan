import { isBucket, MAX_IMAGE_BYTES, type R2Like } from "./review-media";
import { REVIEWS_PUBLISHED, type Review } from "./reviews";

// Website publication only. The approved review and uploads stay in the
// private MEDIA bucket; the repository has only irreversible fingerprints.
const APPROVAL = {
  month: "2026-11",
  record: "be01e6fb2c86ee2ca14e33bcb2dcf873f98688506f8fabc161265f91c5e8f734",
  body: "16e571970bc131161b06b6ffe5257f0133bbfa03e1179c1307721d93a4a5af7d",
  photos: [
    "2c425c5749c3ad6556a4d32baf0c8e00e906538d1ee4ca2f42277cfc592d1e20",
    "4008d68bdf4b441f0869d812ec09891139f70b18d0625a311e830838525a2d5f",
    "73eaaaa332891d086d5a86b9155cab133376c5855c7651b8e4d15cc925500f81",
  ],
  windowStart: Date.parse("2026-11-20T06:32:00Z"),
  windowEnd: Date.parse("2026-11-20T06:36:00Z"),
  date: "2026-11-10",
  experience: "mt-fuji-golf-day",
  rating: 5,
};

export const SITE_GOLF_REVIEW_ID = "verified-round-2026-11-b";
export const SITE_GOLF_REVIEW_HEADER = "x-kh-site-golf-review";
const PHOTO_BASE = "/media/guest-reviews/verified-round-2026-11-b";
const MAX_META_BYTES = 16_384;
const MAX_TRANSFORMED_BYTES = 3 * 1024 * 1024;
const digest = async (text: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), b => b.toString(16).padStart(2, "0")).join("");
const millis = (v: unknown) => v instanceof Date ? v.getTime() : typeof v === "string" ? Date.parse(v) : NaN;

type Approval = typeof APPROVAL;
type ApprovedGolfReview = {
  review: Review;
  submitted: number;
  orderedPhotoKeys: string[];
};

export async function approvedGolfReview(bucket: R2Like, approval: Approval = APPROVAL): Promise<ApprovedGolfReview | null> {
  const monthPrefix = `reviews/${approval.month}/`;
  const metaKeyPattern = new RegExp(`^${monthPrefix}[0-9a-f-]{36}/meta\\.json$`);
  let cursor: string | undefined;
  let key: string | undefined;
  // Bound private listing work. Only meta object paths are compared, never
  // enumerated or exposed to the caller.
  for (let page = 0; page < 8 && !key; page++) {
    const result = await bucket.list({ prefix: monthPrefix, cursor, limit: 1000 });
    for (const item of result.objects) {
      if (metaKeyPattern.test(item.key) && await digest(item.key) === approval.record) {
        key = item.key;
        break;
      }
    }
    if (!result.truncated || !result.cursor || result.cursor === cursor) break;
    cursor = result.cursor;
  }
  if (!key) return null;
  const object = await bucket.get(key);
  if (!object || object.size > MAX_META_BYTES) return null;
  let meta;
  try { meta = JSON.parse(await object.text()); } catch { return null; }
  if (!meta || typeof meta !== "object" || meta.consent !== true || meta.experience !== approval.experience ||
      meta.rating !== approval.rating || meta.lang !== "en" || typeof meta.name !== "string" ||
      typeof meta.body !== "string") return null;
  const at = millis(meta.at);
  if (!(at >= approval.windowStart && at <= approval.windowEnd)) return null;
  const author = meta.name.trim().split(/\s+/)[0];
  if (!author || author.length > 40) return null;
  const body = meta.body.trim().replace(/\r\n?/g, "\n");
  if (await digest(body) !== approval.body) return null;

  const allowedKeys = new Map<string, string>();
  if (meta.mediaConsent === true && Array.isArray(meta.media)) {
    const folder = key.slice(0, -"meta.json".length);
    for (const item of meta.media.slice(0, 5)) {
      if (!item || typeof item.key !== "string" || item.type !== "image/jpeg" ||
          !item.key.startsWith(folder) || !/^\d-[a-z0-9_-]+\.jpg$/i.test(item.key.slice(folder.length))) continue;
      const hash = await digest(item.key);
      if (approval.photos.includes(hash)) allowedKeys.set(hash, item.key);
    }
  }
  // Show the gallery only if the approved cover and all assigned slots are
  // present. Revoking just media consent does not hide the review text.
  const orderedPhotoKeys = approval.photos.every((hash) => allowedKeys.has(hash)) ? approval.photos.map((hash) => allowedKeys.get(hash)!) : [];
  const review: Review = {
    id: SITE_GOLF_REVIEW_ID, author, body, country: "", experience: approval.experience,
    rating: approval.rating, date: approval.date, source: "direct", verified: true,
    photos: orderedPhotoKeys.map((_, i) => `${PHOTO_BASE}/${i + 1}.webp`),
  };
  return { review, submitted: at, orderedPhotoKeys };
}

export async function siteGolfReview(): Promise<Review | null> {
  try {
    if (!REVIEWS_PUBLISHED) return null;
    const { env } = await import("cloudflare:workers");
    return isBucket(env.MEDIA) ? (await approvedGolfReview(env.MEDIA))?.review ?? null : null;
  } catch {
    // Storage unavailability never prevents the golf page from rendering.
    return null;
  }
}

// Only these three approved image ordinals (or their existing gallery thumbnail
// URLs) can be requested. No client-selected bucket keys or transforms.
const photoPattern = new RegExp(`^${PHOTO_BASE}/([123])(-600)?\\.webp$`);
export const isSiteGolfReviewPhoto = (path: string) => photoPattern.test(path);
type ImageBinding = {
  input(source: ReadableStream): {
    transform(options: Record<string, unknown>): {
      output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
    };
  };
};

/** Rebuild a static WebP from image chunks only, dropping all EXIF, XMP and
 * ICC data even if the upstream optimizer retained it. */
export function stripWebpMetadata(bytes: ArrayBuffer): Uint8Array<ArrayBuffer> | null {
  const data = new Uint8Array(bytes);
  const view = new DataView(bytes);
  const text = (offset: number) => String.fromCharCode(...data.subarray(offset, offset + 4));
  if (data.length < 20 || text(0) !== "RIFF" || text(8) !== "WEBP" || view.getUint32(4, true) !== data.length - 8) return null;
  const out = new Uint8Array(data.length);
  out.set(data.subarray(0, 12));
  let write = 12;
  let seenFrame = false;
  for (let read = 12; read < data.length;) {
    if (read + 8 > data.length) return null;
    const type = text(read);
    const size = view.getUint32(read + 4, true);
    const end = read + 8 + size + (size & 1);
    if (end > data.length) return null;
    if (type === "ANIM" || type === "ANMF") return null;
    if (type === "VP8 " || type === "VP8L" || type === "ALPH" || type === "VP8X") {
      if (type === "VP8X" && size !== 10) return null;
      const frame = type === "VP8 " || type === "VP8L";
      if (frame && seenFrame) return null;
      seenFrame ||= frame;
      out.set(data.subarray(read, end), write);
      if (type === "VP8X") out[write + 8] &= ~0x2c;
      if (size & 1) out[write + end - read - 1] = 0;
      write += end - read;
    }
    read = end;
  }
  if (!seenFrame) return null;
  new DataView(out.buffer).setUint32(4, write - 8, true);
  return out.subarray(0, write);
}

export async function serveSiteGolfReviewPhoto(request: Request, bucket: unknown, images: ImageBinding, approval = APPROVAL): Promise<Response> {
  const failure = () => new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
  const url = new URL(request.url);
  const match = photoPattern.exec(url.pathname);
  if (!REVIEWS_PUBLISHED || !match || url.search || !["GET", "HEAD"].includes(request.method) || !isBucket(bucket)) return failure();
  try {
    const selection = await approvedGolfReview(bucket, approval);
    const key = selection?.orderedPhotoKeys[Number(match[1]) - 1];
    if (!selection || !key) return failure();
    const actual = await bucket.get(key);
    // Late object replacement must not re-use a past site's image approval.
    if (!actual?.body || !(millis(actual.uploaded) <= selection.submitted) ||
        actual.httpMetadata?.contentType !== "image/jpeg" || actual.size > MAX_IMAGE_BYTES) return failure();
    const transformed = (await images.input(actual.body).transform({ width: match[2] ? 600 : 1200 }).output({ format: "image/webp", quality: 82 })).response();
    if (!transformed.ok || transformed.headers.get("content-type") !== "image/webp") return failure();
    const transformedBytes = await transformed.arrayBuffer();
    if (transformedBytes.byteLength > MAX_TRANSFORMED_BYTES) return failure();
    const clean = stripWebpMetadata(transformedBytes);
    if (!clean) return failure();
    return new Response(request.method === "HEAD" ? null : clean, { headers: {
      "content-type": "image/webp", "content-length": String(clean.byteLength),
      "cache-control": "no-store", "x-robots-tag": "noindex",
    } });
  } catch {
    return failure();
  }
}
