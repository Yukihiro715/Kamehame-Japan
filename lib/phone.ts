// Phone numbers for WhatsApp. Guests type a national number next to a
// country-code select; the form sends one international number ("+81 90 1234
// 5678" → "+819012345678"). The same normaliser runs on the server so what
// reaches the ledger, Slack and the mail is always in that shape when it can
// be, and the raw text when it cannot.

export interface DialCountry {
  /** ISO 3166-1 alpha-2, upper case. */
  iso: string;
  /** Country calling code without the plus. */
  dial: string;
  /** English name; the form shows the viewer's language via Intl.DisplayNames. */
  name: string;
}

// Countries whose guests we see or expect, by calling code. Not every country
// in the world: a guest elsewhere can type the full number with "+".
export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: "JP", dial: "81", name: "Japan" },
  { iso: "US", dial: "1", name: "United States" },
  { iso: "CA", dial: "1", name: "Canada" },
  { iso: "GB", dial: "44", name: "United Kingdom" },
  { iso: "IE", dial: "353", name: "Ireland" },
  { iso: "AU", dial: "61", name: "Australia" },
  { iso: "NZ", dial: "64", name: "New Zealand" },
  { iso: "SG", dial: "65", name: "Singapore" },
  { iso: "HK", dial: "852", name: "Hong Kong" },
  { iso: "MO", dial: "853", name: "Macao" },
  { iso: "TW", dial: "886", name: "Taiwan" },
  { iso: "KR", dial: "82", name: "South Korea" },
  { iso: "CN", dial: "86", name: "China" },
  { iso: "TH", dial: "66", name: "Thailand" },
  { iso: "MY", dial: "60", name: "Malaysia" },
  { iso: "ID", dial: "62", name: "Indonesia" },
  { iso: "PH", dial: "63", name: "Philippines" },
  { iso: "VN", dial: "84", name: "Vietnam" },
  { iso: "IN", dial: "91", name: "India" },
  { iso: "AE", dial: "971", name: "United Arab Emirates" },
  { iso: "SA", dial: "966", name: "Saudi Arabia" },
  { iso: "QA", dial: "974", name: "Qatar" },
  { iso: "IL", dial: "972", name: "Israel" },
  { iso: "TR", dial: "90", name: "Türkiye" },
  { iso: "ZA", dial: "27", name: "South Africa" },
  { iso: "EG", dial: "20", name: "Egypt" },
  { iso: "MA", dial: "212", name: "Morocco" },
  { iso: "FR", dial: "33", name: "France" },
  { iso: "BE", dial: "32", name: "Belgium" },
  { iso: "CH", dial: "41", name: "Switzerland" },
  { iso: "LU", dial: "352", name: "Luxembourg" },
  { iso: "MC", dial: "377", name: "Monaco" },
  { iso: "DE", dial: "49", name: "Germany" },
  { iso: "AT", dial: "43", name: "Austria" },
  { iso: "NL", dial: "31", name: "Netherlands" },
  { iso: "ES", dial: "34", name: "Spain" },
  { iso: "PT", dial: "351", name: "Portugal" },
  { iso: "IT", dial: "39", name: "Italy" },
  { iso: "GR", dial: "30", name: "Greece" },
  { iso: "DK", dial: "45", name: "Denmark" },
  { iso: "SE", dial: "46", name: "Sweden" },
  { iso: "NO", dial: "47", name: "Norway" },
  { iso: "FI", dial: "358", name: "Finland" },
  { iso: "IS", dial: "354", name: "Iceland" },
  { iso: "PL", dial: "48", name: "Poland" },
  { iso: "CZ", dial: "420", name: "Czechia" },
  { iso: "HU", dial: "36", name: "Hungary" },
  { iso: "RO", dial: "40", name: "Romania" },
  { iso: "UA", dial: "380", name: "Ukraine" },
  { iso: "MX", dial: "52", name: "Mexico" },
  { iso: "BR", dial: "55", name: "Brazil" },
  { iso: "AR", dial: "54", name: "Argentina" },
  { iso: "CL", dial: "56", name: "Chile" },
  { iso: "CO", dial: "57", name: "Colombia" },
  { iso: "PE", dial: "51", name: "Peru" },
  { iso: "UY", dial: "598", name: "Uruguay" },
  { iso: "CR", dial: "506", name: "Costa Rica" },
  { iso: "PA", dial: "507", name: "Panama" },
  { iso: "DO", dial: "1", name: "Dominican Republic" },
  { iso: "PR", dial: "1", name: "Puerto Rico" },
];

/** Countries shown at the top of the select for a site language. */
export const PREFERRED_BY_LANG: Record<string, string[]> = {
  en: ["US", "GB", "AU", "CA", "SG", "HK", "NZ", "IE", "IN", "AE"],
  ja: ["JP", "US", "TW", "HK", "SG", "KR"],
  es: ["ES", "MX", "AR", "CO", "CL", "PE", "US"],
  fr: ["FR", "BE", "CH", "CA", "LU", "MC"],
  "zh-tw": ["TW", "HK", "SG", "MO", "MY", "US"],
};

/** The country pre-selected for a site language ("" = let the guest choose). */
export const DEFAULT_BY_LANG: Record<string, string> = { ja: "JP", es: "ES", fr: "FR", "zh-tw": "TW", en: "" };

export function countryByIso(iso: string): DialCountry | undefined {
  return DIAL_COUNTRIES.find((c) => c.iso === iso.toUpperCase());
}

/** Spaces, dots, dashes and brackets removed; a "00" prefix becomes "+". */
export function stripPhone(raw: string): string {
  let s = (raw ?? "").trim().replace(/[\s().\-‐-―ー－/]/g, "");
  // Full-width digits and plus from Japanese keyboards.
  s = s.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xff10 + 48)).replace(/＋/g, "+");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  return s;
}

/** True for a plausible international number: "+" and 7 to 15 digits. */
export function isE164(s: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(s);
}

/**
 * One international number from a country code and a national number. A
 * single trunk "0" is dropped (090… → +81 90…, 07700… → +44 7700…), except
 * for Italy where the 0 is part of the number. A national part that already
 * starts with "+" is taken as the whole number and the country is ignored.
 * Returns "" when there is nothing to send.
 */
export function composePhone(dial: string, national: string): string {
  const nat = stripPhone(national);
  if (!nat) return "";
  if (nat.startsWith("+")) return nat;
  if (!dial) return nat;
  const digits = nat.replace(/\D/g, "");
  if (!digits) return "";
  const body = dial !== "39" && digits.length > 1 && digits.startsWith("0") ? digits.slice(1) : digits;
  return `+${dial}${body}`;
}

/**
 * Server-side shape: a valid international number is returned in E.164
 * ("+819012345678"); anything else comes back stripped but otherwise as
 * typed, so staff still see what the guest wrote.
 */
export function normalizePhone(raw: string): { value: string; valid: boolean } {
  const s = stripPhone(raw);
  if (!s) return { value: "", valid: false };
  return { value: s, valid: isE164(s) };
}

/** "+819012345678" → "+81 9012345678": the country code set apart, the rest
 *  as one block (national grouping differs by country, so none is imposed). */
export function formatPhone(e164: string): string {
  if (!isE164(e164)) return e164;
  const c = [...DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((k) => e164.startsWith(`+${k.dial}`));
  const dial = c?.dial ?? e164.slice(1, 2);
  return `+${dial} ${e164.slice(1 + dial.length)}`;
}
