// The GOLFPAQ feed: parsing the partner's monthly listing and detail pages
// (saved fixtures from 2026-11-02), the public projection, and the pricing.
import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true }, logLevel: "silent" });
after(() => vite.close());
const g = await vite.ssrLoadModule("/lib/golfpaq.ts");
const fx = (name) => readFileSync(new URL(`./fixtures/golfpaq/${name}`, import.meta.url), "utf8");

test("listing: self-play rounds inside the window; sold-out and closed cards are kept and flagged, cancelled ones dropped", () => {
  const tours = g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-11-09", "2027-01-09");
  assert.ok(tours.length >= 40 && tours.length <= 70, `tours from 11-09 in November: ${tours.length}`);
  assert.ok(tours.filter((t) => !t.closed && t.seats > 0).length >= 20, "open ones among them");
  assert.ok(tours.filter((t) => t.closed).length >= 10, "sold-out ones among them");
  for (const t of tours) {
    assert.ok(t.seats >= 0 && t.capacity > 0, "seats and capacity");
    if (!t.closed) assert.ok(t.seats > 0, "an open card has seats");
    assert.ok(t.date >= "2026-11-09" && t.date <= "2026-11-30", t.date);
    assert.match(t.id, /^\d+-\d+-\d+$/);
    assert.ok(t.sourceYen >= 13200 && t.sourceYen <= 23100, `partner price ${t.sourceYen}`);
    assert.equal(t.perPersonYen, t.sourceYen + 15000);
    assert.match(t.detailUrl, /^https:\/\/www\.golfpaq\.net\/booking\/plan\/show\//);
    if (t.imageUrl) assert.match(t.imageUrl, /^https:\/\/www\.golfpaq\.net\/booking\/storage\/images\/course\//);
  }
  // the closed card (受付終了, 3 seats shown) is kept but flagged, so the page shows it as sold out
  assert.equal(g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-11-01", "2026-11-30").find((t) => t.id === "1-1066-30821")?.closed, true, "受付終了 is flagged even with seats shown");
  assert.ok(g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-11-01", "2026-11-08").length > 0, "earlier dates exist but are outside the window");
  assert.equal(g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-12-01", "2026-12-31").length, 0, "nothing outside the month");
});

test("index: the published calendar gives the last date the partner sells", () => {
  const dates = g.publishedDatesFromIndex(fx("index.html"));
  assert.ok(dates.length > 60);
  assert.equal(dates[0], "2026-11-01");
  assert.equal(dates[dates.length - 1], "2027-01-31", "the calendar links every day of its last published month");
});

test("detail: departure time, description, schedule and conditions", () => {
  const d = g.parseGolfpaqDetail(fx("detail-30821.html"), new Date("2026-11-02T00:00:00Z"));
  assert.equal(d.departureTime, "06:40");
  assert.match(d.features, /ピート・ダイ/);
  assert.match(d.access, /栃木県日光市/);
  assert.match(d.schedule, /到着/);
  assert.equal(d.lunchIncluded, false, "lunch is paid separately on this tour");
  assert.equal(d.cartIncluded, true);
  assert.ok(d.notes.some((n) => /ラウンド経験/.test(n)));
});

test("public projection: no partner price, no partner link, readable departure", () => {
  const [t] = g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-11-09", "2027-01-09");
  t.details = g.parseGolfpaqDetail(fx("detail-30821.html"));
  const p = g.toPublicTour(t);
  assert.equal(p.perPersonYen, t.sourceYen + 15000);
  assert.ok(!("sourceYen" in p) && !("detailUrl" in p), "internal fields are stripped");
  assert.ok(!JSON.stringify(p).includes("golfpaq.net/booking/plan"), "no link to the partner product");
  assert.equal(p.departure.time, "06:40");
  assert.ok(["Shinjuku (Tokyo)", "Oimachi (Tokyo)", "Tokyo"].includes(p.departure.area));
  assert.ok(!/別途昼食代|ランチは別料金/.test(p.highlights ?? ""), "the lunch note is handled as a flag, not copied");
  assert.ok(!(p.notes ?? []).some((n) => /レンタルクラブは/.test(n)), "the partner's own rental price is not shown");
  assert.deepEqual(g.describePickup("☆大井町発着プラン　昼食補助付き♪"), { area: "Oimachi (Tokyo)", lunch: "subsidy", throughPlay: false });
  assert.deepEqual(g.describePickup("新宿発池袋経由プラン　スループレープランです♪"), { area: "Shinjuku (Tokyo)", via: "via Ikebukuro", lunch: "not_included", throughPlay: true });
  assert.equal(g.describePickup("新宿発王子経由プラン　昼食つき♪").lunch, "included");
});

test("pricing: ¥15,400 → ¥30,400 per person; rental ¥5,500 per renter; totals add up", () => {
  assert.equal(g.customerPricePerPerson(15400), 30400);
  assert.deepEqual(g.enquiryTotal(30400, 1, 0), { tours: 30400, rentals: 0, total: 30400 });
  assert.deepEqual(g.enquiryTotal(30400, 1, 1), { tours: 30400, rentals: 5500, total: 35900 });
  assert.deepEqual(g.enquiryTotal(30400, 3, 2), { tours: 91200, rentals: 11000, total: 102200 });
  assert.equal(g.yen(30400), "¥30,400");
});

test("snapshot window: from today in Japan time with the sold-out rules, nothing when the feed is stale", () => {
  const now = new Date("2026-11-02T20:00:00Z"); // 05:00 JST on 11-03
  assert.equal(g.japanToday(now), "2026-11-03");
  assert.equal(g.firstPublicDay(now), "2026-11-05", "shown from the day after tomorrow");
  // the owner's rules: within 3 days everything is sold out; within 7 days one seat left is sold out; closed cards are sold out
  const open = (date, seats, closed) => !g.availabilityOf({ date, seats, closed }, now).soldOut;
  assert.equal(open("2026-11-03", 10, false), false); assert.equal(open("2026-11-06", 10, false), false);
  assert.equal(open("2026-11-07", 1, false), false); assert.equal(open("2026-11-07", 2, false), true);
  assert.equal(open("2026-11-10", 1, false), false); assert.equal(open("2026-11-11", 1, false), true);
  assert.equal(open("2026-11-20", 5, true), false); assert.equal(open("2026-11-20", 0, false), false);
  assert.deepEqual(g.availabilityOf({ date: "2026-11-20", seats: 3, closed: true }, now), { soldOut: true, seats: 0 });
  const tours = g.parseGolfpaqListing(fx("month-2026-11.html"), "2026-11-01", "2026-11-30");
  const fresh = { updatedAt: new Date(now.getTime() - 3600000).toISOString(), first: "2026-11-05", through: "2027-01-09", tours, months: ["2026-11"], fetchedMonths: 1, failedMonths: 0, detailsPending: 0 };
  const shown = g.publicToursFrom(fresh, now).tours;
  assert.ok(shown.every((t) => t.date >= "2026-11-05"), "today and tomorrow are not shown");
  assert.ok(shown.filter((t) => t.date <= "2026-11-06").every((t) => t.soldOut && t.seats === 0), "the next three days are sold out");
  assert.ok(shown.some((t) => t.soldOut) && shown.some((t) => !t.soldOut && t.seats > 1), "both states appear");
  assert.ok(!("sourceYen" in shown[0]) && !("closed" in shown[0]) && !("detailUrl" in shown[0]), "internal fields stay out");
  const stale = { ...fresh, updatedAt: new Date(now.getTime() - 7 * 3600000).toISOString() };
  assert.deepEqual(g.publicToursFrom(stale, now), { tours: [], updatedAt: null, through: null });
  assert.deepEqual(g.publicToursFrom(null, now).tours, []);
  // the page switch
  assert.equal(g.golfpaqVisible({ KH_ENV: "staging" }), true);
  assert.equal(g.golfpaqVisible({ GOLFPAQ_LIVE: "true" }), true);
  assert.equal(g.golfpaqVisible({}), false);
});

test("refresh: months and details come from the fetcher, details are cached in KV, the per-run budget holds", async () => {
  const store = new Map();
  const kv = { get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null), put: async (k, v) => { store.set(k, v); } };
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    const u = String(url);
    const body = u.endsWith("/booking/") ? fx("index.html") : /coursecategory\/1\/2026\/11$/.test(u) ? fx("month-2026-11.html") : /coursecategory/.test(u) ? fx("month-2026-11.html").replace(/2026年11月/g, "2026年12月") : fx("detail-30821.html");
    return new Response(body, { status: 200, headers: { "content-type": "text/html" } });
  };
  try {
    const now = new Date("2026-11-02T00:00:00Z");
    const s = await g.refreshGolfpaqSnapshot(kv, now, { detailFetches: 3 });
    assert.deepEqual(s.months, ["2026-11", "2026-12", "2027-01"]);
    assert.equal(s.fetchedMonths, 3);
    assert.ok(s.tours.length > 30);
    assert.equal(s.tours.filter((t) => t.details).length, 3, "three details this run");
    assert.equal(s.detailsPending, s.tours.length - 3);
    assert.equal(calls.filter((c) => /plan\/show/.test(c)).length, 3);
    // a second run inside three hours does nothing; a forced run reuses the cached details
    const before = calls.length;
    assert.equal((await g.refreshGolfpaqSnapshot(kv, new Date(now.getTime() + 60000))).updatedAt, s.updatedAt);
    assert.equal(calls.length, before);
    const s2 = await g.refreshGolfpaqSnapshot(kv, new Date(now.getTime() + 4 * 3600000), { detailFetches: 3 });
    assert.equal(s2.tours.filter((t) => t.details).length, 6, "three cached plus three new");
  } finally { globalThis.fetch = realFetch; }
});

test("course names: the English pages use the map, the database overrides it, spacing and width variants match", async () => {
  const c = await vite.ssrLoadModule("/lib/golf-courses-db.ts");
  const names = { [ (await vite.ssrLoadModule("/lib/golf-course-images.ts")).normaliseCourseName("ジェイゴルフ霞ヶ浦") ]: { en: "J-Golf Kasumigaura (DB)", area: "Ibaraki" } };
  assert.equal(c.displayCourseName("ゴルフ５カントリーサニーフィールド", "en"), "Golf5 Country Sunny Field", "full-width digit matches the map");
  assert.equal(c.displayCourseName("ピートダイGC VIPコース", "en"), "Pete Dye Golf Club, VIP Course");
  assert.equal(c.displayCourseName("ジェイゴルフ霞ヶ浦", "en", names), "J-Golf Kasumigaura (DB)", "the database wins");
  assert.equal(c.displayCourseName("ジェイゴルフ霞ヶ浦", "fr", names), "J-Golf Kasumigaura (DB)", "other languages fall back to English");
  assert.equal(c.displayCourseName("ジェイゴルフ霞ヶ浦", "ja", names), "ジェイゴルフ霞ヶ浦", "Japanese keeps the partner's name unless overridden");
  assert.equal(c.displayCourseName("未知のゴルフ倶楽部", "en"), "未知のゴルフ倶楽部", "unknown courses keep their name");
  assert.equal(c.displayCourseArea("白帆カントリークラブ"), "Ibaraki");
});

test("translation: the cron adds English to the cached details and names unknown courses, without touching the snapshot's age", async () => {
  const T = await vite.ssrLoadModule("/lib/golfpaq-translate.ts");
  const now = new Date("2026-11-02T03:00:00Z");
  const tours = g.parseGolfpaqListing(fx("month-2026-11.html"), g.firstPublicDay(now), "2027-01-31").slice(0, 3);
  tours[0].details = { ...g.parseGolfpaqDetail(fx("detail-30821.html"), now), features: "丘陵コース。\nお問い合わせは GOLFPAQ 03-1234-5678 まで\n3188Y(東 OUT)" };
  tours[1].details = { ...g.parseGolfpaqDetail(fx("detail-30821.html"), now), en: { features: "Already there", at: "2026-11-01T00:00:00Z", tries: 1 } };
  tours[2].course = "架空の森ゴルフ倶楽部";
  const updatedAt = new Date(now.getTime() - 600000).toISOString();
  const store = new Map([[g.GOLFPAQ_SNAPSHOT_KEY, JSON.stringify({ updatedAt, first: g.firstPublicDay(now), through: "2027-01-31", tours, months: ["2026-11"], fetchedMonths: 1, failedMonths: 0, detailsPending: 0 })]]);
  const kv = { get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null), put: async (k, v) => { store.set(k, v); } };
  const calls = [];
  const ai = { run: async (model, input) => {
    const text = input.messages[1].content; calls.push(text);
    if (/英語名|golf course as the club/.test(input.messages[0].content)) return { response: "Fictional Forest Golf Club" };
    if (/^1\. /.test(text)) return { response: text.split("\n").map((l, i) => `${i + 1}. EN ${l.replace(/^\d+\. /, "")}`).join("\n") };
    return { response: "EN: " + text.replace(/\n/g, " / ") };
  } };
  const done = await T.translatePendingGolfpaq(kv, ai, { now, maxDetails: 5, hasName: () => false });
  assert.deepEqual(done, { details: 1, names: 1 });
  const snap = JSON.parse(store.get(g.GOLFPAQ_SNAPSHOT_KEY));
  assert.equal(snap.updatedAt, updatedAt, "translation never makes the feed look fresher");
  const en = snap.tours[0].details.en;
  assert.match(en.features, /^EN: 丘陵コース。 \/ 3188Y/); assert.ok(!/GOLFPAQ|03-1234/.test(en.features), "partner line and phone stripped before translation");
  assert.ok(en.notes.length > 0 && en.notes.every((n) => n.startsWith("EN ")), "notes come back one per line without numbering");
  assert.equal(JSON.parse(store.get(g.GOLFPAQ_DETAIL_PREFIX + tours[0].id)).en.features, en.features, "the detail cache carries it for the next refresh");
  assert.equal(snap.tours[1].details.en.features, "Already there", "done ones are left alone");
  assert.ok(!calls.some((c) => /GOLFPAQ/.test(c)), "nothing sent to the model names the partner");
  const auto = JSON.parse(store.get(g.GOLFPAQ_COURSE_NAMES_KEY));
  assert.equal(Object.values(auto)[0].en, "Fictional Forest Golf Club");
  // the public projection: English fields, and the facts a visitor sees carry no phone numbers
  const pub = g.toPublicTour(snap.tours[0], now);
  assert.equal(pub.highlightsEn, en.features); assert.ok(!/03-1234|GOLFPAQ/.test(pub.highlights ?? ""));
  const names = await (await vite.ssrLoadModule("/lib/golf-courses-db.ts")).loadCourseNames(null, kv);
  assert.equal(names[(await vite.ssrLoadModule("/lib/golf-course-images.ts")).normaliseCourseName("架空の森ゴルフ倶楽部")]?.en, "Fictional Forest Golf Club");
});
