import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const server = async (packageMode = false) => createServer({ appType: "custom", configFile: false, root,
  resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false },
  plugins: [{ name: "package-mode-rollback", enforce: "pre", transform(code, id) {
    if (id.endsWith("/lib/golf-prices.ts")) return code.replace(/GOLF_MODE: GolfMode = "(arrangement|package)"/, `GOLF_MODE: GolfMode = "${packageMode ? "package" : "arrangement"}"`);
  } }],
});
const vite = await server(), rollback = await server(true);
after(async () => { await vite.close(); await rollback.close(); });
const automation = await vite.ssrLoadModule("/lib/golf-automation.ts");
const { golfCustomerEmail } = await vite.ssrLoadModule("/lib/golf-customer-email.ts");
const prices = await vite.ssrLoadModule("/lib/golf-prices.ts");
const { arrangementPaymentTemplate } = await vite.ssrLoadModule("/lib/golf-arrangement-email.ts");
const e = { kind: "guest", experience: "mt-fuji-golf-day", name: '<img src=x> {{TOTAL}}', email: "guest@example.invalid", lang: "en", areaId: "fuji", area: "Mt. Fuji", dates: "2099-11-18 09:00", party: "2", message: "", courseMode: "recommended", pickup: "Example Hotel", assistant: "required", caddie: "required", rentalKeys: "own,own", estimate: "¥30,000" };
const proposal = { courseName: "Example & Club", date: "2099-11-18", teeTime: "09:00", courseCharges: "¥18,000 per golfer including cart; rentals extra, payable to club.", courseCancellation: "From 15 November: ¥3,000 per golfer payable to club.", validUntil: "2099-11-10T18:00:00+09:00", payment: { url: "https://book.stripe.com/EXAMPLE123", amount: 30000, currency: "JPY", verified: true, priceVersion: "arrangement-2026-10-17" } };
const env = { GOLF_AUTOMATION_URL: "https://script.google.com/macros/s/example/exec", GOLF_AUTOMATION_TOKEN: "test-only" };

test("new requests cannot enter package automation, even with both production settings present", async t => {
  assert.equal(automation.automationConfigured(env), false);
  t.mock.method(globalThis, "fetch", () => { throw Error("must not call external automation"); });
  await assert.rejects(automation.submitGolfAutomation(env, e, "Golf", "", {}), /disabled/);
  assert.equal(automation.paymentTemplate(e), null, "an enquiry alone is never a payment proposal");
  assert.equal(prices.GOLF_PRICE_VERSION, "arrangement-2026-10-17");
});

test("all five acknowledgement/follow-up languages add safe HTML, fee split and assistant selections", () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) for (const kind of ["ack", "follow-up"]) {
    const mail = golfCustomerEmail(kind, { ...e, lang }, "Golf");
    assert.ok(mail.html && mail.text);
    assert.doesNotMatch(mail.html, /<img src=x>/);
    assert.match(mail.html, /&lt;img src=x&gt;/);
    assert.doesNotMatch(mail.text, /package price|Pick-up:|Thank you for booking/);
    if (kind === "ack") assert.match(mail.text, /30,000/);
  }
  const ack = golfCustomerEmail("ack", e);
  assert.match(ack.text, /Requested \(quoted separately\)/);
  assert.match(ack.text, /Date and preferred tee time/);
  const follow = golfCustomerEmail("follow-up", e);
  assert.match(follow.html, /fuji-oyama.jpg/);
  assert.doesNotMatch(follow.html, /book\.stripe\.com|Proceed to payment/);
  assert.equal(golfCustomerEmail("ack", { ...e, experience: "other" }).html, undefined);
  assert.equal(golfCustomerEmail("ack", { ...e, kind: "trade" }).html, undefined);
});

test("reviewed fee drafts cover both areas and 1–4 golfers without club discounts or package claims", () => {
  for (const areaId of ["tokyo", "fuji"]) for (const party of [1, 2, 3, 4]) {
    const t = arrangementPaymentTemplate({ ...e, areaId, party: String(party) }, { ...proposal, payment: { ...proposal.payment, amount: party * 15000 } });
    assert.equal(t.amount, party * 15000);
    assert.equal(t.priceVersion, "arrangement-2026-10-17");
    assert.equal(t.version, "arrangement-photo-2026-10-17");
    assert.match(t.text, /paid directly to the club/);
    assert.match(t.text, /book, contract and pay directly/);
    assert.match(t.text, /fee is refunded in full/);
    assert.match(t.text, /10 November 2099/);
    assert.doesNotMatch(t.text, /private return hotel transfers|Clubhouse lunch: included|Driver and guide contact|¥5,000 discount|\{\{[A-Z_]+\}\}/);
    assert.match(t.html, /&lt;img src=x&gt;/);
    assert.equal((t.html.match(/Pay booking service fee —/g) || []).length, 2);
    assert.equal((t.html.match(/href="https:\/\/book.stripe.com\/EXAMPLE123"/g) || []).length, 3);
    assert.ok(t.html.indexOf("Pay booking service fee") < t.html.indexOf('<img src="https://'));
    assert.match(t.html, new RegExp(areaId === "fuji" ? "fuji-oyama.jpg" : "chiba-isumi.jpg"));
  }
});

