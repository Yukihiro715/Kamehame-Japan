// The portal API end to end on node:sqlite: sign-in by code, hotel scoping
// (T02, T03), materials and QR, dashboard numbers (T22), operations actions,
// CSV export and the request rules (CSRF, forged cookies) (T24).
import assert from "node:assert/strict";
import test, { after, before, mock } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const { handlePortalApi } = await vite.ssrLoadModule("/lib/portal/api.ts");
const auth = await vite.ssrLoadModule("/lib/portal/auth.ts");
const links = await vite.ssrLoadModule("/lib/referral/links.ts");
const R = await vite.ssrLoadModule("/lib/referral/reservations.ts");

// Keep API timestamps and expiring fixtures independent of the day CI runs.
before(() => mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-28T03:00:00Z") }));
after(() => mock.timers.reset());

const ORIGIN = "https://staging.example";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1";
let seq = 0;
const uuid = () => `11111111-2222-4333-8444-${String(++seq).padStart(12, "0")}`;
const iso = (t) => new Date(t).toISOString();
const T0 = Date.parse("2026-10-05T03:00:00Z"); // bookings in the past relative to the real clock the API uses

/** A client for the API: keeps cookies, sends the portal header and a same-origin Origin. */
function client(db, env = {}, jar = new Map()) {
  const fullEnv = { DB: db.d1, KH_ENV: "staging", ...env };
  return { db,
    jar,
    async call(method, path, body, opts = {}) {
      const headers = new Headers(opts.headers ?? {});
      if (method !== "GET") { headers.set("content-type", "application/json"); if (!opts.noOrigin) headers.set("origin", opts.origin ?? ORIGIN); if (!opts.noPortalHeader) headers.set("x-kh-portal", "1"); }
      if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
      const req = new Request(`${ORIGIN}/api/portal/${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
      const res = await handlePortalApi(req, fullEnv, path.split("?")[0].split("/"));
      for (const sc of res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")].filter(Boolean)) {
        const [kv] = sc.split(";"); const [k, v] = kv.split("=");
        if (v) jar.set(k, v); else jar.delete(k);
      }
      const type = res.headers.get("content-type") ?? "";
      return { status: res.status, headers: res.headers, body: type.includes("json") ? await res.json() : type.startsWith("image/png") ? new Uint8Array(await res.arrayBuffer()) : type.startsWith("text/csv") ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(await res.arrayBuffer()) : await res.text() };
    },
  };
}
async function signIn(c, email, kind) {
  if (kind === "hotel") {
    const { passwordHash } = await vite.ssrLoadModule("/lib/portal/password-auth.ts");
    const password = "fixture-password-123", salt = "test-only-salt";
    await c.db.run(`INSERT OR REPLACE INTO partner_passwords SELECT id,?,?,? FROM users WHERE email=?`, [salt, await passwordHash(password, salt), new Date().toISOString(), email]);
    const r = await c.call("POST", "auth/password-login", { email, password, kind });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    return;
  }
  const r1 = await c.call("POST", "auth/request-code", { email, kind });
  assert.equal(r1.status, 200);
  assert.ok(r1.body.devCode, "staging without mail shows the code");
  const r2 = await c.call("POST", "auth/verify", { email, code: r1.body.devCode, kind });
  assert.equal(r2.status, 200, JSON.stringify(r2.body));
  return r1.body.devCode;
}

async function seed(db) {
  const now = iso(T0);
  await db.batch([
    { sql: `INSERT INTO users (id, email, name, status, created_at) VALUES ('u-admin', 'admin@example.com', 'Admin', 'active', ?)`, params: [now] },
    { sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES ('m-admin', 'u-admin', 'ops_admin', 'ops', NULL, ?)`, params: [now] },
    { sql: `INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES ('le1', 'Example Hotels Co.', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('hA', 'le1', 'HP-0001', 'Hotel A', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('hB', 'le1', 'HP-0002', 'Hotel B', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES ('spA', 'le1', 'A payout', '2026-01-01', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES ('spB', 'le1', 'B payout', '2026-01-01', ?, ?)`, params: [now, now] },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spA', 'hA', '2026-01-01')` },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spB', 'hB', '2026-01-01')` },
    { sql: `INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, valid_from, version, created_at) VALUES ('pol1', 'kanji-name-calligraphy', 500, 1000, '2026-01-01T00:00:00Z', 1, ?)`, params: [now] },
  ]);
}

test("sign-in: a code by mail, five attempts, a session cookie; unknown addresses get the same answer", async () => {
  const db = openTestDb(); await seed(db);
  const c = client(db);
  const unknown = await c.call("POST", "auth/request-code", { email: "nobody@example.com", kind: "ops" });
  assert.deepEqual(unknown.body, { ok: true, sent: false });
  const r1 = await c.call("POST", "auth/request-code", { email: "Admin@Example.com ", kind: "ops" });
  assert.equal(r1.body.mail, "unconfigured"); assert.match(r1.body.devCode, /^\d{6}$/);
  for (let i = 0; i < 4; i++) assert.equal((await c.call("POST", "auth/verify", { email: "admin@example.com", code: "000000", kind: "ops" })).status, 401);
  const fifth = await c.call("POST", "auth/verify", { email: "admin@example.com", code: "000000", kind: "ops" });
  assert.equal(fifth.body.error, "locked");
  const right = await c.call("POST", "auth/verify", { email: "admin@example.com", code: r1.body.devCode, kind: "ops" });
  assert.equal(right.body.error, "locked", "the right code is dead after five wrong ones");
  // a new code works
  await signIn(c, "admin@example.com", "ops");
  assert.ok(c.jar.get("kh_sess_ops"));
  const me = await c.call("GET", "ops/me");
  assert.equal(me.status, 200); assert.deepEqual(me.body.roles, ["ops_admin"]);
  // the ops session does not open the hotel portal, and a forged cookie opens nothing
  assert.equal((await c.call("GET", "hotel/me")).status, 401);
  const forged = client(db); forged.jar.set("kh_sess_ops", "A".repeat(44));
  assert.equal((await forged.call("GET", "ops/me")).status, 401);
  // sign out revokes
  await c.call("POST", "auth/signout", { kind: "ops" });
  assert.equal((await c.call("GET", "ops/me")).status, 401);
});

test("request rules: no database → 503; state changes need the portal header and a same-origin Origin", async () => {
  const db = openTestDb(); await seed(db);
  const none = await handlePortalApi(new Request(`${ORIGIN}/api/portal/ops/me`), {}, ["ops", "me"]);
  assert.equal(none.status, 503);
  const c = client(db);
  assert.equal((await c.call("POST", "auth/request-code", { email: "admin@example.com", kind: "ops" }, { noPortalHeader: true })).status, 403);
  assert.equal((await c.call("POST", "auth/request-code", { email: "admin@example.com", kind: "ops" }, { origin: "https://evil.example" })).status, 403);
  assert.equal((await c.call("POST", "auth/request-code", { email: "admin@example.com", kind: "ops" }, { noOrigin: true })).status, 403);
});

test("T02/T03: a hotel user sees only their hotel; the same legal entity's other hotel is closed; billing covers a shared profile only with rights on every hotel", async () => {
  const db = openTestDb(); await seed(db);
  const admin = client(db); await signIn(admin, "admin@example.com", "ops");
  // invite a viewer to A and a billing user to B through the API
  const inv = await admin.call("POST", "ops/hotels/hA/members", { email: "front@hotel-a.example", name: "Front A", role: "hotel_viewer" });
  assert.equal(inv.status, 200); assert.equal(inv.body.mail, "unconfigured");
  assert.equal((await admin.call("POST", "ops/hotels/hB/members", { email: "billing@hotel-b.example", role: "hotel_billing" })).status, 200);
  assert.equal((await admin.call("POST", "ops/hotels/hA/members", { email: "x@hotel-a.example", role: "ops_admin" })).status, 400, "an ops role cannot be given on a hotel");
  const a = client(db); await signIn(a, "front@hotel-a.example", "hotel");
  const me = await a.call("GET", "hotel/me");
  assert.deepEqual(me.body.hotels.map((h) => h.id), ["hA"]);
  assert.equal((await a.call("GET", "hotel/dashboard?hotel=hA")).status, 200);
  assert.equal((await a.call("GET", "hotel/dashboard?hotel=hB")).status, 403);
  assert.equal((await a.call("GET", "hotel/reservations?hotel=hB")).status, 403);
  assert.equal((await a.call("POST", "hotel/materials", { hotel: "hB" })).status, 403);
  assert.equal((await a.call("GET", "ops/overview")).status, 401, "a hotel session is not an ops session");
  // a link of B cannot be rendered by A even by id
  const bLinks = await admin.call("POST", "ops/hotels/hB/links", { medium: "brochure", kind: "qr", label: "B brochure" });
  assert.equal(bLinks.status, 200);
  assert.equal((await a.call("GET", `hotel/qr?link=${bLinks.body.link.id}`)).status, 404);
  // profile visibility: a shared profile over A and B needs billing on both
  await db.run(`INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES ('spAB', 'le1', 'AB', '2026-01-01', ?, ?)`, [iso(T0), iso(T0)]);
  await db.run(`INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spAB', 'hA', '2026-01-01'), ('spAB', 'hB', '2026-01-01')`);
  const bUser = await auth.principalFromRequest(db, new Request(ORIGIN, { headers: { cookie: "" } }), "hotel"); // no cookie → null
  assert.equal(bUser, null);
  const billingB = { userId: "x", email: "billing@hotel-b.example", name: null, kind: "hotel", sessionId: "s", memberships: [{ id: "m", role: "hotel_billing", scopeType: "hotel", scopeId: "hB" }] };
  assert.equal(await auth.canSeeProfile(db, billingB, "spB"), true);
  assert.equal(await auth.canSeeProfile(db, billingB, "spAB"), false, "A is in the profile and B's user has no rights on A");
  const billingBoth = { ...billingB, memberships: [...billingB.memberships, { id: "m2", role: "hotel_billing", scopeType: "hotel", scopeId: "hA" }] };
  assert.equal(await auth.canSeeProfile(db, billingBoth, "spAB"), true);
  // revoking the only membership ends the session
  const detail = await admin.call("GET", "ops/hotels/hA");
  const membershipId = detail.body.members.find((m) => m.email === "front@hotel-a.example").membership_id;
  assert.equal((await admin.call("POST", `ops/members/${membershipId}/revoke`, {})).body.ok, true);
  assert.equal((await a.call("GET", "hotel/me")).status, 401);
});

