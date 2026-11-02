/**
 * GOLFPAQ's public day pages (partner-approved information use).
 * Dates run from seven days after today through the end of the third
 * published calendar month. A scheduled job snapshots the data to KV;
 * customer-facing requests never crawl the entire partner site.
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
export function lastPublishedDay(now = new Date()): string {
  const [year, month] = japanToday(now).split("-").map(Number);
  // The partner calendar shows the current and next two calendar months.
  return new Date(Date.UTC(year, month + 2, 0)).toISOString().slice(0, 10);
}
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
export function parseGolfpaqDay(html: string, expectedDate: string): GolfpaqTour[] {
  const cards = html.split(/<div\s+class=["']col-lg-4 mb-5["']\s*>/i).slice(1);
  const found: GolfpaqTour[] = [];
  for (const card of cards) {
    const kind = strip(card.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
    if (kind !== "セルフプレーラウンド") continue;
    const dateValue = field(card, "日程：");
    const matchDate = dateValue.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!matchDate) continue;
    const date = matchDate[1] + "-" + matchDate[2].padStart(2, "0") + "-" + matchDate[3].padStart(2, "0");
    if (date !== expectedDate) continue;
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
export function golfpaqDayUrl(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${GOLFPAQ_SOURCE}/booking/plan/index/${y}/${m}/${d}`;
}
export async function fetchGolfpaqDay(date: string): Promise<GolfpaqTour[]> {
  const res = await fetch(golfpaqDayUrl(date), {
    headers: { "user-agent": "KAMEHAME-JAPAN partner tour catalog (hello@kamehame-japan.com)" },
    signal: AbortSignal.timeout(8500),
    cache: "no-store",
  });
  if (!res.ok) throw Error("golfpaq_http_" + res.status);
  const html = await res.text();
  // A login, maintenance or bot-challenge page must not be mistaken for an empty schedule.
  if (!html.includes("GOLFPAQ") || !html.includes("件数")) throw Error("golfpaq_page_changed");
  return parseGolfpaqDay(html, date);
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
  const first = firstPublicDay(now), through = lastPublishedDay(now);
  const dates: string[] = [];
  for (let d = first; d <= through; d = plusDays(d, 1)) dates.push(d);
  if (!dates.length) return;
  const tours: GolfpaqTour[] = [];
  let fetchedDays = 0, failedDays = 0;
  // Limit concurrency out of respect for our tour partner.
  for (let i = 0; i < dates.length; i += 4) {
    const batch = await Promise.allSettled(dates.slice(i, i + 4).map(fetchGolfpaqDay));
    for (const item of batch) {
      if (item.status === "fulfilled") { fetchedDays++; tours.push(...item.value); }
      else failedDays++;
    }
  }
  // Do not replace a useful snapshot with a predominantly failed crawl.
  if (fetchedDays < Math.ceil(dates.length * 0.8)) throw Error("golfpaq_refresh_incomplete");
  const unique = [...new Map(tours.map(t => [t.id, t])).values()].sort((a,b) => a.date.localeCompare(b.date) || a.perPersonYen - b.perPersonYen);
  await kv.put(GOLFPAQ_SNAPSHOT_KEY, JSON.stringify({ updatedAt: now.toISOString(), through, tours: unique, fetchedDays, failedDays } satisfies GolfpaqSnapshot), { expirationTtl: 48 * 3600 });
}
