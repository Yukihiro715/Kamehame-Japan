import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false }, logLevel: "silent" });
after(() => vite.close());

test("date picker prop synchronization converges without browser APIs during SSR", async () => {
  const { DatePicker } = await vite.ssrLoadModule("/components/site/date-picker.tsx");
  for (const props of [{ min: "2026-11-20" }, { min: "2026-11-20", value: "2026-12-01" }, { defaultOpenMonth: "2027-01" }]) {
    const html = renderToStaticMarkup(React.createElement(DatePicker, { name: "date", lang: "en", ...props }));
    assert.match(html, /name="date"/);
    assert.match(html, /aria-expanded="false"/);
    if (props.value) assert.match(html, /value="2026-12-01"/);
  }
});

test("listing and consent server output does not access browser state", async () => {
  const { ListingGrid } = await vite.ssrLoadModule("/components/site/listing-grid.tsx");
  const { ConsentBanner } = await vite.ssrLoadModule("/components/site/consent-banner.tsx");
  const html = renderToStaticMarkup(React.createElement(ListingGrid, { items: [], lang: "en" }));
  assert.match(html, /class="lg"/);
  assert.match(html, /aria-expanded="false"/);
  assert.equal(renderToStaticMarkup(React.createElement(ConsentBanner, { lang: "en" })), "");
});
