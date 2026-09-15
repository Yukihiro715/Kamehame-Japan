// Generates public/sitemap.xml and public/robots.txt from the catalog.
// Runs from `prebuild`, so a catalog change is always reflected in the
// sitemap that ships — including in CI, where the files are regenerated
// before the build rather than trusted from git.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ORIGIN = "https://kamehame-japan.com";
const LANGS = ["en", "es", "ja"];
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

// Tours are withheld until the operating partner holds a 旅行業 registration
// (lib/catalog.ts TOURS_PUBLISHED). Keep the sitemap in step with the site.
const toursPublished = /export const TOURS_PUBLISHED = true/.test(catalog);

const collections = [...new Set([
  ...cities, ...categories,
  ...(toursPublished ? ["tours"] : []),
  "experiences",
])];

/** Every indexable path, with the hreflang siblings search engines expect. */
const entries = [];
const add = (path, { priority = "0.7", changefreq = "weekly", alternates = null } = {}) =>
  entries.push({ path, priority, changefreq, alternates });

// English lives at the root; every other locale sits under its prefix.
const homePath = (lang) => (lang === "en" ? "/" : `/${lang}/`);
const homeAlternates = Object.fromEntries(LANGS.map((l) => [l, homePath(l)]));

for (const lang of LANGS) {
  add(homePath(lang), { priority: "1.0", changefreq: "daily", alternates: homeAlternates });
}

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

for (const slug of toursPublished ? tours : []) {
  for (const lang of LANGS) {
    add(`/${lang}/tours/${slug}/`, {
      priority: "0.9",
      alternates: Object.fromEntries(LANGS.map((l) => [l, `/${l}/tours/${slug}/`])),
    });
  }
}

for (const page of ["about", "faq", "journal", "contact", "trade"]) {
  for (const lang of LANGS) {
    add(`/${lang}/${page}/`, {
      priority: "0.5",
      changefreq: "monthly",
      alternates: Object.fromEntries(LANGS.map((l) => [l, `/${l}/${page}/`])),
    });
  }
}

// Articles render only in the locales they have been written for.
const articles = read("lib/articles.ts");
for (const m of articles.matchAll(/slug:\s*"([a-z0-9-]+)",\s*\n\s*date:/g)) {
  const slug = m[1];
  // Which locales carry copy for this article
  const block = articles.slice(articles.indexOf(`slug: "${slug}"`));
  const end = block.indexOf("\n  },\n");
  const langs = LANGS.filter((l) => new RegExp(`\\n\\s{6}${l}:\\s*\\{`).test(block.slice(0, end)));
  for (const lang of langs) {
    add(`/${lang}/journal/${slug}/`, {
      priority: "0.6",
      changefreq: "monthly",
      alternates: Object.fromEntries(langs.map((l) => [l, `/${l}/journal/${slug}/`])),
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

console.log(
  `sitemap.xml: ${entries.length} URLs (${experiences.length} experiences, ` +
  `${toursPublished ? tours.length : 0} tours, ${collections.length} collections)`,
);
