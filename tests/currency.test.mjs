import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { usdOf, usd, approxUsd, fxText, hasYen, isPlausibleRate, validateRate, cacheIsFresh, MAX_RATE_AGE_DAYS } = await vite.ssrLoadModule("/lib/currency.ts");

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

test("a rate is accepted only with the right currencies, a plausible figure and a recent, real date", () => {
  const now = Date.parse("2026-10-15T09:00:00Z");
  const good = { base: "USD", quote: "JPY", rate: 158.45, date: "2026-10-14", fetchedAt: "2026-10-15T08:00:00Z" };
  assert.deepEqual(validateRate(good, now), good);
  assert.equal(validateRate({ ...good, stale: true }, now).stale, true, "the stale flag survives");
  assert.equal(validateRate({ ...good, base: "EUR" }, now), null, "wrong base");
  assert.equal(validateRate({ ...good, quote: "USD" }, now), null, "wrong quote");
  assert.equal(validateRate({ ...good, rate: 15.8 }, now), null, "implausible figure");
  assert.equal(validateRate({ ...good, rate: "158" }, now), null, "a string is not a rate");
  assert.equal(validateRate({ ...good, date: "14/10/2026" }, now), null, "malformed date");
  assert.equal(validateRate({ ...good, date: "2026-10-18" }, now), null, "a date days in the future");
  assert.ok(validateRate({ ...good, date: "2026-10-16" }, now), "tomorrow's date (time zones) is tolerated");
  assert.equal(validateRate({ ...good, date: "2026-10-01" }, now), null, `older than ${MAX_RATE_AGE_DAYS} days`);
  assert.ok(validateRate({ ...good, date: "2026-10-09" }, now), "a long weekend's age is fine");
  for (const bad of [null, undefined, "158", 158, [], {}]) assert.equal(validateRate(bad, now), null, String(bad));
});

test("a cached copy must have been taken in the past and within the TTL", () => {
  const now = Date.parse("2026-10-15T09:00:00Z");
  const ttl = 12 * 60 * 60 * 1000;
  assert.equal(cacheIsFresh("2026-10-15T08:00:00Z", ttl, now), true);
  assert.equal(cacheIsFresh("2026-10-14T20:00:00Z", ttl, now), false, "older than the TTL");
  assert.equal(cacheIsFresh("2026-10-15T10:00:00Z", ttl, now), false, "a future timestamp (clock skew or tampering) is not fresh");
  assert.equal(cacheIsFresh("not a date", ttl, now), false);
  assert.equal(cacheIsFresh(undefined, ttl, now), false);
});