test("materials: a QR/URL pair per target, SVG and PNG, pointing at the public origin", async () => {
  const db = openTestDb(); await seed(db);
  const admin = client(db); await signIn(admin, "admin@example.com", "ops");
  await admin.call("POST", "ops/hotels/hA/members", { email: "front@hotel-a.example", role: "hotel_viewer" });
  const a = client(db); await signIn(a, "front@hotel-a.example", "hotel");
  const all = await a.call("POST", "hotel/materials", {});
  assert.equal(all.status, 200);
  assert.match(all.body.qr.url, new RegExp(`^${ORIGIN}/r/[A-Za-z0-9_-]{22}$`), "staging links point at the staging origin");
  assert.notEqual(all.body.qr.url, all.body.url.url, "QR and copy links are told apart");
  const again = await a.call("POST", "hotel/materials", {});
  assert.equal(again.body.qr.id, all.body.qr.id, "asking twice returns the same pair");
  const perExp = await a.call("POST", "hotel/materials", { experience: "kanji-name-calligraphy" });
  assert.equal(perExp.status, 200);
  assert.equal((await a.call("POST", "hotel/materials", { experience: "no-such-experience" })).status, 400);
  const list = await a.call("GET", "hotel/materials");
  assert.equal(list.body.links.length, 4);
  const svg = await a.call("GET", `hotel/qr?link=${all.body.qr.id}`);
  assert.equal(svg.status, 200); assert.match(svg.headers.get("content-type"), /svg/); assert.match(svg.body, /^<svg /);
  const png = await a.call("GET", `hotel/qr?link=${all.body.qr.id}&format=png`);
  assert.equal(png.status, 200); assert.deepEqual([...png.body.slice(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.ok(png.body.length > 500);
  // the link works: a visit through it lands on the English home and sets the referral cookie
  const token = all.body.qr.url.split("/r/")[1];
  const arrival = await links.handleReferralArrival(db, { token, userAgent: UA, now: T0 });
  assert.equal(arrival.redirect, "/en/"); assert.ok(arrival.setCookie);
  // production origin unless a setting says otherwise
  const prod = client(db, { KH_ENV: "production" }, a.jar);
  const l2 = await prod.call("GET", "hotel/materials");
  assert.match(l2.body.links[0].url, /^https:\/\/kamehame-japan\.com\/r\//);
});

test("T22: dashboard numbers come from the same facts as the reservation list; balance is current, not per period", async () => {
  const db = openTestDb(); await seed(db);
  const admin = client(db); await signIn(admin, "admin@example.com", "ops");
  await admin.call("POST", "ops/hotels/hA/members", { email: "front@hotel-a.example", role: "hotel_viewer" });
  const a = client(db); await signIn(a, "front@hotel-a.example", "hotel");
  const pair = (await a.call("POST", "hotel/materials", {})).body;
  const token = pair.qr.url.split("/r/")[1];
  // Three arrivals: the browser keeps both cookies; repeat scans count once, bots are excluded.
  const v1 = await links.handleReferralArrival(db, { token, userAgent: UA, now: T0 });
  await links.handleReferralArrival(db, { token, userAgent: UA, now: T0 + 10 * 60000, cookie: [v1.setCookie, v1.visitorCookie].map(c => c.split(";")[0]).join("; ") });
  await links.handleReferralArrival(db, { token, userAgent: "Googlebot/2.1", now: T0 });
  const ctx = await links.activeReferral(db, v1.setCookie.split(";")[0], T0 + 20 * 60000);
  const r1 = await R.createReservation(db, { requestId: uuid(), flow: "experience", experienceSlug: "kanji-name-calligraphy", experienceDate: "2026-10-20", guests: 2, lang: "en", lines: [{ kind: "base", description: "Calligraphy × 2", commissionable: true, quantity: 2, grossJpy: 39600 }] }, ctx, T0 + 20 * 60000);
  const r2 = await R.createReservation(db, { requestId: uuid(), flow: "experience", experienceSlug: "kanji-name-calligraphy", experienceDate: "2026-10-21", guests: 1, lang: "en", lines: [{ kind: "base", description: "Calligraphy", commissionable: true, quantity: 2, grossJpy: 39600 }] }, ctx, T0 + 21 * 60000);
  // r1 paid and performed; r2 cancelled
  await R.applyPayment(db, r1.id, { eventId: "evt1", paymentIntent: "pi1", amountTotal: 39600, paymentStatus: "paid", occurredAt: iso(T0 + 3600000) }, T0 + 3600000);
  const att = await admin.call("POST", `ops/reservations/${r1.id}/attendance`, { performedAt: "2026-10-20T01:00:00Z" });
  assert.equal(att.status, 200, JSON.stringify(att.body));
  const out = await admin.call("POST", `ops/reservations/${r2.id}/outcome`, { outcome: "cancelled", reason: "guest cancelled" });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const dash = (await a.call("GET", "hotel/dashboard?from=2026-10-01&to=2026-10-31")).body;
  assert.deepEqual(dash.funnel, { accesses: 2, visits: 1, provisional: 0, confirmed: 1, paid: 1, fullyRefunded: 0, cancelled: 1, estimatedCommissionNet: 0 });
  assert.deepEqual(dash.confirmed, { count: 1, baseNet: 36000, commissionNet: 1800, commissionTaxRef: 180 });
  assert.deepEqual(dash.balance, { unpaidNet: 1800, unpaidTaxRef: 180, paid: 0 });
  const other = (await a.call("GET", "hotel/dashboard?from=2026-11-01&to=2026-11-30")).body;
  assert.equal(other.confirmed.count, 0); assert.equal(other.balance.unpaidNet, 1800, "the balance does not depend on the period");
  const list = (await a.call("GET", "hotel/reservations?hotel=hA")).body;
  assert.equal(list.total, 2);
  const row = list.rows.find((r) => r.experienceDate === "2026-10-20");
  assert.match(row.hotelRef, /^R-[23456789BCDFGHJKMNPQRSTVWXZ]{6}$/);
  assert.equal(row.commissionNet, 1800); assert.equal(row.commissionGrossRef, 1980); assert.equal(row.entryJa, "確定");
  for (const r of list.rows) for (const k of Object.keys(r)) assert.ok(!/email|name|phone|message/i.test(k), `no personal field ${k}`);
  assert.equal(list.rows.reduce((s, r) => s + (r.entryStatus === "confirmed" ? r.commissionNet : 0), 0), dash.confirmed.commissionNet, "drill-down matches the total");
});

test("operations: reasons are required, corrections keep history, manual lines and payments feed the ledger, CSV is guarded", async () => {
  const db = openTestDb(); await seed(db);
  const admin = client(db); await signIn(admin, "admin@example.com", "ops");
  const r = await R.createReservation(db, { requestId: uuid(), flow: "contact", experienceSlug: "kanji-name-calligraphy", experienceDate: "2026-10-25", guests: 2, lang: "en", lines: [], amountPending: true }, null, T0);
  // no referral: the ops user attributes it to Hotel A with a reason
  assert.equal((await admin.call("POST", `ops/reservations/${r.id}/referral`, { hotelId: "hA", reason: "" })).status, 400);
  const corr = await admin.call("POST", `ops/reservations/${r.id}/referral`, { hotelId: "hA", reason: "guest showed the hotel's brochure" });
  assert.equal(corr.status, 200); assert.equal(corr.body.referral.hotel_id, "hA"); assert.equal(corr.body.referral.basis, "manual");
  // amount pending → entry on hold; operations enter the lines
  let ex = (await admin.call("GET", "ops/exceptions")).body;
  assert.equal(ex.amountPending.length, 1);
  const withLines = await admin.call("POST", `ops/reservations/${r.id}/lines`, { lines: [{ kind: "base", description: "=SUM(A1)", commissionable: true, grossJpy: 22000 }, { kind: "onsite", description: "paid at venue", commissionable: false, grossJpy: 5000 }], reason: "quote agreed by mail" });
  assert.equal(withLines.status, 200); assert.equal(withLines.body.entry.base_net_jpy, 20000); assert.equal(withLines.body.entry.commission_net_jpy, 1000);
  // a manual payment (golf Payment Link style) and the attendance confirm it
  const paid = await admin.call("POST", `ops/reservations/${r.id}/payment`, { amountJpy: 22000, reference: "pl_test", reason: "Stripe dashboard shows the payment" });
  assert.equal(paid.body.reservation.payment_status, "paid");
  const done = await admin.call("POST", `ops/reservations/${r.id}/attendance`, { performedAt: "2026-10-25T02:00:00Z" });
  assert.equal(done.body.entry.status, "confirmed"); assert.equal(done.body.entry.settlement_profile_id, "spA");
  // move it to Hotel B: previous hotel and reason are kept
  const moved = await admin.call("POST", `ops/reservations/${r.id}/referral`, { hotelId: "hB", reason: "hotel B's QR, confirmed with the guest" });
  assert.equal(moved.body.referral.previous_hotel_id, "hA"); assert.equal(moved.body.referral.status, "corrected"); assert.equal(moved.body.entry.hotel_id, "hB"); assert.equal(moved.body.entry.settlement_profile_id, "spB");
  const logs = (await admin.call("GET", `ops/audit?type=reservation&q=${r.id}`)).body.rows;
  assert.ok(logs.some((l) => l.action === "referral.correct" && l.reason.includes("hotel B")));
  // CSV: the formula-looking description is neutralised, the BOM is present
  const csv = await admin.call("GET", "ops/export.csv?from=2026-10-01&to=2026-10-31");
  assert.equal(csv.status, 200); assert.ok(csv.body.startsWith("﻿"));
  assert.ok(csv.body.includes("HP-0002"), "the current hotel is exported");
  assert.ok(!/(^|,)=SUM/m.test(csv.body));
  // roles: a booking operator cannot export or set rates; a finance user can
  await admin.call("POST", "ops/ops-members", { email: "booking@example.com", role: "ops_booking" });
  const booking = client(db); await signIn(booking, "booking@example.com", "ops");
  assert.equal((await booking.call("GET", "ops/export.csv?from=2026-10-01&to=2026-10-31")).status, 403);
  assert.equal((await booking.call("POST", "ops/policies", { experienceSlug: "dotonbori-ramen-class", rateBp: 700 })).status, 403);
  assert.equal((await booking.call("POST", `ops/reservations/${r.id}/outcome`, { outcome: "confirmed", reason: "ok" })).status, 200);
  const pol = await admin.call("POST", "ops/policies", { experienceSlug: "dotonbori-ramen-class", rateBp: 700, referenceAvg: 53000, referenceNote: "運営入力" });
  assert.equal(pol.status, 200); assert.equal(pol.body.version, 1);
  const terms = (await admin.call("GET", "ops/policies")).body;
  assert.ok(terms.policies.some((p) => p.experience_slug === "dotonbori-ramen-class" && p.rate_bp === 700));
});

test("commission settings require finance/admin and partner reads use their own entity", async () => {
  const db = openTestDb(); await seed(db);
  const admin = client(db); await signIn(admin, 'admin@example.com', 'ops');
  assert.equal((await admin.call('POST', 'ops/commission-rates', { legalEntityId: null, rateBp: 600 })).status, 200);
  assert.equal((await admin.call('POST', 'ops/commission-rates', { legalEntityId: 'le1', rateBp: 800 })).status, 200);
  const list = await admin.call('GET', 'ops/policies');
  assert.equal(list.body.rateSettings.length, 3);
  // Owner's seeded demo membership can read only its own common rate, never le1's override.
  const hotel = client(db); await signIn(hotel, 'yukihiro_ito@prosent.co.jp', 'hotel');
  assert.equal((await hotel.call('POST', 'ops/commission-rates', { legalEntityId: null, rateBp: 999 })).status, 401);
  const terms = await hotel.call('GET', 'hotel/experiences?hotel=site-prosent-demo');
  assert.equal(terms.status, 200);
  assert.equal(terms.body.experiences.find(e => e.slug === 'kanji-name-calligraphy').rateBp, 600);
  await db.run(`UPDATE memberships SET role = 'ops_booking' WHERE id = 'm-admin'`);
  assert.equal((await admin.call('POST', 'ops/commission-rates', { legalEntityId: null, rateBp: 999 })).status, 403);
});

async function demoFixture(db) {
  const { pbkdf2Sync } = await import('node:crypto');
  const password = 'test-only-demo-pass';
  const salt = '0123456789abcdef0123456789abcdef';
  const hash = pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex');
  await db.run(`UPDATE demo_credentials SET salt_hex = ?, password_hash = ?, iterations = 100000`, [salt, hash]);
  return { email: 'demo@kamehame-japan.com', password, kind: 'hotel' };
}

test('demo password session: isolated reads, writes denied, sign-out and existing OTP preserved', async () => {
  const db = openTestDb(); await seed(db);
  const login = await demoFixture(db), demo = client(db);
  assert.equal((await demo.call('POST', 'auth/demo-login', { ...login, password: 'wrong' })).status, 401);
  assert.equal((await demo.call('POST', 'auth/demo-login', { ...login, email: 'demo@kamemane-japan.com' })).status, 401);
  assert.equal((await demo.call('POST', 'auth/demo-login', login, { noOrigin: true })).status, 403);
  const signed = await demo.call('POST', 'auth/demo-login', login);
  assert.equal(signed.status, 200);
  const cookie = signed.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /Max-Age=7200/);
  const me = (await demo.call('GET', 'hotel/me')).body;
  assert.equal(me.demo, true); assert.deepEqual(me.hotels.map(h => h.id), ['site-partner-public-demo']);
  for (const path of ['dashboard', 'experiences', 'reservations', 'materials', 'settlement', 'cases', 'case-options']) {
    assert.equal((await demo.call('GET', `hotel/${path}`)).status, 200, path);
  }
  assert.equal((await demo.call('GET', 'hotel/dashboard?hotel=site-prosent-demo')).status, 403);
  assert.equal((await demo.call('GET', 'ops/policies')).status, 401);
  for (const path of ['materials', 'cases', 'lang', 'cases/fake/messages', 'statements/fake/acknowledge']) {
    const r = await demo.call('POST', `hotel/${path}`, {});
    assert.equal(r.status, 403, path); assert.equal(r.body.error, 'demo_read_only');
  }
  // Even accidental extra memberships cannot expand the shared credential's scope.
  await db.run(`INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES ('extra-demo', 'u-partner-public-demo', 'partner_manager', 'hotel', 'hA', '')`);
  assert.equal((await demo.call('GET', 'hotel/dashboard?hotel=hA')).status, 403);
  assert.equal((await demo.call('POST', 'auth/demo-login', { ...login, kind: 'ops' })).status, 401);
  const code = await demo.call('POST', 'auth/request-code', { email: login.email, kind: 'hotel' });
  assert.equal(code.body.sent, false); assert.equal(code.body.devCode, undefined);
  assert.equal((await demo.call('POST', 'auth/verify', { email: login.email, kind: 'hotel', code: '123456' })).status, 401);
  const principalRequest = new Request(ORIGIN, { headers: { cookie: cookie.split(';')[0] } });
  assert.equal(await auth.principalFromRequest(db, principalRequest, 'hotel', Date.parse(signed.body.expiresAt) + 1), null);
  await demo.call('POST', 'auth/signout', { kind: 'hotel' });
  assert.equal((await demo.call('GET', 'hotel/me')).status, 401);
  const admin = client(db); await signIn(admin, 'admin@example.com', 'ops');
  assert.equal((await admin.call('GET', 'ops/policies')).status, 200);
});

test('demo attempts are bounded, sessions honor revocation and account disablement', async () => {
  const db = openTestDb(); const login = await demoFixture(db), demo = client(db);
  for (let i = 0; i < 10; i++) assert.equal((await demo.call('POST', 'auth/demo-login', { ...login, password: 'wrong' })).status, 401);
  assert.equal((await demo.call('POST', 'auth/demo-login', login)).status, 429);
  const other = client(db);
  assert.equal((await other.call('POST', 'auth/demo-login', login, { headers: { 'cf-connecting-ip': '192.0.2.1' } })).status, 200);
  await db.run(`UPDATE memberships SET revoked_at = '2026-01-01' WHERE id = 'm-public-demo-manager'`);
  assert.equal((await other.call('GET', 'hotel/me')).status, 401);
  await db.run(`UPDATE memberships SET revoked_at = NULL WHERE id = 'm-public-demo-manager'`);
  await db.run(`UPDATE users SET status = 'disabled' WHERE id = 'u-partner-public-demo'`);
  assert.equal((await other.call('GET', 'hotel/me')).status, 401);
});

test('partner password setup mail, login, reset revocation, token replay and OTP retirement', async (t) => {
  const db = openTestDb(); await seed(db);
  await auth.inviteMember(db, { KH_ENV: 'staging' }, { email: 'password@example.com', role: 'hotel_viewer', scopeType: 'hotel', scopeId: 'hA', by: 'test', loginOrigin: ORIGIN, scopeLabel: 'A' });
  const mails = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => { mails.push(JSON.parse(init.body)); return new Response('{}', { status: 200 }); });
  const c = client(db, { RESEND_API_KEY: 'test', NOTIFY_ALLOWLIST: '@example.com' });
  const request = async email => c.call('POST', 'auth/password-request', { email, kind: 'hotel' });
  assert.deepEqual((await request('nobody@example.com')).body, { ok: true });
  assert.equal(mails.length, 0);
  assert.deepEqual((await request('password@example.com')).body, { ok: true });
  const token = mails.at(-1).text.match(/password-token=([A-Za-z0-9_-]+)/)[1];
  assert.ok(!JSON.stringify(await db.all('SELECT * FROM partner_password_tokens')).includes(token));
  const password = 'new-test-password-123';
  const set = (token, password) => c.call('POST', 'auth/password-set', { kind: 'hotel', token, password });
  assert.equal((await set(token, 'short')).status, 400);
  assert.equal((await set(token, password)).status, 200);
  assert.equal((await set(token, 'other-test-password')).status, 400);
  assert.equal((await c.call('POST', 'auth/password-login', { kind: 'hotel', email: 'password@example.com', password: 'wrong' })).status, 401);
  assert.equal((await c.call('POST', 'auth/password-login', { kind: 'hotel', email: 'password@example.com', password })).status, 200);
  assert.equal((await c.call('GET', 'hotel/me')).status, 200);
  assert.equal((await c.call('GET', 'ops/me')).status, 401);
  assert.equal((await c.call('POST', 'auth/password-login', { kind: 'ops', email: 'password@example.com', password })).status, 403);
  assert.equal((await c.call('POST', 'auth/password-login', { kind: 'hotel', email: 'password@example.com', password }, { noOrigin: true })).status, 403);
  assert.equal((await c.call('POST', 'auth/request-code', { kind: 'hotel', email: 'password@example.com' })).body.devCode, undefined);
  await request('password@example.com');
  const token2 = mails.at(-1).text.match(/password-token=([A-Za-z0-9_-]+)/)[1];
  const results = await Promise.all([set(token2, 'reset-password-one'), set(token2, 'reset-password-two')]);
  assert.deepEqual(results.map(r => r.status).sort(), [200,400]);
  assert.equal((await c.call('GET', 'hotel/me')).status, 401);
  assert.equal((await c.call('POST', 'auth/password-login', { kind: 'hotel', email: 'password@example.com', password })).status, 401);
  await request('password@example.com');
  const token3 = mails.at(-1).text.match(/password-token=([A-Za-z0-9_-]+)/)[1];
  await db.run(`UPDATE partner_password_tokens SET expires_at='2000-01-01' WHERE consumed_by IS NULL`);
  assert.equal((await set(token3, password)).status, 400);
});

test('demo samples filter correctly, agree with 5% totals, and never enter the ledger', async () => {
  const db = openTestDb(), login = await demoFixture(db), c = client(db);
  await c.call('POST', 'auth/demo-login', login);
  const rows = (await c.call('GET','hotel/reservations')).body;
  assert.equal(rows.total,60);
  assert.equal(rows.rows.length,25);
  assert.equal(rows.rows[0].hotelRef,'R-DEMO60');
  const completed = (await c.call('GET','hotel/reservations?status=completed&limit=500')).body;
  assert.equal(completed.total,30);
  for (const r of completed.rows) { assert.equal(r.rateBp,500); assert.equal(r.commissionNet,r.baseNet*.05); }
  const dash = (await c.call('GET','hotel/dashboard')).body;
  assert.equal(dash.confirmed.commissionNet,completed.rows.reduce((n,r) => n+r.commissionNet,0));
  assert.equal(dash.funnel.provisional,10);
  assert.equal(dash.funnel.confirmed,48);
  assert.equal(dash.funnel.visits,1620);
  assert.equal(dash.funnel.estimatedCommissionNet,66500);
  assert.equal((await c.call('GET','hotel/reservations?ref=missing')).body.total,0);
  const cases = (await c.call('GET','hotel/cases')).body;
  assert.equal(cases.total,3);
  assert.equal((await c.call('GET',`hotel/cases/${cases.rows[0].id}`)).status,200);
  assert.equal((await c.call('GET','hotel/cases/unknown')).status,404);
  assert.equal((await c.call('GET','hotel/settlement')).body.balance.unpaidNet,70000);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM reservations')).n,0);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM commission_entries')).n,0);
  assert.equal((await db.first("SELECT rate_bp FROM partner_commission_rates WHERE id='common-rate-five-percent'")).rate_bp,500);
});

