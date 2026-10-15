import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { usdOf, usd, approxUsd, fxText, hasYen, isPlausibleRate } = await vite.ssrLoadModule("/lib/currency.ts");

const RATE = 150; // the fixed test rate: 1 USD = 150 JPY

test("dollar figures are whole dollars from the yen figure at the given rate", () => {
  assert.equal(usdOf(19800, RATE), 132);
  assert.equal(usdOf(82500, RATE), 550);
  assert.equal(usdOf(330000, RATE), 2200);
  assert.equal(usdOf(350000, RATE), 2333);
  assert.equal(usd(2333), "US$2,333", "US$ prefix, never a bare $");
  assert.equal(approxUsd(82500, RATE), "≈ US$550");
});

test("formatted price strings keep their words and gain a dollar estimate per yen figure", () => {
  assert.equal(fxText("¥82,500 / person", RATE), "≈ US$550 (¥82,500) / person");
  assert.equal(fxText("¥82,500 / person", RATE, true), "≈ US$550 / person");
  assert.equal(fxText("¥330,000 total · 4 golfers", RATE), "≈ US$2,200 (¥330,000) total · 4 golfers");
  assert.equal(fxText("Based on 4 golfers · ¥330,000 per group", RATE), "Based on 4 golfers · ≈ US$2,200 (¥330,000) per group");
  // Two figures in one string, each converted on its own.
  assert.equal(fxText("+¥5,000 per extra guest (¥7,000 in high season)", RATE), "+≈ US$33 (¥5,000) per extra guest (≈ US$47 (¥7,000) in high season)");
  // An "approx." already in the text is not doubled with "≈".
  assert.equal(fxText("From approx. ¥96,667", RATE, true), "From approx. US$644");
  assert.equal(fxText("1名 約¥96,667〜", RATE, true), "1名 約US$644〜");
  // Unpriced copy passes through untouched, so "Custom quote" never gets a conversion.
  assert.equal(fxText("Custom quote", RATE), "Custom quote");
  assert.equal(hasYen("Custom quote"), false);
  assert.equal(hasYen("¥25,000"), true);
});

test("only plausible yen-per-dollar rates are accepted", () => {
  for (const ok of [100, 149.37, 199]) assert.equal(isPlausibleRate(ok), true);
  for (const bad of [0, -1, 1, 49, 401, NaN, Infinity, "150", null, undefined]) assert.equal(isPlausibleRate(bad), false, String(bad));
});
