import { attributionNote } from "@/lib/attribution";
// The booking ledger (a Google Sheet) gets a row for every enquiry.
//
// The sheet is owned by the team and edited by hand, so the Worker never
// touches it directly: it posts one JSON record to a small Apps Script web
// app bound to the sheet (docs/ledger-apps-script.gs), and that script
// appends the rows in the sheet's own layout. The web app URL is the
// LEDGER_WEBHOOK_URL var or secret; without it, nothing is sent. Best
// effort: a failure is logged and never holds up the visitor.

import { catalogFor } from "@/lib/catalog";
import type { Enquiry } from "@/lib/contact";
import type { TranslatedField } from "@/lib/translate";

/** The site-wide tiers, used when an experience sets none of its own. */
const DEFAULT_FREE_UNTIL_DAYS = 7;

const CATEGORY_JA: Record<string, string> = {
  golf: "プライベートゴルフ", geisha: "京都芸妓・舞妓", calligraphy: "漢字・書道", "tea-ceremony": "茶道", ramen: "料理・グルメ", food: "料理・グルメ", kendo: "剣道・武道",
};

export interface LedgerRecord {
  requestId?: string;
  attribution?: Enquiry["attribution"];
  receivedAt: string;
  kind: Enquiry["kind"];
  name: string;
  email: string;
  phone?: string;
  lang: string;
  experienceSlug?: string;
  experienceTitle?: string;
  category: string;
  area?: string;
  areaId?: string;
  courseMode?: string;
  course?: string;
  dates?: string;
  experienceDate?: string;
  departure?: string;
  party?: string;
  pickup?: string;
  pickupJa?: string;
  level?: string;
  rental?: string;
  shoes?: string;
  clubs?: string;
  clubsJa?: string;
  addons?: string;
  plan?: string;
  interpreter?: string;
  estimate?: string;
  priceNote?: string;
  message?: string;
  messageJa?: string;
  company?: string;
  country?: string;
  freeCancelUntil?: string;
  partner?: string;
  ackSent: boolean;
  followUpScheduled: boolean;
}

/** "2026-11-16 07:00" → ["2026-11-16", "07:00"]; free text stays whole. */
function splitDates(dates?: string): [string | undefined, string | undefined] {
  const m = dates?.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(.*))?$/);
  return m ? [m[1], m[2]?.trim() || undefined] : [undefined, undefined];
}

function freeCancelUntil(experienceDate: string | undefined, tiers: { until: number; rate: number }[] | undefined): string | undefined {
  if (!experienceDate) return undefined;
  const free = tiers?.find((t) => t.rate === 0);
  const days = free ? free.until : DEFAULT_FREE_UNTIL_DAYS;
  // Calendar arithmetic only: the date is a Japan calendar day, 18:00 JST.
  const d = new Date(`${experienceDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return `${d.toISOString().slice(0, 10)} 18:00`;
}

export function ledgerRecord(e: Enquiry, ja: Partial<Record<TranslatedField, string>>, status: { ackSent: boolean; followUpScheduled: boolean }): LedgerRecord {
  const x = e.experience ? catalogFor("ja").experiences.find((v) => v.slug === e.experience) : undefined;
  const [experienceDate, departure] = splitDates(e.dates);
  const now = new Date(Date.now() + 9 * 3600_000); // JST
  const receivedAt = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)}`;
  return {
    receivedAt,
    requestId: e.requestId,
    attribution: e.attribution,
    kind: e.kind,
    name: e.name,
    email: e.email,
    phone: e.whatsapp,
    lang: e.lang,
    experienceSlug: e.experience,
    experienceTitle: x?.title,
    category: e.kind === "trade" ? "取引先" : (x && CATEGORY_JA[x.category]) || x?.title || "その他",
    area: e.areaId ? x?.variants?.find((v) => v.id === e.areaId)?.short ?? e.area : e.area,
    areaId: e.areaId,
    courseMode: e.courseMode,
    course: e.course,
    dates: e.dates,
    experienceDate,
    departure,
    party: e.party,
    pickup: e.pickup,
    pickupJa: ja.pickup,
    level: e.level,
    rental: e.rental,
    shoes: e.shoes,
    clubs: e.clubs,
    clubsJa: ja.clubs,
    addons: e.addons,
    plan: e.plan,
    interpreter: e.interpreter,
    estimate: e.estimate,
    priceNote: e.priceNote,
    message: [e.message, `申込ID: ${e.requestId || "未取得"}`, e.referralHotel && `紹介元ホテル: ${e.referralHotel}`, attributionNote(e.attribution)].filter(Boolean).join("\n"),
    messageJa: ja.message,
    company: e.company,
    country: e.country,
    freeCancelUntil: freeCancelUntil(experienceDate, x?.cancellationTiers),
    partner: e.areaId ? "Rion Japan" : undefined,
    ackSent: status.ackSent,
    followUpScheduled: status.followUpScheduled,
  };
}

/** Posts the record; never throws, never waits more than a few seconds. */
export async function postToLedger(url: string | undefined, record: LedgerRecord): Promise<boolean> {
  if (!url || !/^https:\/\/script\.google\.com\//.test(url)) return false;
  try {
    const res = await Promise.race([
      fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(record), redirect: "follow" }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    if (!res) { console.error("ledger: timed out"); return false; }
    if (!res.ok) { console.error("ledger: answered", res.status, (await res.text()).slice(0, 200)); return false; }
    return true;
  } catch (err) {
    console.error("ledger: failed", err);
    return false;
  }
}