test('normal partner password attempts are limited; disabled and revoked accounts cannot enter', async () => {
  const db = openTestDb(); await seed(db);
  await auth.inviteMember(db, {}, { email: 'limit@example.com', role: 'hotel_viewer', scopeType: 'hotel', scopeId: 'hA', by: 'test', loginOrigin: ORIGIN, scopeLabel: 'A' });
  const c = client(db); await signIn(c, 'limit@example.com', 'hotel');
  for (let i=0;i<9;i++) assert.equal((await c.call('POST','auth/password-login',{kind:'hotel',email:'limit@example.com',password:'wrong'})).status,401);
  assert.equal((await c.call('POST','auth/password-login',{kind:'hotel',email:'limit@example.com',password:'fixture-password-123'})).status,429);
  await db.run('DELETE FROM partner_auth_limits');
  await db.run("UPDATE users SET status='disabled' WHERE email='limit@example.com'");
  assert.equal((await c.call('GET','hotel/me')).status,401);
  assert.equal((await c.call('POST','auth/password-login',{kind:'hotel',email:'limit@example.com',password:'fixture-password-123'})).status,401);
  await db.run("UPDATE users SET status='active' WHERE email='limit@example.com'");
  await db.run("UPDATE memberships SET revoked_at='2026-01-01' WHERE user_id=(SELECT id FROM users WHERE email='limit@example.com')");
  assert.equal((await c.call('POST','auth/password-login',{kind:'hotel',email:'limit@example.com',password:'fixture-password-123'})).status,401);
});

