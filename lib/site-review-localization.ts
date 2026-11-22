import type { Review } from "./reviews";

export interface SiteReviewEnvelope { iv: string; ciphertext: string }

const DOMAIN = "kamehame/review-localization/v1";
const LOCALES = ["ja", "es", "fr", "zh-tw"] as const;
const encoder = new TextEncoder();
const unbase64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));

/** Use only after the original text and consent are verified. The locator
 * remains internal to the private store; only the localized copy is returned. */
export async function openSiteReviewLocalizations(
  envelope: SiteReviewEnvelope, privateLocator: string, approvedBodyDigest: string,
): Promise<Review["i18n"]> {
  try {
    const iv = unbase64(envelope.iv);
    const sealed = unbase64(envelope.ciphertext);
    if (iv.length !== 12 || sealed.length < 17 || sealed.length > 24000) return undefined;
    const material = await crypto.subtle.digest("SHA-256", encoder.encode(DOMAIN + "\0" + privateLocator));
    const key = await crypto.subtle.importKey("raw", material, "AES-GCM", false, ["decrypt"]);
    const bytes = await crypto.subtle.decrypt({
      name: "AES-GCM", iv, additionalData: encoder.encode(DOMAIN + "\0" + approvedBodyDigest),
    }, key, sealed);
    const data: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).length !== LOCALES.length) return undefined;
    const copy: NonNullable<Review["i18n"]> = {};
    for (const lang of LOCALES) {
      if (!Object.hasOwn(data, lang)) return undefined;
      const body = (data as Record<string, unknown>)[lang];
      if (typeof body !== "string" || !body.trim() || body.length > 4000) return undefined;
      copy[lang] = { body };
    }
    return copy;
  } catch {
    // Invalid payload or unavailable crypto: intact original still renders.
    return undefined;
  }
}
