/** "Popular right now" on the home page. The order comes from demand over
 *  the last 90 days (reservations count three, shared-bus golf enquiries
 *  one), or from a hand-picked order saved on /ops/popular/; with no demand
 *  yet, from DEFAULT_POPULAR. Only live experiences are ever shown, and the
 *  list is padded to POPULAR_COUNT from the default order. */
import { catalogFor, isLive, type Experience } from "./catalog";
import type { Lang } from "./i18n";
import { randomId, type SqlDb } from "./referral/db";

export const POPULAR_SETTING_KEY = "popular_experiences";
export const POPULAR_COUNT = 4;
export const POPULAR_WINDOW_DAYS = 90;
/** The custom golf experience; shared-bus golf enquiries count towards it. */
export const GOLF_SLUG = "mt-fuji-golf-day";
/** The order before there is demand data: strongest sellers first. */
export const DEFAULT_POPULAR = ["evening-with-geiko", GOLF_SLUG, "shibuya-ramen-class", "kyoto-garden-teahouse-tea-ceremony", "nihonbashi-kendo-experience", "kanji-name-calligraphy", "dotonbori-ramen-class"];
const CACHE_MS = 5 * 60 * 1000;

export interface PopularSetting { mode: "auto" | "manual"; slugs: string[] }
export interface DemandRow { slug: string; reservations: number; enquiries: number; score: number }

const liveSlugs = () => new Set(catalogFor("en").experiences.filter(isLive).map((e) => e.slug));
const unique = (xs: string[]) => [...new Set(xs)];

export async function readPopularSetting(db: SqlDb | null): Promise<PopularSetting> {
  if (!db) return { mode: "auto", slugs: [] };
  try {
    const row = await db.first<{ value: string }>(`SELECT value FROM portal_settings WHERE key = ?`, [POPULAR_SETTING_KEY]);
    const v = row ? JSON.parse(row.value) as Partial<PopularSetting> : null;
    return { mode: v?.mode === "manual" ? "manual" : "auto", slugs: Array.isArray(v?.slugs) ? v!.slugs!.filter((s): s is string => typeof s === "string") : [] };
  } catch { return { mode: "auto", slugs: [] }; }
}

/** Demand per experience in the window, highest first; experiences without any demand are left out. */
export async function demandBySlug(db: SqlDb, now = new Date()): Promise<DemandRow[]> {
  const since = new Date(now.getTime() - POPULAR_WINDOW_DAYS * 86400000).toISOString();
  const rows = new Map<string, DemandRow>();
  const at = (slug: string) => { let r = rows.get(slug); if (!r) { r = { slug, reservations: 0, enquiries: 0, score: 0 }; rows.set(slug, r); } return r; };
  for (const r of await db.all<{ slug: string; n: number }>(`SELECT experience_slug AS slug, COUNT(*) AS n FROM reservations WHERE created_at >= ? AND status NOT IN ('cancelled','no_show') GROUP BY experience_slug`, [since])) at(r.slug).reservations += Number(r.n);
  try {
    const bus = await db.first<{ n: number }>(`SELECT COUNT(*) AS n FROM bus_tour_enquiries WHERE created_at >= ? AND status NOT IN ('cancelled','unavailable')`, [since]);
    if (bus && Number(bus.n) > 0) at(GOLF_SLUG).enquiries += Number(bus.n);
  } catch { /* table absent on an older database */ }
  for (const r of rows.values()) r.score = r.reservations * 3 + r.enquiries;
  return [...rows.values()].filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

/** Candidates for the home page, in order: the manual list or the demand ranking, padded from DEFAULT_POPULAR, live
 *  experiences only. Twice the card count, because a language may lack some of them; the page takes the first POPULAR_COUNT it has. */
export async function popularSlugs(db: SqlDb | null, now = new Date()): Promise<{ mode: PopularSetting["mode"]; slugs: string[]; demand: DemandRow[] }> {
  const live = liveSlugs();
  const setting = await readPopularSetting(db);
  const demand = db ? await demandBySlug(db, now) : [];
  const ranked = setting.mode === "manual" ? setting.slugs : demand.map((d) => d.slug);
  const slugs = unique([...ranked, ...DEFAULT_POPULAR, ...live]).filter((s) => live.has(s)).slice(0, POPULAR_COUNT * 2);
  return { mode: setting.mode, slugs, demand };
}

let cache: { at: number; slugs: string[] } | null = null;
/** The experiences for the home page, in the page's language; the order is cached for a few minutes per isolate. */
export async function popularExperiences(db: SqlDb | null, lang: Lang, now = new Date()): Promise<Experience[]> {
  if (!cache || now.getTime() - cache.at > CACHE_MS) {
    try { cache = { at: now.getTime(), slugs: (await popularSlugs(db, now)).slugs }; } catch { cache = { at: now.getTime(), slugs: (await popularSlugs(null, now)).slugs }; }
  }
  const all = catalogFor(lang).experiences;
  return cache.slugs.map((s) => all.find((e) => e.slug === s)).filter((e): e is Experience => !!e && isLive(e)).slice(0, POPULAR_COUNT);
}
export const resetPopularCache = () => { cache = null; };

/** For /ops/popular/: the saved setting, the demand table and what the home page currently shows. */
export async function popularOverview(db: SqlDb, now = new Date()) {
  const setting = await readPopularSetting(db);
  const { slugs, demand } = await popularSlugs(db, now);
  const titles = new Map(catalogFor("ja").experiences.map((e) => [e.slug, e]));
  const en = new Map(catalogFor("en").experiences.map((e) => [e.slug, e]));
  const label = (slug: string) => ({ slug, title: titles.get(slug)?.title ?? en.get(slug)?.title ?? slug, titleEn: en.get(slug)?.title ?? slug, city: en.get(slug)?.city ?? "" });
  return {
    setting, effective: slugs.slice(0, POPULAR_COUNT).map(label), count: POPULAR_COUNT, windowDays: POPULAR_WINDOW_DAYS,
    demand: demand.map((d) => ({ ...d, ...label(d.slug) })),
    experiences: catalogFor("en").experiences.filter(isLive).map((e) => label(e.slug)),
    defaults: DEFAULT_POPULAR.filter((s) => liveSlugs().has(s)).map(label),
  };
}

export async function savePopularSetting(db: SqlDb, input: { mode: unknown; slugs: unknown; by: string }) {
  const mode: PopularSetting["mode"] = input.mode === "manual" ? "manual" : "auto";
  const live = liveSlugs();
  const slugs = unique((Array.isArray(input.slugs) ? input.slugs : []).filter((s): s is string => typeof s === "string" && live.has(s))).slice(0, 8);
  if (mode === "manual" && slugs.length === 0) throw new Error("slugs_required");
  const value = JSON.stringify({ mode, slugs } satisfies PopularSetting), at = new Date().toISOString();
  await db.run(`INSERT INTO portal_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`, [POPULAR_SETTING_KEY, value, at, input.by]);
  await db.run(`INSERT INTO audit_logs (id, at, actor, action, target_type, target_id, reason, after_json) VALUES (?, ?, ?, 'popular.update', 'settings', ?, NULL, ?)`, [randomId(), at, input.by, POPULAR_SETTING_KEY, value]);
  resetPopularCache();
  return { mode, slugs };
}
