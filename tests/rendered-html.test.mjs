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

test("renders development preview metadata", async () => {
  const response = await render();

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("closes the document after the last inline script", async () => {
  // vinext appends its RSC payload scripts after React's closing tags; the
  // Worker moves </body></html> to the end so scanners do not read the
  // trailing scripts as an injection.
  const html = (await (await render()).text()).trimEnd();

  assert.ok(html.endsWith("</body></html>"), `document ends with: ${html.slice(-80)}`);
  assert.equal(html.indexOf("</html>"), html.lastIndexOf("</html>"), "only one </html>");
  assert.equal(html.indexOf("</body>"), html.lastIndexOf("</body>"), "only one </body>");
  assert.ok(html.includes("__VINEXT_RSC_DONE__"), "RSC payload is still delivered");
});

test("serves security.txt and marks confirmation pages noindex", async () => {
  const txt = await render("/.well-known/security.txt");
  assert.equal(txt.status, 200);
  assert.match(txt.headers.get("content-type") ?? "", /^text\/plain/);
  assert.match(await txt.text(), /^Contact: mailto:hello@kamehame-japan\.com$/m);

  const booked = await render("/en/booked/");
  assert.equal(booked.status, 200);
  assert.equal(booked.headers.get("x-robots-tag"), "noindex, nofollow");
  const home = await render("/");
  assert.equal(home.headers.get("x-robots-tag"), null);
});

test("golf page: two areas, published prices for 2–4 golfers, one options panel, one form", async () => {
  const html = await (await render("/en/tokyo/mt-fuji-golf-day/")).text();

  assert.match(html, /<title>Private Golf Day from Tokyo \| Mt\. Fuji &amp; Tokyo Area \| KAMEHAME JAPAN<\/title>/);
  assert.match(html, /<h1>Private Golf Day from Tokyo<\/h1>/);
  // every package price from the master is on the page (the read-only table), the old ones are not
  for (const price of ["¥250,000", "¥270,000", "¥290,000", "¥310,000", "¥330,000", "¥350,000"]) {
    assert.ok(html.includes(price), `price table shows ${price}`);
  }
  assert.doesNotMatch(html, /¥180,000|¥220,000|¥280,000/, "the old prices are gone");
  // the default selection: Mt. Fuji, four golfers, per person first, group total beside it
  const text = html.replace(/<[^>]+>/g, "");
  assert.ok(text.includes("¥87,500") && text.includes("¥350,000 total · 4 golfers"), "Mt. Fuji per-person and total for four");
  assert.ok(text.includes("¥82,500") && text.includes("¥330,000 total · 4 golfers"), "Tokyo per-person and total for four");
  assert.ok(html.includes('class="vh-timings" open'), "sample timings start open");
  assert.ok(html.includes("6:00 pm JST") && !/18:00 Japan time/.test(html), "times read as 12-hour JST");
  assert.ok(html.includes("/images/golf-fuji-aerial.jpg") && !/golf-flag-fuji|golf-swing|golf-fairway/.test(html), "new photos only");
  assert.ok(text.includes("Includes private transfers, 18 holes, rental clubs, English-speaking assistance and lunch."), "shared includes line");
  assert.ok(text.includes("Private hotel transfers") && !text.includes("Tokyo & Mt. Fuji · Private hotel transfers"), "benefit chips, no subtitle");
  // the listing card opens on the same numbers as the page
  const list = (await (await render("/en/golf/")).text()).replace(/<[^>]+>/g, "");
  assert.ok(list.includes("¥82,500") && list.includes("Based on 4 golfers · ¥330,000 per group"), "listing card shows the per-person figure with its party size and group total");
  assert.doesNotMatch(list, /¥180,000|¥250,000 \/ group/, "no old or bare group price on the listing");
  // one place to choose, one form, no second-choice date, no quote-by-party-size
  assert.equal(html.split('id="golf-options"').length - 1, 1, "exactly one options panel");
  assert.equal(html.split('id="request-form"').length - 1, 1, "exactly one request form anchor");
  assert.equal(html.split("<form ").length - 1, 1, "exactly one form");
  assert.doesNotMatch(html, /alt-date|Alternative date|Second-choice/i, "no second-choice date");
  assert.doesNotMatch(html, /quoted individually for this group size|3–4 golfers: Custom quote/i, "no quote by party size");
  // the guide assists; nobody promises a playing guide or a caddie
  assert.ok(html.includes("does not normally play"), "guide does not play");
  assert.doesNotMatch(html, /caddie (is )?included|guide plays the round with you/i);
  for (const field of ['name="golfers"', 'name="area"', 'name="specific-course"', 'name="pickup"', 'name="hotel-undecided"', 'name="level"', 'name="rental-1"', 'name="handed-1"', 'name="whatsapp"']) {
    assert.ok(html.includes(field), `request form has ${field}`);
  }
  assert.ok(html.includes("Send Golf Day Request"), "the submit button has its own label");
  assert.ok(html.includes("Check Availability"), "the page CTA is Check Availability");
  assert.ok(html.includes("Custom quote"), "a specific course is quoted");
  assert.ok(html.includes('"@type":"AggregateOffer"') && html.includes('"lowPrice":"250000"') && html.includes('"highPrice":"350000"'), "structured data carries the price range");
});

test("golf request: the server validates the choice against the price master", async () => {
  const post = async (body) => {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
    const { default: worker } = await import(workerUrl.href);
    const res = await worker.fetch(
      new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    return { status: res.status, json: await res.json() };
  };
  const base = { kind: "guest", lang: "en", experience: "mt-fuji-golf-day", name: "Test", email: "test@example.com", area: "Tokyo Area Golf Day", dates: "2027-04-10 07:00", pickup: "Hotel X" };
  // a valid choice gets past validation (delivery is unconfigured in the test runner, which is the next step)
  const ok = await post({ ...base, area_id: "tokyo", party: "3", course_mode: "recommended" });
  assert.equal(ok.status, 503);
  assert.equal(ok.json.error, "unconfigured");
  // an area or a party size outside the master is refused, whatever the browser claims
  for (const bad of [{ area_id: "osaka", party: "2" }, { area_id: "fuji", party: "5" }, { area_id: "fuji", party: "1" }]) {
    const r = await post({ ...base, ...bad });
    assert.equal(r.status, 400, `rejects ${JSON.stringify(bad)}`);
  }
});

test("ramen classes: Tokyo and Osaka live, priced per person, listed, never naming the venue", async () => {
  const pages = [
    ["/en/tokyo/shibuya-ramen-class/", "Ramen Making Class near Shibuya, Tokyo", "/en/tokyo/"],
    ["/en/osaka/dotonbori-ramen-class/", "Ramen Making Class in Dotonbori, Osaka", "/en/osaka/"],
  ];
  for (const [path, title, city] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, "");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes("¥25,000"), "sale price");
    assert.ok(!text.includes("Preview — this page is not published yet"), "published");
    assert.doesNotMatch(html, /Ramen Dojo|Ohashi|Meguro|Soemoncho|宗右衛門/i, "the venue's name and address stay private");
    assert.ok(text.includes("11:00") && text.includes("18:30"), "session times from the partner sheet");
    assert.ok(text.includes("Up to 30 days before the date"), "30-day free cancellation from the partner sheet");
    assert.ok(!html.includes("ramen-three-bowls"), "no branded bowls");
    const listing = await (await render(city)).text();
    assert.ok(listing.includes(path), `listed on ${city}`);
  }
  const osaka = await render("/en/osaka/");
  assert.equal(osaka.status, 200);
  assert.ok((await osaka.text()).includes("Experiences in Osaka"), "the Osaka city page");
  const home = await (await render("/en/")).text();
  assert.ok(home.includes('href="/en/osaka/"') && home.includes('href="/en/ramen/"'), "home links the city and the ramen theme");
});

test("kendo, bushido and tea ceremony: preview pages that never name the partners", async () => {
  const pages = [
    ["/en/tokyo/nihonbashi-kendo-experience/", "Kendo Experience in a Nihonbashi Dojo, Tokyo", "¥20,000"],
    ["/en/tokyo/nihonbashi-bushido-experience/", "Bushido Experience in a Tokyo Dojo: the Nihon Kendo Kata", "¥10,000"],
    ["/en/tokyo/yotsuya-tea-ceremony/", "Tea Ceremony in a Yotsuya Tearoom, Tokyo", "¥8,800"],
  ];
  for (const [path, title, price] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, "");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes(price), `placeholder price on ${path}`);
    assert.ok(text.includes("Preview — this page is not published yet"), `preview banner on ${path}`);
    assert.doesNotMatch(html, /Kendo Spirit|Umino|海野|Kobunach|浜町|SEC Nihonbashi|Watanabe|有庵|r_cafe|Airbnb/i, `partner names stay private on ${path}`);
  }
  const listing = await (await render("/en/tokyo/")).text();
  assert.ok(!listing.includes("nihonbashi-kendo-experience") && !listing.includes("yotsuya-tea-ceremony"), "not listed while in preview");
});

