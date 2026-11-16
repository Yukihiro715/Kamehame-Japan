import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import worker from "../dist/server/index.js";

async function render(path) {
  const response = await worker.fetch(new Request(`https://kamehame-japan.com${path}`, { headers: { accept: "text/html" } }), { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } }, { waitUntil() {}, passThroughOnException() {} });
  assert.equal(response.status, 200, path);
  return response.text();
}
test("the supplier LP renders Japanese metadata, the approved copy and a consultation entry point", async () => {
  const html = await render("/partners-lp/");
  assert.match(html, /<html[^>]+lang="ja"/);
  assert.match(html, /rel="canonical" href="https:\/\/kamehame-japan.com\/partners-lp\/"/);
  assert.match(html, /インバウンド集客の、/);
  assert.match(html, /日本語またはご希望の言語/);
  assert.match(html, /5〜10％/);
  assert.match(html, /貴社へのお支払額を、/);
  assert.doesNotMatch(html, /希望卸価格|希望受取額/);
  assert.match(html, /href="#consult"/);
  assert.match(html, /電話番号/);
  assert.match(html, /type="tel"/);
  assert.match(html, /体験名・サービス名/);
  assert.match(html, /<input(?=[^>]*\bname="title")(?=[^>]*\brequired)[^>]*>/);
  assert.doesNotMatch(html, /確認用フォーム|非公開プレビュー|PREVIEW-ONLY/);
  assert.doesNotMatch(html, /href="[^\"]*\/register\//);
  assert.match(readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8"), /<loc>https:\/\/kamehame-japan.com\/partners-lp\/<\/loc>/);
});
test("the separate registration page is noindex and keeps the existing partner dashboard route intact", async () => {
  const html = await render("/partners-lp/register/");
  assert.match(html, /name="robots" content="noindex, nofollow, noarchive"/);
  assert.match(html, /ご相談後、担当者からご案内した事業者様向け/);
  assert.match(html, /href="\/partners-lp\/"/);
  assert.match(html, /貴社へのお支払額の希望/);
  const dashboard = await render("/partner/");
  assert.doesNotMatch(dashboard, /インバウンド集客の、/);
  assert.match(dashboard, /パートナー向け管理画面/);
});
