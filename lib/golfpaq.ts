/**
 * GOLFPAQ shared-bus golf tours: the partner's public schedule as the
 * catalogue for "Shared Bus Golf Tours" (docs/GOLFPAQ_BUS_TOURS.md).
 *
 * Source: the partner's public monthly listings (one page per month) plus
 * one detail page per tour, read in the Cloudflare cron at most once every
 * three hours and kept in KV. Visitors never cause a crawl. Dates run from
 * JST today + 7 through the last date on the partner's published calendar.
 *
 * Money: the customer price is the partner's price plus a fixed amount per
 * person, shown only as one tax-inclusive total. The partner's price, the
 * amount added and the margin stay in the snapshot and the ledger; nothing
 * public receives them (toPublicTour strips them).
 */
export const GOLFPAQ_SOURCE = "https://www.golfpaq.net";
/** Added per person on top of the partner's price (internal; never shown). */
export const GOLFPAQ_FEE_JPY = 15000;
/** Rental clubs, per golfer who needs them (shown as an option). */
export const GOLFPAQ_RENTAL_JPY = 5500;
export const GOLFPAQ_SNAPSHOT_KEY = "golfpaq:self-rounds:v2";
export const GOLFPAQ_DETAIL_PREFIX = "golfpaq:detail:v1:";
export const GOLFPAQ_REFRESH_MS = 3 * 60 * 60 * 1000;
export const GOLFPAQ_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const DETAIL_TTL_SEC = 14 * 24 * 3600;
const DETAIL_FETCHES_PER_RUN = 40;
const UA = "KAMEHAME-JAPAN partner tour catalog (hello@kamehame-japan.com)";

/** What the detail page adds: times, conditions and the partner's own description. */
export interface GolfpaqTourDetails {
  departureTime?: string;
  features: string;
  access: string;
  schedule: string;
  notes: string[];
  lunchIncluded: boolean;
  cartIncluded: boolean;
  fetchedAt: string;
}

/** Internal record (KV). Carries the partner's price and the detail URL. */
export interface GolfpaqTour {
  id: string;
  date: string;
  course: string;
  /** The partner's departure plan as published, e.g. "新宿発着プラン 昼食つき♪". */
  pickup: string;
  sourceYen: number;
  perPersonYen: number;
  seats: number;
  capacity: number;
  detailUrl: string;
  imageUrl?: string;
  details?: GolfpaqTourDetails;
}

/** What pages and the browser receive: no partner price, no partner link. */
export interface PublicTour {
  id: string;
  date: string;
  course: string;
  pickup: string;
  departure: { area: string; via?: string; time?: string; lunch: "included" | "subsidy" | "not_included"; throughPlay: boolean; note?: string };
  perPersonYen: number;
  seats: number;
  capacity: number;
  imageUrl?: string;
  highlights?: string;
  schedule?: string;
  cartIncluded: boolean;
  notes?: string[];
}

export interface GolfpaqSnapshot {
  updatedAt: string;
  first: string;
  through: string;
  tours: GolfpaqTour[];
  months: string[];
  fetchedMonths: number;
  failedMonths: number;
  detailsPending: number;
}

export interface GolfpaqKv {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

// ---- money ------------------------------------------------------------------

export const customerPricePerPerson = (sourceYen: number) => sourceYen + GOLFPAQ_FEE_JPY;
/** The quoted total: golfers × per-person price, plus rental clubs for those who need them. */
export function enquiryTotal(perPersonYen: number, people: number, renters: number) {
  return { tours: perPersonYen * people, rentals: GOLFPAQ_RENTAL_JPY * renters, total: perPersonYen * people + GOLFPAQ_RENTAL_JPY * renters };
}
export const yen = (n: number) => `¥${n.toLocaleString("en-US")}`;

// ---- dates ------------------------------------------------------------------

export function japanToday(now = new Date()): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}
export function plusDays(day: string, n: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") + n * 86400_000).toISOString().slice(0, 10);
}
/** The first date shown: a week out, Japan time (要件 5). */
export function firstPublicDay(now = new Date()): string { return plusDays(japanToday(now), 7); }

