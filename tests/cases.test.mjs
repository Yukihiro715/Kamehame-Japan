// The booking relay (lib/portal/cases.ts): a partner's case, the quote, the
// customer's page, the payment and the attribution fixed by the case.
// T-N03 attribution without a cookie, on any device; T-N04 no double counting
// on duplicate events; T-N05 paid ≠ confirmed; T-N06 an old version cannot be
// paid; T-N07 nothing internal on the customer page; T-N08 other partners'
// cases are invisible.
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { openTestDb } from "./helpers/sqlite-db.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const C = await vite.ssrLoadModule("/lib/portal/cases.ts");
const { handlePortalApi } = await vite.ssrLoadModule("/lib/portal/api.ts");
const { receiveWebhook } = await vite.ssrLoadModule("/lib/payment-webhooks.ts");

const T = Date.parse("2026-11-06T03:00:00Z");
const iso = (t) => new Date(t).toISOString();
const ORIGIN = "https://staging.example";
const SECRET = "whsec_test_secret";

async function seed(db) {
  const at = iso(T);
  const user = (id, email, name) => ({ sql: `INSERT INTO users (id, email, name, status, created_at) VALUES (?, ?, ?, 'active', ?)`, params: [id, email, name, at] });
  const member = (id, user, role, scope) => ({ sql: `INSERT INTO memberships (id, user_id, role, scope_type, scope_id, created_at) VALUES (?, ?, ?, ?, ?, ?)`, params: [id, user, role, scope ? "hotel" : "ops", scope, at] });
  await db.batch([
    user("u-ops", "ops@example.com", "Ops"), member("m-ops", "u-ops", "ops_booking", null),
    user("u-fin", "fin@example.com", "Fin"), member("m-fin", "u-fin", "ops_finance", null),
    { sql: `INSERT INTO partner_legal_entities (id, name, partner_type, contact_email, created_at, updated_at) VALUES ('le1', 'Example Travel', 'agency', 'office@agency.example', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, site_kind, features_json, created_at, updated_at) VALUES ('sA', 'le1', 'HP-0001', 'Agency Tokyo', 'branch', '{"refer":true,"cases":true,"settlement":true,"members":false}', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO settlement_profiles (id, legal_entity_id, name, payee_name, min_payout_jpy, fee_borne_by, valid_from, created_at, updated_at) VALUES ('spA', 'le1', 'A payout', 'EXAMPLE TRAVEL', 3000, 'hotel', '2026-01-01', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('spA', 'sA', '2026-01-01')` },
    { sql: `INSERT INTO partner_legal_entities (id, name, partner_type, created_at, updated_at) VALUES ('le2', 'Other Hotel', 'hotel', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, features_json, created_at, updated_at) VALUES ('sB', 'le2', 'HP-0002', 'Other Hotel', '{"refer":true,"cases":true,"settlement":true,"members":false}', ?, ?)`, params: [at, at] },
    { sql: `INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('sC', 'le2', 'HP-0003', 'No Relay Hotel', ?, ?)`, params: [at, at] },
    user("u-agent", "agent@agency.example", "Agent"), member("m-agent", "u-agent", "partner_agent", "sA"),
    user("u-agent2", "agent2@agency.example", "Agent Two"), member("m-agent2", "u-agent2", "partner_agent", "sA"),
    user("u-mgr", "manager@agency.example", "Manager"), member("m-mgr", "u-mgr", "partner_manager", "sA"),
    user("u-viewer", "viewer@agency.example", "Viewer"), member("m-viewer", "u-viewer", "hotel_viewer", "sA"),
    user("u-other", "agent@other.example", "Other"), member("m-other", "u-other", "partner_manager", "sB"),
    user("u-norelay", "agent@norelay.example", "NoRelay"), member("m-norelay", "u-norelay", "partner_agent", "sC"),
    { sql: `INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, price_basis, referral_enabled, valid_from, version, created_by, created_at) VALUES ('pol1', 'kanji-name-calligraphy', 1000, 1000, 'tax_inclusive', 1, '2026-01-01T00:00:00Z', 1, 'seed', ?)`, params: [at] },
    { sql: `INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, price_basis, referral_enabled, valid_from, version, created_by, created_at) VALUES ('pol2', 'golf-bus', 500, 1000, 'tax_inclusive', 1, '2026-01-01T00:00:00Z', 1, 'seed', ?)`, params: [at] },
  ]);
}
function client(db, jar = new Map(), mails = [], stripe = []) {
  const env = { DB: db.d1, KH_ENV: "staging", RESEND_API_KEY: "re_test", NOTIFY_ALLOWLIST: "@agency.example,@example.com,@customer.example", CONTACT_TO: "team@example.com", STRIPE_CHECKOUT_KEY: "rk_test_x", STRIPE_WEBHOOK_SECRET: SECRET };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.startsWith("https://api.resend.com/")) { mails.push(JSON.parse(init.body)); return Response.json({ id: "m" }); }
    if (u.startsWith("https://api.stripe.com/v1/checkout/sessions")) {
      if (u.endsWith("/expire")) { stripe.push({ expire: u.split("/").at(-2) }); return Response.json({ id: u.split("/").at(-2), status: "expired" }); }
      const p = new URLSearchParams(String(init.body));
      let total = 0; for (let i = 0; i < 20; i++) { const a = p.get(`line_items[${i}][price_data][unit_amount]`); if (a === null) break; total += Number(a) * Number(p.get(`line_items[${i}][quantity]`)); }
      const id = `cs_test_${stripe.length + 1}`;
      stripe.push({ create: id, params: Object.fromEntries(p), idem: init.headers["Idempotency-Key"] });
      return Response.json({ id, url: `https://checkout.stripe.com/c/pay/${id}`, status: "open", livemode: false, amount_total: total, currency: "jpy" });
    }
    return realFetch(url, init);
  };
  return {
    env, mails, stripe, restore: () => { globalThis.fetch = realFetch; },
    async call(method, path, body, raw) {
      const headers = new Headers();
      if (method !== "GET") { headers.set("content-type", raw ? raw.type : "application/json"); headers.set("origin", ORIGIN); headers.set("x-kh-portal", "1"); if (raw) headers.set("content-length", String(raw.body.length)); }
      if (jar.size) headers.set("cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
      const res = await handlePortalApi(new Request(`${ORIGIN}/api/portal/${path}`, { method, headers, body: raw ? raw.body : body === undefined ? undefined : JSON.stringify(body) }), env, path.split("?")[0].split("/"));
      for (const sc of res.headers.getSetCookie?.() ?? []) { const [kv] = sc.split(";"); const [k, v] = kv.split("="); if (v) jar.set(k, v); else jar.delete(k); }
      const type = res.headers.get("content-type") ?? "";
      return { status: res.status, body: type.includes("json") ? await res.json() : await res.text() };
    },
  };
}
async function signIn(c, email, kind) {
  const r1 = await c.call("POST", "auth/request-code", { email, kind });
  const code = r1.body.devCode ?? c.mails.filter((m) => m.to?.[0] === email).at(-1)?.text.match(/サインインコード: (\d{6})/)?.[1];
  const r2 = await c.call("POST", "auth/verify", { email, code, kind }); assert.equal(r2.status, 200, JSON.stringify(r2.body));
}
/** A signed checkout.session.completed from Stripe, as the Worker receives it. */
async function stripeEvent(env, { id, sessionId, ref, amount, reservationId, quoteId, caseId, paymentStatus = "paid", type = "checkout.session.completed" }) {
  const raw = JSON.stringify({ id, type, created: Math.floor(T / 1000), livemode: false, data: { object: { id: sessionId, object: "checkout.session", client_reference_id: ref, payment_status: paymentStatus, payment_intent: `pi_${sessionId}`, amount_total: amount, amount_subtotal: amount, currency: "jpy", livemode: false, metadata: { booking_flow: "partner_case", reservation_id: reservationId, quote_id: quoteId, case_id: caseId }, total_details: { amount_discount: 0, amount_tax: 0 } } } });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = createHmac("sha256", SECRET).update(`${ts}.${raw}`).digest("hex");
  return receiveWebhook("stripe", new Request(`${ORIGIN}/api/webhooks/stripe`, { method: "POST", body: raw, headers: { "stripe-signature": `t=${ts},v1=${sig}` } }), env);
}
const LINES = [{ kind: "base", description: "Kanji calligraphy class × 2", quantity: 2, unitJpy: 19800, taxRateBp: 1000, commissionable: true }, { kind: "onsite", description: "Ink set to take home (paid at the studio)", quantity: 1, unitJpy: 3000, taxRateBp: 1000, commissionable: false }];

