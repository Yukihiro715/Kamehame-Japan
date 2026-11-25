import assert from "node:assert/strict";
import test from "node:test";
import worker from "../dist/server/index.js";

const languages = ["en", "ja", "es", "fr", "zh-tw"];
const teaPath = (lang, variant) => `/${lang}/kyoto/kyoto-higashiyama-${variant}-tea-ceremony/`;

function render(path) {
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("the tea guide shows catalog totals and links only to existing booking pages", async () => {
  for (const lang of languages) {
    const result = await render(`/${lang}/journal/choosing-tea-ceremony-kyoto/`);
    assert.equal(result.status, 200);
    const html = await result.text();
    for (const price of ["¥33,000 / ¥38,000", "¥45,000 / ¥50,000", "¥23,000 / ¥25,000", "¥35,000 / ¥37,000"]) {
      assert.ok(html.includes(price), `${lang}: ${price}`);
    }
    assert.ok(html.includes(`href="${teaPath(lang, "private")}#request-form"`));
    assert.ok(html.includes(`href="${teaPath("en", "shared")}#request-form"`));
  }
  const html = await (await render(teaPath("en", "shared"))).text();
  for (const lang of languages.slice(1)) {
    assert.ok(!html.includes(`href="https://kamehame-japan.com${teaPath(lang, "shared")}"`));
  }
});

test("legal pages show the paid provisional flow before the availability-enquiry terms", async () => {
  for (const route of ["legal", "terms"]) {
    const html = await (await render(`/en/${route}/`)).text();
    assert.ok(html.includes("Paid provisional bookings"));
    assert.ok(html.includes("Pay now to submit a provisional booking"));
    assert.ok(html.indexOf("Paid provisional bookings") < html.indexOf("Bookings made by availability enquiry"));
  }
});
