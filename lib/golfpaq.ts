/**
 * GOLFPAQ's public day pages (partner-approved information use).
 * Dates run from JST today + 7 days through the last published calendar
 * date on the partner's home page. Only monthly self-play listings are fetched;
 * customer-facing requests never crawl the partner site.
 */
export const GOLFPAQ_SOURCE = "https://www.golfpaq.net";
export const GOLFPAQ_FEE_JPY = 15000;
export const GOLFPAQ_RENTAL_JPY = 5500;
export const GOLFPAQ_SNAPSHOT_KEY = "golfpaq:self-rounds:v1";
export const GOLFPAQ_REFRESH_MS = 3 * 60 * 60 * 1000;
export const GOLFPAQ_MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface GolfpaqTour {
  id: string; date: string; course: string; pickup: string;
  sourceYen: number; perPersonYen: number; seats: number;
  detailUrl: string; imageUrl?: string;
}

export interface GolfpaqSnapshot {
  updatedAt: string;
  through: string;
  tours: GolfpaqTour[];
  fetchedDays: number;
  failedDays: number;
}

export interface GolfpaqKv {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export function japanToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
export function plusDays(day: string, n: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
}
export function firstPublicDay(now = new Date()): string { return plusDays(japanToday(now), 7); }
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const field = (html: string, label: string) => {
  const at = html.indexOf(label);
  if (at < 0) return "";
  const end = html.indexOf("</li>", at);
  return strip(html.slice(at + label.length, end < 0 ? at + 160 : end));
};
function validPicture(source: string): string | undefined {
  try {
    const url = new URL(source);
    return url.protocol === "https:" && url.hostname === "www.golfpaq.net" && url.pathname.startsWith("/booking/storage/images/course/") ? url.href : undefined;
  } catch { return undefined; }
}

/** Returns only ordinary, available 18-hole self-play rounds, not lessons, caddies or shuttles. */
export function parseGolfpaqListing(html: string, fromDate: string, throughDate: string): GolfpaqTour[] {
  const cards = html.split(/<div\s+class=["']col-lg-4 mb-5["']\s*>/i).slice(1);
  const found: GolfpaqTour[] = [];
  for (const card of cards) {
    const kind = strip(card.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
    if (kind !== "セルフプレーラウンド") continue;
    const dateValue = field(card, "日程：");
    const matchDate = dateValue.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!matchDate) continue;
    const date = matchDate[1] + "-" + matchDate[2].padStart(2, "0") + "-" + matchDate[3].padStart(2, "0");
    if (date < fromDate || date > throughDate) continue;
    const course = strip(card.match(/<p\s+class=["']small mb-1["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 130);
    const sourceYen = Number(strip(card.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i)?.[1] ?? "").match(/([\d,]+)円/)?.[1]?.replace(/,/g, "") ?? 0);
    const seats = Number(field(card, "残数：").match(/(\d+)名/)?.[1] ?? 0);
    const detailUrl = card.match(/https:\/\/www\.golfpaq\.net\/booking\/plan\/show\/\d+\/\d+\/\d+/i)?.[0] ?? "";
    const id = detailUrl.match(/\/plan\/show\/(\d+\/\d+\/\d+)/)?.[1]?.replace(/\//g, "-") ?? "";
    const pickup = strip(card.match(/<p\s+class=["']mb-0["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 180);
    const imageUrl = validPicture(card.match(/<img\s+class=["']card-img-top["']\s+src=["']([^"']+)["']/i)?.[1] ?? "");
    if (!id || !course || !pickup || seats <= 0 || sourceYen < 5000 || sourceYen > 100000) continue;
    found.push({ id, date, course, pickup, sourceYen, perPersonYen: sourceYen + GOLFPAQ_FEE_JPY, seats, detailUrl, ...(imageUrl ? { imageUrl } : {}) });
  }
  return found;
}
/** One public calendar listing tells us how far ahead this partner currently sells. */
export function publishedDatesFromIndex(html: string): string[] {
  const dates = [...html.matchAll(/\/booking\/plan\/index\/(\d{4})\/(\d{1,2})\/(\d{1,2})(?=[\s"'?#<])/g)]
    .map((m) => m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0"))
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z")));
  return [...new Set(dates)].sort();
}
export async function publishedSchedule(now = new Date()): Promise<{ first: string; through: string; months: string[] }> {
  const res = await fetch(GOLFPAQ_SOURCE + "/booking/", {
    headers: { "user-agent": "KAMEHAME-JAPAN partner tour catalog (hello@kamehame-japan.com)" },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!res.ok) throw Error("golfpaq_index_http_" + res.status);
  const html = await res.text();
  if (!html.includes("GOLFPAQ") || !html.includes("/booking/plan/index/")) throw Error("golfpaq_index_changed");
  const first = firstPublicDay(now);
  const published = publishedDatesFromIndex(html).filter((d) => d >= first && d <= plusDays(japanToday(now), 365));
  const through = published[published.length - 1];
  if (!through) return { first, through: first, months: [] };
  const months: string[] = [];
  for (let month = first.slice(0, 7); month <= through.slice(0, 7); ) {
    months.push(month);
    const [year, m] = month.split("-").map(Number);
    month = new Date(Date.UTC(year, m, 1)).toISOString().slice(0, 7);
  }
  return { first, through, months };
}
/** Monthly self-play schedules need only a handful of calls instead of daily pages. */
export async function fetchGolfpaqMonth(month: string, first: string, through: string): Promise<GolfpaqTour[]> {
  const [y, m] = month.split("-").map(Number);
  const res = await fetch(GOLFPAQ_SOURCE + "/booking/coursecategory/1/" + y + "/" + m, {
    headers: { "user-agent": "KAMEHAME-JAPAN partner tour catalog (hello@kamehame-japan.com)" },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!res.ok) throw Error("golfpaq_month_http_" + res.status);
  const html = await res.text();
  if (!html.includes("GOLFPAQ") || !html.includes("セルフプレーラウンド")) throw Error("golfpaq_month_page_changed");
  return parseGolfpaqListing(html, first, through);
}
export async function readGolfpaqSnapshot(kv?: GolfpaqKv | null): Promise<GolfpaqSnapshot | null> {
  if (!kv) return null;
  try {
    const raw = await kv.get(GOLFPAQ_SNAPSHOT_KEY, "json") as GolfpaqSnapshot | null;
    return raw && Array.isArray(raw.tours) && typeof raw.updatedAt === "string" ? raw : null;
  } catch { return null; }
}
export function snapshotIsFresh(snapshot: GolfpaqSnapshot | null, now = Date.now()): boolean {
  return !!snapshot && Number.isFinite(Date.parse(snapshot.updatedAt)) && now - Date.parse(snapshot.updatedAt) <= GOLFPAQ_MAX_AGE_MS && now >= Date.parse(snapshot.updatedAt);
}
/** Runs in the existing Cloudflare cron, at most once every three hours. */
export async function refreshGolfpaqSnapshot(kv?: GolfpaqKv | null, now = new Date()): Promise<void> {
  if (!kv) return;
  const previous = await readGolfpaqSnapshot(kv);
  if (previous && now.getTime() - Date.parse(previous.updatedAt) < GOLFPAQ_REFRESH_MS) return;
  const { first, through, months } = await publishedSchedule(now);
  const tours: GolfpaqTour[] = [];
  let fetchedMonths = 0;
  const jobs = await Promise.allSettled(months.map(month => fetchGolfpaqMonth(month, first, through)));
  for (const job of jobs) {
    if (job.status === "fulfilled") { fetchedMonths++; tours.push(...job.value); }
  }
  if (fetchedMonths !== months.length) throw Error("golfpaq_refresh_incomplete");
  const unique = [...new Map(tours.map(t => [t.id, t])).values()].sort((a,b) => a.date.localeCompare(b.date) || a.perPersonYen - b.perPersonYen);
  await kv.put(GOLFPAQ_SNAPSHOT_KEY, JSON.stringify({ updatedAt: now.toISOString(), through, tours: unique, fetchedDays: fetchedMonths, failedDays: 0 } satisfies GolfpaqSnapshot), { expirationTtl: 48 * 3600 });
}