test("group-priced page: facts under the photos, per-person headline with the group total", async () => {
  const html = await (await render("/en/kyoto/evening-with-geiko/")).text();
  const h1 = html.indexOf("<h1"), gallery = html.indexOf('class="gallery-bar"'), chips = html.indexOf('class="xp-conditions"');
  assert.ok(h1 > 0 && gallery > h1 && chips > gallery, "title, then photos, then the facts");
  const card = html.match(/<div class="bk-price">([\s\S]*?)<\/div>/)?.[1].replace(/<[^>]+>/g, " ") ?? "";
  assert.match(card, /From\s+¥80,500\s+\/ person/, "per-person figure leads the booking card");
  assert.ok(card.includes("¥161,000 total · 2 guests"), "the group total it comes from");
  const bar = html.match(/class="sticky-price">([\s\S]*?)<\/div>/)?.[1].replace(/<[^>]+>/g, " ") ?? "";
  assert.match(bar, /¥80,500[\s\S]*¥161,000 total · 2 guests/, "the sticky bar matches");
  const listing = (await (await render("/en/kyoto/")).text()).replace(/<[^>]+>/g, " ");
  assert.match(listing, /¥80,500\s+\/ person\s+Based on 2 guests · ¥161,000 per group/, "listing card per person with the party size");
});

