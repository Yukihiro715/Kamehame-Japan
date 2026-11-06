/** Partner sites: what kind of partner a legal entity is, what kind of site a
 *  row in `hotels` is, and which features the site may use. Type and features
 *  are independent: a hotel may relay bookings, an agency may only refer links
 *  (docs/PARTNER_PLATFORM_STAGE1.md 4.1). */
import type { SqlDb } from "@/lib/referral/db";
import { ApiError } from "./util";

export type PartnerType = "hotel" | "agency" | "guide" | "other";
export type EntityKind = "company" | "individual";
export type SiteKind = "hotel" | "branch" | "guide" | "other";
export type FeatureKey = "refer" | "cases" | "settlement" | "members";
export type Features = Record<FeatureKey, boolean>;

export const PARTNER_TYPES: PartnerType[] = ["hotel", "agency", "guide", "other"];
export const ENTITY_KINDS: EntityKind[] = ["company", "individual"];
export const SITE_KINDS: SiteKind[] = ["hotel", "branch", "guide", "other"];
export const FEATURE_KEYS: FeatureKey[] = ["refer", "cases", "settlement", "members"];
export const PARTNER_TYPE_JA: Record<PartnerType, string> = { hotel: "ホテル", agency: "旅行代理店", guide: "ガイド", other: "その他" };
export const ENTITY_KIND_JA: Record<EntityKind, string> = { company: "法人", individual: "個人" };
export const SITE_KIND_JA: Record<SiteKind, string> = { hotel: "施設", branch: "支店・拠点", guide: "ガイド本人", other: "その他" };
export const FEATURE_JA: Record<FeatureKey, string> = { refer: "リンク紹介", cases: "予約取り次ぎ", settlement: "精算閲覧・確認", members: "メンバー管理" };

export const DEFAULT_FEATURES: Features = { refer: true, cases: false, settlement: true, members: false };

export function parseFeatures(json: string | null | undefined): Features {
  try {
    const v = json ? JSON.parse(json) as Partial<Record<FeatureKey, unknown>> : {};
    return Object.fromEntries(FEATURE_KEYS.map((k) => [k, k in v ? v[k] === true : DEFAULT_FEATURES[k]])) as Features;
  } catch { return { ...DEFAULT_FEATURES }; }
}
export const featuresJson = (f: Partial<Features>) => JSON.stringify(Object.fromEntries(FEATURE_KEYS.map((k) => [k, f[k] === true])));

/** The site's features, or null when the site does not exist. */
export async function siteFeatures(db: SqlDb, siteId: string): Promise<Features | null> {
  const row = await db.first<{ features_json: string | null }>(`SELECT features_json FROM hotels WHERE id = ?`, [siteId]);
  return row ? parseFeatures(row.features_json) : null;
}

/** 403 `feature_off` unless the site may use the feature (checked on the server, never from the browser). */
export async function requireFeature(db: SqlDb, siteId: string, key: FeatureKey): Promise<Features> {
  const f = await siteFeatures(db, siteId);
  if (!f) throw new ApiError(404, "not_found");
  if (!f[key]) throw new ApiError(403, "feature_off", `${FEATURE_JA[key]}はこの拠点では使えません`);
  return f;
}

export const partnerTypeOf = (v: unknown): PartnerType => (PARTNER_TYPES as string[]).includes(String(v)) ? v as PartnerType : "hotel";
export const entityKindOf = (v: unknown): EntityKind => v === "individual" ? "individual" : "company";
export const siteKindOf = (v: unknown, fallback: SiteKind = "hotel"): SiteKind => (SITE_KINDS as string[]).includes(String(v)) ? v as SiteKind : fallback;
/** The site kind that fits a partner type when none is given. */
export const siteKindFor = (t: PartnerType): SiteKind => t === "hotel" ? "hotel" : t === "guide" ? "guide" : t === "agency" ? "branch" : "other";
