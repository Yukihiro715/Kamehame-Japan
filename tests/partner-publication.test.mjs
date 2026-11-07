import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { catalogFor } = await vite.ssrLoadModule("/lib/catalog.ts");
const { pricingFor, quote } = await vite.ssrLoadModule("/lib/pricing.ts");
const { isBookable } = await vite.ssrLoadModule("/components/site/booking-context.tsx");
const newlyPublished = ["nerima-herbal-bath-private-spa", "yotsuya-tea-ceremony", "nihonbashi-japanese-dance-salon", "nihonbashi-english-rakugo-salon", "nihonbashi-shamisen-salon"];
const existing = ["kyoto-garden-teahouse-tea-ceremony", "kyoto-higashiyama-shared-tea-ceremony", "kyoto-higashiyama-private-tea-ceremony", "kyoto-higashiyama-annex-tea-ceremony", "nihonbashi-kendo-experience", "nihonbashi-bushido-experience", ...["tokyo", "osaka", "kyoto", "nagoya", "okinawa", "kanazawa", "himeji"].map(city => `${city}-kendo-experience-tour`)];

test("approved pages remain available in every language and existing partners stay published", () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    for (const slug of newlyPublished) assert.equal(catalogFor(lang).experiences.find(e => e.slug === slug)?.status, "live", `${lang}/${slug}`);
  }
  for (const slug of existing) assert.equal(catalogFor("en").experiences.find(e => e.slug === slug)?.status, "live", slug);
});

test("spa booking quotes use group totals and reject Tuesday requests", () => {
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const spa = catalogFor(lang).experiences.find(e => e.slug === newlyPublished[0]);
    const pricing = pricingFor(spa, lang);
    for (const [party, total] of [[1, 24000], [2, 42000], [3, 60000]]) assert.equal(quote(pricing, "", party)?.total, total, `${lang}, ${party} guests`);
    assert.equal(quote(pricing, "", 4), null);
    assert.equal(isBookable("2026-12-08", { closedWeekdays: spa.availability.closedWeekdays }), false);
    assert.equal(isBookable("2026-12-09", { closedWeekdays: spa.availability.closedWeekdays }), true);
  }
});

const { default: worker } = await import("../dist/server/index.js");
async function render(path) {
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
}

test("published pages render without preview or noindex and appear in sitemap and Tokyo listing", async () => {
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const listing = await (await render(`/${lang}/tokyo/`)).text();
    for (const slug of newlyPublished) {
      const path = `/${lang}/tokyo/${slug}/`;
      const response = await render(path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(!html.includes('class="xp-preview-banner"'), path);
      assert.doesNotMatch(html, /<meta[^>]+name="robots"[^>]+noindex/, path);
      assert.ok(sitemap.includes(path), `sitemap: ${path}`);
      assert.ok(listing.includes(`href="${path}"`), `listing: ${path}`);
      if (slug === newlyPublished[0]) {
        for (const price of ["¥24,000", "¥42,000", "¥60,000"]) assert.ok(html.includes(price), `${path}: ${price}`);
        assert.ok(html.includes(lang === "ja" ? "原則火曜定休" : "Normally closed on Tuesdays"));
        assert.ok(!html.includes("¥14,400"), "wholesale price is not exposed");
      }
    }
  }
});
