// Generates public/sitemap.xml and public/robots.txt from the catalog.
// Runs from `prebuild`, so a catalog change is always reflected in the
// sitemap that ships — including in CI, where the files are regenerated
// before the build rather than trusted from git.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ORIGIN = "https://kamehame-japan.com";
const LANGS = ["en", "es"];
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Read the catalog without a TS toolchain: the slugs are plain string literals.
const read = (f) => readFileSync(join(root, f), "utf8");

const catalog = read("lib/catalog.ts");
const slugs = (re) => [...catalog.matchAll(re)].map((m) => m[1]);

const cities = slugs(/slug:\s*"(tokyo|kyoto)",\s*title:/g);
const categories = slugs(/\{\s*slug:\s*"([a-z-]+)",\s*title:[^}]*?tag:/g);
const experiences = [...catalog.matchAll(/slug:\s*"([a-z-]+)",\s*city:\s*"(tokyo|kyoto)",\s*category:/g)]
  .map((m) => ({ slug: m[1], city: m[2] }));
const tours = slugs(/slug:\s*"([a-z-]+-private-day-tour)",\s*city:/g);

const collections = [...new Set([...cities, ...categories, "tours", "experiences"])];

/** Every indexable path, with the hreflang siblings search engines expect. */
const entries = [];
const add = (path, { priority = "0.7", changefreq = "weekly", alternates = null } = {}) =>
  entries.push({ path, priority, changefreq, alternates });

add("/", { priority: "1.0", changefreq: "daily", alternates: { en: "/", es: "/es/" } });
add("/es/", { priority: "1.0", changefreq: "daily", alternates: { en: "/", es: "/es/" } });

for (const c of collections) {
  for (const lang of LANGS) {
    add(`/${lang}/${c}/`, {
      priority: "0.8",
      alternates: Object.fromEntries(LANGS.map((l) => [l, `/${l}/${c}/`])),
    });
  }
}

for (const { slug, city } of experiences) {
  for (const lang of LANGS) {
    add(`/${lang}/${city}/${slug}/`, {
      priority: "0.9",
      alternates: Object.fromEntries(LANGS.map((l) => [l, `/${l}/${city}/${slug}/`])),
    });
  }
}

for (const slug of tours) {
  for (const lang of LANGS) {
    add(`/${lang}/tours/${slug}/`, {
      priority: "0.9",
      alternates: Object.fromEntries(LANGS.map((l) => [l, `/${l}/tours/${slug}/`])),
    });
  }
}

add("/partners/", { priority: "0.4", changefreq: "monthly" });

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map(({ path, priority, changefreq, alternates }) => {
    const links = alternates
      ? Object.entries(alternates)
          .map(([l, p]) => `\n    <xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${p}"/>`)
          .join("")
      : "";
    return `  <url>
    <loc>${ORIGIN}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${links}
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

console.log(`sitemap.xml: ${entries.length} URLs (${experiences.length} experiences, ${tours.length} tours, ${collections.length} collections)`);
