/** English for the partner's Japanese course descriptions, day schedules and
 *  conditions, and English names for courses neither the code map nor the
 *  ops table knows. Runs on Workers AI inside the cron, a few tours per tick,
 *  and keeps the result with the cached detail (KV), so each text is
 *  translated once. Partner names, phone numbers, addresses and links are
 *  stripped before and after translation. Best effort: a failure leaves the
 *  tour untranslated and the English page shows the confirmed facts only. */
import { courseNameEn, normaliseCourseName } from "./golf-course-images";
import { GOLFPAQ_COURSE_NAMES_KEY, GOLFPAQ_DETAIL_PREFIX, GOLFPAQ_SNAPSHOT_KEY, publicNotes, readGolfpaqSnapshot, scrubPartnerText, type GolfpaqKv, type GolfpaqTourDetails } from "./golfpaq";

export type Ai = { run(model: string, input: Record<string, unknown>): Promise<unknown> };
export const GOLFPAQ_TRANSLATE_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DETAIL_TTL_SEC = 14 * 24 * 3600;
const MAX_TRIES = 3;
const SYSTEM = "You translate text from a Japanese golf tour operator into natural, concise English for international golfers who will play in Japan. Translate faithfully; do not add, advertise or explain. Use standard golf terms (yards, par, fairway, green, riding cart, self-play, clubhouse, driving range, hot-spring bath). Write times on the 24-hour clock (9:00, 18:30) and prices as ¥ amounts. Leave out phone numbers, postal addresses, website links and company names entirely. Output only the translation, keeping the source's line breaks.";
const NAME_SYSTEM = "You give the English name of a Japanese golf course as the club itself writes it in Latin letters, for example 鶴舞カントリークラブ → Tsurumai Country Club, ピートダイGC ロイヤルコース → Pete Dye Golf Club, Royal Course, ゴルフ5カントリーサニーフィールド → Golf5 Country Sunny Field. Output only the name, nothing else.";

/** One short completion; null on timeout, error or an empty answer. */
async function ask(ai: Ai, system: string, text: string, maxTokens: number, timeoutMs = 25000): Promise<string | null> {
  const run = ai.run(GOLFPAQ_TRANSLATE_MODEL, { messages: [{ role: "system", content: system }, { role: "user", content: text }], max_tokens: maxTokens, temperature: 0.2 }) as Promise<{ response?: string }>;
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  try {
    const out = await Promise.race([run, timeout]);
    const answer = out?.response?.trim().replace(/^```[a-z]*\n?|```$/g, "").trim();
    return answer || null;
  } catch (err) { console.error("golfpaq translate:", err instanceof Error ? err.message : err); return null; }
}

/** Numbered lines back into an array; tolerates "1." / "1)" / "-" prefixes and dropped items. */
export function splitNumbered(text: string): string[] {
  return text.split(/\r?\n/).map((l) => l.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim()).filter((l) => l.length > 2);
}

export async function translateDetails(ai: Ai, d: GolfpaqTourDetails, now = new Date()): Promise<NonNullable<GolfpaqTourDetails["en"]>> {
  const features = scrubPartnerText(d.features.replace(/\*?別途昼食代がかかります。?|ランチは別料金となります。各自ご精算ください。?/g, ""));
  const schedule = scrubPartnerText(d.schedule);
  const notes = publicNotes(d.notes);
  const [f, s, n] = await Promise.all([
    features ? ask(ai, SYSTEM, features, 700) : Promise.resolve(""),
    schedule ? ask(ai, SYSTEM, schedule, 400) : Promise.resolve(""),
    notes.length ? ask(ai, SYSTEM + " Each line is numbered; keep the numbers and the one-item-per-line layout.", notes.map((x, i) => `${i + 1}. ${x}`).join("\n"), 500) : Promise.resolve(""),
  ]);
  const failed = (features && f === null) || (schedule && s === null) || (notes.length && n === null);
  const prev = d.en?.tries ?? 0;
  return {
    ...(f ? { features: scrubPartnerText(f) } : {}),
    ...(s ? { schedule: scrubPartnerText(s) } : {}),
    ...(n ? { notes: splitNumbered(scrubPartnerText(n)) } : {}),
    at: now.toISOString(),
    tries: prev + 1,
    ...(failed ? { incomplete: true } : {}),
  };
}

export async function translateCourseName(ai: Ai, ja: string): Promise<string | null> {
  const en = await ask(ai, NAME_SYSTEM, ja, 40, 15000);
  if (!en || en.length > 60 || /\n/.test(en) || !/^[A-Za-z0-9][A-Za-z0-9 ,.'&()-]*$/.test(en)) return null;
  return en;
}

export interface AutoCourseName { ja: string; en: string; at: string }
export type AutoCourseNames = Record<string, AutoCourseName>;

/** Translate what the snapshot still lacks: a few tours' details and the
 *  names of unknown courses. Writes the detail cache and the auto-name map,
 *  and the snapshot itself without touching its updatedAt. */
export async function translatePendingGolfpaq(kv: GolfpaqKv | null | undefined, ai: Ai | null | undefined, opts: { now?: Date; maxDetails?: number; maxNames?: number; hasName?: (course: string) => boolean } = {}): Promise<{ details: number; names: number }> {
  if (!kv || !ai) return { details: 0, names: 0 };
  const now = opts.now ?? new Date();
  const snapshot = await readGolfpaqSnapshot(kv);
  if (!snapshot) return { details: 0, names: 0 };
  let details = 0, budget = opts.maxDetails ?? 8;
  for (const t of snapshot.tours) {
    const d = t.details;
    if (!d || budget <= 0) continue;
    const done = d.en && (!d.en.incomplete || (d.en.tries ?? 0) >= MAX_TRIES);
    if (done) continue;
    budget--;
    const en = await translateDetails(ai, d, now);
    d.en = en;
    details++;
    try { await kv.put(GOLFPAQ_DETAIL_PREFIX + t.id, JSON.stringify(d), { expirationTtl: DETAIL_TTL_SEC }); } catch { /* the snapshot still carries it until the next refresh */ }
  }
  if (details) await kv.put(GOLFPAQ_SNAPSHOT_KEY, JSON.stringify(snapshot), { expirationTtl: 48 * 3600 });

  let names = 0, nameBudget = opts.maxNames ?? 5;
  let auto: AutoCourseNames = {};
  try { auto = ((await kv.get(GOLFPAQ_COURSE_NAMES_KEY, "json")) as AutoCourseNames | null) ?? {}; } catch { auto = {}; }
  for (const course of new Set(snapshot.tours.map((t) => t.course))) {
    if (nameBudget <= 0) break;
    const key = normaliseCourseName(course);
    if (courseNameEn(course) !== course || opts.hasName?.(course) || auto[key]) continue;
    nameBudget--;
    const en = await translateCourseName(ai, course);
    if (!en) continue;
    auto[key] = { ja: course, en, at: now.toISOString() };
    names++;
  }
  if (names) await kv.put(GOLFPAQ_COURSE_NAMES_KEY, JSON.stringify(auto));
  return { details, names };
}
