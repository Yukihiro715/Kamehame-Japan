// Generates public/sitemap.xml and public/robots.txt from the catalog.
// Runs from `prebuild`, so a catalog change is always reflected in the
// sitemap that ships — including in CI, where the files are regenerated
// before the build rather than trusted from git.
//
// <lastmod> is the day a page's copy or conditions last changed, not the
// build date: scripts/sitemap-content.mjs derives a content key for each
// page, and scripts/sitemap-dates.json remembers the key's hash with the date
// it was first seen. A page whose hash is unchanged keeps its date; a changed
// one is dated today (Japan time) and the JSON is updated — commit it with the
// content change, so every later build reproduces the same date. A listing
// page (home, city, category, journal) is also at least as new as the newest
// page it lists.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildEntries, hashOf } from "./sitemap-content.mjs";

const ORIGIN = "https://kamehame-japan.com";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), "utf8") : null);

const { entries, stats } = buildEntries(read);

const datesFile = join(root, "scripts/sitemap-dates.json");
const stored = existsSync(datesFile) ? JSON.parse(readFileSync(datesFile, "utf8")) : {};
// Today in Japan: the business day the change was published.
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

const own = new Map();
const next = {};
let bumped = 0;
for (const e of entries) {
  if (e.date) { own.set(e.path, e.date); continue; }
  if (e.key == null) continue;
  const hash = hashOf(e.key);
  const prev = stored[e.path];
  const lastmod = prev && prev.hash === hash ? prev.lastmod : today;
  if (lastmod === today && prev?.lastmod !== today) bumped++;
  next[e.path] = { hash, lastmod };
  own.set(e.path, lastmod);
}
const lastmodOf = (e) => {
  const dates = [own.get(e.path), ...e.deps.map((p) => own.get(p))].filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : today;
};

const json = JSON.stringify(Object.fromEntries(Object.keys(next).sort().map((k) => [k, next[k]])), null, 2) + "\n";
if (!existsSync(datesFile) || readFileSync(datesFile, "utf8") !== json) writeFileSync(datesFile, json);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((e) => {
    const links = e.alternates
      ? Object.entries(e.alternates)
          .map(([l, p]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${p}"/>`)
          .join("")
      : "";
    return `  <url>
    <loc>${ORIGIN}${e.path}</loc>
    <lastmod>${lastmodOf(e)}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${links}
  </url>`;
  })
  .join("\n")}
</urlset>
`;

writeFileSync(join(root, "public/sitemap.xml"), xml);

writeFileSync(
  join(root, "public/robots.txt"),
  `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
);

console.log(
  `sitemap.xml: ${entries.length} URLs (${stats.experiences} experiences, ` +
  `${stats.tours} tours, ${stats.collections} collections); ${bumped} dated today`,
);
