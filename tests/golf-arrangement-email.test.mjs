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
const { golfArrangementPayment, golfArrangementPaymentReady } = await vite.ssrLoadModule("/lib/golf-arrangement-payments.ts");
// Party sizes whose Stripe link at the current fee is registered; the group drafts run only once the owner adds the 2–4 links.
const READY = [1, 2, 3, 4].filter(golfArrangementPaymentReady);
const groupLinks = READY.includes(2);
const e = { kind: "guest", experience: "mt-fuji-golf-day", name: '<img src=x> {{TOTAL}}', email: "guest@example.invalid", lang: "en", areaId: "fuji", area: "Mt. Fuji", dates: "2099-11-18 09:00", party: "2", message: "", courseMode: "recommended", pickup: "Example Hotel", assistant: "required", transfer: "introduce", caddie: "required", rentalKeys: "own,own", estimate: "¥20,000" };
const proposal = {
  policyVersion: "staged-2026-10-24", eligibility: "new-enquiry-no-prior-terms",
  date: "2099-11-18", preferredTeeTime: "09:00 preferred, no earlier than 08:00",
  essentialRequirements: "Tokyo area, approved date and party", preferences: "Scenic course", rentalRequirements: "Own clubs",
  budget: { totalJpy: 150000, scope: "Service fee, course charges, rentals and transport for the whole group" },
  validUntil: "2099-11-10T18:00:00+09:00",
  payment: groupLinks ? { ...golfArrangementPayment(2), verified: true } : undefined,
};
const solo = { ...e, party: "1", rentalKeys: "own", estimate: "¥15,000" };
const soloProposal = { ...proposal, payment: { ...golfArrangementPayment(1), verified: true } };
const env = { GOLF_AUTOMATION_URL: "https://script.google.com/macros/s/example/exec", GOLF_AUTOMATION_TOKEN: "test-only" };

test("new requests cannot enter package automation, even with both production settings present", async t => {
  assert.equal(automation.automationConfigured(env), false);
  t.mock.method(globalThis, "fetch", () => { throw Error("must not call external automation"); });
  await assert.rejects(automation.submitGolfAutomation(env, e, "Golf", "", {}), /disabled/);
  assert.equal(automation.paymentTemplate(e), null, "an enquiry alone is never a reviewed payment invitation");
  assert.equal(prices.GOLF_PRICE_VERSION, "arrangement-2026-10-24");
});

test("all five acknowledgement/follow-up languages add safe HTML, fee split and assistant selections", () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) for (const kind of ["ack", "follow-up"]) {
    const mail = golfCustomerEmail(kind, { ...e, lang }, "Golf");
    assert.ok(mail.html && mail.text);
    assert.doesNotMatch(mail.html, /<img src=x>/);
    assert.match(mail.html, /&lt;img src=x&gt;/);
    assert.doesNotMatch(mail.text, /package price|Pick-up:|Thank you for booking/);
    if (kind === "ack") assert.match(mail.text, /20,000/);
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

test("the group fee: ¥15,000 for the first golfer + ¥5,000 per additional golfer, quoted from five", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 12].map(prices.golfArrangementFee), [15000, 20000, 25000, 30000, 35000, 70000]);
  assert.deepEqual(prices.golfPackagePrice("fuji", 3), { currency: "JPY", groupTotal: 25000, perPersonDisplay: 8333, approximate: true });
  assert.equal(prices.golfPackagePrice("tokyo", 5), null, "five or more are quoted");
  assert.deepEqual(prices.golfTiers("tokyo").map((t) => t.total), [15000, 20000, 25000, 30000]);
});

