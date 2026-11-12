// The Kyoto ryokan-style beauty clinic (lib/catalog.ts): a preview page written
// to the medical advertising guideline. It is reachable by URL, never indexed or
// listed, names the clinic but no company, person, street or phone, carries no
// testimonial or result claim, shows no amount in the booking display, and
// says the fee is paid at the clinic.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const { default: worker } = await import("../dist/server/index.js");
const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
const PRIVATE = /ダヴィンチ|[Dd]a ?[Vv]inci|麻生|中島|藤森|[Ff]ujinomori|大亀谷|西寺町|075-606|jakuchu-an-biyo/;
const FORBIDDEN_CLAIMS = /before and after|ビフォーアフター|guaranteed|保証|No\.\s?1|最高|cured|完治|testimonial|patients say|患者様の声|campaign|キャンペーン|limited time|期間限定|今だけ|今なら/i;

test("clinic preview: unlisted, noindex, private, guideline wording, pay at the clinic", async () => {
  for (const [lang, expect] of [["en", "pay the clinic on the day"], ["ja", "クリニックでお支払い"]]) {
    const res = await render(`/${lang}/kyoto/kyoto-ryokan-beauty-clinic/`);
    assert.equal(res.status, 200, `${lang} page renders`);
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    assert.match(html, /noindex/, `${lang} noindex`);
    assert.match(html, /xp-preview-banner/, `${lang} preview banner`);
    assert.doesNotMatch(text, PRIVATE, `${lang}: company, people, street and phone stay off the page`);
    assert.match(text, /Jakuchu-an|若冲庵/, `${lang}: the clinic is named`);
    assert.match(html, /\/images\/clinic-entrance\.webp/, `${lang}: the clinic's own photos`);
    // No amount in the booking display: the price block, the card's note, the
    // sticky bar and the structured data. (The FAQ keeps indicative fees.)
    const block = (re) => (html.match(re) ?? [""])[0];
    assert.ok(block(/class="bk-price"[\s\S]*?<\/div>/).length > 0 && !/[¥￥]|\d{2},\d{3}/.test(block(/class="bk-price"[\s\S]*?<\/div>/)), `${lang}: no amount in the booking card price block`);
    assert.ok(!/[¥￥]/.test(block(/class="bk-est[^"]*"[\s\S]*?<\/div>/)), `${lang}: no estimate amount in the booking card`);
    assert.ok(!/[¥￥]/.test(block(/class="sticky-request[^"]*"[\s\S]*?<\/div>\s*<a/)), `${lang}: no amount in the sticky bar`);
    assert.ok(!html.includes('"@type":"Product"'), `${lang}: no priced structured data`);
    assert.ok(/5%/.test(block(/class="bk-est[^"]*"[\s\S]*?<\/div>/)), `${lang}: the 5% coupon is stated in the booking card`);
    assert.match(html, /class="perk-badge">5%/, `${lang}: coupon badge on the photo`);
    assert.match(html, /class="xp-perk"/, `${lang}: coupon line under the title`);
    assert.match(html, /class="xp-perk-banner"/, `${lang}: coupon banner above the request form`);
    assert.doesNotMatch(text, FORBIDDEN_CLAIMS, `${lang}: no testimonial, result or superlative wording`);
    assert.ok(text.includes(expect), `${lang}: payment at the clinic`);
    assert.ok(/self-pay|自由診療/.test(text), `${lang}: self-pay practice stated`);
    assert.ok(/side effects|副作用/.test(text), `${lang}: risks and side effects stated`);
  }
  for (const path of ["/en/kyoto/", "/en/wellness-beauty/", "/en/experiences/", "/ja/kyoto/"]) {
    const html = await (await render(path)).text();
    assert.ok(!html.includes("kyoto-ryokan-beauty-clinic"), `${path} does not list the preview`);
  }
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.ok(!sitemap.includes("kyoto-ryokan-beauty-clinic"), "not in the sitemap");
});
