import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";

// Every experience page points its og:image at /og/<slug>.jpg (a card rendered
// by scripts/generate-og-cards.py and committed). A missing file 308s to a
// trailing-slash URL and 404s, so social previews show no image. Live pages
// must have theirs; previews too, so that releasing one needs no extra step.
test("every live and preview experience has its social share card", () => {
  const catalog = readFileSync(new URL("../lib/catalog.ts", import.meta.url), "utf8");
  const entries = [...catalog.matchAll(/^\s+slug: "([a-z0-9-]+)", city: "[a-z]+", category: "[a-z-]+"(?:, bookingType: "[a-z]+")?, status: "(live|preview)"/gm)];
  assert.ok(entries.length > 20, "catalog entries found");
  const missing = entries.filter(([, slug]) => !existsSync(new URL(`../public/og/${slug}.jpg`, import.meta.url))).map(([, slug, status]) => `${slug} (${status})`);
  assert.deepEqual(missing, [], "run: python3 scripts/generate-og-cards.py --missing-only");
});
