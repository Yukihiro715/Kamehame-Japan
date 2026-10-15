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
  // the default selection: Mt. Fuji, four golfers, the group total first, the per-person figure small under it
  const text = html.replace(/<[^>]+>/g, "");
  assert.match(text, /¥350,000\s*total · 4 golfers\s*¥87,500 \/ person/, "Mt. Fuji total for four, then per person");
  assert.match(text, /¥330,000\s*total · 4 golfers\s*¥82,500 \/ person/, "Tokyo total for four, then per person");
  assert.doesNotMatch(html, /From ¥8[27],500|From approx\./, "the package price is fixed: no 'From' on the area cards");
  assert.match(html, /<span class="go-price">(?:(?!<\/span>).)*<b>¥350,000<\/b>/, "the group total is the card's headline figure");
  assert.doesNotMatch(html, /<b>¥87,500<\/b>|<b>¥82,500<\/b>/, "the per-person figure is no longer a headline");
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
  for (const bad of [{ area_id: "osaka", party: "2" }, { area_id: "fuji", party: "5" }, { area_id: "fuji", party: "1" }]) {
    const r = await post({ ...base, ...bad });
    assert.equal(r.status, 400, `rejects ${JSON.stringify(bad)}`);
  }
});

const PREVIEW_BANNER = "Preview — this page is not published yet";

test("ramen classes: Tokyo and Osaka in preview, priced per person, unlisted, never naming the venue", async () => {
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
    assert.ok(text.includes("¥25,000"), "sale price");
    assert.ok(text.includes(PREVIEW_BANNER), `preview banner on ${path}`);
    assert.doesNotMatch(html, /Ramen Dojo|Ohashi|Meguro|Soemoncho|宗右衛門/i, "the venue's name and address stay private");
    assert.ok(text.includes("11:00") && text.includes("18:30"), "session times from the partner sheet");
    assert.ok(text.includes("Up to 30 days before the date"), "30-day free cancellation from the partner sheet");
    assert.ok(text.includes("45 days before") && text.includes("44 to 29 days"), "group and private cancellation from the partner sheet");
    assert.ok(text.includes("5 to 10 minutes"), "late tolerance from the partner sheet");
    assert.ok(!html.includes("ramen-three-bowls"), "no branded bowls");
    const listing = await render(city);
    if (listing.status === 200) assert.ok(!(await listing.text()).includes(path), `not listed on ${city}`);
  }
  // Osaka has no live experience while the class is in preview, so the city and theme pages are gone
  assert.equal((await render("/en/osaka/")).status, 404, "no Osaka city page without a live experience");
  assert.equal((await render("/en/ramen/")).status, 404, "no ramen theme page without a live experience");
  const home = await (await render("/en/")).text();
  assert.ok(!home.includes('href="/en/osaka/"') && !home.includes('href="/en/ramen/"'), "home does not link the city or the ramen theme");
});

test("kendo, bushido, tea ceremony and the kendo tours: preview pages that never name the partners", async () => {
  const pages = [
    ["/en/tokyo/nihonbashi-kendo-experience/", "Kendo Experience in a Nihonbashi Dojo, Tokyo", "¥20,000", "/en/tokyo/"],
    ["/en/tokyo/nihonbashi-bushido-experience/", "Bushido Experience in a Tokyo Dojo: the Nihon Kendo Kata", "¥10,000", "/en/tokyo/"],
    ["/en/tokyo/yotsuya-tea-ceremony/", "Tea Ceremony in a Yotsuya Tearoom, Tokyo", "¥8,800", "/en/tokyo/"],
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
    assert.ok(text.includes(PREVIEW_BANNER), `preview banner on ${path}`);
    assert.doesNotMatch(html, /Kendo Spirit|Umino|海野|Kobunach|浜町|SEC Nihonbashi|Watanabe|有庵|r_cafe|Airbnb|SAMURAI TRIP|Nagamatsu|永松|パークフォーアス|Park For Us|samuraitrip|誠道館|Seidokan|4-7-2/i, `partner names stay private on ${path}`);
    const listing = await render(city);
    if (listing.status === 200) assert.ok(!(await listing.text()).includes(path), `not listed on ${city}`);
  }
  // the Japanese pages carry the same banner in Japanese
  const ja = (await (await render("/ja/tokyo/tokyo-kendo-experience-tour/")).text()).replace(/<[^>]+>/g, " ");
  assert.ok(ja.includes("プレビュー — このページはまだ公開していません"), "Japanese preview banner");
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
  // with only calligraphy, golf and the geiko evening live, the site shows two cities and no kendo theme
  const home = await (await render("/en/")).text();
  assert.ok(home.includes("Two cities.") && !home.includes('href="/en/himeji/"') && !home.includes('href="/en/kendo/"'), "home shows two cities and no kendo theme");
  assert.equal((await render("/en/kendo/")).status, 404, "no kendo theme page without a live experience");
  assert.equal((await render("/en/himeji/")).status, 404, "no Himeji city page without a live experience");
});