test('bank updates require billing scope, encrypt account numbers and remain isolated from demo and booking operators', async()=>{
  const db=openTestDb();await seed(db);
  await auth.inviteMember(db,{}, {email:'billing@example.com',role:'hotel_billing',scopeType:'hotel',scopeId:'hA',by:'test',loginOrigin:ORIGIN,scopeLabel:'A'});
  const env={PORTAL_BANK_KEY:'ab'.repeat(32)}, c=client(db,env);await signIn(c,'billing@example.com','hotel');
  const input={profileId:'spA',bank:'Test Bank',branch:'Test Branch',type:'ordinary',number:'1234567',holder:'テスト'};
  assert.equal((await c.call('POST','hotel/bank',input,{noOrigin:true})).status,403);
  assert.equal((await c.call('POST','hotel/bank',{...input,profileId:'spB'})).status,403);
  assert.equal((await c.call('POST','hotel/bank',{...input,number:'123'})).status,400);
  assert.equal((await c.call('POST','hotel/bank',input)).status,200);
  const row=await db.first("SELECT * FROM settlement_profiles WHERE id='spA'");
  assert.ok(!row.bank_details_enc.includes('1234567'));assert.match(row.bank_details_masked,/\*\*\*4567/);
  const B=await vite.ssrLoadModule('/lib/portal/bank.ts');
  await assert.rejects(B.saveBank(db,'spA',input,'test'),/準備中/);
  await db.run("UPDATE settlement_profiles SET bank_details_enc=? WHERE id='spB'",[row.bank_details_enc]);
  await assert.rejects(B.readBank(db,'spB',env.PORTAL_BANK_KEY),'ciphertext is bound to its payment profile');
  const view=await c.call('GET','hotel/settlement');assert.ok(!JSON.stringify(view.body).includes('1234567'));assert.equal(view.body.profile.payee_name,'テスト');
  const admin=client(db,env);await signIn(admin,'admin@example.com','ops');
  assert.equal((await admin.call('GET','ops/bank/spA')).body.bank.number,'1234567');
  await db.run("UPDATE memberships SET role='ops_booking' WHERE id='m-admin'");
  assert.equal((await admin.call('GET','ops/bank/spA')).status,403);
  await db.run("INSERT INTO settlement_profile_hotels VALUES ('spA','hB','2026-01-01',NULL)");
  assert.equal((await c.call('POST','hotel/bank',input)).status,403,'billing rights on all grouped sites required');
  const login=await demoFixture(db), demo=client(db,env);await demo.call('POST','auth/demo-login',login);
  assert.equal((await demo.call('POST','hotel/bank',input)).status,403);
});

