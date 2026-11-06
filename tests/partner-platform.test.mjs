// Partner platform, step 2a (docs/PARTNER_PLATFORM_STAGE1.md 4.1–4.3): hotels
// read as partner sites after the migration, type and features are
// independent (T-N01), an individual guide or a branch-less agency is one
// entity with one site (T-N02), and a site with link referral switched off
// gives no new referral session while everything else stays as it was.
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const { handlePortalApi } = await vite.ssrLoadModule("/lib/portal/api.ts");
const links = await vite.ssrLoadModule("/lib/referral/links.ts");

const ORIGIN = "https://staging.example";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1";
const now = new Date("2026-11-06T03:00:00Z").toISOString();

function client(db, jar = new Map()) {
  const env = { DB: db.d1, KH_ENV: "staging" };
  return {
    async call(method, path, body) {
      const headers = new Headers();
      if (method !== "GET") { headers.set("content-type", "application/json"); headers.set("origin", ORIGIN); headers.set("x-kh-portal", "1"); }
      if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
      const res = await handlePortalApi(new Request(`${ORIGIN}/api/portal/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }), env, path.split("?")[0].split("/"));
      for (const sc of res.headers.getSetCookie?.() ?? []) { const [kv] = sc.split(";"); const [k, v] = kv.split("="); if (v) jar.set(k, v); else jar.delete(k); }
      return { status: res.status, body: (res.headers.get("content-type") ?? "").includes("json") ? await res.json() : null };
    },
  };
}
async function signIn(c, email, kind) {
  const r1 = await c.call("POST", "auth/request-code", { email, kind });
  const r2 = await c.call("POST", "auth/verify", { email, code: r1.body.devCode, kind });
  assert.equal(r2.status, 200, JSON.stringify(r2.body));
}
async function seed(db) {
  await db.batch([
    { sql: `INSERT INTO users (id, email, name, status, created_at) VALUES ('u-admin', 'admin@example.com', 'Admin', 'active', ?)`, params: [now] },
    { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES ('m-admin', 'u-admin', 'ops_admin', 'ops', NULL, ?)`, params: [now] },
    // A hotel from before the migration: no partner columns given.
    { sql: `INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES ('le1', 'Example Hotels Co.', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('hA', 'le1', 'HP-0001', 'Hotel A', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES ('spA', 'le1', 'A payout', '2026-01-01', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spA', 'hA', '2026-01-01')` },
  ]);
}

test("after the migration an existing hotel reads as hotel / company / link referral and settlement on; the old roles still work", async () => {
  const db = openTestDb(); await seed(db);
  const ops = client(db); await signIn(ops, "admin@example.com", "ops");
  const list = (await ops.call("GET", "ops/partners")).body;
  // Migration 0011 seeds the owner's demo site beside the test's hotel; look at the hotel alone.
  assert.deepEqual(list.entities.filter((e) => e.id !== "le-prosent").map((e) => [e.partner_type, e.entity_kind]), [["hotel", "company"]]);
  const hA = list.hotels.find((h) => h.id === "hA");
  assert.deepEqual(hA.features, { refer: true, cases: false, settlement: true, members: false });
  assert.equal(hA.site_kind, "hotel");
  assert.equal((await ops.call("POST", "ops/hotels/hA/members", { email: "front@hotel-a.example", role: "hotel_viewer" })).status, 200);
  assert.equal((await ops.call("POST", "ops/hotels/hA/members", { email: "x@hotel-a.example", role: "partner_agent" })).status, 403, "relay roles need the relay feature, whatever the type");
});

test("T-N01: type and features are independent; T-N02: an agency without branches and an individual guide are one entity with one site", async () => {
  const db = openTestDb(); await seed(db);
  const ops = client(db); await signIn(ops, "admin@example.com", "ops");
  // An agency that may only refer links.
  const agency = (await ops.call("POST", "ops/legal-entities", { name: "Sakura Travel", partnerType: "agency", entityKind: "company", contactEmail: "desk@sakura.example", withSite: true, features: { refer: true, cases: false, settlement: true, members: false } })).body;
  assert.ok(agency.site?.id, "withSite creates the one site");
  const d1 = (await ops.call("GET", `ops/hotels/${agency.site.id}`)).body;
  assert.equal(d1.hotel.site_kind, "branch"); assert.equal(d1.entity.partner_type, "agency"); assert.deepEqual(d1.hotel.features.cases, false);
  assert.equal(d1.profiles.length, 1, "a settlement profile like a hotel's");
  assert.equal((await ops.call("POST", `ops/hotels/${agency.site.id}/members`, { email: "a@sakura.example", role: "partner_manager" })).status, 403);
  // Switch the relay on without touching the type: the role can now be given.
  assert.equal((await ops.call("POST", `ops/hotels/${agency.site.id}`, { features: { cases: true } })).status, 200);
  const d2 = (await ops.call("GET", `ops/hotels/${agency.site.id}`)).body;
  assert.deepEqual(d2.hotel.features, { refer: true, cases: true, settlement: true, members: false }); assert.equal(d2.entity.partner_type, "agency");
  assert.equal((await ops.call("POST", `ops/hotels/${agency.site.id}/members`, { email: "a@sakura.example", role: "partner_manager" })).status, 200);
  // A hotel may relay bookings too.
  assert.equal((await ops.call("POST", "ops/hotels/hA", { features: { cases: true } })).status, 200);
  assert.equal((await ops.call("POST", "ops/hotels/hA/members", { email: "x@hotel-a.example", role: "partner_agent" })).status, 200);
  // An individual guide.
  const guide = (await ops.call("POST", "ops/legal-entities", { name: "Yamada Taro", partnerType: "guide", entityKind: "individual", withSite: true })).body;
  const g = (await ops.call("GET", `ops/hotels/${guide.site.id}`)).body;
  assert.equal(g.hotel.site_kind, "guide"); assert.equal(g.entity.entity_kind, "individual"); assert.equal(g.hotel.name, "Yamada Taro");
  assert.equal((await ops.call("POST", `ops/hotels/${guide.site.id}/members`, { email: "taro@guide.example", role: "hotel_viewer" })).status, 200);
  const taro = client(db); await signIn(taro, "taro@guide.example", "hotel");
  const me = (await taro.call("GET", "hotel/me")).body;
  assert.equal(me.hotels.length, 1); assert.equal(me.hotels[0].site_kind, "guide"); assert.equal(me.hotels[0].features.refer, true);
  assert.equal((await taro.call("GET", `hotel/dashboard?hotel=${guide.site.id}`)).status, 200);
  assert.equal((await taro.call("GET", `hotel/dashboard?hotel=hA`)).status, 403, "another partner's site stays closed");
  // Entity details can be corrected.
  assert.equal((await ops.call("POST", `ops/legal-entities/${guide.id}`, { registrationStatus: "unregistered", contactEmail: "taro@guide.example" })).status, 200);
  assert.equal((await ops.call("GET", "ops/partners")).body.entities.find((e) => e.id === guide.id).registration_status, "unregistered");
});

test("link referral switched off: no new links or material, arrivals still reach the page without a session; switched back on, as before", async () => {
  const db = openTestDb(); await seed(db);
  const ops = client(db); await signIn(ops, "admin@example.com", "ops");
  const link = (await ops.call("POST", "ops/hotels/hA/links", { medium: "brochure", kind: "qr" })).body.link;
  const on = await links.handleReferralArrival(db, { token: link.token, userAgent: UA });
  assert.ok(on.setCookie, "a session while referral is on");
  assert.equal((await ops.call("POST", "ops/hotels/hA", { features: { refer: false } })).status, 200);
  const off = await links.handleReferralArrival(db, { token: link.token, userAgent: UA });
  assert.equal(off.setCookie, undefined, "no session while referral is off"); assert.equal(off.redirect, on.redirect, "the visitor still reaches the page");
  assert.equal((await ops.call("POST", "ops/hotels/hA/links", { medium: "front", kind: "url" })).status, 403);
  assert.equal((await ops.call("POST", "ops/hotels/hA/members", { email: "front@hotel-a.example", role: "hotel_viewer" })).status, 200);
  const front = client(db); await signIn(front, "front@hotel-a.example", "hotel");
  assert.equal((await front.call("POST", "hotel/materials", { hotel: "hA" })).status, 403);
  assert.equal((await front.call("GET", "hotel/dashboard?hotel=hA")).status, 200, "the dashboard is not a referral feature");
  assert.equal((await ops.call("POST", "ops/hotels/hA", { features: { refer: true } })).status, 200);
  assert.ok((await links.handleReferralArrival(db, { token: link.token, userAgent: UA })).setCookie);
  assert.equal((await front.call("POST", "hotel/materials", { hotel: "hA" })).status, 200);
});