// ---- parsing ----------------------------------------------------------------

const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;|　/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
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

/** Open, ordinary 18-hole self-play rounds from a monthly listing. Sold-out
 *  (完売), closed (受付終了) and zero-seat cards are left out. */
export function parseGolfpaqListing(html: string, fromDate: string, throughDate: string): GolfpaqTour[] {
  const cards = html.split(/<div\s+class=["']col-lg-4 mb-5["']\s*>/i).slice(1);
  const found: GolfpaqTour[] = [];
  for (const card of cards) {
    const kind = strip(card.match(/<h5[^>]*>([\s\S]*?)<\/h5>/i)?.[1] ?? "");
    if (kind !== "セルフプレーラウンド") continue;
    const badge = strip(card.match(/rounded-pill[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "");
    if (/完売|受付終了|満席|中止/.test(badge)) continue;
    const dateValue = field(card, "日程：");
    const matchDate = dateValue.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (!matchDate) continue;
    const date = `${matchDate[1]}-${matchDate[2].padStart(2, "0")}-${matchDate[3].padStart(2, "0")}`;
    if (date < fromDate || date > throughDate) continue;
    const course = strip(card.match(/<p\s+class=["']small mb-1["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 130);
    const sourceYen = Number(strip(card.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i)?.[1] ?? "").match(/([\d,]+)円/)?.[1]?.replace(/,/g, "") ?? 0);
    const seats = Number(field(card, "残数：").match(/(\d+)名/)?.[1] ?? 0);
    const capacity = Number(field(card, "定員：").match(/(\d+)名/)?.[1] ?? 0);
    const detailUrl = card.match(/https:\/\/www\.golfpaq\.net\/booking\/plan\/show\/\d+\/\d+\/\d+/i)?.[0] ?? "";
    const id = detailUrl.match(/\/plan\/show\/(\d+\/\d+\/\d+)/)?.[1]?.replace(/\//g, "-") ?? "";
    const pickup = strip(card.match(/<p\s+class=["']mb-0["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "").slice(0, 180);
    const imageUrl = validPicture(card.match(/<img\s+class=["']card-img-top["']\s+src=["']([^"']+)["']/i)?.[1] ?? "");
    if (!id || !course || !pickup || seats <= 0 || sourceYen < 5000 || sourceYen > 100000) continue;
    found.push({ id, date, course, pickup, sourceYen, perPersonYen: customerPricePerPerson(sourceYen), seats, capacity, detailUrl, ...(imageUrl ? { imageUrl } : {}) });
  }
  return found;
}

const text = (html: string) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>|<\/tr>|<\/dd>|<\/dt>/gi, "\n").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;|　/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const between = (t: string, start: string, ends: string[]) => {
  const at = t.indexOf(start);
  if (at < 0) return "";
  let end = t.length;
  for (const e of ends) { const i = t.indexOf(e, at + start.length); if (i >= 0 && i < end) end = i; }
  return t.slice(at + start.length, end).replace(/\s*\n\s*/g, "\n").trim();
};

/** The detail page: departure time, the course description, access, the day's schedule and conditions. */
export function parseGolfpaqDetail(html: string, now = new Date()): GolfpaqTourDetails {
  const t = text(html);
  const departureTime = t.match(/出発時間\s*\n?\s*(\d{1,2}:\d{2})/)?.[1];
  const features = between(t, "特長", ["コース・ラウンド紹介", "スタッフコメント", "送迎車について"]).slice(0, 1200);
  const access = between(t, "コース・ラウンド紹介", ["キャンセル規程", "スタッフコメント", "送迎車について"]).slice(0, 600);
  const schedule = between(t, "スタッフコメント", ["送迎車について", "お車でお越しの方は", "その他"]).slice(0, 800);
  const notes = between(t, "その他", ["受付終了しました", "申し込み", "戻る"]).split("\n").map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 200).slice(0, 12);
  const all = `${features}\n${schedule}\n${notes.join("\n")}`;
  return {
    ...(departureTime ? { departureTime } : {}),
    features, access, schedule, notes,
    lunchIncluded: /昼食(付|つ)き|昼食込|ランチ込/.test(all) && !/昼食.{0,8}別途|別途昼食|ランチは別料金/.test(all),
    cartIncluded: /カートフィー込|カート.{0,6}込/.test(all) || !/カート.{0,6}別途|カートフィー別/.test(all),
    fetchedAt: now.toISOString(),
  };
}

/** The partner's departure plan as something a visitor can read, keeping the Japanese text alongside. */
export function describePickup(pickup: string): PublicTour["departure"] {
  const area = /大井町/.test(pickup) ? "Oimachi (Tokyo)" : /新宿/.test(pickup) ? "Shinjuku (Tokyo)" : "Tokyo";
  const via = /東京経由/.test(pickup) ? "via Tokyo Station" : /池袋経由/.test(pickup) ? "via Ikebukuro" : /王子経由/.test(pickup) ? "via Oji" : undefined;
  const lunch: PublicTour["departure"]["lunch"] = /昼食(つき|付き)/.test(pickup) ? "included" : /昼食補助/.test(pickup) ? "subsidy" : "not_included";
  const noteBits: string[] = [];
  if (/同組不可/.test(pickup)) noteBits.push("Golfers from the other departure point are grouped separately");
  if (/日没了承/.test(pickup)) noteBits.push("Late tee time: the round may finish near sunset");
  if (/WEST/i.test(pickup)) noteBits.push("WEST course"); if (/EAST/i.test(pickup)) noteBits.push("EAST course");
  return { area, ...(via ? { via } : {}), lunch, throughPlay: /スループレー/.test(pickup), ...(noteBits.length ? { note: noteBits.join(". ") } : {}) };
}

/** The public projection: everything a visitor may see, nothing about the partner's price or page. */
export function toPublicTour(t: GolfpaqTour): PublicTour {
  const d = t.details;
  const departure = describePickup(t.pickup);
  if (d?.departureTime) departure.time = d.departureTime;
  if (d && departure.lunch === "not_included" && d.lunchIncluded) departure.lunch = "included";
  return {
    id: t.id, date: t.date, course: t.course, pickup: t.pickup, departure, perPersonYen: t.perPersonYen, seats: t.seats, capacity: t.capacity,
    ...(t.imageUrl ? { imageUrl: t.imageUrl } : {}),
    ...(d?.features ? { highlights: d.features.replace(/\*?別途昼食代がかかります。?|ランチは別料金となります。各自ご精算ください。?/g, "").trim() } : {}),
    ...(d?.schedule ? { schedule: d.schedule } : {}),
    cartIncluded: d ? d.cartIncluded : true,
    ...(d?.notes?.length ? { notes: d.notes.filter((n) => !/暴力団|レンタルクラブは/.test(n)) } : {}),
  };
}

// ---- fetching -------------------------------------------------------------------

/** One public calendar listing tells us how far ahead this partner currently sells. */
export function publishedDatesFromIndex(html: string): string[] {
  const dates = [...html.matchAll(/\/booking\/plan\/index\/(\d{4})\/(\d{1,2})\/(\d{1,2})(?=[\s"'?#<])/g)]
    .map((m) => `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`)
    .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z")));
  return [...new Set(dates)].sort();
}
async function get(url: string, timeoutMs = 12000): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw Error(`golfpaq_http_${res.status}`);
  return res.text();
}
export async function publishedSchedule(now = new Date()): Promise<{ first: string; through: string; months: string[] }> {
  const html = await get(GOLFPAQ_SOURCE + "/booking/");
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
  const html = await get(`${GOLFPAQ_SOURCE}/booking/coursecategory/1/${y}/${m}`);
  if (!html.includes("GOLFPAQ") || !html.includes("セルフプレーラウンド")) throw Error("golfpaq_month_page_changed");
  return parseGolfpaqListing(html, first, through);
}
export async function fetchGolfpaqDetail(detailUrl: string, now = new Date()): Promise<GolfpaqTourDetails> {
  if (!/^https:\/\/www\.golfpaq\.net\/booking\/plan\/show\/\d+\/\d+\/\d+$/.test(detailUrl)) throw Error("golfpaq_detail_url");
  const html = await get(detailUrl);
  if (!html.includes("GOLFPAQ")) throw Error("golfpaq_detail_changed");
  return parseGolfpaqDetail(html, now);
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
/** The tours a page may show now: fresh snapshot, dates inside the window, public fields only. */
export function publicToursFrom(snapshot: GolfpaqSnapshot | null, now = new Date()): { tours: PublicTour[]; updatedAt: string | null; through: string | null } {
  if (!snapshotIsFresh(snapshot, now.getTime())) return { tours: [], updatedAt: null, through: null };
  const first = firstPublicDay(now);
  return { tours: snapshot!.tours.filter((t) => t.date >= first && t.date <= snapshot!.through && t.seats > 0).map(toPublicTour), updatedAt: snapshot!.updatedAt, through: snapshot!.through };
}

/** Runs in the existing Cloudflare cron, at most once every three hours:
 *  the published months, then detail pages for tours we have not seen
 *  (a bounded number per run; the rest follow on the next run). A month
 *  that fails keeps nothing stale: the whole refresh is retried next time. */
export async function refreshGolfpaqSnapshot(kv?: GolfpaqKv | null, now = new Date(), opts: { force?: boolean; detailFetches?: number } = {}): Promise<GolfpaqSnapshot | null> {
  if (!kv) return null;
  const previous = await readGolfpaqSnapshot(kv);
  if (!opts.force && previous && now.getTime() - Date.parse(previous.updatedAt) < GOLFPAQ_REFRESH_MS) return previous;
  const { first, through, months } = await publishedSchedule(now);
  const tours: GolfpaqTour[] = [];
  let fetchedMonths = 0;
  const jobs = await Promise.allSettled(months.map((month) => fetchGolfpaqMonth(month, first, through)));
  for (const job of jobs) if (job.status === "fulfilled") { fetchedMonths++; tours.push(...job.value); }
  if (fetchedMonths !== months.length) throw Error("golfpaq_refresh_incomplete");
  const unique = [...new Map(tours.map((t) => [t.id, t])).values()].sort((a, b) => a.date.localeCompare(b.date) || a.perPersonYen - b.perPersonYen);
  // Details: cached per tour for two weeks; new ones fetched a few at a time.
  let budget = opts.detailFetches ?? DETAIL_FETCHES_PER_RUN, pending = 0;
  for (const t of unique) {
    let cached: GolfpaqTourDetails | null = null;
    try { cached = await kv.get(GOLFPAQ_DETAIL_PREFIX + t.id, "json") as GolfpaqTourDetails | null; } catch { cached = null; }
    if (cached && typeof cached.fetchedAt === "string") { t.details = cached; continue; }
    if (budget <= 0) { pending++; continue; }
    budget--;
    try {
      const d = await fetchGolfpaqDetail(t.detailUrl, now);
      t.details = d;
      await kv.put(GOLFPAQ_DETAIL_PREFIX + t.id, JSON.stringify(d), { expirationTtl: DETAIL_TTL_SEC });
    } catch (err) { pending++; console.error("golfpaq detail:", t.id, err instanceof Error ? err.message : err); }
  }
  const snapshot: GolfpaqSnapshot = { updatedAt: now.toISOString(), first, through, tours: unique, months, fetchedMonths, failedMonths: 0, detailsPending: pending };
  await kv.put(GOLFPAQ_SNAPSHOT_KEY, JSON.stringify(snapshot), { expirationTtl: 48 * 3600 });
  return snapshot;
}

/** Whether the shared-bus pages are shown at all: staging always, production only when switched on. */
export const golfpaqVisible = (env: { KH_ENV?: string; GOLFPAQ_LIVE?: string } | null | undefined) => env?.KH_ENV === "staging" || env?.GOLFPAQ_LIVE === "true";