test('demo QR previews do not create live referral links and quarterly samples reconcile', async()=>{
  const db=openTestDb(),login=await demoFixture(db),c=client(db);await c.call('POST','auth/demo-login',login);
  const material=(await c.call('GET','hotel/demo-material?experience=kanji-name-calligraphy')).body;
  assert.match(material.url.url,/^https:\/\/example.invalid\//);
  assert.equal((await c.call('GET',`hotel/qr?link=${encodeURIComponent(material.qr.id)}`)).status,200);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM referral_links')).n,0);
  const settle=(await c.call('GET','hotel/settlement')).body;
  assert.equal(settle.quarters.filter(r=>r.status==='paid').reduce((n,r)=>n+r.transfer,0),settle.balance.paid);
  assert.equal(settle.quarters.find(r=>r.status==='accruing').transfer,null);
  assert.equal(settle.quarters.find(r=>r.status==='accruing').gross,settle.balance.unpaidNet + settle.balance.unpaidTaxRef);
});

test('quarterly payments exclude void/draft statements, retain actual transfers and separate unstated accruals', async()=>{
  const db=openTestDb();await seed(db);
  const S=await vite.ssrLoadModule('/lib/portal/settlement.ts');
  for (const [id,period,status,gross,transfer,carry] of [['paid','2026-Q1','settled',5500,5280,0],['void','2026-Q1','void',9900,9680,0],['scheduled','2026-Q2','issued',6600,6380,0],['carry','2026-Q3','issued',1100,0,1100],['draft','2026-Q4','draft',7700,7480,0]]) {
    await db.run(`INSERT INTO statements (id,profile_id,period,version,status,gross_jpy,transfer_jpy,carried_out_jpy,created_at,updated_at) VALUES (?,'spA',?,?, ?,?,?,?,'','')`,[id,period,id==='void'?2:1,status,gross,transfer,carry]);
  }
  const rows=await S.partnerQuarterPayments(db,'hA',await S.statementsOfProfiles(db,['spA']));
  assert.equal(rows.length,3);assert.equal(rows.find(r=>r.status==='paid').transfer,5280);assert.equal(await S.paidTotalForHotel(db,'hA'),5280);assert.equal(rows.find(r=>r.status==='carried').carried,1100);assert.equal(rows.find(r=>r.status==='scheduled').transfer,6380);
  const r=await R.createReservation(db,{requestId:'quarter',flow:'experience',experienceSlug:'kanji-name-calligraphy',lines:[{kind:'base',description:'test',commissionable:true,grossJpy:22000}]},{hotelId:'hA',chainProfileId:null,linkId:null,sessionId:null,medium:null});
  await db.run(`UPDATE commission_entries SET status='confirmed',hold_reason=NULL,performed_on_jst='2026-10-12',commission_net_jpy=1000 WHERE reservation_id=?`,[r.id]);
  const pending=(await S.partnerQuarterPayments(db,'hA',[]))[0];assert.equal(pending.period,'2026-Q4');assert.equal(pending.gross,1100);assert.equal(pending.transfer,null);
  assert.equal((await S.partnerQuarterPayments(db,'hB',[])).length,0);
});


test("dashboard: pending excludes confirmed/cancelled and estimates use selected booking dates", async () => {
  const db = openTestDb(); await seed(db);
  const metrics = await vite.ssrLoadModule("/lib/portal/metrics.ts");
  const admin = client(db); await signIn(admin, "admin@example.com", "ops");
  const materials = await admin.call("POST", "ops/hotels/hA/links", { medium:"web",kind:"url" });
  const arrival = await links.handleReferralArrival(db,{ token:materials.body.link.url.split('/r/')[1],userAgent:UA,now:T0 });
  const ctx = await links.activeReferral(db,arrival.setCookie.split(';')[0],T0);
  const states = ['provisional','arranging','confirmed','completed','cancelled','no_show','confirmed','provisional'];
  const entries = [];
  for (let i=0;i<states.length;i++) {
    const r=await R.createReservation(db,{requestId:uuid(),flow:'experience',experienceSlug:'kanji-name-calligraphy',experienceDate:'2026-10-25',guests:1,lang:'en',lines:[{kind:'base',description:'Test',commissionable:true,quantity:1,grossJpy:22000}]},ctx,T0+i);
    await db.run(`UPDATE reservations SET status = ?, created_at = ? WHERE id = ?`,[states[i],i===6?'2026-09-01T00:00:00Z':iso(T0),r.id]);
    if(i===7) await db.run(`UPDATE reservation_referrals SET status = 'removed' WHERE reservation_id = ?`,[r.id]);
    if(i===3) await db.run(`UPDATE commission_entries SET status = 'pending', performed_on_jst = '2026-10-25' WHERE reservation_id = ?`,[r.id]);
    entries.push(await db.first(`SELECT commission_net_jpy FROM commission_entries WHERE reservation_id = ?`,[r.id]));
  }
  const d=await metrics.hotelDashboard(db,'hA',{from:'2026-10-01',to:'2026-10-31'});
  assert.equal(d.funnel.provisional,2);
  assert.equal(d.funnel.confirmed,2);
  assert.equal(d.funnel.estimatedCommissionNet,entries.slice(0,3).reduce((n,e)=>n+e.commission_net_jpy,0));
  assert.ok(d.funnel.estimatedCommissionNet>0);
  const other=await metrics.hotelDashboard(db,'hB',{from:'2026-10-01',to:'2026-10-31'});
  assert.equal(other.funnel.provisional,0);assert.equal(other.funnel.estimatedCommissionNet,0);
});


test("reservation sheet: global sorting, full-result totals, search, one-sided dates and scope", async () => {
  const db=openTestDb(); await seed(db);
  const admin=client(db); await signIn(admin,'admin@example.com','ops');
  await admin.call('POST','ops/hotels/hA/members',{email:'sheet@example.com',role:'hotel_viewer'});
  const viewer=client(db); await signIn(viewer,'sheet@example.com','hotel');
  const pair=(await viewer.call('POST','hotel/materials',{})).body;
  const arrival=await links.handleReferralArrival(db,{token:pair.url.url.split('/r/')[1],userAgent:UA,now:T0});
  const ctx=await links.activeReferral(db,arrival.setCookie.split(';')[0],T0);
  const bookings=[];
  for(let i=1;i<=31;i++) {
    const r=await R.createReservation(db,{requestId:uuid(),flow:'experience',experienceSlug:'kanji-name-calligraphy',experienceDate:i===31?null:`2026-11-${String(i).padStart(2,'0')}`,guests:1,lang:'en',lines:[{kind:'base',description:'Test',commissionable:true,quantity:1,grossJpy:2200*i}]},ctx,T0+i*1000);
    bookings.push(r);
  }
  await db.run(`UPDATE commission_entries SET status='confirmed' WHERE reservation_id=?`,[bookings[0].id]);
  await db.run(`UPDATE commission_entries SET status='pending' WHERE reservation_id=?`,[bookings[1].id]);
  await db.run(`UPDATE commission_entries SET status='voided',commission_net_jpy=0 WHERE reservation_id=?`,[bookings[30].id]);
  await db.run(`UPDATE reservations SET status='cancelled' WHERE id=?`,[bookings[30].id]);
  await db.run(`UPDATE reservations SET amount_status='pending' WHERE id=?`,[bookings[29].id]);
  await db.run(`UPDATE commission_entries SET rate_bp=NULL,commission_net_jpy=0 WHERE reservation_id=?`,[bookings[29].id]);
  const first=(await viewer.call('GET','hotel/reservations?sort=commission&direction=desc&limit=25')).body;
  const second=(await viewer.call('GET','hotel/reservations?sort=commission&direction=desc&limit=25&offset=25')).body;
  assert.equal(first.total,31);assert.equal(first.rows.length,25);assert.equal(second.rows.length,6);
  assert.equal(first.rows[0].commissionNet,2900);
  assert.equal(new Set([...first.rows,...second.rows].map(r=>r.hotelRef)).size,31);
  assert.deepEqual(first.summary,{estimatedNet:43200,pendingNet:200,confirmedNet:100,unknownCount:1});
  assert.deepEqual(first.summary,second.summary,"summary covers all matching pages");
  const amount=(await viewer.call('GET','hotel/reservations?sort=amount&direction=desc&limit=100')).body;
  assert.equal(amount.rows[0].bookingGross,68200);assert.equal(amount.rows.at(-1).bookingGross,null);
  const dates=(await viewer.call('GET','hotel/reservations?sort=date&direction=asc&limit=100')).body;
  assert.equal(dates.rows[0].experienceDate,'2026-11-01');assert.equal(dates.rows.at(-1).experienceDate,null);
  const search=(await viewer.call('GET',`hotel/reservations?q=${first.rows[0].hotelRef.toLowerCase()}`)).body;
  assert.equal(search.total,1);assert.equal(search.summary.estimatedNet,2900);
  assert.equal((await viewer.call('GET',`hotel/reservations?q=${encodeURIComponent('書道')}`)).body.total,31);
  assert.equal((await viewer.call('GET','hotel/reservations?q=%25')).body.total,0,"search wildcards are literal");
  assert.equal((await viewer.call('GET','hotel/reservations?from=2026-10-06')).body.total,0);
  assert.equal((await viewer.call('GET','hotel/reservations?to=2026-10-04')).body.total,0);
  assert.equal((await viewer.call('GET','hotel/reservations?experienceFrom=2026-11-29')).body.total,2);
  assert.equal((await viewer.call('GET','hotel/reservations?experienceTo=2026-11-02')).body.total,2);
  const cancelled=(await viewer.call('GET','hotel/reservations?status=cancelled')).body;
  assert.equal(cancelled.total,1);assert.equal(cancelled.summary.estimatedNet+cancelled.summary.confirmedNet+cancelled.summary.pendingNet,0);
  const malicious=(await viewer.call('GET',`hotel/reservations?sort=${encodeURIComponent('r.created_at; DROP TABLE reservations')}&direction=anything`)).body;
  assert.equal(malicious.total,31);assert.equal(malicious.rows[0].hotelRef,amount.rows[0].hotelRef);
  assert.equal((await viewer.call('GET','hotel/reservations?hotel=hB&sort=amount')).status,403);
  const {hotelReservations}=await vite.ssrLoadModule('/lib/portal/metrics.ts');
  const other=await hotelReservations(db,'hB',{});assert.equal(other.total,0);assert.equal(other.summary.estimatedNet,0);
  assert.ok(first.rows.every(r=>!('customerName' in r)&&!('customerEmail' in r)));
  await db.run(`UPDATE reservation_lines SET discount_jpy=110,refunded_gross_jpy=220 WHERE reservation_id=?`,[bookings[0].id]);
  const ref=(await db.first(`SELECT hotel_ref FROM reservations WHERE id=?`,[bookings[0].id])).hotel_ref;
  assert.equal((await viewer.call('GET',`hotel/reservations?ref=${ref}`)).body.rows[0].bookingGross,1870);
});

test("demo reservation sheet mirrors ordering, search and full-result summaries", async () => {
  const {demoReservations}=await vite.ssrLoadModule('/lib/portal/demo-data.ts');
  const first=demoReservations({sort:'commission',direction:'desc',limit:2});
  const next=demoReservations({sort:'commission',direction:'desc',limit:2,offset:2});
  assert.equal(first.total,60);assert.equal(first.rows[0].commissionNet,4000);assert.deepEqual(first.summary,next.summary);
  assert.deepEqual(first.summary,{estimatedNet:66500,pendingNet:0,confirmedNet:70000,unknownCount:0});
  const pending=demoReservations({status:'provisional'});assert.equal(pending.total,8);assert.equal(pending.summary.estimatedNet,19000);
  assert.equal(demoReservations({q:'demo03'}).total,1);assert.equal(demoReservations({q:'Calligraphy'}).total,20);
});

// Exercise calendar boundaries as well as the regular end-of-month fixture.
test('expanded demo rows paginate without gaps and keep completed dates in the past', async () => {
  const {demoRows,demoReservations,demoDashboard,demoBalance}=await vite.ssrLoadModule('/lib/portal/demo-data.ts');
  try {
    for (const today of ['2026-11-01','2027-02-28','2028-02-29','2026-12-31']) {
      mock.timers.setTime(new Date(`${today}T03:00:00Z`).getTime());
      const rows=demoRows();
      assert.equal(new Set(rows.map(r=>r.hotelRef)).size,60);
      assert.equal(new Set(rows.map(r=>r.experienceSlug)).size,3);
      for (const row of rows) {
        assert.ok(row.createdAt.slice(0,10)<=today);
        assert.ok(row.createdAt.slice(0,10)<=row.experienceDate);
        assert.equal(new Date(row.experienceDate).toISOString().slice(0,10),row.experienceDate);
        if(row.performedOn) assert.ok(row.performedOn<=today);
      }
      const pages=[0,25,50].flatMap(offset=>demoReservations({offset}).rows);
      assert.equal(new Set(pages.map(r=>r.hotelRef)).size,60);
      const dash=demoDashboard({from:today.slice(0,7)+'-01',to:today});
      assert.equal(dash.funnel.confirmed,48);
      assert.equal(dash.funnel.provisional,10);
      assert.equal(dash.confirmed.commissionNet,demoBalance.unpaidNet);
    }
  } finally { mock.timers.setTime(new Date('2026-10-28T03:00:00Z').getTime()); }
});

test('partner brochure settings: role and site isolation, safe values, no booking or commission changes', async () => {
  const db=openTestDb();await seed(db);
  await db.run(`INSERT INTO users(id,email,name,status,created_at) VALUES ('u-brand','brand@example.com','Brand manager','active','2026-01-01')`);
  await db.run(`INSERT INTO memberships(id,user_id,role,scope_type,scope_id,created_at) VALUES ('m-brand','u-brand','partner_manager','hotel','hA','2026-01-01')`);
  const c=client(db);await signIn(c,'brand@example.com','hotel');
  const brand={hotel:'hA',companyName:'Agency A',logoDataUrl:null,accentColor:'#176b69',contactEmail:'hello@example.com',contactPhone:'03-0000-0000',contactUrl:'https://example.com/enquiry'};
  const price={hotel:'hA',slug:'kanji-name-calligraphy',priceJpy:35000,priceUnit:'person',priceNote:'2名から・税込'};
  assert.equal((await c.call('POST','hotel/brochures/brand',brand)).status,200);
  assert.equal((await c.call('POST','hotel/brochures/price',price)).status,200);
  const config=(await c.call('GET','hotel/brochures?hotel=hA')).body;
  assert.equal(config.canManage,true);assert.equal(config.brand.companyName,'Agency A');
  assert.equal(config.prices[price.slug].priceJpy,35000);
  assert.ok(config.experiences.en.some(e=>e.slug===price.slug));
  assert.equal(config.prices[price.slug].priceMode,'fixed');
  assert.equal(config.prices[price.slug].priceNoteEn,price.priceNote,'legacy client note retained');
  const bilingual={...price,priceMode:'fixed',priceNoteEn:'For two or more guests.'};
  assert.equal((await c.call('POST','hotel/brochures/price',bilingual)).status,200);
  assert.equal((await c.call('POST','hotel/brochures/price',{...price,priceNote:'日本語のみ更新'})).status,200);
  let current=(await c.call('GET','hotel/brochures?hotel=hA')).body.prices[price.slug];
  assert.equal(current.priceNote,'日本語のみ更新');assert.equal(current.priceNoteEn,bilingual.priceNoteEn,'legacy writes preserve existing English note');
  for(const invalid of [{priceMode:'fixed',priceJpy:null},{priceMode:'inquiry',priceJpy:100},{priceMode:'bad'},{priceNoteEn:'x'.repeat(181)}]) {
    assert.equal((await c.call('POST','hotel/brochures/price',{...bilingual,...invalid})).status,400);
  }
  const {brochurePriceReady,emptyBrochurePrice}=await vite.ssrLoadModule('/lib/portal/brochure-types.ts');
  assert.equal(brochurePriceReady(emptyBrochurePrice('person')),false);
  for(const mode of ['unset','inquiry']) {
    assert.equal((await c.call('POST','hotel/brochures/price',{...bilingual,priceMode:mode,priceJpy:null})).status,200);
    current=(await c.call('GET','hotel/brochures?hotel=hA')).body.prices[price.slug];
    assert.equal(current.priceMode,mode);assert.equal(brochurePriceReady(current),mode==='inquiry');
  }
  // Migration remains compatible with the seven-column insert used by the previous worker.
  await db.run('DELETE FROM partner_brochure_options WHERE hotel_id=? AND experience_slug=?',['hA',price.slug]);
  await db.run('INSERT OR REPLACE INTO partner_brochure_prices VALUES (?,?,?,?,?,?,?)',['hA',price.slug,36000,'group','旧設定','2026-01-01','u-brand']);
  current=(await c.call('GET','hotel/brochures?hotel=hA')).body.prices[price.slug];
  assert.equal(current.priceMode,'fixed');assert.equal(current.priceNoteEn,'旧設定');

  const logo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWhkAAAAASUVORK5CYII=';
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,logoDataUrl:logo})).status,200);
  assert.equal((await c.call('GET','hotel/brochures?hotel=hA')).body.brand.logoDataUrl,logo);
  assert.equal((await c.call('POST','hotel/brochures/brand',brand)).status,200);
  assert.equal((await c.call('GET','hotel/brochures?hotel=hA')).body.brand.logoDataUrl,null);
  assert.equal((await c.call('GET','hotel/brochures?hotel=hB')).status,403);
  assert.equal((await c.call('POST','hotel/brochures/price',{...price,hotel:'hB'})).status,403);
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,contactUrl:'javascript:alert(1)'})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,contactUrl:'https://user:secret@example.com'})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,logoDataUrl:'data:image/svg+xml;base64,PHN2Zz4='})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,logoDataUrl:'data:image/png;base64,YmFk'})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/brand',{...brand,companyName:'x'.repeat(81)})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/brand',brand,{noOrigin:true})).status,403);
  for(const priceJpy of [-1,0,1.5,100000001,'35000'])assert.equal((await c.call('POST','hotel/brochures/price',{...price,priceJpy})).status,400);
  assert.equal((await c.call('POST','hotel/brochures/price',{...price,slug:'not-live'})).status,404);
  assert.equal((await c.call('POST','hotel/brochures/price',{...price,priceJpy:null})).status,200);
  await db.run(`UPDATE memberships SET role='partner_agent' WHERE id='m-brand'`);
  assert.equal((await c.call('POST','hotel/brochures/brand',brand)).status,403);
  assert.equal((await c.call('POST','hotel/brochures/price',price)).status,200);
  await db.run(`UPDATE memberships SET role='hotel_viewer' WHERE id='m-brand'`);
  assert.equal((await c.call('POST','hotel/brochures/price',price)).status,403);
  assert.equal((await c.call('GET','hotel/brochures?hotel=hA')).body.canPrice,false);
  await db.run(`UPDATE hotels SET features_json='{"refer":false,"cases":false}' WHERE id='hA'`);
  assert.equal((await c.call('GET','hotel/brochures?hotel=hA')).status,403);
  const d=client(db),login=await demoFixture(db);await d.call('POST','auth/demo-login',login);
  assert.equal((await d.call('GET','hotel/brochures')).body.demo,true);
  assert.equal((await d.call('POST','hotel/brochures/price',price)).status,403);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM reservations')).n,0);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM commission_entries')).n,0);
  assert.equal((await db.first("SELECT rate_bp FROM partner_commission_rates WHERE id='common-rate-five-percent'")).rate_bp,500);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM partner_brochure_prices')).n,1);
  const audit=await db.all("SELECT after_json FROM audit_logs WHERE action='partner.brochure.brand'");
  assert.equal(audit.length,3);assert.ok(audit.every(a=>!a.after_json.includes('logoDataUrl')));
});

