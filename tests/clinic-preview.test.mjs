// The Kyoto ryokan-style beauty clinic (lib/catalog.ts): a preview page written
// to the medical advertising guideline. It is reachable by URL, never indexed or
// listed, names no clinic, company, person, street or phone, carries no
// testimonial or result claim, and says the fee is paid at the clinic.
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const { default: worker } = await import("../dist/server/index.js");
const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
const PRIVATE = /若冲|[Jj]akuchu|ダヴィンチ|[Dd]a ?[Vv]inci|麻生|中島|藤森|[Ff]ujinomori|大亀谷|西寺町|075-606|jakuchu-an-biyo/;
const FORBIDDEN_CLAIMS = /before and after|ビフォーアフター|guaranteed|保証|No\.\s?1|最高|cured|完治|testimonial|patients say|患者様の声/i;

test("clinic preview: unlisted, noindex, private, guideline wording, pay at the clinic", async () => {
  for (const [lang, expect] of [["en", "pay the clinic on the day"], ["ja", "クリニックでお支払い"]]) {
    const res = await render(`/${lang}/kyoto/kyoto-ryokan-beauty-clinic/`);
    assert.equal(res.status, 200, `${lang} page renders`);
    const html = await res.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
    assert.match(html, /noindex/, `${lang} noindex`);
    assert.match(html, /xp-preview-banner/, `${lang} preview banner`);
    assert.doesNotMatch(text, PRIVATE, `${lang}: clinic, company, people, street and phone stay off the page`);
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
