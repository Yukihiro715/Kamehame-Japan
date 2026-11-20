// Travel support (lib/support.ts): the index and the babysitting page in five
// languages, the home section, the banner on experience pages, the header
// link, and the /api/contact rules for a "support" request. The babysitting
// page is KAMEHAME JAPAN's own product: no agency name, address, contact or
// external booking link appears on it.
import assert from "node:assert/strict";
import test from "node:test";

const { default: worker } = await import("../dist/server/index.js");
const ctx = { waitUntil() {}, passThroughOnException() {} };
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
const post = (body) => worker.fetch(new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), env, ctx);
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
const PARTNER = /Little ?Hug|littlehug|都筑|茅ヶ崎|info@littlehug|facebook\.com|instagram\.com|youtube\.com|phonics/i;

test("travel support: index and babysitting page in five languages, no partner details, coming-soon services never link", async () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const index = await render(`/${lang}/support/`);
    assert.equal(index.status, 200, `${lang} index renders`);
    const ih = await index.text();
    assert.ok(ih.includes(`href="/${lang}/support/babysitter/"`), `${lang}: babysitting links through`);
    for (const soon of ["transfer", "interpreter", "planner"]) assert.ok(!ih.includes(`/support/${soon}/`), `${lang}: ${soon} has no link while coming soon`);
    assert.ok((ih.match(/soon-badge/g) ?? []).length >= 3, `${lang}: three coming-soon badges`);
    assert.doesNotMatch(text(ih), PARTNER, `${lang} index: no partner details`);

    const page = await render(`/${lang}/support/babysitter/`);
    assert.equal(page.status, 200, `${lang} babysitting page renders`);
    const ph = await page.text();
    const pt = text(ph);
    assert.doesNotMatch(pt, PARTNER, `${lang}: no agency name, address, contact or links`);
    const body = ph.slice(0, ph.indexOf("<footer")).replace(/<script[\s\S]*?<\/script>/g, "");
    assert.ok(!/href="https?:\/\/(?!kamehame-japan\.com)/.test(body), `${lang}: no external links in the page body`);
    assert.ok(ph.includes("sp-form") && ph.includes('name="place_detail"') && ph.includes('name="ages"') && ph.includes('name="language"') && ph.includes('name="whatsapp"'), `${lang}: the form asks place, ages, language, contact`);
    // Fees carry our margin; the agency's own figures never appear.
    assert.ok(pt.includes("¥5,150") && pt.includes("¥3,900") && pt.includes("¥15,450"), `${lang}: the guide hourly fees and the lowest booking are shown`);
    // The sibling line legitimately says "+30%"; the margin would appear as a bare "30%"/"35%" or a multiplier.
    assert.ok(!/3,960|2,970|33,000|5,500|1,650|3,300|[^+\d]3[05]\s?%|×\s?1\.3|1\.3[05]\b/.test(pt), `${lang}: no agency base figure or margin on the page`);
    assert.ok(ph.includes("/images/support-babysitter.webp"), `${lang}: the sitter photo`);
    assert.ok(ph.includes('"@type":"FAQPage"'), `${lang}: FAQ structured data`);
  }
});

test("travel support: the home section, the header link and the banner on experience pages", async () => {
  const home = await (await render("/ja/")).text();
  assert.ok(home.includes('class="support-section"') && home.includes('href="/ja/support/"'), "home has the section and its link");
  assert.ok((home.match(/support-section[\s\S]*?<\/section>/)?.[0].match(/class="lc lc-grid sc/g) ?? []).length === 4, "four service cards in the section");
  for (const path of ["/en/tokyo/mt-fuji-golf-day/", "/en/kyoto/kyoto-ryokan-beauty-clinic/", "/ja/tokyo/kanji-name-calligraphy/"]) {
    const html = await (await render(path)).text();
    const banners = html.match(/class="support-banner sb-(mid|end)"/g) ?? [];
    assert.equal(banners.length, 2, `${path}: one banner under the overview and one by the articles`);
    assert.ok(/class="support-banner sb-mid" href="\/[a-z-]+\/support\/" target="_blank" rel="noopener"/.test(html), `${path}: the banner opens in a new tab`);
    assert.ok(html.includes("/images/support-banner.webp"), `${path}: the banner carries a photo`);
    assert.ok(html.indexOf('class="support-banner sb-mid"') > html.indexOf("xp-main"), `${path}: the banner sits in the main column, not above the booking box`);
  }
  const header = await (await render("/fr/about/")).text();
  assert.ok(header.includes('href="/fr/support/"'), "header links to travel support in every language");
});

test("travel support: /api/contact takes a complete babysitting request and refuses an incomplete or unknown one", async () => {
  const base = { kind: "support", service: "babysitter", lang: "en", name: "Test", email: "test@example.com", dates: "2027-04-10", start: "07:00", end: "18:30", party: "2", place: "hotel", place_detail: "Hotel X", ages: "2 and 5", language: "en", golf: "1", golf_venue: "Fuji course", travel: "1" };
  // complete: passes validation (delivery is unconfigured in the test runner, which is the next step)
  const ok = await post(base);
  assert.equal(ok.status, 503);
  assert.equal((await ok.json()).error, "unconfigured");
  for (const [label, bad] of [["no ages", { ages: "" }], ["no place", { place_detail: "" }], ["bad time", { start: "7am" }], ["bad place", { place: "park" }], ["bad language", { language: "de" }], ["no date", { dates: "" }], ["ten children", { party: "10" }], ["other service", { service: "transfer" }]]) {
    const r = await post({ ...base, ...bad });
    assert.equal(r.status, 400, `refuses ${label}`);
  }
});