test("unreviewed/expired proposals and mismatched or unsafe payment links cannot produce drafts", () => {
  for (const patch of [{ courseName: "" }, { courseCharges: "" }, { courseCancellation: "" }, { date: "2099-02-30" }, { date: "2099-11-19" }, { teeTime: "25:00" }, { validUntil: "2000-01-01T00:00:00Z" }, { validUntil: "2099-11-19T00:00:00Z" }, { validUntil: "2099-11-10T18:00:00" }])
    assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, ...patch }));
  for (const patch of [{ verified: false }, { amount: 270000 }, { amount: 20000 }, { priceVersion: "2026-10-10" }, { currency: "USD" }, { url: "javascript:alert(1)" }, { url: "https://book.stripe.com.evil.test/x" }, { url: "https://book.stripe.com/x?quantity=9" }])
    assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, payment: { ...proposal.payment, ...patch } }));
  for (const party of ["0", "5", "2.5"]) assert.throws(() => arrangementPaymentTemplate({ ...e, party }, proposal));
  assert.throws(() => arrangementPaymentTemplate({ ...e, lang: "ja" }, proposal), /reviewed translation/);
});

test("one mode switch restores package prices, original templates and original delivery format", async () => {
  const oldPrices = await rollback.ssrLoadModule("/lib/golf-prices.ts");
  const oldAutomation = await rollback.ssrLoadModule("/lib/golf-automation.ts");
  const { packagePaymentTemplate } = await rollback.ssrLoadModule("/lib/golf-package-email.ts");
  const { golfCustomerEmail: oldCustomer } = await rollback.ssrLoadModule("/lib/golf-customer-email.ts");
  assert.equal(oldPrices.GOLF_PRICE_VERSION, "2026-10-10");
  assert.deepEqual(oldPrices.GOLF_GOLFERS, [2, 3, 4]);
  assert.equal(oldPrices.golfPackagePrice("fuji", 2).groupTotal, 270000);
  assert.equal(oldPrices.golfTotalWithOwnClubs(270000, 2), 260000);
  assert.equal(oldAutomation.automationConfigured(env), true);
  assert.deepEqual(oldAutomation.paymentTemplate(e), packagePaymentTemplate(e));
  assert.match(oldAutomation.paymentTemplate(e).text, /private return hotel transfers/);
  assert.equal(oldAutomation.paymentTemplate(e).version, "photo-2026-10-16");
  assert.equal(oldCustomer("ack", e).html, undefined);
  assert.equal(oldCustomer("follow-up", e).html, undefined);
});

test("Apps Script rejects arrangement/unknown price versions even if a package master matches the fee", () => {
  const gas = vm.createContext({ console, Date, Number, String, JSON, encodeURIComponent, isFinite });
  vm.runInContext(readFileSync(new URL("../docs/payment-automation.gs", import.meta.url), "utf8"), gas);
  for (const p of [{ golfMode: "arrangement", priceVersion: "2026-10-10" }, { priceVersion: "arrangement-2026-10-17" }, { golfMode: "unknown", priceVersion: "2026-10-10" }]) {
    assert.equal(gas.decision_({ ...p, enquiry: e }, [], Date.now()).mode, "manual");
  }
});


test("public terms agree with fee emails, while package terms are preserved on rollback", async () => {
  const current = await vite.ssrLoadModule("/lib/legal.ts");
  const old = await rollback.ssrLoadModule("/lib/legal.ts");
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const text = JSON.stringify([current.legalFor(lang), current.termsFor(lang)]);
    assert.doesNotMatch(text, /hotel transfers stated|既発生費用|less costs already incurred|ホテル送迎を含みます/);
    assert.match(text, lang === "ja" ? /予約手配料を全額返金/ : /booking service fee is refunded in full/);
  }
  assert.match(JSON.stringify(old.termsFor("en")), /hotel transfers stated/);
  assert.match(JSON.stringify(old.termsFor("en")), /less costs already incurred/);
});
