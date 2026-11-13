import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { buildEntries } from "../scripts/sitemap-content.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { GOLF_ARTICLES } = await vite.ssrLoadModule("/lib/golf-articles.ts");
const { articlesFor } = await vite.ssrLoadModule("/lib/articles.ts");
const langs = ["en", "ja", "es", "fr", "zh-tw"];
const read = (f) => existsSync(root + f) ? readFileSync(root + f, "utf8") : null;
const { entries } = buildEntries(read);

test("all golf translations preserve complete structure, figures, and localized destinations", () => {
  assert.equal(GOLF_ARTICLES.length, 8);
  for (const article of GOLF_ARTICLES) {
    const english = article.copy.en;
    assert.doesNotMatch(article.img, /lunch|tonkatsu|lounge/);
    assert.ok(existsSync(root + "public" + article.img));
    for (const lang of langs) {
      const c = article.copy[lang];
      assert.ok(c, `${lang}: ${article.slug}`);
      assert.equal(c.body.length, english.body.length, `${lang}: complete article ${article.slug}`);
      c.body.forEach((block, i) => {
        const source = english.body[i];
        assert.equal(typeof block, typeof source);
        if (typeof block === "string") {
          assert.equal(block.startsWith("## "), source.startsWith("## "));
        } else {
          assert.equal(block.type, source.type);
          if (block.type === "table") {
            assert.equal(block.headings.length, source.headings.length);
            assert.equal(block.rows.length, source.rows.length);
            block.rows.forEach((row, n) => assert.equal(row.length, source.rows[n].length));
          } else {
            assert.equal(block.href, source.href.replace(/^\/en\//, `/${lang}/`));
          }
        }
        // Numbers in source paragraphs and tables must survive translation;
        // extra numeric spelling ("two" -> "2") is allowed.
        const amounts = JSON.stringify(source).match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
        const translated = JSON.stringify(block).match(/\d+(?:,\d{3})*(?:\.\d+)?/g) ?? [];
        for (const amount of amounts) assert.ok(translated.includes(amount), `${lang}/${article.slug} block ${i}: missing ${amount}`);
      });
      const localized = articlesFor(lang).find((a) => a.slug === article.slug);
      assert.ok(localized);
      assert.ok(localized.cta.href.startsWith(`/${lang}/`));
      assert.ok(localized.alt);
      assert.ok(localized.editorial.note);
      if (lang !== "en") {
        assert.notEqual(localized.alt, article.alt);
        assert.notEqual(localized.editorial.note, article.editorial.note);
        assert.notEqual(c.title, english.title);
      }
      const entry = entries.find((e) => e.path === `/${lang}/journal/${article.slug}/`);
      assert.ok(entry, "sitemap includes every translated article");
      assert.equal(Object.keys(entry.alternates).length, 5);
    }
  }
});

test("all 40 published article routes render with reciprocal alternates and matching thumbnails", async () => {
  const { default: worker } = await import("../dist/server/index.js");
  const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), { GOLFPAQ_LIVE: "true", ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  for (const lang of langs) {
    const indexResponse = await render(`/${lang}/journal/`);
    assert.equal(indexResponse.status, 200);
    const index = await indexResponse.text();
    for (const article of GOLF_ARTICLES) {
      const path = `/${lang}/journal/${article.slug}/`;
      assert.ok(index.includes(`href="${path}"`));
      assert.ok(index.includes(`src="${article.img}"`));
      const response = await render(path);
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.ok(html.includes(`rel="canonical" href="https://kamehame-japan.com${path}"`));
      assert.doesNotMatch(html, /name="robots" content="noindex/);
      assert.ok(html.includes(`src="${article.img}"`));
      assert.ok(html.includes(`"inLanguage":"${lang}"`));
      for (const other of langs) assert.ok(html.includes(`href="https://kamehame-japan.com/${other}/journal/${article.slug}/"`));
      const main = html.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1] ?? "";
      assert.ok(main.includes('class="article-body"'));
      if (lang !== "en") assert.doesNotMatch(main, /In this article|Plan your round|Continue planning|Prepared from KAMEHAME/);
      for (const slug of article.relatedArticles) assert.ok(main.includes(`href="/${lang}/journal/${slug}/"`));
      for (const heading of main.matchAll(/href="#(section-\d+)"/g)) assert.ok(main.includes(`id="${heading[1]}"`));
    }
  }
});
