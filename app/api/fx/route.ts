import { isPlausibleRate, type FxRate } from "@/lib/currency";

// The day's USD→JPY reference rate, for the dollar estimates shown beside
// yen prices. Source: Frankfurter (European Central Bank reference rates,
// published once per working day; free, no key). The Worker caches the
// answer for a day in the edge cache and keeps the last good answer for a
// month, so the source is asked at most about once a day per location, a
// visitor's page never waits on it, and an outage serves the last known
// rate (marked stale) rather than nothing. With no rate at all the site
// simply stays in yen (components/site/currency-context.tsx).

const SOURCE = "https://api.frankfurter.app/latest?from=USD&to=JPY";
const FRESH_KEY = "https://kamehame-japan.com/api/fx/_cache/fresh";
const LAST_GOOD_KEY = "https://kamehame-japan.com/api/fx/_cache/last-good";
const FRESH_SECONDS = 24 * 60 * 60;
const LAST_GOOD_SECONDS = 30 * 24 * 60 * 60;

/** The Workers edge cache; absent in the Node preview server and the test runner. */
function edgeCache(): Cache | undefined {
  const c = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
  return c?.default;
}

function json(body: unknown, status = 200, maxAge = 3600) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": `public, max-age=${maxAge}` },
  });
}

async function fetchSource(): Promise<FxRate | null> {
  try {
    const res = await fetch(SOURCE, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { date?: string; rates?: { JPY?: number } };
    const rate = data.rates?.JPY;
    if (!isPlausibleRate(rate) || typeof data.date !== "string") return null;
    return { base: "USD", quote: "JPY", rate: Math.round(rate * 10000) / 10000, date: data.date, fetchedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

async function readCache(cache: Cache | undefined, key: string): Promise<FxRate | null> {
  if (!cache) return null;
  try {
    const hit = await cache.match(new Request(key));
    if (!hit) return null;
    const fx = (await hit.json()) as FxRate;
    return isPlausibleRate(fx.rate) ? fx : null;
  } catch {
    return null;
  }
}

async function writeCache(cache: Cache | undefined, key: string, fx: FxRate, seconds: number) {
  if (!cache) return;
  try {
    await cache.put(new Request(key), new Response(JSON.stringify(fx), {
      headers: { "content-type": "application/json", "cache-control": `public, max-age=${seconds}` },
    }));
  } catch { /* the cache is best effort */ }
}

export async function GET() {
  const cache = edgeCache();
  const fresh = await readCache(cache, FRESH_KEY);
  if (fresh) return json(fresh);

  const live = await fetchSource();
  if (live) {
    await Promise.all([writeCache(cache, FRESH_KEY, live, FRESH_SECONDS), writeCache(cache, LAST_GOOD_KEY, live, LAST_GOOD_SECONDS)]);
    return json(live);
  }

  const lastGood = await readCache(cache, LAST_GOOD_KEY);
  if (lastGood) return json({ ...lastGood, stale: true }, 200, 600);

  // No rate at all: the client keeps every price in yen.
  return json({ error: "rate unavailable" }, 503, 0);
}
