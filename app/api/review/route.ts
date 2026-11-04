// Guest reviews from /{lang}/review/. Nothing is published automatically:
// the review lands in the hello@ inbox (photos attached), is matched to a
// booking, and is then added to lib/reviews.ts by hand.

import { CONTACT_EMAIL } from "@/lib/contact";
import { isBucket, isMediaKeyFor, writeReviewMeta, MAX_FILES, type MediaItem } from "@/lib/review-media";

async function bindings() {
  try {
    const [{ env }, { EmailMessage }] = await Promise.all([import("cloudflare:workers"), import("cloudflare:email")]);
    return { env, EmailMessage };
  } catch {
    return null;
  }
}

const FROM = "enquiries@kamehame-japan.com";
const MAX = { title: 90, body: 2000, name: 40, email: 200, country: 60, party: 20, date: 10, ref: 40, experience: 80, lang: 5 };
const UPLOAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 2_500_000; // base64 length; ~1.8 MB decoded

interface ReviewSubmission {
  experience: string; rating: number; title?: string; body: string; name: string; email: string; country: string;
  party?: string; date?: string; ref?: string; lang: string; consent: boolean; website?: string;
  photos: { name: string; type: string; data: string }[];
  /** Files already in the MEDIA bucket (lib/review-media.ts) and the permission to use them on the site and social media. */
  uploadId?: string; media: MediaItem[]; mediaConsent: boolean;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "");

function parse(b: Record<string, unknown>): ReviewSubmission | null {
  if (!b || typeof b !== "object") return null;
  const rating = Number(b.rating);
  const body = typeof b.body === "string" ? b.body.trim().slice(0, MAX.body) : "";
  const name = clean(b.name, MAX.name); const email = clean(b.email, MAX.email); const country = clean(b.country, MAX.country);
  if (!Number.isInteger(rating) || !(rating >= 1 && rating <= 5) || !body || !name || !(b.consent === "yes" || b.consent === true)) return null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (b.photos !== undefined && (!Array.isArray(b.photos) || b.photos.length > MAX_PHOTOS)) return null;
  const photosIn = Array.isArray(b.photos) ? b.photos as unknown[] : [];
  const photos = photosIn.flatMap((p) => {
    if (!p || typeof p !== "object") return [];
    const { name: n, type, data } = p as Record<string, unknown>;
    if (typeof data !== "string" || data.length > MAX_PHOTO_BYTES || !/^[A-Za-z0-9+/=]+$/.test(data)) return [];
    return [{ name: clean(n, 80) || "photo.jpg", type: type === "image/png" ? "image/png" : "image/jpeg", data }];
  });
  if (photos.length !== photosIn.length) return null;
  const uploadId = typeof b.uploadId === "string" && UPLOAD_ID.test(b.uploadId) ? b.uploadId.toLowerCase() : undefined;
  const mediaIn = Array.isArray(b.media) ? (b.media as unknown[]).slice(0, MAX_FILES) : [];
  const media: MediaItem[] = uploadId ? mediaIn.flatMap((m) => {
    if (!m || typeof m !== "object") return [];
    const { key, name: n, type, size } = m as Record<string, unknown>;
    if (typeof key !== "string" || !isMediaKeyFor(key, uploadId)) return [];
    return [{ key, name: clean(n, 80) || "file", type: clean(type, 40), size: Number(size) || 0 }];
  }) : [];
  return {
    experience: clean(b.experience, MAX.experience), rating, title: clean(b.title, MAX.title) || undefined, body, name, email, country,
    party: clean(b.party, MAX.party) || undefined, date: clean(b.date, MAX.date) || undefined, ref: clean(b.ref, MAX.ref) || undefined,
    lang: clean(b.lang, MAX.lang) || "en", consent: b.consent === "yes" || b.consent === true, website: clean(b.website, 200) || undefined, photos,
    uploadId, media, mediaConsent: b.mediaConsent === "yes" || b.mediaConsent === true,
  };
}

