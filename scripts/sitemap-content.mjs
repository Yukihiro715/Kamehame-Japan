// The site's indexable pages, each with the source text it is rendered from
// (its "content key"). scripts/generate-sitemap.mjs hashes the key to tell
// whether a page's copy or conditions changed since the date it stored, so
// <lastmod> is the day the content actually changed, not the day of the
// build. Everything is read as plain text (no TS toolchain), through the
// `read(file)` function the caller supplies — the backfill reads from git.

import { createHash } from "node:crypto";

export const LANGS = ["en", "es", "ja", "fr", "zh-tw"];
export const CITY_SLUGS = "tokyo|kyoto|osaka";
const CATALOG = { en: "lib/catalog.ts", es: "lib/catalog.es.ts", ja: "lib/catalog.ja.ts", fr: "lib/catalog.fr.ts", "zh-tw": "lib/catalog.zh-tw.ts" };
const STATIC_PAGES = ["about", "faq", "journal", "contact", "trade", "privacy", "legal", "terms"];

export const hashOf = (key) => createHash("sha1").update(key).digest("hex").slice(0, 12);

/** `  { … },` block of the entry whose `slug: "x"` line sits at 4-space indent. */
function entryBlock(src, slug) {
  const i = src.indexOf(`\n    slug: "${slug}"`);
  if (i < 0) return null;
  const start = src.lastIndexOf("\n  {\n", i);
  const end = src.indexOf("\n  },\n", i);
  return start < 0 || end < 0 ? null : src.slice(start, end + 5);
}

/** Category entry `{ slug: "x", title: …, lead: "…" },` wherever it starts on the line. */
function categoryBlock(src, slug) {
  const m = src.match(new RegExp(`\\{\\s*slug:\\s*"${slug}",\\s*title:[\\s\\S]*?\\},`));
  return m ? m[0] : null;
}

/** The `${indent}lang: {` … `${indent}},` block of a per-language object. */
function langBlock(src, lang, indent = "  ") {
  const key = lang.includes("-") ? `"${lang}"` : lang;
  const open = `\n${indent}${key}: {`;
  const i = src.indexOf(open);
  if (i < 0) return null;
  const end = src.indexOf(`\n${indent}},`, i);
  return end < 0 ? null : src.slice(i, end + indent.length + 3);
}

/** The values of the given keys inside one language block of lib/i18n.ts. */
function i18nKeys(block, keys) {
  if (!block) return null;
  const parts = [];
  for (const k of keys) {
    const i = block.indexOf(`\n    ${k}:`);
    if (i < 0) continue;
    const next = block.slice(i + 1).search(/\n    [A-Za-z_"][\w"-]*:/);
    parts.push(next < 0 ? block.slice(i) : block.slice(i, i + 1 + next));
  }
  return parts.join("\n");
}

const keysUsed = (pageSrc) => [...new Set([...(pageSrc ?? "").matchAll(/\bT\.([A-Za-z]\w*)/g)].map((m) => m[1]))].sort();
const join = (...parts) => (parts.some((p) => p == null) ? null : parts.join("\n"));

/**
 * Every indexable path with its sitemap attributes and either a content
 * `key` (hashed to detect change), a fixed `date` (pages that declare their
 * own "last updated"), or neither. `deps` are the paths whose dates a listing
 * page inherits when they are newer: a city page is as new as its newest
 * experience.
 */
