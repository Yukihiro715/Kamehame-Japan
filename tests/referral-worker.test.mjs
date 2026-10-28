// The Worker's referral entry point and the staging gate, against the built
// worker (dist/server/index.js) with a node:sqlite D1 stand-in as `DB`.
import assert from "node:assert/strict";
import test from "node:test";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  return (await import(workerUrl.href)).default;
}
const ctx = { waitUntil() {}, passThroughOnException() {} };
const assets = { fetch: async () => new Response("Not found", { status: 404 }) };

async function seed(db) {
  const now = new Date().toISOString();
  await db.batch([
    { sql: `INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES ('le1', 'Example Hotels Co.', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('h1', 'le1', 'HP-0001', 'Example Hotel Shinjuku', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO referral_links (id, token, hotel_id, medium, kind, target_path, status, created_at, updated_at) VALUES ('l1', 'exampletoken_0123456789', 'h1', 'brochure', 'qr', '/ja/tokyo/mt-fuji-golf-day/', 'active', ?, ?)`, params: [now, now] },
  ]);
}

test("/r/<token>: records the arrival, sets the session cookie and redirects to the link's page", async () => {
  const db = openTestDb();
  await seed(db);
  const w = await worker();
  const res = await w.fetch(new Request("https://kamehame-japan.com/r/exampletoken_0123456789", { headers: { "user-agent": UA } }), { ASSETS: assets, DB: db.d1 }, ctx);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://kamehame-japan.com/ja/tokyo/mt-fuji-golf-day/");
  assert.match(res.headers.get("set-cookie") ?? "", /^kh_ref=[A-Za-z0-9_-]{22}; Max-Age=2592000; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(res.headers.get("cache-control"), "no-store");
  const events = await db.all(`SELECT ua_class, excluded FROM referral_events`);
  assert.deepEqual(events, [{ ua_class: "human", excluded: 0 }]);
  assert.equal((await db.all(`SELECT id FROM referral_sessions`)).length, 1);
  // an unknown token still lands on the site, with nothing recorded and no cookie
  const miss = await w.fetch(new Request("https://kamehame-japan.com/r/unknowntoken_0123456789", { headers: { "user-agent": UA } }), { ASSETS: assets, DB: db.d1 }, ctx);
  assert.equal(miss.status, 302);
  assert.equal(miss.headers.get("location"), "https://kamehame-japan.com/en/");
  assert.equal(miss.headers.get("set-cookie"), null);
  // the operator's own test visit is kept apart from real arrivals
  await w.fetch(new Request("https://kamehame-japan.com/r/exampletoken_0123456789?kh_test=1", { headers: { "user-agent": UA } }), { ASSETS: assets, DB: db.d1 }, ctx);
  assert.deepEqual(await db.all(`SELECT ua_class, excluded FROM referral_events ORDER BY ua_class`), [{ ua_class: "human", excluded: 0 }, { ua_class: "test", excluded: 1 }]);
});

test("/r/<token> without a database: the visitor is still sent to the site", async () => {
  const w = await worker();
  const res = await w.fetch(new Request("https://kamehame-japan.com/r/exampletoken_0123456789", { headers: { "user-agent": UA } }), { ASSETS: assets }, ctx);
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://kamehame-japan.com/en/");
  assert.equal(res.headers.get("set-cookie"), null);
});

test("staging gate: locked without the secret, 401 without credentials, open with them, webhooks exempt", async () => {
  const w = await worker();
  const page = (env, headers = {}) => w.fetch(new Request("https://staging.example/en/", { headers: { accept: "text/html", ...headers } }), { ASSETS: assets, ...env }, ctx);
  assert.equal((await page({ KH_ENV: "staging" })).status, 503);
  const noAuth = await page({ KH_ENV: "staging", STAGING_BASIC_AUTH: "kame:hame" });
  assert.equal(noAuth.status, 401);
  assert.match(noAuth.headers.get("www-authenticate") ?? "", /^Basic /);
  const wrong = await page({ KH_ENV: "staging", STAGING_BASIC_AUTH: "kame:hame" }, { authorization: `Basic ${btoa("kame:nope")}` });
  assert.equal(wrong.status, 401);
  const right = await page({ KH_ENV: "staging", STAGING_BASIC_AUTH: "kame:hame" }, { authorization: `Basic ${btoa("kame:hame")}` });
  assert.equal(right.status, 200);
  // a bare password means the user "kame"
  assert.equal((await page({ KH_ENV: "staging", STAGING_BASIC_AUTH: "hame" }, { authorization: `Basic ${btoa("kame:hame")}` })).status, 200);
  assert.equal((await page({ KH_ENV: "staging", STAGING_BASIC_AUTH: " hame " }, { authorization: `Basic ${btoa("kame:hame")}` })).status, 200, "surrounding spaces are ignored");
  assert.equal(right.headers.get("x-robots-tag"), "noindex, nofollow", "staging pages are never indexed");
  const hook = await w.fetch(new Request("https://staging.example/api/webhooks/stripe", { method: "POST", body: "{}" }), { ASSETS: assets, KH_ENV: "staging", STAGING_BASIC_AUTH: "kame:hame" }, ctx);
  assert.notEqual(hook.status, 401, "webhooks authenticate with their own signatures");
  // production is untouched
  assert.equal((await page({})).status, 200);
});
