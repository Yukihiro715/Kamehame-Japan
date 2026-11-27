// The site's indexable pages, each with the source text it is rendered from
// (its "content key"). scripts/generate-sitemap.mjs hashes the key to tell
// whether a page's copy or conditions changed since the date it stored, so
// <lastmod> is the day the content actually changed, not the day of the
// build. Everything is read as plain text (no TS toolchain), through the
// `read(file)` function the caller supplies — the backfill reads from git.

import { createHash } from "node:crypto";

export const LANGS = ["en", "es", "ja", "fr", "zh-tw"];
export const CITY_SLUGS = "tokyo|kyoto|osaka|nagoya|okinawa|kanazawa|himeji|matsuyama|yakushima";
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

/** One theme's `{ slug: "x", … },` block in lib/themes.ts (copy in every language). */
function themeBlock(src, slug) {
  const i = src.indexOf(`slug: "${slug}", tags:`);
  if (i < 0) return null;
  const start = src.lastIndexOf("\n  {", i);
  const end = src.indexOf("\n  },", i);
  return start < 0 || end < 0 ? null : src.slice(start, end + 5);
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
export function buildEntries(read, { golfpaqLive = false } = {}) {
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
  // Themes (lib/themes.ts) group categories by their English tag; a theme has a page while one published category sits in it.
  const tagOf = Object.fromEntries([...catalog.matchAll(/\{\s*slug:\s*"([a-z-]+)",\s*title:[^}]*?tag:\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  const themesSrc = src("lib/themes.ts");
  const themeDefs = [...themesSrc.matchAll(/slug:\s*"([a-z-]+)",\s*tags:\s*\[([^\]]*)\]/g)].map((m) => ({ slug: m[1], tags: [...m[2].matchAll(/"([^"]+)"/g)].map((t) => t[1]) }));
  const themeCategories = (th) => categories.filter((c) => th.tags.includes(tagOf[c]));
  const themes = themeDefs.filter((th) => themeCategories(th).length > 0);
  const collections = [...new Set([...cities, ...categories, ...themes.map((th) => th.slug), ...(toursPublished ? ["tours"] : []), "experiences"])];

  const entries = [];
  const add = (path, { priority = "0.7", changefreq = "weekly", alternates = null, key = null, date = null, deps = [] } = {}) =>
    entries.push({ path, priority, changefreq, alternates, key, date, deps });
  const siblings = (fn, langs = LANGS) => Object.fromEntries(langs.map((l) => [l, fn(l)]));

  // English lives at the root; every other locale sits under its prefix.
  const homePath = (lang) => (lang === "en" ? "/" : `/${lang}/`);
  const expPath = (lang, e) => `/${lang}/${e.city}/${e.slug}/`;
  // Match catalogFor's explicit fallback allowlist, not arbitrary missing
  // translations. These pages render the English entry, so its content must
  // also control lastmod rather than falling back to the date of every build.
  const fallbackBlock = catalog.match(/const APPROVED_ENGLISH_FALLBACK = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "";
  const englishFallback = new Set([...fallbackBlock.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]));
  const expKey = (lang, slug) => join(entryBlock(cat.en, slug), lang === "en" ? "" : (entryBlock(cat[lang], slug) ?? (englishFallback.has(slug) ? "" : null)));
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
      else if (themes.some((th) => th.slug === c)) {
        const th = themes.find((x) => x.slug === c); const cats = themeCategories(th).map((x) => x.slug);
        members = experiences.filter((e) => cats.includes(e.category));
        key = join(themeBlock(themesSrc, c), lang, members.map((e) => e.slug).join(","));
      }
      else if (c === "tours") { members = []; key = join(src("lib/booking-guidance.ts"), langBlock(collectionsCopy, lang), tours.join(",")); }
      else { members = experiences; key = join(src("lib/booking-guidance.ts"), langBlock(collectionsCopy, lang), experiences.map((e) => e.slug).join(",")); }
      const deps = members.map((e) => expPath(lang, e));
      if (c === "kyoto") deps.push(`/${lang}/kyoto/bamboo-sky-terrace/`);
      add(`/${lang}/${c}/`, { priority: "0.8", alternates: siblings((l) => `/${l}/${c}/`), key, deps });
    }
  }

  for (const e of experiences) {
    // A live English entry does not imply that every locale has a route.
    // Only authored translations and explicitly approved fallbacks resolve.
    const langs = LANGS.filter((lang) => expKey(lang, e.slug) != null);
    for (const lang of langs) {
      add(expPath(lang, e), { priority: "0.9", alternates: siblings((l) => expPath(l, e), langs), key: join(expKey(lang, e.slug), src("lib/experience-seo.ts"), src("components/site/experience-facts.tsx")) });
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
  const articles = src("lib/articles.ts") + "\n" + src("lib/golf-articles.ts");
  const golfTranslations = Object.fromEntries(LANGS.filter((lang) => lang !== "en").map((lang) => {
    const text = src(`lib/golf-articles.${lang}.json`);
    return [lang, text ? JSON.parse(text) : {}];
  }));
  const golfSlugs = new Set([...src("lib/golf-articles.ts").matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  const listed = new Set(experiences.map((e) => e.slug));
  const articlePaths = Object.fromEntries(LANGS.map((l) => [l, []]));
  for (const m of articles.matchAll(/slug:\s*"([a-z0-9-]+)",\s*\n\s*date:/g)) {
    const slug = m[1];
    const block = entryBlock(articles, slug) ?? "";
    const tags = [...(block.match(/experiences:\s*\[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((t) => t[1]);
    if (!tags.some((t) => listed.has(t))) continue;
    const head = block.slice(0, block.indexOf("copy:"));
    const copyFor = (lang) => golfSlugs.has(slug) && golfTranslations[lang]?.[slug]
      ? JSON.stringify(golfTranslations[lang][slug])
      : langBlock(block, lang, "      ");
    const langs = LANGS.filter((l) => copyFor(l));
    for (const lang of langs) {
      articlePaths[lang].push(`/${lang}/journal/${slug}/`);
      add(`/${lang}/journal/${slug}/`, { priority: "0.6", changefreq: "monthly", alternates: siblings((l) => `/${l}/journal/${slug}/`, langs), key: join(head, copyFor(lang), golfSlugs.has(slug) ? src("lib/journal-copy.ts") : "", /comparison:/.test(head) ? catalog + cat[lang] : "") });
    }
  }

  const staticCopy = src("lib/static-pages.ts");
  const aboutSrc = staticCopy.slice(staticCopy.indexOf("const ABOUT"), staticCopy.indexOf("const FAQ"));
  const faqSrc = staticCopy.slice(staticCopy.indexOf("const FAQ"));
  const i18n = src("lib/i18n.ts");
  const privacyDate = src("lib/privacy.ts").match(/const UPDATED = "(\d{4}-\d{2}-\d{2})"/)?.[1] ?? null;
  // LEGAL_UPDATED may be a plain date or a mode-dependent expression (the golf booking
  // service changed the terms); the newest date on that line is the page's date.
  const legalLine = src("lib/legal.ts").match(/LEGAL_UPDATED = [^\n]*/)?.[0] ?? "";
  const legalDate = [...legalLine.matchAll(/"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1]).sort().pop() ?? null;
  const pageKeys = { contact: keysUsed(src("app/[lang]/contact/page.tsx")), trade: keysUsed(src("app/[lang]/trade/page.tsx")) };
  for (const page of STATIC_PAGES) {
    for (const lang of LANGS) {
      const opts = { priority: "0.5", changefreq: "monthly", alternates: siblings((l) => `/${l}/${page}/`) };
      if (page === "about") opts.key = join(langBlock(aboutSrc, lang), src("lib/booking-guidance.ts"));
      else if (page === "faq") opts.key = join(langBlock(faqSrc, lang), src("lib/booking-guidance.ts"));
      else if (page === "journal") { opts.key = "journal"; opts.deps = articlePaths[lang]; }
      else if (page === "contact" || page === "trade") opts.key = i18nKeys(langBlock(i18n, lang), pageKeys[page]);
      else if (page === "privacy") opts.date = privacyDate;
      else opts.date = legalDate; // legal, terms
      add(`/${lang}/${page}/`, opts);
    }
  }

  if (golfpaqLive) {
    // The bus copy currently has English and Japanese editions.
    const golfLocales = ["en", "ja"];
    const golfCopy = src("lib/golfpaq-copy.ts");
    for (const page of ["golf-bus", "golf-tours"]) {
      const pagePath = (lang) => `/${lang}/${page}/`;
      const key = join(src(`app/[lang]/${page}/page.tsx`), golfCopy);
      for (const lang of golfLocales) {
        add(pagePath(lang), {
          priority: "0.7",
          changefreq: "weekly",
          alternates: siblings(pagePath, golfLocales),
          key,
        });
      }
    }
  }

  // Travel support (lib/support.ts): the index and the babysitting page, in every language.
  const supportSrc = join(src("lib/support.ts"), src("lib/support-fees.ts"));
  for (const lang of LANGS) {
    add(`/${lang}/support/`, { priority: "0.6", changefreq: "monthly", alternates: siblings((l) => `/${l}/support/`), key: join(langBlock(src("lib/support.ts"), lang) || supportSrc, src("app/[lang]/support/page.tsx")) });
    add(`/${lang}/support/babysitter/`, { priority: "0.7", changefreq: "monthly", alternates: siblings((l) => `/${l}/support/babysitter/`), key: join(supportSrc, src("app/[lang]/support/babysitter/page.tsx")) });
  }

  const terraceSrc = src("lib/bamboo-sky-terrace.ts");
  const terraceShared = terraceSrc.split("export const terraceCopy =")[0];
  const terracePage = src("app/[lang]/kyoto/bamboo-sky-terrace/page.tsx");
  for (const lang of LANGS) {
    add(`/${lang}/kyoto/bamboo-sky-terrace/`, {
      priority: "0.7", changefreq: "monthly", alternates: siblings((l) => `/${l}/kyoto/bamboo-sky-terrace/`),
      key: join(terracePage, terraceShared, langBlock(terraceSrc, lang)),
    });
  }

  add("/partners/", { priority: "0.4", changefreq: "monthly", key: src("app/partners/page.tsx") || null });
  add("/partners-lp/", { priority: "0.5", changefreq: "monthly", key: join(src("app/partners-lp/page.tsx"), src("components/suppliers/page.tsx"), src("components/suppliers/reach-channels.tsx"), src("lib/supplier-policy.ts")) });
  // The Ofukuro Dinner founding-guest campaign (published 2026-10-23): its copy lives in lib/ofukuro-dinner.ts and the page.
  add("/ofukuro-dinner/", { priority: "0.7", changefreq: "weekly", key: (src("app/ofukuro-dinner/page.tsx") || "") + (src("lib/ofukuro-dinner.ts") || "") || null });

  return { entries, stats: { experiences: experiences.length, tours: toursPublished ? tours.length : 0, collections: collections.length } };
}
