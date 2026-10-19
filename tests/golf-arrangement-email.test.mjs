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
const { golfArrangementPayment } = await vite.ssrLoadModule("/lib/golf-arrangement-payments.ts");
const e = { kind: "guest", experience: "mt-fuji-golf-day", name: '<img src=x> {{TOTAL}}', email: "guest@example.invalid", lang: "en", areaId: "fuji", area: "Mt. Fuji", dates: "2099-11-18 09:00", party: "2", message: "", courseMode: "recommended", pickup: "Example Hotel", assistant: "required", transfer: "introduce", caddie: "required", rentalKeys: "own,own", estimate: "¥30,000" };
const proposal = {
  policyVersion: "staged-2026-10-19", eligibility: "new-enquiry-no-prior-terms",
  date: "2099-11-18", preferredTeeTime: "09:00 preferred, no earlier than 08:00",
  essentialRequirements: "Tokyo area, approved date and party", preferences: "Scenic course", rentalRequirements: "Own clubs",
  budget: { totalJpy: 150000, scope: "Service fee, course charges, rentals and transport for the whole group" },
  validUntil: "2099-11-10T18:00:00+09:00",
  payment: { url: "https://book.stripe.com/8x2bJ16rT2AHbD19V83Je0m", amount: 30000, currency: "JPY", verified: true, priceVersion: "arrangement-2026-10-17" },
};
const env = { GOLF_AUTOMATION_URL: "https://script.google.com/macros/s/example/exec", GOLF_AUTOMATION_TOKEN: "test-only" };

test("new requests cannot enter package automation, even with both production settings present", async t => {
  assert.equal(automation.automationConfigured(env), false);
  t.mock.method(globalThis, "fetch", () => { throw Error("must not call external automation"); });
  await assert.rejects(automation.submitGolfAutomation(env, e, "Golf", "", {}), /disabled/);
  assert.equal(automation.paymentTemplate(e), null, "an enquiry alone is never a reviewed payment invitation");
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
  assert.match(ack.text, /Transfer to the course: Yes — please introduce the transfer partner/);
  assert.match(ack.text, /Date and preferred tee time/);
  const follow = golfCustomerEmail("follow-up", e);
  assert.match(follow.html, /fuji-oyama.jpg/);
  assert.doesNotMatch(follow.html, /book\.stripe\.com|Proceed to payment/);
  assert.equal(golfCustomerEmail("ack", { ...e, experience: "other" }).html, undefined);
  assert.equal(golfCustomerEmail("ack", { ...e, kind: "trade" }).html, undefined);
});

test("reviewed fee drafts cover both areas and 1–4 golfers without club discounts or package claims", () => {
  for (const areaId of ["tokyo", "fuji"]) for (const party of [1, 2, 3, 4]) {
    const t = arrangementPaymentTemplate({ ...e, areaId, party: String(party) }, { ...proposal, payment: undefined });
    assert.equal(t.amount, party * 15000);
    assert.equal(t.priceVersion, "arrangement-2026-10-17");
    assert.equal(t.version, "arrangement-staged-2026-10-19");
    assert.match(t.text, /paid directly to the club/);
    assert.match(t.text, /book, contract and pay directly/);
    assert.match(t.text, /fee is refunded in full/);
    assert.match(t.text, /10 November 2099/);
    assert.doesNotMatch(t.text, /private return hotel transfers|Clubhouse lunch: included|Driver and guide contact|¥5,000 discount|\{\{[A-Z_]+\}\}/);
    assert.match(t.html, /&lt;img src=x&gt;/);
    assert.equal((t.html.match(/Pay booking service fee —/g) || []).length, 1);
    assert.equal(t.paymentUrl, golfArrangementPayment(party).url);
    assert.equal(t.html.split(`href="${t.paymentUrl}"`).length - 1, 2);
    assert.ok(t.text.includes(t.paymentUrl));
    assert.ok(t.html.indexOf("Pay booking service fee") < t.html.indexOf('<img src="https://'));
    assert.match(t.html, new RegExp(areaId === "fuji" ? "fuji-oyama.jpg" : "chiba-isumi.jpg"));
  }
});

