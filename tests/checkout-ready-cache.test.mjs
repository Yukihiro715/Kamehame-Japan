import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false }, logLevel: "silent" });
after(() => vite.close());
const m = await vite.ssrLoadModule("/lib/experience-checkout.ts");
const { EXPERIENCE_POLICY_VERSION } = await vite.ssrLoadModule("/lib/provisional-booking.ts");
const env = { EXPERIENCE_CHECKOUT_ENABLED: "true", STRIPE_CHECKOUT_KEY: "rk_live_test", STRIPE_READ_KEY: "x", STRIPE_WEBHOOK_SECRET: "x", GOLF_AUTOMATION_TOKEN: "t", GOLF_AUTOMATION_URL: "https://script.google.com/macros/s/x/exec" };
const tick = () => new Promise((r) => setTimeout(r, 0));

test("the page's readiness answer is cached: one ledger call per TTL, stale answers served while refreshing", async (t) => {
  let calls = 0, ready = true;
  t.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ ok: true, version: EXPERIENCE_POLICY_VERSION, ready }); });
  m.resetCheckoutReadyCache();
  const t0 = Date.now();
  assert.equal(await m.checkoutReadyCached(env, t0), true, "cold: asks the ledger and waits");
  assert.equal(calls, 1);
  assert.equal(await m.checkoutReadyCached(env, t0 + 60_000), true, "fresh: no second call");
  assert.equal(calls, 1);
  ready = false;
  assert.equal(await m.checkoutReadyCached(env, t0 + 6 * 60_000), true, "stale: the last answer is served at once…");
  for (let i = 0; i < 200 && calls < 2; i++) await tick();
  assert.equal(calls, 2, "…and one refresh ran in the background");
  for (let i = 0; i < 200 && (await m.checkoutReadyCached(env, Date.now())) !== false; i++) await tick();
  assert.equal(await m.checkoutReadyCached(env, Date.now()), false, "the refreshed answer is the new value");
  assert.equal(calls, 2);
});

test("a shared Cache API answer saves the cold wait, and the result is written back to it", async (t) => {
  let calls = 0; const store = new Map();
  t.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ ok: true, version: EXPERIENCE_POLICY_VERSION, ready: true }); });
  globalThis.caches = { default: { match: async (u) => store.get(u)?.clone(), put: async (u, r) => { store.set(u, r); } } };
  try {
    m.resetCheckoutReadyCache();
    assert.equal(await m.checkoutReadyCached(env, Date.now()), true);
    assert.equal(calls, 1);
    const [url, res] = [...store.entries()][0];
    assert.match(url, /experience-checkout-ready/);
    assert.deepEqual(await res.clone().json().then((j) => j.ready), true, "written to the shared cache");
    // a different isolate (empty memory) reads the shared answer instead of calling the ledger
    m.resetCheckoutReadyCache();
    assert.equal(await m.checkoutReadyCached(env, Date.now()), true);
    assert.equal(calls, 1, "no ledger call: the shared answer was fresh");
  } finally { delete globalThis.caches; }
});

test("a published KV answer is used without any ledger call, and the publisher writes it", async (t) => {
  let calls = 0; const kv = new Map();
  const READY_STATE = { get: async (k) => kv.has(k) ? JSON.parse(kv.get(k)) : null, put: async (k, v) => { kv.set(k, v); } };
  t.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ ok: true, version: EXPERIENCE_POLICY_VERSION, ready: true }); });
  m.resetCheckoutReadyCache();
  const published = await m.publishCheckoutReady({ ...env, READY_STATE });
  assert.equal(published.value, true); assert.equal(calls, 1);
  assert.equal(JSON.parse(kv.get(m.READY_STATE_KEY)).ready, true, "written to KV");
  m.resetCheckoutReadyCache();
  assert.equal(await m.checkoutReadyCached({ ...env, READY_STATE }, Date.now()), true, "a page reads the published answer");
  assert.equal(calls, 1, "no ledger call from the page");
  // the env switch wins immediately over a published "ready"
  assert.equal(await m.checkoutReadyCached({ ...env, READY_STATE, EXPERIENCE_CHECKOUT_ENABLED: "false" }, Date.now()), false);
  // a published answer older than 30 minutes is ignored (the cron has stopped): the fallback asks the ledger
  kv.set(m.READY_STATE_KEY, JSON.stringify({ ready: true, at: Date.now() - 31 * 60_000, version: EXPERIENCE_POLICY_VERSION }));
  m.resetCheckoutReadyCache();
  assert.equal(await m.checkoutReadyCached({ ...env, READY_STATE }, Date.now()), true);
  assert.equal(calls, 2, "stale publication: one fallback ledger call");
});

test("publisher checks every tick but writes unchanged state only at the heartbeat, across isolates", async (t) => {
  let now = 1800000000000, calls = 0, writes = 0, ready = true;
  const store = new Map();
  const READY_STATE = { get: async k => store.get(k) ?? null, put: async (k,v) => { writes++; store.set(k, JSON.parse(v)); } };
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ok:true, version:EXPERIENCE_POLICY_VERSION, ready}); });
  const publish = async () => { m.resetCheckoutReadyCache(); return m.publishCheckoutReady({...env, READY_STATE}); };
  await publish();
  for (let i=0; i<2; i++) { now += 5*60000; await publish(); }
  assert.equal(calls, 3); assert.equal(writes, 1);
  now += 5*60000; await publish(); assert.equal(writes, 2, "15-minute heartbeat");
  now += 5*60000; ready=false; await publish(); assert.equal(writes, 3, "unhealthy immediately published");
  now += 5*60000; ready=true; await publish(); assert.equal(writes, 4, "recovery immediately published");
  for (const invalid of [{ready:true,at:now+1,version:EXPERIENCE_POLICY_VERSION},{ready:true,at:now,version:"old"},{ready:"true",at:now,version:EXPERIENCE_POLICY_VERSION}]) {
    store.set(m.READY_STATE_KEY, invalid); const before=writes; await publish(); assert.equal(writes,before+1);
  }
});

test("failed KV publication is retried next tick and read errors do not suppress writes", async (t) => {
  let writes=0, fail=true;
  const READY_STATE = { get: async () => { throw Error("unavailable"); }, put: async () => { writes++; if(fail) throw Error("quota"); } };
  t.mock.method(globalThis, "fetch", async () => Response.json({ok:true,version:EXPERIENCE_POLICY_VERSION,ready:true}));
  await m.publishCheckoutReady({...env, READY_STATE});
  fail=false;
  await m.publishCheckoutReady({...env, READY_STATE});
  assert.equal(writes,2);
});
