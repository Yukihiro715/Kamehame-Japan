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

test("sends baseline security headers", async () => {
  const response = await render();

  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=\d+/);
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'self'/);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
});