test("unreviewed/expired proposals and mismatched or unsafe payment links cannot produce drafts", () => {
  for (const patch of [{ essentialRequirements: "" }, { rentalRequirements: "" }, { preferences: "" }, { date: "2099-02-30" }, { date: "2099-11-19" }, { preferredTeeTime: "" }, { validUntil: "2000-01-01T00:00:00Z" }, { validUntil: "2099-11-19T00:00:00Z" }, { validUntil: "2099-11-10T18:00:00" }])
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


test("registered links match every party size and cannot be replaced with another party's or a package link", () => {
  const ids = ["8x228rcQhejp8qP2sG3Je0l", "8x2bJ16rT2AHbD19V83Je0m", "7sYeVd3fHcbh22rc3g3Je0n", "3cI3cvcQh5MTgXlffs3Je0o"];
  for (const [i, id] of ids.entries()) {
    const p = golfArrangementPayment(i + 1);
    assert.equal(p.url, `https://book.stripe.com/${id}`);
    assert.equal(p.amount, (i + 1) * 15000);
    assert.equal(p.currency, "JPY");
  }
  for (const n of [0, 5, -1, 1.5, NaN, Infinity, "2", null]) assert.throws(() => golfArrangementPayment(n));
  for (const url of [golfArrangementPayment(1).url, golfArrangementPayment(3).url, "https://book.stripe.com/14A4gz3fHdfldL92sG3Je0i"]) {
    assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, payment: { ...proposal.payment, url } }), /do not match/);
  }
  const explicit = arrangementPaymentTemplate(e, proposal);
  const selected = arrangementPaymentTemplate(e, { ...proposal, payment: undefined });
  assert.equal(explicit.text, selected.text);
  assert.equal(explicit.html, selected.html);
  assert.equal(automation.paymentTemplate(e), null, "registered links do not bypass requirements and terms review");
});

test("new policy cannot be silently applied to saved or existing customer arrangements", () => {
  for (const patch of [{ policyVersion: undefined }, { eligibility: undefined }, { policyVersion: "old" }, { eligibility: "customer-agreed-change-before-work" }])
    assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, ...patch }));
  assert.doesNotThrow(() => arrangementPaymentTemplate(e, { ...proposal, eligibility: "customer-agreed-change-before-work", changedTermsAgreement: "Customer's written agreement before any work: reference TEST" }));
  for (const budget of [undefined, { totalJpy: null, scope: "All costs" }, { totalJpy: 1000, scope: "All costs" }, { totalJpy: 50000, scope: "" }])
    assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, budget }));
  assert.doesNotThrow(() => arrangementPaymentTemplate(e, { ...proposal, budget: { totalJpy: null, noCeilingConfirmed: true, scope: "No cap confirmed, all costs still require approval" } }));
});

test("all public languages and automatic mails use the staged terms and keep private offers out", async () => {
  const { GOLF_ARRANGEMENT_COPY, applyGolfArrangement } = await vite.ssrLoadModule("/lib/golf-arrangement-copy.ts");
  const { arrangementPolicy } = await vite.ssrLoadModule("/lib/golf-arrangement-policy.ts");
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const c = GOLF_ARRANGEMENT_COPY[lang], p = arrangementPolicy[lang];
    assert.equal(c.cancellation, p.terms);
    assert.equal(c.faq[9].a, p.beforePayment);
    assert.equal(c.faq[10].a, p.weather);
    assert.equal(c.faq[11].a, p.terms);
    assert.equal(c.process.paid, p.paid);
    assert.equal(applyGolfArrangement({ slug: "mt-fuji-golf-day", variants: [], cancellationTiers: [{ until: 7, rate: 0 }] }, lang).cancellationTiers, undefined);
    assert.doesNotMatch(JSON.stringify(c), /seven days before|7日前|siete días antes|sept jours avant|7 天前|Option 2/);
    for (const kind of ["ack", "follow-up"]) {
      const mail = golfCustomerEmail(kind, { ...e, lang });
      assert.ok(mail.text.includes(p.terms));
      assert.doesNotMatch(mail.text, /Option 2|Private golf day with premium/);
    }
  }
});

test("individual offers distinguish one golfer, group enquiry, and a fully reviewed private quote", () => {
  const solo = arrangementPaymentTemplate({ ...e, party: "1" }, { ...proposal, payment: undefined });
  assert.doesNotMatch(solo.text, /Option 2/);
  const group = arrangementPaymentTemplate(e, proposal);
  assert.match(group.text, /Option 1 — Golf course booking service/);
  assert.match(group.text, /Option 2 — Private golf day/);
  assert.match(group.text, /do not use it to pay for Option 2/);
  assert.doesNotMatch(group.text, /¥270,000|campaign|guaranteed tee time/);
  assert.ok(group.html.indexOf("Booking-service fee and refunds") < group.html.indexOf("Pay booking service fee —"));
  assert.match(group.text, /¥30,000 refunded;.*¥20,000 refunded.*¥10,000 retained/);
  assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, privateQuote: { totalJpy: 250000, verifiedForThisRequest: true } }));
  const quote = { totalJpy: 250000, verifiedForThisRequest: true, inclusions: "Return transfers, assistant and golf", exclusions: "Personal purchases", contractingParty: "Example licensed travel company", paymentRecipient: "Example licensed travel company", cancellationTerms: "Example reviewed cancellation conditions" };
  const offered = arrangementPaymentTemplate(e, { ...proposal, privateQuote: quote });
  assert.match(offered.text, /Reviewed total for 2 golfers: ¥250,000/);
  assert.match(offered.text, /Contracting party: Example licensed/);
  assert.throws(() => arrangementPaymentTemplate({ ...e, party: "1" }, { ...proposal, payment: undefined, privateQuote: quote }));
});