export function buildEntries(read) {
  const src = (f) => read(f) ?? "";
  const catalog = src("lib/catalog.ts");
  const cat = Object.fromEntries(LANGS.map((l) => [l, src(CATALOG[l])]));
  const slugs = (re) => [...catalog.matchAll(re)].map((m) => m[1]);

  const allCities = slugs(new RegExp(`slug:\\s*"(${CITY_SLUGS})",\\s*title:`, "g"));
  const allCategories = slugs(/\{\s*slug:\s*"([a-z-]+)",\s*title:[^}]*?tag:/g);
  const allExperiences = [...catalog.matchAll(new RegExp(`slug:\\s*"([a-z-]+)",\\s*city:\\s*"(${CITY_SLUGS})",\\s*category:\\s*"([a-z-]+)"([^\\n]*)`, "g"))]
    .map((m) => ({ slug: m[1], city: m[2], category: m[3], live: /status:\s*"live"/.test(m[4]) }));
  const tours = slugs(/slug:\s*"([a-z-]+-private-day-tour)",\s*city:/g);

  // Tours are withheld until the operating partner holds a 旅行業 registration
  // (lib/catalog.ts TOURS_PUBLISHED); placeholder experiences (no signed
  // partner) are withheld with the cities and categories only they populate
  // (PLACEHOLDERS_PUBLISHED) — the same filters catalogFor() applies.
  const toursPublished = /export const TOURS_PUBLISHED = true/.test(catalog);
  const placeholdersPublished = /export const PLACEHOLDERS_PUBLISHED = true/.test(catalog);
  const experiences = placeholdersPublished ? allExperiences : allExperiences.filter((e) => e.live);
  const cities = allCities.filter((c) => placeholdersPublished || experiences.some((e) => e.city === c));
  const categories = allCategories.filter((c) => placeholdersPublished || experiences.some((e) => e.category === c));
  const collections = [...new Set([...cities, ...categories, ...(toursPublished ? ["tours"] : []), "experiences"])];

  const entries = [];
  const add = (path, { priority = "0.7", changefreq = "weekly", alternates = null, key = null, date = null, deps = [] } = {}) =>
    entries.push({ path, priority, changefreq, alternates, key, date, deps });
  const siblings = (fn, langs = LANGS) => Object.fromEntries(langs.map((l) => [l, fn(l)]));

  // English lives at the root; every other locale sits under its prefix.
  const homePath = (lang) => (lang === "en" ? "/" : `/${lang}/`);
  const expPath = (lang, e) => `/${lang}/${e.city}/${e.slug}/`;
  const expKey = (lang, slug) => join(entryBlock(cat.en, slug), lang === "en" ? "" : entryBlock(cat[lang], slug));
  const inCity = (c) => experiences.filter((e) => e.city === c);
  const inCategory = (c) => experiences.filter((e) => e.category === c);
  const collectionsCopy = src("lib/collections.ts");

  for (const lang of LANGS) {
    add(homePath(lang), {
      priority: "1.0", changefreq: "daily", alternates: siblings(homePath), key: "home",
      deps: [...collections.map((c) => `/${lang}/${c}/`), ...experiences.map((e) => expPath(lang, e))],
    });
  }

  for (const c of collections) {
    for (const lang of LANGS) {
      let key, members;
      if (cities.includes(c)) { members = inCity(c); key = join(entryBlock(cat.en, c), lang === "en" ? "" : entryBlock(cat[lang], c), members.map((e) => e.slug).join(",")); }
      else if (categories.includes(c)) { members = inCategory(c); key = join(categoryBlock(cat.en, c), lang === "en" ? "" : categoryBlock(cat[lang], c), members.map((e) => e.slug).join(",")); }
      else if (c === "tours") { members = []; key = join(langBlock(collectionsCopy, lang), tours.join(",")); }
      else { members = experiences; key = join(langBlock(collectionsCopy, lang), experiences.map((e) => e.slug).join(",")); }
      add(`/${lang}/${c}/`, { priority: "0.8", alternates: siblings((l) => `/${l}/${c}/`), key, deps: members.map((e) => expPath(lang, e)) });
    }
  }

  for (const e of experiences) {
    for (const lang of LANGS) {
      add(expPath(lang, e), { priority: "0.9", alternates: siblings((l) => expPath(l, e)), key: expKey(lang, e.slug) });
    }
  }

  for (const slug of toursPublished ? tours : []) {
    for (const lang of LANGS) {
      add(`/${lang}/tours/${slug}/`, { priority: "0.9", alternates: siblings((l) => `/${l}/tours/${slug}/`), key: expKey(lang, slug) });
    }
  }

  // Articles render only in the locales they have been written for, and only
  // while one of the experiences they are tagged with is on the site
  // (lib/articles.ts articlesFor).
  const articles = src("lib/articles.ts");
  const listed = new Set(experiences.map((e) => e.slug));
  const articlePaths = Object.fromEntries(LANGS.map((l) => [l, []]));
  for (const m of articles.matchAll(/slug:\s*"([a-z0-9-]+)",\s*\n\s*date:/g)) {
    const slug = m[1];
    const block = entryBlock(articles, slug) ?? "";
    const tags = [...(block.match(/experiences:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((t) => t[1]);
    if (!tags.some((t) => listed.has(t))) continue;
    const head = block.slice(0, block.indexOf("copy:"));
    const langs = LANGS.filter((l) => langBlock(block, l, "      "));
    for (const lang of langs) {
      articlePaths[lang].push(`/${lang}/journal/${slug}/`);
      add(`/${lang}/journal/${slug}/`, { priority: "0.6", changefreq: "monthly", alternates: siblings((l) => `/${l}/journal/${slug}/`, langs), key: join(head, langBlock(block, lang, "      ")) });
    }
  }

  // Only approved articles enter this manifest (rebuilt before the sitemap).
  // Explicit editorial dates remain stable across unrelated deployments.
  for (const article of JSON.parse(src("lib/journal.generated.json") || "[]")) {
    if (!article.experiences.some((slug) => listed.has(slug))) continue;
    const path = `/en/journal/${article.slug}/`;
    articlePaths.en.push(path);
    add(path, { priority: "0.6", changefreq: "monthly", alternates: { en: path }, date: article.editorial.updatedAt });
    const related = experiences.filter((e) => article.experiences.includes(e.slug));
    const parents = new Set(["/", "/en/experiences/", ...related.flatMap((e) => [expPath("en", e), `/en/${e.city}/`, `/en/${e.category}/`])]);
    for (const entry of entries) if (parents.has(entry.path)) entry.deps.push(path);
  }

  const staticCopy = src("lib/static-pages.ts");
  const aboutSrc = staticCopy.slice(staticCopy.indexOf("const ABOUT"), staticCopy.indexOf("const FAQ"));
  const faqSrc = staticCopy.slice(staticCopy.indexOf("const FAQ"));
  const i18n = src("lib/i18n.ts");
  const privacyDate = src("lib/privacy.ts").match(/const UPDATED = "(\d{4}-\d{2}-\d{2})"/)?.[1] ?? null;
  const legalDate = src("lib/legal.ts").match(/LEGAL_UPDATED = "(\d{4}-\d{2}-\d{2})"/)?.[1] ?? null;
  const pageKeys = { contact: keysUsed(src("app/[lang]/contact/page.tsx")), trade: keysUsed(src("app/[lang]/trade/page.tsx")) };
  for (const page of STATIC_PAGES) {
    for (const lang of LANGS) {
      const opts = { priority: "0.5", changefreq: "monthly", alternates: siblings((l) => `/${l}/${page}/`) };
      if (page === "about") opts.key = langBlock(aboutSrc, lang);
      else if (page === "faq") opts.key = langBlock(faqSrc, lang);
      else if (page === "journal") { opts.key = "journal"; opts.deps = articlePaths[lang]; }
      else if (page === "contact" || page === "trade") opts.key = i18nKeys(langBlock(i18n, lang), pageKeys[page]);
      else if (page === "privacy") opts.date = privacyDate;
      else opts.date = legalDate; // legal, terms
      add(`/${lang}/${page}/`, opts);
    }
  }

  add("/partners/", { priority: "0.4", changefreq: "monthly", key: src("app/partners/page.tsx") || null });

  return { entries, stats: { experiences: experiences.length, tours: toursPublished ? tours.length : 0, collections: collections.length } };
}