test('official brochures use public prices and stable hotel/language referral QRs, isolated from agency branding and demo', async () => {
  const db=openTestDb();await seed(db);
  const admin=client(db);await signIn(admin,'admin@example.com','ops');
  await admin.call('POST','ops/hotels/hA/members',{email:'print@example.com',role:'hotel_viewer'});
  const c=client(db);await signIn(c,'print@example.com','hotel');
  const slug='shibuya-ramen-class';
  // Unrelated agency settings must never enter an official download.
  await db.run('INSERT INTO partner_brochure_brands VALUES (?,?,?,?,?,?,?,?,?)',['hA','PRIVATE AGENCY',null,'#000000','private@example.com','','','2026-01-01','u-admin']);
  await db.run('INSERT INTO partner_brochure_prices VALUES (?,?,?,?,?,?,?)',['hA',slug,999999,'group','PRIVATE PRICE NOTE','2026-01-01','u-admin']);
  const catalog=await c.call('GET','hotel/official-brochures?hotel=hA');
  assert.equal(catalog.status,200);assert.equal(catalog.body.experiences.en[0].slug,slug);
  const prep=(lang,experience=null,extras={})=>c.call('POST','hotel/official-brochures/prepare',{hotel:'hA',lang,experience,...extras});
  const en=await prep('en',slug,{priceJpy:999999,companyName:'FORGED BRAND',referralUrl:'https://evil.example'});
  assert.equal(en.status,200,JSON.stringify(en.body));
  assert.equal(en.body.input.items[0].price,'From ¥26,500');
  assert.equal(en.body.input.demo,false);
  assert.ok(!JSON.stringify(en.body).includes('PRIVATE'));
  assert.ok(!JSON.stringify(en.body).includes('999999'));
  assert.equal((await prep('en',slug)).body.input.referralUrl,en.body.input.referralUrl,'reprint reuses the same QR');
  const ja=(await prep('ja',slug)).body.input,general=(await prep('en')).body.input;
  assert.notEqual(ja.referralUrl,en.body.input.referralUrl);assert.equal(general.items.length,3);
  assert.equal(general.items[0].slug,slug);assert.equal(general.experience,null);
  for(const input of [en.body.input,ja,general]) {
    const token=new URL(input.referralUrl).pathname.split('/').pop();
    const row=await db.first('SELECT * FROM referral_links WHERE token=?',[token]);
    assert.equal(row.hotel_id,'hA');assert.equal(row.kind,'qr');assert.equal(row.medium,'brochure');
    assert.ok(row.target_path.startsWith(`/${input.lang}/`));
    const arrival=await links.handleReferralArrival(db,{token,userAgent:UA});
    assert.equal(arrival.redirect,row.target_path);assert.ok(arrival.setCookie);
    const context=await links.activeReferral(db,arrival.setCookie);
    assert.equal(context.hotelId,'hA');assert.equal(context.linkId,row.id);
    if(input.experience)assert.ok(arrival.redirect.includes(input.experience));else assert.equal(arrival.redirect,'/en/');
  }
  const before=(await db.first('SELECT COUNT(*) AS n FROM referral_links')).n;
  assert.equal((await prep('es',slug)).status,400);
  assert.equal((await prep('en','not-live')).status,400);
  assert.equal((await prep('en',slug,{hotel:'hB'})).status,403);
  assert.equal((await c.call('GET','hotel/official-brochures?hotel=hB')).status,403);
  assert.equal((await c.call('GET','hotel/official-brochures/demo?hotel=hA&lang=en')).status,404);
  assert.equal((await c.call('POST','hotel/official-brochures/prepare',{hotel:'hA',lang:'en'},{noOrigin:true})).status,403);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM referral_links')).n,before);
  await db.run(`UPDATE hotels SET features_json='{"refer":false}' WHERE id='hA'`);
  assert.equal((await prep('en')).status,403);
  assert.equal((await c.call('GET','hotel/official-brochures?hotel=hA')).status,403);
  const d=client(db),login=await demoFixture(db);await d.call('POST','auth/demo-login',login);
  const demo=await d.call('GET',`hotel/official-brochures/demo?lang=ja&experience=${slug}`);
  assert.equal(demo.status,200);assert.equal(demo.body.input.demo,true);
  assert.equal(new URL(demo.body.input.referralUrl).hostname,'example.invalid');
  assert.equal((await d.call('POST','hotel/official-brochures/prepare',{lang:'en'})).status,403);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM referral_links')).n,before);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM reservations')).n,0);
  assert.equal((await db.first('SELECT COUNT(*) AS n FROM commission_entries')).n,0);
});