test("T-N03/T-N04/T-N05: case → quote → shared page → payment from anywhere → the reservation carries basis=case, once, and confirmation is a separate step", async () => {
  const db = openTestDb(); await seed(db);
  const agent = client(db); await signIn(agent, "agent@agency.example", "hotel");
  try {
    // The partner registers the case: no cookie, no link.
    const created = await agent.call("POST", "hotel/cases", { hotel: "sA", kind: "experience", experience: "kanji-name-calligraphy", preferredDate: "2026-12-10", altDates: ["2026-12-11"], guests: 2, lang: "en", customerName: "Jane Doe", customerEmail: "jane@customer.example", requirements: "Afternoon if possible", partnerRef: "AG-77" });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    assert.match(created.body.publicRef, /^KC-261106-01$/);
    assert.deepEqual(agent.mails.filter((m) => m.to[0] === "team@example.com").map((m) => m.subject), [`【取り次ぎ】新しい案件 KC-261106-01（Agency Tokyo）`], "operations hear of the new case");
    const caseId = created.body.id;

    // Operations quote it and share.
    const ops = client(db, new Map(), agent.mails, agent.stripe); await signIn(ops, "ops@example.com", "ops");
    const q1 = await ops.call("POST", `ops/cases/${caseId}/quote`, { lines: LINES, includes: "Teacher, materials", excludes: "Transport", validUntil: "2026-11-20", cancelTerms: "Free until 7 days before" });
    assert.equal(q1.status, 200, JSON.stringify(q1.body));
    assert.equal(q1.body.quotes[0].status, "draft");
    assert.equal(q1.body.quotes[0].totalJpy, 39600); assert.equal(q1.body.quotes[0].onsiteJpy, 3000);
    assert.deepEqual(q1.body.quotes[0].commission, { baseNetJpy: 36000, rateBp: 1000, estimateNetJpy: 3600, policyMissing: false }, "partner-only commission preview from the commissionable lines");
    const agentDraft = await agent.call("GET", `hotel/cases/${caseId}`);
    assert.equal(agentDraft.body.quotes.length, 0, "a draft is not shown to the partner");
    const shared = await ops.call("POST", `ops/quotes/${q1.body.id}/share`, { notifyCustomer: true });
    assert.equal(shared.status, 200, JSON.stringify(shared.body));
    assert.match(shared.body.shareUrl, new RegExp(`^${ORIGIN}/en/quote/[A-Za-z0-9_-]{20,}/$`));
    assert.equal(shared.body.case.displayStatus, "awaiting_payment");
    assert.ok(shared.body.reservation, "the reservation exists from the share"); assert.equal(shared.body.reservation.payment_status, "unpaid");
    const ref = await db.first(`SELECT * FROM reservation_referrals WHERE reservation_id = ?`, [shared.body.reservation.id]);
    assert.equal(ref.basis, "case"); assert.equal(ref.case_id, caseId); assert.equal(ref.hotel_id, "sA"); assert.equal(ref.status, "attributed"); assert.equal(ref.link_id, null);
    const entry0 = await db.first(`SELECT * FROM commission_entries WHERE reservation_id = ?`, [shared.body.reservation.id]);
    assert.equal(entry0.status, "estimated"); assert.equal(entry0.commission_net_jpy, 3600); assert.equal(entry0.settlement_profile_id, "spA");
    const toCustomer = agent.mails.find((m) => m.to[0] === "jane@customer.example");
    assert.ok(toCustomer, "the customer gets the link when asked"); assert.doesNotMatch(toCustomer.text, /Agency|commission|紹介/i);
    assert.ok(agent.mails.some((m) => m.to[0] === "agent@agency.example" && m.subject.includes("見積もりを共有")), "the partner hears of the share");

    // The customer's page, from another device: no partner, no commission, no internal references.
    const token = shared.body.shareUrl.split("/").at(-2);
    const view = await C.quoteByToken(db, token, T);
    assert.equal(view.state, "open"); assert.equal(view.canPay, true); assert.equal(view.totalJpy, 39600); assert.equal(view.version, 1);
    const text = JSON.stringify(view);
    assert.doesNotMatch(text, /Agency|KC-261106|commission|rate|3600|36000|sA|spA/);
    const checkout = await C.openQuoteCheckout(db, agent.env, token, ORIGIN, T);
    assert.equal(checkout.ok, true, JSON.stringify(checkout));
    const created1 = agent.stripe.find((s) => s.create);
    assert.equal(created1.params.client_reference_id, `KJ-C-${q1.body.id}`); assert.equal(created1.params["metadata[reservation_id]"], shared.body.reservation.id);
    assert.equal(created1.params["line_items[0][price_data][unit_amount]"], "19800"); assert.equal(created1.params["line_items[0][quantity]"], "2"); assert.equal(created1.params["line_items[1][quantity]"], undefined, "on-site lines are not charged");
    const again = await C.openQuoteCheckout(db, agent.env, token, ORIGIN, T + 60000);
    assert.equal(again.url, checkout.url, "the open session is reused");

    // Stripe's webhook: the payment lands on the reservation, the case turns paid, nothing is forwarded to Sheets.
    const w1 = await stripeEvent(agent.env, { id: "evt_1", sessionId: created1.create, ref: `KJ-C-${q1.body.id}`, amount: 39600, reservationId: shared.body.reservation.id, quoteId: q1.body.id, caseId });
    const w1body = await w1.json(); assert.equal(w1.status, 200, JSON.stringify(w1body)); assert.deepEqual(w1body, { ok: true, outcome: "processed" });
    const afterPay = await agent.call("GET", `hotel/cases/${caseId}`);
    assert.equal(afterPay.body.case.displayStatus, "paid"); assert.equal(afterPay.body.reservation.payment_status, "paid"); assert.equal(afterPay.body.reservation.amount_status, "known");
    assert.equal(afterPay.body.reservation.status, "provisional", "T-N05: paid is not confirmed");
    assert.equal(afterPay.body.quotes[0].status, "paid");
    assert.equal((await C.quoteByToken(db, token, T)).state, "paid");
    assert.ok(agent.mails.some((m) => m.to[0] === "agent@agency.example" && m.subject.includes("決済が完了")));
    assert.ok(agent.mails.some((m) => m.to[0] === "team@example.com" && m.subject.includes("決済が完了")));
    // T-N04: the same event again, and a second event for the same session: one payment, one reservation.
    const w2 = await stripeEvent(agent.env, { id: "evt_1", sessionId: created1.create, ref: `KJ-C-${q1.body.id}`, amount: 39600, reservationId: shared.body.reservation.id, quoteId: q1.body.id, caseId });
    assert.deepEqual(await w2.json(), { ok: true, outcome: "duplicate" });
    assert.equal((await db.first(`SELECT COUNT(*) AS n FROM payments`)).n, 1);
    assert.equal((await db.first(`SELECT COUNT(*) AS n FROM reservations`)).n, 1);
    assert.equal((await db.first(`SELECT COUNT(*) AS n FROM commission_entries`)).n, 1);
    const paidMails = agent.mails.filter((m) => m.subject.includes("決済が完了")).length;
    assert.equal(paidMails, 2, "no second round of notices for the duplicate");

    // Confirmation is operations' own step; the partner cannot do it and cannot cancel a paid case.
    const cancel = await agent.call("POST", `hotel/cases/${caseId}/cancel`, { reason: "changed mind" });
    assert.equal(cancel.status, 400); assert.equal(cancel.body.error, "case_locked");
    const confirmed = await ops.call("POST", `ops/cases/${caseId}/confirm`, { note: "Studio holds 14:00" });
    assert.equal(confirmed.status, 200, JSON.stringify(confirmed.body));
    assert.equal(confirmed.body.case.displayStatus, "confirmed"); assert.equal(confirmed.body.reservation.status, "confirmed");
    assert.ok(agent.mails.some((m) => m.to[0] === "agent@agency.example" && m.subject.includes("予約が確定")));
    // The partner's booking list shows the case's reservation under its site, like any referral.
    const list = await agent.call("GET", "hotel/reservations?hotel=sA");
    assert.equal(list.body.rows.length, 1); assert.equal(list.body.rows[0].commissionNet, 3600);
  } finally { agent.restore(); }
});