test("the document language follows the locale segment", async () => {
  for (const [path, lang] of [["/ja/kyoto/", "ja"], ["/fr/", "fr"], ["/zh-tw/tokyo/kanji-name-calligraphy/", "zh-tw"], ["/en/about/", "en"], ["/", "en"]]) {
    const html = await (await render(path)).text();
    assert.match(html, new RegExp(`<html[^>]*\\blang="${lang}"`), `${path} is ${lang}`);
  }
});

test("sitemap dates follow the content, not the build", async () => {
  const { readFileSync } = await import("node:fs");
  const { buildEntries } = await import("../scripts/sitemap-content.mjs");
  const read = (f) => { try { return readFileSync(new URL(`../${f}`, import.meta.url), "utf8"); } catch { return null; } };
  const { entries } = buildEntries(read);
  const undated = entries.filter((e) => e.key == null && e.date == null);
  assert.deepEqual(undated.map((e) => e.path), [], "every page has a content key or a declared date");
  const xml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const dates = [...xml.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map((m) => m[1]);
  assert.equal(dates.length, entries.length, "one lastmod per URL");
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  assert.ok(dates.every((d) => d <= today), "no date in the future");
  assert.ok(new Set(dates).size > 1, "unchanged pages keep their own earlier dates");
});

test("sends baseline security headers", async () => {
  const response = await render();

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=\d+/);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'self'/);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});