test("samurai, rakugo, cooking, ninja and Arashiyama workshops: preview pages that never name the partners", async () => {
  const pages = [
    ["/en/tokyo/samurai-street-walk-kitasenju/", "Samurai Street Walk & Bushido Experience in Kitasenju, Tokyo", "¥40,000"],
    ["/en/tokyo/tokyo-tate-samurai-sword-experience/", "Private Samurai Experience in Tokyo: Authentic Tate Sword Choreography", "¥33,000"],
    ["/en/tokyo/kichijoji-japanese-cuisine-class/", "Learn Japanese Cuisine from a Professional Chef in Kichijoji, Tokyo", "¥18,500"],
    ["/en/tokyo/asakusa-english-rakugo-walk/", "English Rakugo & Asakusa Cultural Walk, Tokyo", "¥12,000"],
    ["/en/tokyo/tokyo-ninja-zen-meditation/", "Ninja Zen Meditation in Tokyo: Breathing, Hand Seals and Stillness", "¥30,000"],
    ["/en/kyoto/arashiyama-ninja-experience/", "Ninja Experience in Arashiyama, Kyoto: Blowpipe, Shuriken and Hand Seals", "¥7,000"],
    ["/en/kyoto/arashiyama-stone-mill-matcha/", "Stone-Mill Matcha Grinding in Arashiyama, Kyoto", "¥5,000"],
    ["/en/kyoto/arashiyama-japanese-knife-workshop/", "Japanese Knife Making & Sharpening Workshop in Arashiyama, Kyoto", "¥15,000"],
    ["/en/kyoto/arashiyama-shuriken-casting/", "Cast Your Own Metal Shuriken in Arashiyama, Kyoto", "¥8,000"],
  ];
  const partners = /Trip in real Japan|TRJK|trjk|Rojicoya|Hiryu|Musashi|Jimbo|Kikkoman|Cocoro|Kokoro Dining|Kanariya|Eiraku|Koraku|Ichirin|Shiden|Kenbukai|El Sophia|Okimoto|シーズ|ninja-idea|Tamura|田村|Ninja Sanctuary|Bamboo Sky|Arashiyama Square|Sagatenryuji|Susukinobaba|Viyago|Ramen Dojo/i;
  for (const [path, title, price] of pages) {
    const res = await render(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ");
    assert.ok(text.includes(title), `title on ${path}`);
    assert.ok(text.includes(price), `price on ${path}`);
    assert.ok(text.includes(PREVIEW_BANNER), `preview banner on ${path}`);
    assert.doesNotMatch(html, partners, `partner names stay private on ${path}`);
    // the Japanese page is written; the other locales fall back to the English text so the URL resolves
    for (const lang of ["ja", "es", "fr", "zh-tw"]) {
      const alt = await render(path.replace("/en/", `/${lang}/`));
      assert.equal(alt.status, 200, `${lang} ${path}`);
      const altHtml = await alt.text();
      assert.doesNotMatch(altHtml, partners, `partner names stay private on ${lang} ${path}`);
      if (lang === "ja") assert.ok(altHtml.includes("プレビュー — このページはまだ公開していません") && !altHtml.includes(title), `Japanese text on ${path}`);
    }
  }
  const home = await (await render("/en/")).text();
  assert.ok(!home.includes('href="/en/samurai/"') && !home.includes('href="/en/ninja/"'), "the new themes are not listed while in preview");
  assert.equal((await render("/en/samurai/")).status, 404, "no samurai theme page without a live experience");
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
