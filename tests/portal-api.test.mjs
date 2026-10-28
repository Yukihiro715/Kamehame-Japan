// The portal API end to end on node:sqlite: sign-in by code, hotel scoping
// (T02, T03), materials and QR, dashboard numbers (T22), operations actions,
// CSV export and the request rules (CSRF, forged cookies) (T24).
import assert from "node:assert/strict";
import test, { after } from "node:test";
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

const ORIGIN = "https://staging.example";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1";
let seq = 0;
const uuid = () => `11111111-2222-4333-8444-${String(++seq).padStart(12, "0")}`;
const iso = (t) => new Date(t).toISOString();
const T0 = Date.parse("2026-10-05T03:00:00Z"); // bookings in the past relative to the real clock the API uses

/** A client for the API: keeps cookies, sends the portal header and a same-origin Origin. */
function client(db, env = {}, jar = new Map()) {
  const fullEnv = { DB: db.d1, KH_ENV: "staging", ...env };
  return {
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
  // three arrivals: two scans within 30 minutes are one visit, a bot is excluded
  const v1 = await links.handleReferralArrival(db, { token, userAgent: UA, now: T0 });
  await links.handleReferralArrival(db, { token, userAgent: UA, now: T0 + 10 * 60000, cookie: v1.setCookie.split(";")[0] });
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
  assert.deepEqual(dash.funnel, { accesses: 2, visits: 1, provisional: 2, confirmed: 1, paid: 1, fullyRefunded: 0, cancelled: 1, estimatedCommissionNet: 0 });
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
