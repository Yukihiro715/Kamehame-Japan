// The Arashiyama studio's four experiences: requests close at 18:00 Japan
// time two days before (shown as 前々日 in Japanese), the studio's own
// cancellation notice goes by email only, and the phone layout keeps one
// "all photos" control (the carousel's photo count).
import assert from "node:assert/strict";
import test from "node:test";

const { default: worker } = await import("../dist/server/index.js");
const ctx = { waitUntil() {}, passThroughOnException() {} };
const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const render = (path) => worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), env, ctx);
const text = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ");

test("Arashiyama: two-day cutoff in every language, cancellation notice by email only", async () => {
  for (const slug of ["arashiyama-ninja-experience", "arashiyama-japanese-knife-workshop", "arashiyama-shuriken-casting"]) {
    const ja = text(await (await render(`/ja/kyoto/${slug}/`)).text());
    assert.ok(ja.includes("前々日の18:00(日本時間)まで"), `${slug}: Japanese cutoff`);
    assert.ok(!ja.includes("前日の18:00"), `${slug}: no one-day cutoff left`);
    assert.ok(!ja.includes("電話またはメール"), `${slug}: no phone in the cancellation notice`);
    assert.ok(ja.includes("前日までにメールでお知らせ"), `${slug}: email notice`);
    const en = text(await (await render(`/en/kyoto/${slug}/`)).text());
    assert.ok(/2 days before/.test(en), `${slug}: English cutoff`);
    assert.ok(!/phone or email/i.test(en), `${slug}: no phone in the English notice`);
    assert.ok(en.includes("by email by the day before"), `${slug}: English email notice`);
  }
});
