/** Course display names kept in D1 (migration 0005) on top of the code map:
 *  operations fill in the English (and other-language) names for courses that
 *  appear on the partner's schedule, without a deploy. */
import type { SqlDb } from "@/lib/referral/db";
import { COURSES, courseArea, courseNameEn, normaliseCourseName, type CourseInfo } from "./golf-course-images";
import type { Lang } from "@/lib/i18n";
import { GOLFPAQ_COURSE_NAMES_KEY, type GolfpaqKv } from "./golfpaq";

export interface CourseRow { name: string; name_en: string | null; name_ja: string | null; name_es: string | null; name_fr: string | null; name_zh_tw: string | null; area: string | null; photo: string | null; note: string | null; updated_at: string; updated_by: string | null }
/** What a page needs per partner name: a display name per language and the area. */
export interface CourseNames { en?: string; ja?: string; es?: string; fr?: string; "zh-tw"?: string; area?: string; /** The English name came from the cron's translation, not a person. */ auto?: boolean }
export type AutoNames = Record<string, { ja: string; en: string; at: string }>;
export async function loadAutoNames(kv: GolfpaqKv | null | undefined): Promise<AutoNames> { if (!kv) return {}; try { return ((await kv.get(GOLFPAQ_COURSE_NAMES_KEY, "json")) as AutoNames | null) ?? {}; } catch { return {}; } }
export type CourseNameMap = Record<string, CourseNames>;

const LANG_COL: Record<Lang, keyof CourseRow> = { en: "name_en", ja: "name_ja", es: "name_es", fr: "name_fr", "zh-tw": "name_zh_tw" };

/** The map from the database, keyed by the normalised partner name, plus the
 *  cron's auto-translated English names for courses nobody has named (when a
 *  KV namespace is given); empty when neither is available. */
export async function loadCourseNames(db: SqlDb | null | undefined, kv?: GolfpaqKv | null): Promise<CourseNameMap> {
  const map: CourseNameMap = {};
  if (db) {
    try {
      const rows = await db.all<CourseRow>(`SELECT * FROM golf_courses`);
      for (const r of rows) {
        map[normaliseCourseName(r.name)] = {
          ...(r.name_en ? { en: r.name_en } : {}), ...(r.name_ja ? { ja: r.name_ja } : {}), ...(r.name_es ? { es: r.name_es } : {}), ...(r.name_fr ? { fr: r.name_fr } : {}), ...(r.name_zh_tw ? { "zh-tw": r.name_zh_tw } : {}), ...(r.area ? { area: r.area } : {}),
        };
      }
    } catch { /* the code map still applies */ }
  }
  for (const [key, v] of Object.entries(await loadAutoNames(kv))) {
    if (!map[key]?.en && v.en && courseNameEn(v.ja) === v.ja) map[key] = { ...map[key], en: v.en, auto: true };
  }
  return map;
}

/** The name to show for a partner course name in a language: the database first, then the code map, then the partner's name. */
export function displayCourseName(course: string, lang: Lang, names: CourseNameMap = {}): string {
  const row = names[normaliseCourseName(course)];
  if (lang === "ja") return row?.ja || course;
  return row?.[lang] || row?.en || courseNameEn(course);
}
export function displayCourseArea(course: string, names: CourseNameMap = {}): string | undefined {
  return names[normaliseCourseName(course)]?.area || courseArea(course);
}

/** Operations: every course the schedule mentions, with the stored names, the code-map seed and what is still missing. */
export async function courseList(db: SqlDb, scheduled: { name: string; tours: number }[], auto: AutoNames = {}) {
  const rows = await db.all<CourseRow>(`SELECT * FROM golf_courses ORDER BY name`);
  const byKey = new Map(rows.map((r) => [normaliseCourseName(r.name), r]));
  const seen = new Set<string>();
  const out: (Partial<CourseRow> & { name: string; tours: number; seed: CourseInfo | null; missingEn: boolean; autoEn: boolean; inSchedule: boolean })[] = [];
  const push = (name: string, tours: number, inSchedule: boolean) => {
    const key = normaliseCourseName(name);
    if (seen.has(key)) return;
    seen.add(key);
    const row = byKey.get(key);
    const seedEntry = Object.entries(COURSES).find(([k]) => normaliseCourseName(k) === key)?.[1] ?? null;
    const autoEn = !row?.name_en && !seedEntry ? auto[key]?.en ?? null : null;
    const name_en = row?.name_en ?? seedEntry?.en ?? autoEn ?? null;
    out.push({ ...(row ?? {}), name: row?.name ?? name, tours, seed: seedEntry, name_en, area: row?.area ?? seedEntry?.area ?? null, missingEn: !name_en, autoEn: !!autoEn, inSchedule });
  };
  for (const s of scheduled) push(s.name, s.tours, true);
  for (const r of rows) push(r.name, 0, false);
  return out.sort((a, b) => Number(b.missingEn) - Number(a.missingEn) || Number(b.autoEn) - Number(a.autoEn) || b.tours - a.tours);
}

export async function saveCourse(db: SqlDb, input: { name: unknown; name_en?: unknown; name_ja?: unknown; name_es?: unknown; name_fr?: unknown; name_zh_tw?: unknown; area?: unknown; note?: unknown; by: string }) {
  const clean = (v: unknown, n = 120) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const name = clean(input.name, 160);
  if (!name) throw new Error("name_required");
  const at = new Date().toISOString();
  await db.run(
    `INSERT INTO golf_courses (name, name_en, name_ja, name_es, name_fr, name_zh_tw, area, note, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET name_en = excluded.name_en, name_ja = excluded.name_ja, name_es = excluded.name_es, name_fr = excluded.name_fr, name_zh_tw = excluded.name_zh_tw, area = excluded.area, note = excluded.note, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    [name, clean(input.name_en) || null, clean(input.name_ja) || null, clean(input.name_es) || null, clean(input.name_fr) || null, clean(input.name_zh_tw) || null, clean(input.area, 40) || null, clean(input.note, 500) || null, at, input.by]);
}
