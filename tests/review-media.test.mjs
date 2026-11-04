// Photos and videos with a review: the upload endpoint, the meta.json beside
// the files, and the staff listing (lib/review-media.ts).
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const M = await vite.ssrLoadModule("/lib/review-media.ts");

/** An in-memory stand-in for the R2 binding. */
function bucket() {
  const store = new Map();
  return {
    store,
    async put(key, value, options = {}) {
      const body = typeof value === "string" ? value : value instanceof ArrayBuffer ? new TextDecoder().decode(value) : await new Response(value).text();
      store.set(key, { key, body, size: new TextEncoder().encode(body).length, httpMetadata: options.httpMetadata ?? {}, customMetadata: options.customMetadata ?? {}, uploaded: new Date() });
    },
    async get(key) { const o = store.get(key); return o ? { ...o, body: new Response(o.body).body, text: async () => o.body } : null; },
    async head(key) { const o = store.get(key); return o ? { key, size: o.size, httpMetadata: o.httpMetadata, customMetadata: o.customMetadata } : null; },
    async list({ prefix = "" } = {}) { return { objects: [...store.values()].filter((o) => o.key.startsWith(prefix)).map((o) => ({ key: o.key, size: o.size })), truncated: false }; },
    async delete(key) { for (const k of [key].flat()) store.delete(k); },
  };
}
const NOW = new Date("2026-11-04T05:00:00Z");
const ID = "11111111-2222-4333-8444-555555555555";
const upload = (b, { id = ID, n = 0, name = "clip.mp4", type = "video/mp4", body = "video-bytes", length } = {}) =>
  M.handleReviewUpload(new Request(`https://kamehame-japan.com/api/review/upload?id=${id}&n=${n}&name=${encodeURIComponent(name)}`, { method: "POST", headers: { "content-type": type, "content-length": String(length ?? body.length) }, body }), b, NOW);

test("upload: stored under the upload id with its type and name; bad ids, types and sizes refused; no bucket = 503", async () => {
  const b = bucket();
  const ok = await (await upload(b, { name: "Dinner at the house.MOV", type: "video/quicktime" })).json();
  assert.equal(ok.ok, true); assert.equal(ok.key, `reviews/2026-11/${ID}/0-Dinner-at-the-house.mov`); assert.equal(ok.kind, "video");
  const stored = b.store.get(ok.key); assert.equal(stored.httpMetadata.contentType, "video/quicktime"); assert.equal(stored.customMetadata.uploadId, ID); assert.equal(stored.body, "video-bytes");
  assert.equal((await upload(b, { id: "not-an-id" })).status, 400);
  assert.equal((await upload(b, { type: "application/pdf", name: "x.pdf" })).status, 400);
  assert.equal((await upload(b, { n: 5 })).status, 400, "at most five files");
  assert.equal((await upload(b, { length: 101 * 1024 * 1024 })).status, 413);
  assert.equal((await upload(b, { type: "image/jpeg", name: "p.jpg", length: 13 * 1024 * 1024 })).status, 413, "photos have a smaller limit");
  assert.equal((await upload(null)).status, 503);
});

test("meta.json keeps only files that exist under this id; the staff listing reads it back newest first; files stream with their type", async () => {
  const b = bucket();
  const a = await (await upload(b, { n: 0, name: "a.jpg", type: "image/jpeg" })).json();
  const v = await (await upload(b, { n: 1, name: "b.mp4" })).json();
  const other = await (await upload(b, { id: "99999999-2222-4333-8444-555555555555", n: 0, name: "theirs.mp4" })).json();
  const meta = { id: ID, at: NOW.toISOString(), experience: "evening-with-geiko", rating: 5, body: "Wonderful.", name: "Emily", lang: "en", consent: true, mediaConsent: true,
    media: [{ key: a.key, name: "a.jpg", type: "image/jpeg", size: 1 }, { key: v.key, name: "b.mp4", type: "video/mp4", size: 1 }, { key: other.key, name: "theirs.mp4", type: "video/mp4", size: 1 }, { key: `reviews/2026-11/${ID}/9-missing.mp4`, name: "m", type: "video/mp4", size: 1 }] };
  const key = await M.writeReviewMeta(b, meta, NOW);
  assert.equal(key, `reviews/2026-11/${ID}/meta.json`);
  const saved = JSON.parse(b.store.get(key).body);
  assert.deepEqual(saved.media.map((m) => m.key), [a.key, v.key], "another guest's file and a missing file are dropped");
  assert.equal(saved.media[1].type, "video/mp4"); assert.equal(saved.mediaConsent, true);
  await M.writeReviewMeta(b, { ...meta, id: "99999999-2222-4333-8444-555555555555", at: "2026-11-05T00:00:00Z", name: "Later", mediaConsent: false, media: [] }, new Date("2026-11-05T00:00:00Z"));
  const rows = await M.listReviewSubmissions(b);
  assert.deepEqual(rows.map((r) => [r.name, r.mediaConsent, r.media.length]), [["Later", false, 0], ["Emily", true, 2]]);
  const res = await M.serveMedia(b, v.key);
  assert.equal(res.status, 200); assert.equal(res.headers.get("content-type"), "video/mp4"); assert.match(res.headers.get("content-disposition"), /inline; filename="b.mp4"/);
  assert.equal((await M.serveMedia(b, "../etc/passwd")).status, 404); assert.equal((await M.serveMedia(b, "reviews/2026-11/nope.mp4")).status, 404);
  assert.equal(M.isMediaKeyFor(key, ID), false, "the meta file is never claimed as media");
});