function text(r: ReviewSubmission, stored: string | null): string {
  return [
    `Experience: ${r.experience}`,
    `Rating:     ${r.rating} / 5`,
    r.title && `Title:      ${r.title}`,
    `Name:       ${r.name}`,
    r.country && `Country:    ${r.country}`,
    r.email && `Email:      ${r.email}`,
    r.party && `Party:      ${r.party}`,
    r.date && `Date:       ${r.date}`,
    r.ref && `Booking:    ${r.ref}`,
    `Language:   ${r.lang}`,
    `Consent:    ${r.consent ? "yes" : "no"}`,
    `Photos:     ${r.photos.length} attached`,
    `Media:      ${r.media.length ? `${r.media.length} file(s) in the MEDIA bucket · https://kamehame-japan.com/ops/reviews/` : "none uploaded"}`,
    ...r.media.map((m) => `            - ${m.name} (${m.type}, ${(m.size / 1048576).toFixed(1)} MB) ${m.key}`),
    `Site/SNS use of photos & videos: ${r.mediaConsent ? "PERMITTED by the guest" : "not permitted (review text only)"}`,
    stored ? `Stored:     ${stored}` : (r.media.length ? "Stored:     (bucket unavailable: the file list above could not be confirmed)" : undefined),
    "",
    r.body,
    "",
    "— To publish: add to lib/reviews.ts with source \"direct\" and verified: true once matched to a booking.",
  ].filter((l): l is string => typeof l === "string").join("\n");
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; } catch { return Response.json({ ok: false, error: "bad_json" }, { status: 400 }); }
  const r = parse(body);
  if (!r) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  if (r.website) return Response.json({ ok: true });

  const cf = await bindings();
  const to = cf?.env.CONTACT_TO; const key = cf?.env.RESEND_API_KEY;
  if (!cf || !to || (!key && !cf.env.EMAIL)) {
    console.error("review: CONTACT_TO secret, or both RESEND_API_KEY and the send_email binding, missing");
    return Response.json({ ok: false, error: "unconfigured", fallback: CONTACT_EMAIL }, { status: 503 });
  }
  const subject = `[Review] ${r.experience} — ${r.rating}★ — ${r.name}${r.ref ? ` — ${r.ref}` : ""}${r.media.length ? ` — ${r.media.length} media` : ""}`;
  // The submission beside its files, so /ops/reviews/ can list it with the permissions given.
  let stored: string | null = null;
  if (r.uploadId && isBucket(cf.env.MEDIA)) {
    try {
      stored = await writeReviewMeta(cf.env.MEDIA, { id: r.uploadId, at: new Date().toISOString(), experience: r.experience, rating: r.rating, title: r.title, body: r.body, name: r.name, email: r.email || undefined, country: r.country || undefined, party: r.party, date: r.date, ref: r.ref, lang: r.lang, consent: r.consent, mediaConsent: r.mediaConsent, media: r.media });
    } catch (err) { console.error("review: meta", err instanceof Error ? err.message : err); }
  }

  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `KAMEHAME JAPAN Site <${FROM}>`, to: [to], ...(r.email ? { reply_to: r.email } : {}), subject, text: text(r, stored),
        attachments: r.photos.map((p, i) => ({ filename: `${i + 1}-${p.name}`, content: p.data, content_type: p.type })),
        tags: [{ name: "kind", value: "review" }],
      }),
    });
    if (res.ok) return Response.json({ ok: true });
    console.error("review: resend", res.status, (await res.text()).slice(0, 300));
    if (!cf.env.EMAIL) return Response.json({ ok: false, error: "send_failed", fallback: CONTACT_EMAIL }, { status: 502 });
  }

  // Preserve photos on the fallback transport as MIME attachments too.
  if (!cf.env.EMAIL) return Response.json({ ok: false, error: "send_failed", fallback: CONTACT_EMAIL }, { status: 502 });
  try {
    const boundary = `review-${crypto.randomUUID()}`;
    const encode = (value: string) => btoa(unescape(encodeURIComponent(value)));
    const wrap = (value: string) => value.match(/.{1,76}/g)?.join("\r\n") ?? "";
    const raw = [
      `Message-ID: <${crypto.randomUUID()}@kamehame-japan.com>`, `Date: ${new Date().toUTCString()}`,
      `From: KAMEHAME JAPAN <${FROM}>`, `To: ${to}`, ...(r.email ? [`Reply-To: ${r.email}`] : []),
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`, `Content-Type: multipart/mixed; boundary="${boundary}"`, "",
      `--${boundary}`, `Content-Type: text/plain; charset=UTF-8`, `Content-Transfer-Encoding: base64`, "",
      wrap(encode(text(r, stored))),
      ...r.photos.flatMap((p, i) => [
        `--${boundary}`, `Content-Type: ${p.type}`,
        `Content-Disposition: attachment; filename="photo-${i + 1}.${p.type === "image/png" ? "png" : "jpg"}"`,
        `Content-Transfer-Encoding: base64`, "", wrap(p.data),
      ]),
      `--${boundary}--`, "",
    ].join("\r\n");
    await cf.env.EMAIL.send(new cf.EmailMessage(FROM, to, raw));
    return Response.json({ ok: true });
  } catch (err) {
    console.error("review: send_email", err);
    return Response.json({ ok: false, error: "send_failed", fallback: CONTACT_EMAIL }, { status: 502 });
  }
}
