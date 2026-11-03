// "Popular right now": demand ranking from the ledger, the manual order, and
// the default order when there is no demand (lib/popular.ts).
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const P = await vite.ssrLoadModule("/lib/popular.ts");
const { d1Db } = await vite.ssrLoadModule("/lib/referral/db.ts");

const NOW = new Date("2026-11-03T03:00:00Z");
const day = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
async function reservation(db, slug, i, at, status = "confirmed") {
  await db.run(`INSERT INTO reservations (id, request_id, flow, experience_slug, status, created_at, updated_at) VALUES (?, ?, 'experience', ?, ?, ?, ?)`, [`r${i}`, `rq${i}`, slug, status, at, at]);
}

test("no demand: the default order, live experiences only, four cards", async () => {
  const db = d1Db(openTestDb().d1);
  const r = await P.popularSlugs(db, NOW);
  assert.equal(r.mode, "auto");
  assert.deepEqual(r.slugs.slice(0, 4), P.DEFAULT_POPULAR.slice(0, 4)); assert.equal(r.slugs.length, 8, "spare candidates for languages that lack some");
  assert.deepEqual((await P.popularSlugs(null, NOW)).slugs, r.slugs, "without a database the same default order");
});

test("demand ranks: reservations count three, bus enquiries one, cancelled and old ones ignored, padded from the default", async () => {
  const db = d1Db(openTestDb().d1);
  await reservation(db, "shibuya-ramen-class", 1, day(3));
  await reservation(db, "shibuya-ramen-class", 2, day(10));
  await reservation(db, "kanji-name-calligraphy", 3, day(5));
  await reservation(db, "kanji-name-calligraphy", 4, day(6), "cancelled");
  await reservation(db, "evening-with-geiko", 5, day(120), "confirmed"); // outside the window
  await reservation(db, "nerima-herbal-bath-private-spa", 6, day(1)); // preview: never shown
  for (let i = 0; i < 4; i++) await db.run(`INSERT INTO bus_tour_enquiries (id, reference, request_id, tour_id, tour_date, course, pickup, people, source_yen, fee_yen, per_person_yen, tours_yen, rentals_yen, total_yen, name, email, status, created_at, updated_at) VALUES (?, ?, ?, '1-1-1', '2026-11-20', 'c', 'p', 1, 1, 1, 1, 1, 0, 1, 'n', 'e', 'received', ?, ?)`, [`b${i}`, `GP-${i}`, `u${i}`, day(2), day(2)]);
  const r = await P.popularSlugs(db, NOW);
  assert.deepEqual(r.demand.map((d) => [d.slug, d.score]), [["shibuya-ramen-class", 6], ["mt-fuji-golf-day", 4], ["kanji-name-calligraphy", 3], ["nerima-herbal-bath-private-spa", 3]]);
  assert.deepEqual(r.slugs.slice(0, 4), ["shibuya-ramen-class", "mt-fuji-golf-day", "kanji-name-calligraphy", "evening-with-geiko"]);
  const ov = await P.popularOverview(db, NOW);
  assert.equal(ov.effective[0].slug, "shibuya-ramen-class"); assert.ok(ov.experiences.every((e) => e.title && e.city));
});

test("manual order wins, unknown and preview slugs are dropped, the page's language and cache behave", async () => {
  const db = d1Db(openTestDb().d1);
  await reservation(db, "shibuya-ramen-class", 1, day(3));
  const saved = await P.savePopularSetting(db, { mode: "manual", slugs: ["kyoto-garden-teahouse-tea-ceremony", "nope", "nerima-herbal-bath-private-spa", "mt-fuji-golf-day"], by: "ops@example.com" });
  assert.deepEqual(saved.slugs, ["kyoto-garden-teahouse-tea-ceremony", "mt-fuji-golf-day"]);
  const r = await P.popularSlugs(db, NOW);
  assert.equal(r.mode, "manual");
  assert.deepEqual(r.slugs.slice(0, 4), ["kyoto-garden-teahouse-tea-ceremony", "mt-fuji-golf-day", "evening-with-geiko", "shibuya-ramen-class"]);
  P.resetPopularCache();
  const ja = await P.popularExperiences(db, "ja", NOW);
  assert.equal(ja.length, 4, "four cards even though the Japanese catalog lacks the garden tea ceremony"); assert.equal(ja[0].slug, "mt-fuji-golf-day");
  P.resetPopularCache(); const en = await P.popularExperiences(db, "en", NOW); assert.equal(en[0].slug, "kyoto-garden-teahouse-tea-ceremony"); assert.match(ja[0].title, /[぀-ヿ一-鿿]/, "Japanese title on the Japanese page");
  await assert.rejects(P.savePopularSetting(db, { mode: "manual", slugs: [], by: "ops@example.com" }), /slugs_required/);
  const log = await db.first(`SELECT action, actor FROM audit_logs WHERE action = 'popular.update'`);
  assert.deepEqual(log, { action: "popular.update", actor: "ops@example.com" });
});