test("T-N06: a new version supersedes the old one, closes its Checkout session, and the old link leads to the new quote; a late payment on the old amount is held, not credited silently", async () => {
  const db = openTestDb(); await seed(db);
  const agent = client(db); await signIn(agent, "manager@agency.example", "hotel");
  const ops = client(db, new Map(), agent.mails, agent.stripe); await signIn(ops, "ops@example.com", "ops");
  try {
    const created = await agent.call("POST", "hotel/cases", { hotel: "sA", kind: "experience", experience: "kanji-name-calligraphy", guests: 2, lang: "ja", customerName: "山田 太郎" });
    const caseId = created.body.id;
    const q1 = await ops.call("POST", `ops/cases/${caseId}/quote`, { lines: LINES, validUntil: "2026-11-20" });
    const s1 = await ops.call("POST", `ops/quotes/${q1.body.id}/share`, {});
    const token1 = s1.body.shareUrl.split("/").at(-2);
    assert.match(s1.body.shareUrl, /\/ja\/quote\//);
    const co1 = await C.openQuoteCheckout(db, agent.env, token1, ORIGIN, T);
    const session1 = agent.stripe.find((s) => s.create).create;
    assert.ok(co1.ok);
    // Version 2 with a different price.
    const q2 = await ops.call("POST", `ops/cases/${caseId}/quote`, { lines: [{ ...LINES[0], unitJpy: 18000 }], validUntil: "2026-11-25" });
    assert.equal(q2.status, 200, JSON.stringify(q2.body));
    const s2 = await ops.call("POST", `ops/quotes/${q2.body.id}/share`, {});
    assert.equal(s2.status, 200, JSON.stringify(s2.body));
    assert.equal(s2.body.superseded, 1); assert.equal(s2.body.expire, "expired");
    assert.deepEqual(agent.stripe.filter((s) => s.expire).map((s) => s.expire), [session1], "the old session is expired at Stripe");
    const v1 = await C.quoteByToken(db, token1, T);
    assert.equal(v1.state, "superseded"); assert.equal(v1.canPay, false); assert.equal(v1.newerToken, s2.body.shareUrl.split("/").at(-2));
    assert.equal((await C.openQuoteCheckout(db, agent.env, token1, ORIGIN, T)).error, "superseded");
    const res = await db.first(`SELECT * FROM reservations WHERE id = ?`, [s2.body.reservation.id]);
    assert.equal(res.external_ref, `KJ-C-${q2.body.id}`, "the reservation follows the current version");
    assert.equal((await db.all(`SELECT gross_jpy FROM reservation_lines WHERE reservation_id = ?`, [res.id])).map((l) => l.gross_jpy).join(","), "36000");
    assert.equal((await db.first(`SELECT COUNT(*) AS n FROM reservations`)).n, 1, "still one reservation per case");
    // Stripe nevertheless reports a payment on the old session (a race before the expire): it lands on the reservation but the amount does not match the current lines, so it is held for operations.
    const w = await stripeEvent(agent.env, { id: "evt_late", sessionId: session1, ref: `KJ-C-${q1.body.id}`, amount: 39600, reservationId: res.id, quoteId: q1.body.id, caseId });
    assert.deepEqual(await w.json(), { ok: true, outcome: "processed" });
    const after = await db.first(`SELECT payment_status, amount_status FROM reservations WHERE id = ?`, [res.id]);
    assert.equal(after.payment_status, "paid"); assert.equal(after.amount_status, "pending", "mismatched total → amount pending, commission held");
    const d = await ops.call("GET", `ops/cases/${caseId}`);
    assert.equal(d.body.case.displayStatus, "paid");
    assert.equal(d.body.quotes.find((x) => x.id === q1.body.id).status, "paid", "the version actually paid is marked");
    // No further version can be created on a paid case.
    const q3 = await ops.call("POST", `ops/cases/${caseId}/quote`, { lines: LINES });
    assert.equal(q3.body.error, "already_paid");
  } finally { agent.restore(); }
});

test("external payment (shared-bus golf): operations record the payment to the travel partner; the commission base is the displayed tour price net of tax", async () => {
  const db = openTestDb(); await seed(db);
  const agent = client(db); await signIn(agent, "agent@agency.example", "hotel");
  const ops = client(db, new Map(), agent.mails, agent.stripe); await signIn(ops, "ops@example.com", "ops");
  const fin = client(db, new Map(), agent.mails, agent.stripe); await signIn(fin, "fin@example.com", "ops");
  try {
    const created = await agent.call("POST", "hotel/cases", { hotel: "sA", kind: "experience", experience: "golf-bus", preferredDate: "2026-12-03", guests: 3, customerName: "Golf Group", extra: { area: "Chiba", transfer: "needed", rental_clubs: "some", join_others: "ok", nonsense: "x" } });
    assert.equal(created.status, 200, JSON.stringify(created.body));
    const d0 = await agent.call("GET", `hotel/cases/${created.body.id}`);
    assert.deepEqual(d0.body.case.extra, { area: "Chiba", transfer: "needed", rental_clubs: "some", join_others: "ok" }, "only the product's fields are kept");
    assert.equal(d0.body.case.extraFields.length, 9);
    const q = await ops.call("POST", `ops/cases/${created.body.id}/quote`, { lines: [{ kind: "base", description: "Shared-bus golf day × 3", quantity: 3, unitJpy: 22000, commissionable: true }], paymentMode: "external", confirmationNote: "Seats are confirmed by the tour operator" });
    assert.equal(q.status, 200, JSON.stringify(q.body));
    const s = await ops.call("POST", `ops/quotes/${q.body.id}/share`, {});
    assert.equal(s.body.case.displayStatus, "proposed", "no online payment: proposed, not awaiting payment");
    const view = await C.quoteByToken(db, s.body.shareUrl.split("/").at(-2), T);
    assert.equal(view.canPay, false); assert.equal(view.paymentMode, "external");
    assert.equal((await C.openQuoteCheckout(db, agent.env, view && s.body.shareUrl.split("/").at(-2), ORIGIN, T)).error, "not_payable");
    const notFinance = await ops.call("POST", `ops/cases/${created.body.id}/payment`, { reason: "paid to the tour operator" });
    assert.equal(notFinance.status, 403, "recording money is a finance action");
    const paid = await fin.call("POST", `ops/cases/${created.body.id}/payment`, { reason: "paid to the tour operator, receipt #123", reference: "BT-123" });
    assert.equal(paid.status, 200, JSON.stringify(paid.body));
    assert.equal(paid.body.case.displayStatus, "paid"); assert.equal(paid.body.reservation.payment_status, "paid"); assert.equal(paid.body.reservation.amount_status, "known");
    assert.equal(paid.body.entry.base_net_jpy, 60000, "¥66,000 displayed → ¥60,000 net"); assert.equal(paid.body.entry.commission_net_jpy, 3000);
  } finally { agent.restore(); }
});

test("T-N08: another partner's case is not found; an agent sees only their own, a manager the site's; viewers and sites without the relay are refused; internal notes stay internal", async () => {
  const db = openTestDb(); await seed(db);
  const agent = client(db); await signIn(agent, "agent@agency.example", "hotel");
  const agent2 = client(db, new Map(), agent.mails, agent.stripe); await signIn(agent2, "agent2@agency.example", "hotel");
  const mgr = client(db, new Map(), agent.mails, agent.stripe); await signIn(mgr, "manager@agency.example", "hotel");
  const other = client(db, new Map(), agent.mails, agent.stripe); await signIn(other, "agent@other.example", "hotel");
  const viewer = client(db, new Map(), agent.mails, agent.stripe); await signIn(viewer, "viewer@agency.example", "hotel");
  const norelay = client(db, new Map(), agent.mails, agent.stripe); await signIn(norelay, "agent@norelay.example", "hotel");
  const ops = client(db, new Map(), agent.mails, agent.stripe); await signIn(ops, "ops@example.com", "ops");
  try {
    const c1 = await agent.call("POST", "hotel/cases", { hotel: "sA", kind: "free", customerName: "A", requirements: "Anything in Kyoto" });
    const c2 = await agent2.call("POST", "hotel/cases", { hotel: "sA", kind: "experience", experience: "kanji-name-calligraphy", customerName: "B" });
    assert.equal(c1.status, 200); assert.equal(c2.status, 200);
    assert.equal((await agent.call("GET", "hotel/cases?hotel=sA")).body.rows.map((r) => r.customerName).join(), "A");
    assert.equal((await mgr.call("GET", "hotel/cases?hotel=sA")).body.rows.map((r) => r.customerName).sort().join(), "A,B");
    assert.equal((await agent.call("GET", `hotel/cases/${c2.body.id}`)).status, 404, "another agent's case");
    assert.equal((await other.call("GET", `hotel/cases/${c1.body.id}`)).status, 404, "another partner's case");
    assert.equal((await other.call("GET", "hotel/cases?hotel=sA")).status, 403);
    assert.equal((await viewer.call("GET", "hotel/cases?hotel=sA")).status, 403, "viewers have no relay role");
    assert.equal((await viewer.call("GET", `hotel/cases/${c1.body.id}`)).status, 404);
    assert.equal((await norelay.call("GET", "hotel/cases?hotel=sC")).status, 403, "feature off");
    assert.equal((await norelay.call("POST", "hotel/cases", { hotel: "sC", kind: "free", customerName: "X" })).body.error, "feature_off");
    assert.equal((await agent.call("POST", "hotel/cases", { hotel: "sB", kind: "free", customerName: "X" })).status, 403, "not their site");
    // Messages: an internal note never reaches the partner; a partner cannot write one.
    await ops.call("POST", `ops/cases/${c1.body.id}/message`, { visibility: "internal", body: "wholesale ¥12,000 — do not share" });
    await ops.call("POST", `ops/cases/${c1.body.id}/message`, { visibility: "partner", body: "Checking the studio's calendar" });
    const d = await agent.call("GET", `hotel/cases/${c1.body.id}`);
    assert.deepEqual(d.body.messages.map((m) => m.visibility), ["partner"]); assert.doesNotMatch(JSON.stringify(d.body), /wholesale/);
    assert.equal((await agent.call("POST", `hotel/cases/${c1.body.id}/message`, { visibility: "internal", body: "x" })).status, 403);
    const reply = await agent.call("POST", `hotel/cases/${c1.body.id}/message`, { body: "Customer prefers the 12th" });
    assert.equal(reply.status, 200); assert.ok(agent.mails.some((m) => m.to[0] === "team@example.com" && m.subject.includes("パートナーから")));
    assert.ok(agent.mails.some((m) => m.to[0] === "agent@agency.example" && m.subject.includes("運営から")));
    assert.equal((await ops.call("GET", `ops/cases/${c1.body.id}`)).body.messages.length, 3);
    // A free consultation needs an experience before it can be quoted; operations set it.
    assert.equal((await ops.call("POST", `ops/cases/${c1.body.id}/quote`, { lines: LINES })).body.error, "experience_required");
    const q = await ops.call("POST", `ops/cases/${c1.body.id}/quote`, { lines: LINES, experience: "kanji-name-calligraphy" });
    assert.equal(q.status, 200, JSON.stringify(q.body)); assert.equal(q.body.case.kind, "experience"); assert.equal(q.body.case.experience_slug, "kanji-name-calligraphy");
    // A partner may withdraw an unpaid case with a reason; the open quote closes with it.
    assert.equal((await agent.call("POST", `hotel/cases/${c1.body.id}/cancel`, {})).body.error, "reason_required");
    const cancelled = await agent.call("POST", `hotel/cases/${c1.body.id}/cancel`, { reason: "Customer changed plans" });
    assert.equal(cancelled.body.case.displayStatus, "cancelled"); assert.equal(cancelled.body.quotes.length, 0, "void drafts are not listed to the partner");
    assert.equal((await ops.call("GET", `ops/cases/${c1.body.id}`)).body.quotes[0].status, "void");
  } finally { agent.restore(); }
});

test("expiry: shared quotes past their date close on the cron; the customer page says so", async () => {
  const db = openTestDb(); await seed(db);
  const agent = client(db); await signIn(agent, "agent@agency.example", "hotel");
  const ops = client(db, new Map(), agent.mails, agent.stripe); await signIn(ops, "ops@example.com", "ops");
  try {
    const c = await agent.call("POST", "hotel/cases", { hotel: "sA", kind: "experience", experience: "kanji-name-calligraphy", customerName: "A" });
    const q = await ops.call("POST", `ops/cases/${c.body.id}/quote`, { lines: LINES, validUntil: "2026-11-08" });
    const s = await ops.call("POST", `ops/quotes/${q.body.id}/share`, {});
    const token = s.body.shareUrl.split("/").at(-2);
    await C.openQuoteCheckout(db, agent.env, token, ORIGIN, T);
    assert.equal(await C.expireQuotes(db, agent.env, T), 0);
    assert.equal(await C.expireQuotes(db, agent.env, Date.parse("2026-11-09T00:00:00Z")), 1);
    assert.equal(agent.stripe.filter((x) => x.expire).length, 1);
    assert.equal((await C.quoteByToken(db, token, Date.parse("2026-11-09T00:00:00Z"))).state, "expired");
    assert.equal((await ops.call("GET", `ops/cases/${c.body.id}`)).body.quotes[0].status, "expired");
    assert.equal((await ops.call("POST", `ops/quotes/${q.body.id}/share`, {})).body.error, "not_draft");
  } finally { agent.restore(); }
});