test("reviewed fee drafts cover both areas and the registered party sizes without club discounts or package claims", () => {
  assert.ok(READY.includes(1), "the one-golfer link is registered");
  for (const areaId of ["tokyo", "fuji"]) for (const party of READY) {
    const t = arrangementPaymentTemplate({ ...e, areaId, party: String(party) }, { ...proposal, payment: undefined });
    assert.equal(t.amount, prices.golfArrangementFee(party));
    assert.match(t.text, party === 1 ? /¥15,000 for one golfer/ : new RegExp(`¥15,000 for the first golfer \\+ ¥5,000 × ${party - 1} additional golfer`));
    assert.equal(t.priceVersion, "arrangement-2026-10-24");
    assert.equal(t.version, "arrangement-staged-2026-10-24");
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
  assert.ok(arrangementPaymentTemplate(solo, soloProposal).text, "the unpatched one-golfer proposal drafts");
  for (const patch of [{ essentialRequirements: "" }, { rentalRequirements: "" }, { preferences: "" }, { date: "2099-02-30" }, { date: "2099-11-19" }, { preferredTeeTime: "" }, { validUntil: "2000-01-01T00:00:00Z" }, { validUntil: "2099-11-19T00:00:00Z" }, { validUntil: "2099-11-10T18:00:00" }, { policyVersion: "staged-2026-10-19" }])
    assert.throws(() => arrangementPaymentTemplate(solo, { ...soloProposal, ...patch }));
  for (const patch of [{ verified: false }, { amount: 270000 }, { amount: 20000 }, { priceVersion: "arrangement-2026-10-17" }, { currency: "USD" }, { url: "javascript:alert(1)" }, { url: "https://book.stripe.com.evil.test/x" }, { url: "https://book.stripe.com/x?quantity=9" }, { url: "https://book.stripe.com/8x2bJ16rT2AHbD19V83Je0m" }])
    assert.throws(() => arrangementPaymentTemplate(solo, { ...soloProposal, payment: { ...soloProposal.payment, ...patch } }), /do not match/);
  for (const party of ["0", "5", "2.5"]) assert.throws(() => arrangementPaymentTemplate({ ...e, party }, proposal));
  assert.throws(() => arrangementPaymentTemplate({ ...solo, lang: "ja" }, soloProposal), /reviewed translation/);
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


test("registered links match the current fee; the retired ¥15,000-per-golfer links for 2–4 golfers are refused until replaced", () => {
  const one = golfArrangementPayment(1);
  assert.equal(one.url, "https://book.stripe.com/8x228rcQhejp8qP2sG3Je0l");
  assert.deepEqual([one.amount, one.currency, one.priceVersion], [15000, "JPY", "arrangement-2026-10-24"]);
  for (const n of [2, 3, 4]) {
    if (READY.includes(n)) { assert.equal(golfArrangementPayment(n).amount, prices.golfArrangementFee(n)); continue; }
    assert.throws(() => golfArrangementPayment(n), /No approved Stripe link/, `${n} golfers: no draft until the owner registers the new link`);
    assert.throws(() => arrangementPaymentTemplate({ ...e, party: String(n) }, { ...proposal, payment: undefined }), /No approved Stripe link/);
  }
  for (const n of [0, 5, -1, 1.5, NaN, Infinity, "2", null]) { assert.throws(() => golfArrangementPayment(n)); assert.equal(golfArrangementPaymentReady(n), false); }
  // another party's link (the retired two-golfer link) or a package link never passes the one-golfer check
  for (const url of ["https://book.stripe.com/8x2bJ16rT2AHbD19V83Je0m", "https://book.stripe.com/7sYeVd3fHcbh22rc3g3Je0n", "https://book.stripe.com/14A4gz3fHdfldL92sG3Je0i"]) {
    assert.throws(() => arrangementPaymentTemplate(solo, { ...soloProposal, payment: { ...soloProposal.payment, url } }), /do not match/);
  }
  const explicit = arrangementPaymentTemplate(solo, soloProposal);
  const selected = arrangementPaymentTemplate(solo, { ...soloProposal, payment: undefined });
  assert.equal(explicit.text, selected.text);
  assert.equal(explicit.html, selected.html);
  assert.equal(automation.paymentTemplate(solo), null, "registered links do not bypass requirements and terms review");
});

test("new policy cannot be silently applied to saved or existing customer arrangements", () => {
  for (const patch of [{ policyVersion: undefined }, { eligibility: undefined }, { policyVersion: "old" }, { policyVersion: "staged-2026-10-19" }, { eligibility: "customer-agreed-change-before-work" }])
    assert.throws(() => arrangementPaymentTemplate(solo, { ...soloProposal, ...patch }));
  assert.doesNotThrow(() => arrangementPaymentTemplate(solo, { ...soloProposal, eligibility: "customer-agreed-change-before-work", changedTermsAgreement: "Customer's written agreement before any work: reference TEST" }));
  for (const budget of [undefined, { totalJpy: null, scope: "All costs" }, { totalJpy: 1000, scope: "All costs" }, { totalJpy: 14999, scope: "All costs" }, { totalJpy: 50000, scope: "" }])
    assert.throws(() => arrangementPaymentTemplate(solo, { ...soloProposal, budget }));
  assert.doesNotThrow(() => arrangementPaymentTemplate(solo, { ...soloProposal, budget: { totalJpy: null, noCeilingConfirmed: true, scope: "No cap confirmed, all costs still require approval" } }));
});

test("all public languages and automatic mails use the staged terms and keep private offers out", async () => {
  const { GOLF_ARRANGEMENT_COPY, applyGolfArrangement } = await vite.ssrLoadModule("/lib/golf-arrangement-copy.ts");
  const { arrangementPolicy } = await vite.ssrLoadModule("/lib/golf-arrangement-policy.ts");
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const c = GOLF_ARRANGEMENT_COPY[lang], p = arrangementPolicy[lang];
    assert.equal(c.cancellation, p.terms);
    // FAQ 9 is the large-group answer added 2026-10-23; the policy answers follow it
    assert.equal(c.faq[10].a, p.beforePayment);
    assert.equal(c.faq[11].a, p.weather);
    assert.equal(c.faq[12].a, p.terms);
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

test("a one-golfer draft: the fee for one, the refund split, no second option", () => {
  const t = arrangementPaymentTemplate(solo, { ...soloProposal, payment: undefined });
  assert.doesNotMatch(t.text, /Option 2/);
  assert.match(t.text, /Booking service fee: ¥15,000 including tax \(¥15,000 for one golfer\)/);
  assert.match(t.text, /¥15,000 refunded;.*¥10,000 refunded \(¥5,000 retained\)/);
  assert.match(t.text, /¥15,000 for the first golfer plus ¥5,000 for each additional golfer/);
});

test("individual offers distinguish one golfer, group enquiry, and a fully reviewed private quote", { skip: !groupLinks && "waiting for the owner's ¥20,000 Stripe link for two golfers" }, () => {
  const group = arrangementPaymentTemplate(e, proposal);
  assert.match(group.text, /Option 1 — Golf course booking service/);
  assert.match(group.text, /Option 2 — Private golf day/);
  assert.match(group.text, /do not use it to pay for Option 2/);
  assert.doesNotMatch(group.text, /¥270,000|campaign|guaranteed tee time/);
  assert.ok(group.html.indexOf("Booking-service fee and refunds") < group.html.indexOf("Pay booking service fee —"));
  assert.match(group.text, /Booking service fee: ¥20,000 including tax \(¥15,000 for the first golfer \+ ¥5,000 × 1 additional golfer\)/);
  assert.match(group.text, /¥20,000 refunded;.*¥15,000 refunded.*¥5,000 retained/);
  assert.throws(() => arrangementPaymentTemplate(e, { ...proposal, privateQuote: { totalJpy: 250000, verifiedForThisRequest: true } }));
  const quote = { totalJpy: 250000, verifiedForThisRequest: true, inclusions: "Return transfers, assistant and golf", exclusions: "Personal purchases", contractingParty: "Example licensed travel company", paymentRecipient: "Example licensed travel company", cancellationTerms: "Example reviewed cancellation conditions" };
  const offered = arrangementPaymentTemplate(e, { ...proposal, privateQuote: quote });
  assert.match(offered.text, /Reviewed total for 2 golfers: ¥250,000/);
  assert.match(offered.text, /Contracting party: Example licensed/);
  assert.throws(() => arrangementPaymentTemplate({ ...e, party: "1" }, { ...proposal, payment: undefined, privateQuote: quote }));
});
