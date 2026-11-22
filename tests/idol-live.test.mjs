// The Tokyo idol live (lib/catalog.ts tokyo-idol-live-night): a KAMEHAME
// ticket product on the standard experience page in five languages. Selling
// prices only (standard ¥12,000, front ¥19,000, drink charge ¥700 at the
// door); the organiser's cost prices, the group's name and the venue stay
// off the page until the organiser confirms. The old review preview URL
// redirects to the product page.
import assert from "node:assert/strict";
import test from "node:test";

const { default: worker } = await import("../dist/server/index.js");
const ctx = { waitUntil() {}, passThroughOnException() {} };
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" }, redirect: "manual" }), env, ctx);
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");
const SLUG = "tokyo-idol-live-night";

test("idol live: unlisted product page in five languages with selling prices, no cost prices, no group or venue name", async () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const res = await render(`/${lang}/tokyo/${SLUG}/`);
    assert.equal(res.status, 200, `${lang} renders`);
    const html = await res.text();
    const body = text(html);
    assert.ok(/noindex/.test(html), `${lang}: unlisted page is not indexed`);
    assert.ok(body.includes("12,000"), `${lang}: standard price`);
    assert.ok(body.includes("19,000"), `${lang}: front price`);
    assert.ok((html.match(/class="bk-plan /g) ?? []).length === 2, `${lang}: two ticket types in the booking box`);
    assert.ok(!html.includes("form-addons"), `${lang}: no add-on block`);
    assert.ok(body.includes("700"), `${lang}: drink charge`);
    assert.doesNotMatch(body, /(?<![0-9,])(5,000|8,000)(?![0-9])/, `${lang}: no cost prices`);
    assert.doesNotMatch(html, /BUZZ|Premium!!/i, `${lang}: group not named`);
    assert.ok(!/会場名|venue's name|nombre de la sala|nom de la salle|場地名稱/.test(body), `${lang}: venue never named`);
    assert.ok(html.includes('id="request-form"') || html.includes("enquiry") || html.includes('id="request"'), `${lang}: request section`);
    assert.ok(html.includes('id="access"'), `${lang}: access section`);
    assert.ok(html.includes("/images/idol-live-group.webp") && html.includes("/images/idol-live-venue.webp"), `${lang}: organiser photos`);
  }
});

test("idol live: not listed under Tokyo or the idol category while unlisted; old preview URL redirects", async () => {
  for (const path of ["/en/tokyo/", "/ja/"]) {
    const html = await (await render(path)).text();
    assert.ok(!html.includes(`/tokyo/${SLUG}/`), `${path} does not list the idol live`);
  }
  for (const [q, target] of [["?lang=ja", "/ja/tokyo/tokyo-idol-live-night/"], ["", "/en/tokyo/tokyo-idol-live-night/"]]) {
    const res = await render(`/previews/partner-listings/tokyo-underground-idol-live/${q}`);
    assert.ok([301, 302, 307, 308].includes(res.status), `redirect status ${res.status}`);
    assert.ok((res.headers.get("location") ?? "").endsWith(target), `redirects to ${target}`);
  }
});

test("idol live: kept out of the sitemap while unlisted", async () => {
  const { readFileSync } = await import("node:fs");
  const xml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.ok(!xml.includes(`/${SLUG}/`), "not in sitemap");
});
