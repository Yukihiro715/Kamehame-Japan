import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test('partner listing drafts stay unlisted and cannot accept reservations',async()=>{
 const slugs=['tokyo-underground-idol-live','tokyo-ninja-zen-night-walk','mukojima-geisha-evening','japanese-home-cooking-class','tokyo-matcha-cultural-experience','arashiyama-private-terrace-gathering','sumi-e-ink-painting'];
 for(const slug of slugs)for(const lang of ['en','ja']){
  const response=await render(`/previews/partner-listings/${slug}/?lang=${lang}`);
  assert.equal(response.status,200,slug);const html=await response.text();
  assert.match(html,/noindex/);assert.ok(!html.includes('<form'),slug);
  assert.ok(!html.includes('\"@type\":\"Product\"'),slug);
  assert.ok(html.includes(lang==='ja'?'予約受付前':'Not open for booking'));
 }
 const missing=await render('/previews/partner-listings/not-a-listing/');assert.equal(missing.status,404);
});
