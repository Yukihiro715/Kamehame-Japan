import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(() => vite.close());
const { composePhone, normalizePhone, stripPhone, isE164, formatPhone, DIAL_COUNTRIES, PREFERRED_BY_LANG, DEFAULT_BY_LANG } = await vite.ssrLoadModule("/lib/phone.ts");

test("composePhone: country code plus national number, trunk zero dropped", () => {
  assert.equal(composePhone("81", "090-1234-5678"), "+819012345678");
  assert.equal(composePhone("44", "07700 900123"), "+447700900123");
  assert.equal(composePhone("1", "(212) 555-0199"), "+12125550199");
  assert.equal(composePhone("39", "06 1234 5678"), "+390612345678", "Italy keeps its leading zero");
  assert.equal(composePhone("886", "０９１２３４５６７８"), "+886912345678", "full-width digits");
});

test("composePhone: a number typed with + wins over the select; empty stays empty", () => {
  assert.equal(composePhone("81", "+44 7700 900123"), "+447700900123");
  assert.equal(composePhone("81", "0044 7700 900123"), "+447700900123");
  assert.equal(composePhone("81", ""), "");
  assert.equal(composePhone("81", "   "), "");
  assert.equal(composePhone("", "90 1234 5678"), "9012345678", "no country: the digits as typed, flagged invalid by the form");
});

test("normalizePhone: E.164 when plausible, the stripped text otherwise", () => {
  assert.deepEqual(normalizePhone(" +81 90-1234-5678 "), { value: "+819012345678", valid: true });
  assert.deepEqual(normalizePhone("0081 90 1234 5678"), { value: "+819012345678", valid: true });
  assert.deepEqual(normalizePhone("090 1234 5678"), { value: "09012345678", valid: false });
  assert.deepEqual(normalizePhone("call me"), { value: "callme", valid: false });
  assert.deepEqual(normalizePhone(""), { value: "", valid: false });
  assert.equal(isE164("+1234567"), true);
  assert.equal(isE164("+0123456789"), false, "no leading zero after +");
  assert.equal(isE164("+1234567890123456"), false, "16 digits is too long");
  assert.equal(stripPhone("＋８１ ９０ １２３４ ５６７８"), "+819012345678");
});

test("formatPhone groups for reading", () => {
  assert.equal(formatPhone("+819012345678"), "+81 9012345678");
  assert.equal(formatPhone("+447700900123"), "+44 7700900123");
  assert.equal(formatPhone("+886912345678"), "+886 912345678");
  assert.equal(formatPhone("not-a-number"), "not-a-number");
});

test("country table: unique ISO codes, numeric dial codes, preferred and default lists resolve", () => {
  const isos = DIAL_COUNTRIES.map((c) => c.iso);
  assert.equal(new Set(isos).size, isos.length);
  for (const c of DIAL_COUNTRIES) assert.match(c.dial, /^[1-9]\d{0,3}$/, c.iso);
  for (const [lang, list] of Object.entries(PREFERRED_BY_LANG)) for (const iso of list) assert.ok(isos.includes(iso), `${lang}: ${iso}`);
  for (const [lang, iso] of Object.entries(DEFAULT_BY_LANG)) if (iso) assert.ok(isos.includes(iso), `${lang}: ${iso}`);
  assert.equal(DEFAULT_BY_LANG.ja, "JP");
  assert.equal(DEFAULT_BY_LANG.en, "", "English pages let the guest (or the browser locale) choose");
});
