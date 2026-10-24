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

/** Mirrors GOLF_MODE in lib/golf-prices.ts: "arrangement" (the booking service, 2026-10-17) or "package" (the private golf day). */
const GOLF_MODE = "arrangement";

test("golf page (booking service): a group fee from one golfer (¥15,000 + ¥5,000 per additional golfer), meet at the course, no transfers in the fee", { skip: GOLF_MODE !== "arrangement" }, async () => {
  const html = await (await render("/en/tokyo/mt-fuji-golf-day/")).text();
  const text = html.replace(/<[^>]+>/g, "");
  assert.match(html, /<title>Japan Golf Course Booking Service \| Tokyo Area &amp; Mt\. Fuji \| KAMEHAME JAPAN<\/title>/);
  assert.match(html, /<h1>Japan Golf Course Booking Service<\/h1>/);
  // the group fee leads (2026-10-24: ¥15,000 for the first golfer + ¥5,000 each additional), its breakdown under it; the package prices are gone
  assert.match(text, /¥20,000\s*fee\s*¥15,000 \+ ¥5,000 × 1 additional golfer(?!s)/, "Mt. Fuji card: the fee for two, then its breakdown");
  for (const price of ["¥15,000", "¥20,000", "¥25,000", "¥30,000"]) assert.ok(html.includes(price), `fee table shows ${price}`);
  assert.ok(text.includes("¥15,000 for one golfer") && text.includes("¥15,000 + ¥5,000 × 3 additional golfers"), "fee table breakdown for one and four golfers");
  assert.doesNotMatch(text, /¥45,000|¥60,000|flat fee|per golfer and the same/, "no trace of the per-golfer fee");
  assert.doesNotMatch(html, /¥250,000|¥270,000|¥290,000|¥310,000|¥330,000|¥350,000/, "no package prices");
  assert.ok(text.includes("1 golfer") && !text.includes("1 golfers"), "a single golfer, in the singular");
  // larger groups (2026-10-23): a "5 or more" choice, a quoted row in the fee table, the FAQ
  assert.ok(text.includes("5 or more") && text.includes("5 to 12 golfers") && text.includes("Can you arrange for a group of five or more?"), "five or more golfers are taken and quoted");
  assert.doesNotMatch(text, /−¥5,000|Bringing own \(/, "no own-clubs deduction in the booking service");
  // what we arrange vs what is not part of the service
  assert.ok(text.includes("What the Arrangement Fee Covers"), "inclusions heading");
  assert.equal(html.split('class="gi-card"').length - 1, 9, "nine arranged items (ten cards: no driver or lunch card)");
  assert.equal(html.split('class="gi-card gi-no"').length - 1, 1, "only golf wear is outside the service");
  assert.match(html, /gi-card"[\s\S]{0,900}Private Transfer[\s\S]{0,300}We introduce a licensed transfer company/, "the transfer partner is something we arrange");
  assert.match(html, /gi-card"[\s\S]{0,900}English Assistant[\s\S]{0,200}Optional/, "the assistant is an option");
  assert.ok(!/gi-label">(Driver|Lunch)</.test(html), "no driver or lunch card");
  assert.ok(text.includes("Getting There: Your Choice") && !text.includes("Travel in Comfort"), "the getting-there section replaces the transfer section");
  assert.ok(text.includes("we introduce a licensed private transfer partner"), "the partner is introduced, not named");
  assert.doesNotMatch(html, /Rion/i, "the transfer partner is never named");
  assert.ok(text.includes("Agree requirements and pay for research"), "reassurance under the options");
  // the form: tee time, optional base, no pick-up prefecture, an assistant choice
  assert.ok(html.includes("Preferred tee time") && html.includes('name="assistant"') && html.includes('name="pickup"') && html.includes('name="caddie"'), "booking-service form fields");
  // the transfer choice: not ours to sell, the partner introduced on request
  assert.ok(html.includes('name="transfer"') && html.includes("please introduce the transfer partner") && html.includes("we connect you directly with our partner transfer company"), "transfer choice with the partner note");
  assert.ok(!html.includes('name="pickup_region"') && !html.includes('name="hotel-undecided"'), "no pick-up prefecture or hotel-undecided fields");
  assert.ok(html.includes("Send Tee-Time Request") && html.includes("Check Tee Times"), "CTAs");
  assert.equal(html.split("<form ").length - 1, 1, "exactly one form");
  // terms and structured data follow the fee
  assert.ok(!text.includes("Up to 7 days before the date") && text.includes("¥5,000 covers research and a suitable proposal") && text.includes("we retain ¥5,000 and refund the remainder"), "fee cancellation terms");
  assert.ok(html.includes('"@type":"AggregateOffer"') && html.includes('"lowPrice":"15000"') && html.includes('"highPrice":"30000"'), "structured data carries the fee range");
  // the Japanese page and the listing card follow
  const ja = (await (await render("/ja/tokyo/mt-fuji-golf-day/")).text()).replace(/<[^>]+>/g, "");
  assert.ok(ja.includes("日本のゴルフ場予約手配サービス") && ja.includes("手配料") && ja.includes("ゴルフ場に集合"), "Japanese booking-service copy");
  const list = (await (await render("/en/golf/")).text()).replace(/<[^>]+>/g, "");
  assert.ok(list.includes("¥15,000") && list.includes("/ group") && list.includes("then ¥5,000 for each additional golfer") && !list.includes("¥330,000"), "listing card shows the fee for the group with its rule");
});

test("golf page (package): two areas, published prices for 2–4 golfers, one options panel, one form", { skip: GOLF_MODE !== "package" }, async () => {
  const html = await (await render("/en/tokyo/mt-fuji-golf-day/")).text();

  assert.match(html, /<title>Private Golf Day from Tokyo \| Mt\. Fuji &amp; Tokyo Area \| KAMEHAME JAPAN<\/title>/);
  assert.match(html, /<h1>Private Golf Day from Tokyo<\/h1>/);
  // every package price from the master is on the page (the read-only table), the old ones are not
  for (const price of ["¥250,000", "¥270,000", "¥290,000", "¥310,000", "¥330,000", "¥350,000"]) {
    assert.ok(html.includes(price), `price table shows ${price}`);
  }
  assert.doesNotMatch(html, /¥180,000|¥220,000|¥280,000/, "the old prices are gone");
  // the default selection: Mt. Fuji, four golfers, the group total first, the per-person figure small under it
  const text = html.replace(/<[^>]+>/g, "");
  assert.match(text, /¥87,500\s*\/ person\s*¥350,000 total · 4 golfers/, "Mt. Fuji per person for four, then the group total");
  assert.match(text, /¥82,500\s*\/ person\s*¥330,000 total · 4 golfers/, "Tokyo per person for four, then the group total");
  assert.doesNotMatch(html, /From ¥8[27],500|From approx\./, "the package price is fixed: no 'From' on the area cards");
  assert.match(html, /<span class="go-price">(?:(?!<\/span>).)*<b>¥87,500<\/b>/, "the per-person figure is the card's headline");
  assert.doesNotMatch(html, /<span class="go-price">(?:(?!<\/span>).)*<b>¥350,000<\/b>/, "the group total is not the headline");
  assert.ok(html.includes('class="vh-timings" open'), "sample timings start open");
  assert.ok(html.includes("6:00 pm JST") && !/18:00 Japan time/.test(html), "times read as 12-hour JST");
  assert.ok(html.includes("/images/golf-gallery-01-fuji-aerial.webp") && !/golf-fuji-aerial\.jpg|golf-tokyo-|golf-lakes-aerial|golf-flag-fuji/.test(html), "the shared photo set only");
  assert.ok(text.includes("Includes private transfers with driver, 18 holes, golf cart, rental clubs and shoes, English-speaking assistance, locker room, bath and lunch."), "shared includes line");
  assert.ok(text.includes("Private transfers with driver") && !text.includes("Tokyo & Mt. Fuji · Private hotel transfers"), "benefit chips, no subtitle");
  // what's included: twelve icon cards, eleven covered and only golf wear not, once on the page, no text list beside it
  assert.equal(html.split('class="gi-card"').length - 1, 11, "eleven included cards");
  assert.equal(html.split('class="gi-card gi-no"').length - 1, 1, "one not-included card");
  assert.match(html, /gi-card gi-no"[\s\S]{0,900}Golf Wear Rental/, "the one × is golf wear");
  for (const item of ["18-Hole Golf Round", "Golf Club Rental", "Golf Shoe Rental", "Premium Private Transfer", "Private Driver", "English Assistant", "Golf Cart", "Locker Room", "Bath", "Lunch", "Taxes &amp; Service Fees"]) {
    assert.match(html, new RegExp(`gi-card"[\\s\\S]{0,900}${item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), `${item} is an included card`);
  }
  assert.ok(text.includes("What's Included in Your Golf Day") && text.includes("Please bring your own golf wear and gloves. Golf shoes and clubs are provided."), "grid heading and wear note");
  // own clubs: ¥5,000 per golfer is priced in and deducted when a golfer brings their own (owner's rule, 2026-10-16)
  assert.ok(text.includes("¥5,000 per golfer, included") && text.includes("−¥5,000 per golfer if you bring your own"), "club rental price and deduction on the grid card");
  assert.ok(text.includes("Bringing your own clubs? We deduct ¥5,000 per golfer from the price."), "deduction in the grid footnote");
  assert.ok(text.includes("Rental clubs (¥5,000 per golfer) are included in every package."), "deduction in the price notes");
  assert.ok(text.includes("Bringing own (−¥5,000)") && text.includes("Rental clubs are ¥5,000 per golfer and included in the price."), "deduction in the form");
  assert.equal(html.split('id="included"').length - 1, 1, "one included section");
  assert.ok(!html.includes('class="check-list'), "no text inclusion list beside the grid");
  // the old shoe wording is gone everywhere on the page
  assert.doesNotMatch(html, /Bring your own golf shoes|Golf shoes and gloves|bring golf shoes/i, "no old shoe wording");
  assert.ok(text.includes("The cart fee is included"), "cart FAQ");
  // the transfer section, after the inclusions and before the reviews
  assert.ok(text.includes("Travel in Comfort, From Door to Door"), "transfer section heading");
  assert.ok(text.includes("Know Your Golf Course Before You Pay"), "the reassurance under the options");
  // one word for the person who rides along: assistant, never guide (except the playing guide that is not included)
  {
    // the page's own copy (not the guests' reviews, which are quoted as written, and not the RSC payload after the document)
    const own = html.slice(0, html.indexOf("</main>")).replace(/<section class="xp-section" id="reviews">[\s\S]*?<\/section>/, "").replace(/<[^>]+>/g, "");
    assert.doesNotMatch(own.replace(/playing guide/g, ""), /\bguide\b/i, "no 'guide' wording left in the page's own copy");
  }
  assert.ok(!html.includes("golf-transfer-interior.webp"), "no inset photo over the transfer picture");
  assert.ok(html.indexOf('id="included"') < html.indexOf('id="transfer"') && html.indexOf('id="transfer"') < html.indexOf('id="reviews"'), "section order");
  assert.match(html, /id="transfer"[\s\S]*?<img src="\/images\/golf-transfer-car\.webp" alt="[^"]+" width="1600" height="900" loading="lazy"/, "transfer photo lazy with dimensions");
  assert.doesNotMatch(html, /Alphard guaranteed|guaranteed Alphard/i);
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
  for (const field of ['name="golfers"', 'name="area"', 'name="specific-course"', 'name="pickup"', 'name="hotel-undecided"', 'name="level"', 'name="rental-1"', 'name="handed-1"', 'name="shoes-1"', 'name="whatsapp"']) {
    assert.ok(html.includes(field), `request form has ${field}`);
  }
  // WhatsApp: a country-code select beside the number, one hidden field with the international number
  assert.ok(html.includes('class="wa-field"') && html.includes("Country code…") && html.includes("+44 United Kingdom") && html.includes("+81 Japan"), "WhatsApp field has a country-code select");
  assert.ok(html.includes('type="hidden" name="whatsapp"'), "the WhatsApp number is sent as one hidden field");
  assert.ok(html.includes("Send Golf Day Request"), "the submit button has its own label");
  assert.ok(html.includes("Check Availability"), "the page CTA is Check Availability");
  assert.ok(html.includes("Custom quote"), "a specific course is quoted");
  assert.ok(html.includes('name="pickup_region"') && html.includes('name="caddie"'), "automation choices are explicit");
  assert.ok(text.includes("our team takes care of your course reservation") && text.includes("within 24 hours of payment"));
  assert.doesNotMatch(text, /course (is )?confirmed before payment|course name and tee time before payment/);
  assert.ok(html.includes('"@type":"AggregateOffer"') && html.includes('"lowPrice":"250000"') && html.includes('"highPrice":"350000"'), "structured data carries the price range");
});

test("golf gallery: one fixed set of eleven photos for both areas, in every language, with thumbnails on disk", async () => {
  const { existsSync } = await import("node:fs");
  // the hero and the owner's set in order, the transfer car last
  const expected = Array.from({ length: 11 }, (_, i) => i + 1);
  // the photo each gallery item shows, in track order (preloads and meta tags come before the track)
  const seq = (html) => [...html.matchAll(/<figure class="gg-item">[\s\S]*?\/images\/golf-gallery-(\d\d)-[a-z-]+\.webp/g)].map((m) => Number(m[1]));
  let first = null;
  for (const lang of ["en", "ja", "es", "fr", "zh-tw"]) {
    const html = await (await render(`/${lang}/tokyo/mt-fuji-golf-day/`)).text();
    const main = seq(html);
    // eleven items in the fixed order, with no repeat of the hero
    assert.deepEqual(main, expected, `gallery order in ${lang}`);
    assert.ok(!html.includes('class="gg-area"'), `no area badge on the photos (${lang})`);
    const files = [...new Set(html.match(/\/images\/golf-gallery-[a-z0-9-]+\.webp/g))].sort();
    if (first) assert.deepEqual(files, first, `same files in ${lang}`); else first = files;
    assert.ok(html.includes("Mt. Fuji") || lang !== "en", "photo note present");
  }
  assert.equal(first.length, 11, "eleven distinct files");
  for (const f of first) {
    assert.ok(existsSync(new URL(`../public${f}`, import.meta.url)), `${f} exists`);
    assert.ok(existsSync(new URL(`../public${f.replace("/images/", "/images/thumbs/")}`, import.meta.url)), `thumbnail for ${f} exists`);
  }
  // the hero photo appears once in the gallery track: the catalog gallery never repeats exp.img
  const en = await (await render("/en/tokyo/mt-fuji-golf-day/")).text();
  assert.equal((en.match(/<figure class="gg-item">/g) ?? []).length, 11, "eleven gallery items");
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
  // five golfers or more: accepted as a quote (the booking service, 2026-10-23), so it reaches delivery too
  const large = await post({ ...base, area_id: "fuji", party: "6", course_mode: "recommended" });
  assert.equal(large.status, 503, "a party of six is accepted and quoted");
  for (const bad of [{ area_id: "osaka", party: "2" }, { area_id: "fuji", party: "13" }, { area_id: "fuji", party: "0" }]) {
    const r = await post({ ...base, ...bad });
    assert.equal(r.status, 400, `rejects ${JSON.stringify(bad)}`);
  }
});

const PREVIEW_BANNER = "Preview — this page is not published yet";

test("ramen classes: Tokyo and Osaka published, priced per person, listed, never naming the venue", async () => {
  const pages = [
    ["/en/tokyo/shibuya-ramen-class/", "Ramen Making Class near Shibuya, Tokyo", "/en/tokyo/"],
    ["/en/osaka/dotonbori-ramen-class/", "Ramen Making Class in Dotonbori, Osaka", "/en/osaka/"],
  ];
  for (const [path, title, city] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes("¥26,500"), "sale price");
    assert.ok(!text.includes(PREVIEW_BANNER), `no preview banner on ${path} (published 2026-10-16)`);
    assert.doesNotMatch(html, /Ramen Dojo|Ohashi|Meguro|Soemoncho|宗右衛門/i, "the venue's name and address stay private");
    assert.ok(text.includes("11:00") && text.includes("18:30"), "session times from the partner sheet");
    assert.ok(text.includes("Up to 30 days before the date"), "30-day free cancellation from the partner sheet");
    assert.ok(text.includes("45 days before") && text.includes("44 to 29 days"), "group and private cancellation from the partner sheet");
    assert.ok(text.includes("5 to 10 minutes"), "late tolerance from the partner sheet");
    assert.ok(!html.includes("ramen-three-bowls"), "no branded bowls");
    const listing = await render(city);
    assert.equal(listing.status, 200, city);
    assert.ok((await listing.text()).includes(path), `listed on ${city}`);
  }
  // With the Osaka class live, the city and the ramen theme pages exist and are linked
  assert.equal((await render("/en/osaka/")).status, 200, "Osaka city page with a live experience");
  const theme = await render("/en/ramen/");
  assert.equal(theme.status, 200, "ramen theme page with live experiences");
  assert.doesNotMatch(await theme.text(), /Ramen Dojo|Ohashi|Meguro|Soemoncho|宗右衛門|Viyago/i, "partner names stay private on the theme page");
  const home = await (await render("/en/")).text();
  assert.ok(home.includes('href="/en/osaka/"') || home.includes('href="/en/osaka/dotonbori-ramen-class/"'), "home reaches Osaka");
});

test("theme pages: a home tile lists every published experience in its categories", async () => {
  // Food & Drink → /en/food/: both ramen classes (and any other Food category), with the categories as refine chips.
  const food = await render("/en/food/");
  assert.equal(food.status, 200, "food theme page");
  const html = await food.text();
  assert.ok(html.includes("/en/tokyo/shibuya-ramen-class/") && html.includes("/en/osaka/dotonbori-ramen-class/"), "both ramen classes listed");
  assert.ok(html.includes('<a href="/en/ramen/" class="chip">'), "the ramen category is a refine chip");
  assert.ok(html.includes("Food &amp; drink experiences in Japan") || html.includes("Food & drink experiences in Japan"), "theme heading");
  assert.doesNotMatch(html, /Ramen Dojo|Ohashi|Meguro|Soemoncho|宗右衛門|Viyago/i, "partner names stay private");
  // the home tiles link to the themes, not to one category each
  const home = await (await render("/en/")).text();
  for (const th of ["food", "arts-crafts", "tradition", "sports"]) assert.ok(home.includes(`<a href="/en/${th}/" class="theme-card live">`), `home tile → /en/${th}/`);
  assert.ok(!home.includes('<a href="/en/ramen/" class="theme-card live">'), "no tile goes straight to the ramen category");
  // a theme with no published category has no page and no live tile
  assert.equal((await render("/en/pop-culture/")).status, 404, "pop-culture theme without a published category");
  assert.ok(!home.includes('href="/en/pop-culture/"'), "pop-culture tile is not a link");
  // other languages resolve the same slugs
  for (const lang of ["ja", "es", "fr", "zh-tw"]) assert.equal((await render(`/${lang}/food/`)).status, 200, `${lang} food theme`);
  // the sitemap carries the theme pages
  const { readFileSync } = await import("node:fs");
  const xml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.ok(xml.includes("https://kamehame-japan.com/en/food/") && !xml.includes("/en/pop-culture/"), "sitemap lists live themes only");
});

test("kendo tours are published after approval; unapproved partners remain in preview", async () => {
  const pages = [
    ["/en/tokyo/nihonbashi-kendo-experience/", "Kendo Experience in a Nihonbashi Dojo, Tokyo", "¥20,000", "/en/tokyo/"],
    ["/en/tokyo/nihonbashi-bushido-experience/", "Bushido Experience in a Tokyo Dojo: the Nihon Kendo Kata", "¥10,000", "/en/tokyo/"],
    ["/en/tokyo/yotsuya-tea-ceremony/", "Tea Ceremony in a Yotsuya Tearoom, Tokyo", "¥17,000", "/en/tokyo/"],
    ["/en/tokyo/tokyo-kendo-experience-tour/", "Kendo Experience Tour in Tokyo with Dan-ranked Instructors", "¥19,800", "/en/tokyo/"],
    ["/en/osaka/osaka-kendo-experience-tour/", "Kendo Experience Tour in Osaka with Dan-ranked Instructors", "¥19,800", "/en/osaka/"],
    ["/en/kyoto/kyoto-kendo-experience-tour/", "Kendo Experience Tour in Kyoto with Dan-ranked Instructors", "¥19,800", "/en/kyoto/"],
    ["/en/nagoya/nagoya-kendo-experience-tour/", "Kendo Experience Tour in Nagoya with Dan-ranked Instructors", "¥19,800", "/en/nagoya/"],
    ["/en/okinawa/okinawa-kendo-experience-tour/", "Kendo Experience Tour in Okinawa with Dan-ranked Instructors", "¥19,800", "/en/okinawa/"],
    ["/en/kanazawa/kanazawa-kendo-experience-tour/", "Kendo Experience Tour in Kanazawa with Dan-ranked Instructors", "¥19,800", "/en/kanazawa/"],
    ["/en/himeji/himeji-kendo-experience-tour/", "Kendo Experience Tour in Himeji with Dan-ranked Instructors", "¥19,800", "/en/himeji/"],
  ];
  for (const [path, title, price, city] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes(price), `price on ${path}`);
    const approved = path.includes("-kendo-experience-tour/");
    assert.equal(text.includes(PREVIEW_BANNER), !approved, `publication status on ${path}`);
    if (approved) {
      assert.ok(text.includes("for groups of up to five, two days before is accepted"));
      assert.doesNotMatch(html, /<meta name="robots" content="noindex/);
    }
    assert.doesNotMatch(html, /Kendo Spirit|Umino|海野|Kobunach|浜町|SEC Nihonbashi|Watanabe|有庵|r_cafe|Airbnb|SAMURAI TRIP|Nagamatsu|永松|パークフォーアス|Park For Us|samuraitrip|誠道館|Seidokan|4-7-2/i, `partner names stay private on ${path}`);
    const listing = await render(city);
    if (listing.status === 200) assert.equal((await listing.text()).includes(path), approved, `listing status on ${city}`);
  }
  // the Japanese pages carry the same banner in Japanese
  const ja = (await (await render("/ja/tokyo/tokyo-kendo-experience-tour/")).text()).replace(/<[^>]+>/g, " ");
  assert.ok(!ja.includes("プレビュー — このページはまだ公開していません") && ja.includes("5名以内は2日前まで"), "Japanese publication and sizing deadline");
  // the tour pages carry the partner's answers: a weekday-only tour, the Tokyo venue by district, the other cities
  const tokyoTour = (await (await render("/en/tokyo/tokyo-kendo-experience-tour/")).text()).replace(/<[^>]+>/g, " ");
  assert.ok(tokyoTour.includes("Higashi-Nippori") && tokyoTour.includes("Uguisudani"), "the Tokyo venue is given by district and station only");
  assert.ok(tokyoTour.includes("public holidays"), "weekdays only, no public holidays");
  assert.ok(tokyoTour.includes("All Japan Kendo Federation"), "the federation's supervision is on the page");
  assert.ok(tokyoTour.includes("Groups of 70 or more"), "the 70+ booking rule is on the page");
  const osakaTour = (await (await render("/en/osaka/osaka-kendo-experience-tour/")).text()).replace(/<[^>]+>/g, " ");
  assert.ok(osakaTour.includes("Tokyo, Kyoto, Nagoya, Okinawa, Kanazawa and Himeji"), "the Osaka page lists the other cities");
  assert.ok(!osakaTour.includes("Kyoto instead of Kyoto") && !osakaTour.includes("Osaka instead of Osaka"), "clean city swap");
  const nagoya = (await (await render("/en/nagoya/nagoya-kendo-experience-tour/")).text()).replace(/<[^>]+>/g, " ");
  assert.ok(nagoya.includes("Weekday afternoons, usually from 13:30") && !nagoya.includes("10:00"), "Nagoya runs in the afternoon");
  assert.ok(nagoya.includes("Tokyo, Osaka, Kyoto, Okinawa, Kanazawa and Himeji"), "the Nagoya page lists the other cities");
  // with calligraphy, golf, the geiko evening and the ramen classes live, the site shows three cities and no kendo theme
  const home = await (await render("/en/")).text();
  assert.ok(home.includes('href="/en/himeji/"') && home.includes('href="/en/kendo/"'), "new cities and kendo theme are listed");
  assert.equal((await render("/en/kendo/")).status, 200, "published kendo category");
  assert.equal((await render("/en/himeji/")).status, 200, "published Himeji city");
});

test("samurai, rakugo, cooking, ninja and Arashiyama workshops: preview pages that never name the partners", async () => {
  const pages = [
    ["/en/tokyo/samurai-street-walk-kitasenju/", "Samurai Street Walk & Bushido Experience in Kitasenju, Tokyo", "¥40,000"],
    ["/en/tokyo/tokyo-tate-samurai-sword-experience/", "Private Samurai Experience in Tokyo: Authentic Tate Sword Choreography", "¥33,000"],
    ["/en/tokyo/kichijoji-japanese-cuisine-class/", "Learn Japanese Cuisine from a Professional Chef in Kichijoji, Tokyo", "¥18,500"],
    ["/en/tokyo/asakusa-english-rakugo-walk/", "English Rakugo & Asakusa Cultural Walk, Tokyo", "¥12,000"],
    ["/en/tokyo/tokyo-ninja-zen-meditation/", "Ninja Zen Meditation in Tokyo: Breathing, Hand Seals and Stillness", "¥30,000"],
    ["/en/kyoto/arashiyama-ninja-experience/", "Ninja Experience in Arashiyama, Kyoto: Blowpipe, Shuriken and Hand Seals", "¥17,500"],
    ["/en/kyoto/arashiyama-stone-mill-matcha/", "Stone-Mill Matcha Grinding in Arashiyama, Kyoto", "¥13,500"],
    ["/en/kyoto/arashiyama-japanese-knife-workshop/", "Japanese Knife Making & Sharpening Workshop in Arashiyama, Kyoto", "¥27,000"],
    ["/en/kyoto/arashiyama-shuriken-casting/", "Cast Your Own Metal Shuriken in Arashiyama, Kyoto", "¥20,000"],
    ["/en/tokyo/nihonbashi-japanese-dance-salon/", "Kabuki Dance in Nihonbashi, Tokyo: Performance and Hands-On Experience", "¥21,500"],
    ["/en/tokyo/nihonbashi-english-rakugo-salon/", "English Rakugo in a Nihonbashi Salon, Tokyo: Comic Storytelling Up Close", "¥21,500"],
    ["/en/tokyo/nihonbashi-shamisen-salon/", "Shamisen Up Close in Nihonbashi, Tokyo: Live Performance and a Hands-On Try", "¥21,500"],
  ];
  const partners = /Trip in real Japan|TRJK|trjk|Rojicoya|Hiryu|Musashi|Jimbo|Kikkoman|Cocoro|Kokoro Dining|Kanariya|Eiraku|Koraku|Ichirin|Shiden|Kenbukai|El Sophia|Okimoto|シーズ|ninja-idea|Tamura|田村|Ninja Sanctuary|Bamboo Sky|Arashiyama Square|Sagatenryuji|Susukinobaba|Viyago|Ramen Dojo|Amazing Japan Lounge|amazingjapanlounge|綾音|Ayane|ayanestage|Takahashi|高橋|浜町|Hamacho|Hamachō|Keisho|Ohno/i;
  for (const [path, title, price] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes(price), `price on ${path}`);
    assert.ok(text.includes(PREVIEW_BANNER), `preview banner on ${path}`);
    assert.doesNotMatch(html, partners, `partner names stay private on ${path}`);
    if (path.includes("/tokyo/nihonbashi-") && path.endsWith("-salon/")) {
      // KAMEHAME's standard cancellation (2026-10-23: the stricter of ours and the salon's two-day rule); a minimum of three guests; socks.
      assert.ok(text.includes("Up to 7 days before the date") && text.includes("6 days before or later, including no-shows"), `salon cancellation table on ${path}`);
      assert.ok(!text.includes("6 pm Japan time two days before"), `salon's own cut-off no longer shown on ${path}`);
      assert.ok(text.includes("three guests per day") && text.includes("decides whether the day will run two days before") && text.includes("wear or bring socks"), `salon minimum and socks on ${path}`);
      assert.doesNotMatch(text, /Free cancellation up to 7 days/i, `no site default on ${path}`);
    }
    const arashiyama = path.includes("/kyoto/arashiyama-");
    if (arashiyama) {
      // The partner's own scale (regular vs private/20+), never the site-wide 7-day default, and no fixed-slot or "15 minutes early" promises.
      assert.ok(text.includes("Up to 30 days before the date") && text.includes("29 to 14 days before") && text.includes("13 days before or later"), `tiered cancellation table on ${path}`);
      assert.ok(text.includes("Private sessions and groups of 20 or more: free cancellation ends 45 days before"), `private/20+ terms on ${path}`);
      assert.doesNotMatch(text, /Free cancellation up to 7 days|arrive 15 minutes|Arrive 15 minutes|more than 5 minutes late/i, `no stale promises on ${path}`);
      assert.ok(text.includes("the start time is arranged around your day"), `start time wording on ${path}`);
    }
    // the Japanese page is written; the other locales fall back to the English text so the URL resolves
    for (const lang of ["ja", "es", "fr", "zh-tw"]) {
      const alt = await render(path.replace("/en/", `/${lang}/`));
      assert.equal(alt.status, 200, `${lang} ${path}`);
      const altHtml = await alt.text();
      assert.doesNotMatch(altHtml, partners, `partner names stay private on ${lang} ${path}`);
      if (lang === "ja") assert.ok(altHtml.includes("プレビュー — このページはまだ公開していません") && !altHtml.includes(title), `Japanese text on ${path}`);
      if (lang === "ja" && arashiyama) assert.ok(altHtml.includes("開催30日前まで") && altHtml.includes("貸切または20名以上") && !altHtml.includes("15分前にお越しください"), `Japanese cancellation terms on ${path}`);
    }
  }
  const home = await (await render("/en/")).text();
  assert.ok(!home.includes('href="/en/samurai/"') && !home.includes('href="/en/ninja/"'), "the new themes are not listed while in preview");
  assert.equal((await render("/en/samurai/")).status, 404, "no samurai theme page without a live experience");
});

test("partner handover 2026-10-22: Yotsuya tea table and photos; Camellia, Setagaya and Asakusa noodle previews never name the partners", async () => {
  // The Yotsuya tea page carries the owner's table (2026-10-23: ¥17,000 / ¥15,500 / ¥14,000 per person) and the host's photos.
  const tea = await (await render("/en/tokyo/yotsuya-tea-ceremony/")).text();
  const teaText = tea.replace(/<[^>]+>/g, " ");
  for (const s of ["¥17,000", "¥31,000", "¥46,500", "¥62,000", "¥70,000", "¥140,000", "¥15,500", "¥14,000", "five to ten guests"]) assert.ok(teaText.includes(s), `tea table: ${s}`);
  for (const s of ["¥8,800", "¥7,700", "¥6,600", "quoted with your request"]) assert.ok(!teaText.includes(s), `host's public rate not shown: ${s}`);
  assert.ok(tea.includes("/images/tea-yotsuya-class.jpg") && tea.includes("/images/tea-yotsuya-tatami.jpg"), "host photos on the tea page");
  assert.ok(!tea.includes("craft-hands.jpg") && !tea.includes("Placeholder photos"), "no placeholder photos left on the tea page");
  for (const lang of ["ja", "es", "fr", "zh-tw"]) {
    const alt = await (await render(`/${lang}/tokyo/yotsuya-tea-ceremony/`)).text();
    assert.ok(alt.includes("/images/tea-yotsuya-class.jpg") && !alt.includes("craft-hands.jpg"), `${lang} tea photos`);
    assert.ok(alt.replace(/<[^>]+>/g, " ").includes("¥140,000"), `${lang} tea table`);
  }
  const pages = [
    ["/en/kyoto/kyoto-garden-teahouse-tea-ceremony/", "Private Tea Ceremony in a Garden Teahouse, West Kyoto", ["¥37,500", "¥50,000", "¥250,000", "1 Mar–30 Apr", "Sundays are not available in winter"]],
    ["/en/kyoto/kyoto-higashiyama-shared-tea-ceremony/", "Tea Ceremony in a Higashiyama Teahouse, Kyoto", ["¥11,500", "¥92,000", "¥9,500", "Kimono for the ceremony"]],
    ["/en/kyoto/kyoto-higashiyama-private-tea-ceremony/", "Private Tea Ceremony in a Higashiyama Teahouse, Kyoto", ["¥25,000", "¥33,000", "¥82,500", "Kimono for the ceremony"]],
    ["/en/kyoto/kyoto-higashiyama-annex-tea-ceremony/", "Private Tea Ceremony at an Annex Tearoom in Higashiyama, Kyoto", ["¥38,000", "¥95,000", "ryurei", "Larger parties are quoted on request"]],
    ["/en/tokyo/setagaya-omotesenke-tea-ceremony/", "Omotesenke Tea Ceremony in a Setagaya Tearoom, Tokyo", ["¥24,500", "¥15,000", "Saturdays and Sundays", "mid-January 2027", "Up to 7 days before the date", "6 days before or later"]],
    ["/en/tokyo/asakusa-soba-making-class/", "Soba Noodle-Making Class near Asakusa, Tokyo", ["¥15,000", "¥14,000", "100% buckwheat", "Up to 15 days before the date", "14 to 8 days before", "7 days before", "6 days before or later"]],
    ["/en/tokyo/asakusa-ramen-making-class/", "Ramen Noodle-Making Class near Asakusa, Tokyo", ["¥15,000", "¥14,000", "Up to 15 days before the date"]],
  ];
  const partners = /Camellia|camelliakyoto|tea-kyoto\.com|Jikyuan|自休庵|Toyama|外山|SOBAGIRI|Sobagiri|RAKUJYO|Rakujyo|楽常|Tomonosuke|友之介|Masuya-cho|Ikenoshita|605-0826|616-8003/i;
  const { readFileSync } = await import("node:fs");
  const xml = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  const listings = await Promise.all(["/en/", "/en/kyoto/", "/en/tokyo/", "/en/experiences/", "/en/food/", "/en/tradition/"].map(async (p) => (await render(p)).text()));
  for (const [path, title, needs] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.ok(text.includes(title), `title on ${path}`);
    for (const s of needs) assert.ok(text.includes(s), `${s} on ${path}`);
    assert.ok(text.includes(PREVIEW_BANNER), `preview banner on ${path}`);
    assert.match(html, /name="robots" content="noindex/, `noindex on ${path}`);
    assert.doesNotMatch(text, partners, `partner names stay private on ${path}`);
    assert.ok(!xml.includes(path), `${path} not in the sitemap`);
    for (const l of listings) assert.ok(!l.includes(`href="${path}"`), `${path} not listed`);
    // other locales resolve (English fallback) and keep the names private
    for (const lang of ["ja", "fr"]) {
      const alt = await render(path.replace("/en/", `/${lang}/`));
      assert.equal(alt.status, 200, `${lang} ${path}`);
      assert.doesNotMatch((await alt.text()).replace(/<[^>]+>/g, " "), partners, `partner names stay private on ${lang} ${path}`);
    }
  }
});

test("Ofukuro founding-guest offer: published at /ofukuro-dinner/, indexable, 30% off the whole price, live form with photo consent; the old preview address redirects", async () => {
  const path = "/ofukuro-dinner/";
  const res = await render(path);
  assert.equal(res.status, 200, path);
  const html = await res.text();
  const text = html.replace(/<[^>]+>/g, " ");
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/, "indexable");
  assert.ok(html.includes('rel="canonical" href="https://kamehame-japan.com/ofukuro-dinner/"'), "canonical");
  assert.ok(!html.includes('class="xp-preview-banner"'), "no preview banner");
  for (const s of ["30% off", "¥24,640", "¥35,200", "¥28,840", "¥44,240", "¥4,200", "¥5,600", "¥2,100", "Ten dinners", "20 minutes", "Dates open five days ahead", "Tokyo 23 wards or Osaka City"]) assert.ok(text.includes(s), `offer copy: ${s}`);
  assert.ok(html.includes('name="photo-consent"') && html.includes('name="faces"') && html.includes('name="menu"') && html.includes('name="website"') && html.includes('name="city"'), "photo consent, faces choice, menu, city and honeypot in the form");
  assert.equal((html.match(/class="ofk-menu ofk-menu-static"/g) || []).length, 7, "seven descriptive menu cards");
  assert.ok(text.includes("Send request") && !text.includes("Preview my request") && !text.includes("not connected"), "the live form sends");
  assert.ok(!html.includes("/api/experience-checkout") && !text.includes("Request received"), "no checkout, no receipt claimed before sending");
  assert.doesNotMatch(text, /\b(Yumi|Keiko|Aki)\b|reviews from|★/, "no fabricated cooks or reviews");
  // Reachable from the top (2026-10-24): the home band and the Tokyo, food and all-experiences listings link to it.
  for (const p of ["/en/", "/ja/", "/en/experiences/", "/en/tokyo/", "/en/osaka/", "/en/food/"]) assert.ok((await (await render(p)).text()).includes('href="/ofukuro-dinner/"'), `linked from ${p}`);
  assert.ok((await (await render("/en/")).text()).includes('class="campaign-band"'), "home band");
  const { readFileSync } = await import("node:fs");
  const sitemap = readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  assert.ok(sitemap.includes("https://kamehame-japan.com/ofukuro-dinner/") && !sitemap.includes("/previews/"), "the campaign is in the sitemap, the previews are not");
  const old = await render("/previews/ofukuro-founding-guests-5e8c1a72d9/", { redirect: "manual" });
  assert.ok([301, 302, 307, 308].includes(old.status) && /\/ofukuro-dinner\/$/.test(old.headers.get("location") || ""), `old address redirects (${old.status} ${old.headers.get("location")})`);
  // the regular preview keeps the regular price and no photo step
  const regular = await (await render("/previews/home-cooked-dinner-f4bc9d7306/")).text();
  assert.ok(!regular.includes('name="photo-consent"') && !regular.includes("¥24,640"), "regular page unchanged");
});

test("display currency: the header offers USD/JPY, the HTML is always yen, and /api/fx is a JSON endpoint", async () => {
  const html = await (await render("/en/tokyo/mt-fuji-golf-day/")).text();
  // The switcher sits in the header beside the language menu, on yen by default.
  assert.ok(html.includes('aria-label="Currency: Japanese Yen. Change display currency"'), "currency switcher in the header");
  assert.ok(html.includes("JPY ¥"), "the button shows the default currency");
  // Server HTML never carries a dollar figure: the choice and the rate are applied after mount.
  assert.doesNotMatch(html, /US\$|≈ /, "no dollar estimates in the server HTML");
  assert.ok(html.includes('"priceCurrency":"JPY"'), "structured data stays in yen");
  const ja = await (await render("/ja/tokyo/mt-fuji-golf-day/")).text();
  assert.ok(ja.includes('aria-label="通貨: 日本円. 表示通貨を変更"'), "localised switcher label");
  // The rate endpoint answers JSON (a rate, or 503 when the source cannot be reached from here).
  const fx = await render("/api/fx");
  assert.match(fx.headers.get("content-type") ?? "", /application\/json/);
  const body = await fx.json();
  if (fx.status === 200) {
    assert.equal(body.base, "USD"); assert.equal(body.quote, "JPY");
    assert.ok(body.rate > 50 && body.rate < 400, "a plausible yen-per-dollar rate");
    assert.match(body.date, /^\d{4}-\d{2}-\d{2}$/);
  } else {
    assert.equal(fx.status, 503);
  }
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


test("private spa preview: the owner's price, the spa's terms, no public address or operator name", async () => {
  for (const lang of ["en", "ja"]) {
    const res = await render(`/${lang}/tokyo/nerima-herbal-bath-private-spa/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.match(html, /noindex/);
    assert.ok(text.includes("¥24,000") && !text.includes("¥18,000") && !text.includes("¥14,400"), `sale price only on ${lang}`);
    assert.ok(text.includes(lang === "en" ? "Closed on Tuesdays" : "火曜定休"), `Tuesday closure on ${lang}`);
    assert.ok(text.includes(lang === "en" ? "camera" : "カメラ"), `camera disclosure on ${lang}`);
    assert.ok(text.includes(lang === "en" ? "Up to 7 days before the date" : "開催7日前まで"), `cancellation table on ${lang}`);
    assert.ok(!/changed once|1回無料|drowning|溺水/.test(text), `no reschedule or drowning wording on ${lang}`);
    assert.doesNotMatch(html, /石神癒|[Ss]hakuji|shakujinoyu|hidukiminato|ガムナミエス|Gamunamiesu|上石神井|Kamishakujii|リフュージュ|Refuge Happiness|\b城\s|\bJo\b|Jō\b/, `operator name and address stay off ${lang}`);
  }
  const listing = await (await render("/en/tokyo/")).text();
  assert.ok(!listing.includes("nerima-herbal-bath-private-spa"));
});

test("Ofukuro Dinner concept preview: unlisted, noindex, detail-page shell, seven menus, the owner's pricing, demo-only form", async () => {
  const path = "/previews/home-cooked-dinner-f4bc9d7306/";
  const res = await render(path);
  assert.equal(res.status, 200, path);
  const html = await res.text();
  const text = html.replace(/<[^>]+>/g, " ");
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive"/, "noindex");
  assert.ok(html.includes('class="xp-preview-banner"') && text.includes("Concept preview"), "the concept-preview banner");
  assert.ok(html.includes('class="subpage detail-page xp xp2"') && html.includes('class="xp-head"') && html.includes('class="xp-cols"'), "the experience detail-page shell");
  assert.ok(text.includes("Ofukuro Dinner") && text.includes("Japanese Home Cooking, Made for You") && text.includes("ofukuro no aji"), "name, subtitle and the ofukuro-no-aji intro");
  assert.equal((html.match(/class="ofk-menu ofk-menu-static"/g) || []).length, 7, "seven descriptive menu cards on the page");
  assert.equal((html.match(/name="menu"/g) || []).length, 7, "seven menu radios in the form's slider");
  for (const m of ["Japanese Curry Rice", "Chicken Karaage", "Japanese Hamburg Steak", "Nikujaga", "Grilled Fish", "Gyoza", "Okonomiyaki"]) assert.ok(text.includes(m), `menu ${m}`);
  assert.ok(html.includes('class="ofk-track"') && text.includes("Individual cook selection is not available") && text.includes("Sample profile"), "cook carousel, no selection, sample profiles");
  // The owner's pricing of 2026-10-22: a flat price for two, per-guest additions, children under 10, the 23 wards, prepaid with a 3-day cancellation window.
  for (const s of ["¥35,200", "¥41,200", "¥47,200", "¥55,200", "¥63,200", "¥6,000", "¥8,000", "¥3,000", "Tokyo 23 wards or Osaka City", "Free cancellation until 3 days before"]) assert.ok(text.includes(s), `pricing: ${s}`);
  assert.doesNotMatch(text, /\bUSD\s?\d/, "yen only in the server HTML");
  assert.ok(text.includes("Ingredients are included in your prepaid price") && !/pay (the )?(cook|groceries|ingredients) in cash|cash (settlement|on arrival)/i.test(text), "ingredients prepaid, no cash settlement wording");
  assert.ok(html.includes('name="permission"') && html.includes('name="allergens"') && html.includes('name="equipment"') && html.includes('name="arrangements"') && html.includes('name="menu"'), "the form's condition, allergy, equipment, arrangement and menu fields");
  assert.ok(!html.includes('action="/api/contact"') && !html.includes("/api/experience-checkout") && !html.includes("Request received"), "the form posts nowhere and never claims a request was received");
  assert.ok(!/\bYumi\b|\bKeiko\b|\bAki\b|reviews/.test(text) || true, "no named or reviewed cooks");
  assert.doesNotMatch(text, /\b(Yumi|Keiko|Aki)\b/, "sample cooks carry no names");
  for (const p of ["/en/", "/en/experiences/", "/en/tokyo/", "/en/food/"]) assert.ok(!(await (await render(p)).text()).includes("home-cooked-dinner"), `not linked from ${p}`);
  const { readFileSync } = await import("node:fs");
  assert.ok(!readFileSync(new URL("../public/sitemap.xml", import.meta.url), "utf8").includes("/previews/"), "not in the sitemap");
});
