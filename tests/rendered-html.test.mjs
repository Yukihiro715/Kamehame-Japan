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
  // the default selection: Mt. Fuji, two golfers, per person first, group total beside it
  const text = html.replace(/<[^>]+>/g, "");
  assert.ok(text.includes("¥135,000") && text.includes("¥270,000 total · 2 golfers"), "Mt. Fuji per-person and total for two");
  assert.ok(text.includes("¥125,000") && text.includes("¥250,000 total · 2 golfers"), "Tokyo per-person and total for two");
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

test("sends baseline security headers", async () => {
  const response = await render();

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=\d+/);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'self'/);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});
