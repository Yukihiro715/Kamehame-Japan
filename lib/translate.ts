// Japanese translations of what a visitor typed, for the team's notification.
//
// Runs on Workers AI (the AI binding, model m2m100) inside the Worker, so no
// key or outside service is involved and the visitor's text stays on
// Cloudflare. Best effort: a missing binding, a timeout or an error leaves the
// field untranslated and the notification says so. Never translates Japanese.

import type { Enquiry } from "@/lib/contact";

type Ai = { run(model: string, input: Record<string, unknown>): Promise<unknown> };

const MODEL = "@cf/meta/m2m100-1.2b";
const SOURCE: Record<string, string> = { en: "english", es: "spanish", fr: "french", "zh-tw": "chinese" };

/** The fields whose text the visitor wrote or that the page composed in its
 *  own language. Golf choices that arrive as keys are rendered in Japanese
 *  directly (lib/notification.ts) and are not translated here. */
export const TRANSLATED_FIELDS = ["message", "clubs", "pickup", "course", "plan", "addons", "interpreter", "dates", "party", "level", "rental", "estimate"] as const;
export type TranslatedField = (typeof TRANSLATED_FIELDS)[number];

async function translateOne(ai: Ai, text: string, source: string): Promise<string | undefined> {
  const run = ai.run(MODEL, { text, source_lang: source, target_lang: "japanese" }) as Promise<{ translated_text?: string }>;
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 8000));
  try {
    const out = await Promise.race([run, timeout]);
    const ja = out?.translated_text?.trim();
    return ja && ja !== text ? ja : undefined;
  } catch (err) {
    console.error("translate: failed", err);
    return undefined;
  }
}

/** Japanese versions of the visitor's text fields, keyed by field. Fields
 *  that are empty, already Japanese, or purely numeric are skipped. */
export async function translateForTeam(ai: Ai | undefined, e: Enquiry): Promise<Partial<Record<TranslatedField, string>>> {
  const source = SOURCE[e.lang];
  if (!ai || !source) return {};
  const jobs = TRANSLATED_FIELDS.flatMap((f) => {
    // Golf choices with keys are already said in Japanese by the notification.
    if ((f === "level" && e.levelKey) || (f === "rental" && e.rentalKeys)) return [];
    const text = e[f];
    if (!text || !/[A-Za-z\u00C0-\u024F\u4E00-\u9FFF]{2}/.test(text)) return [];
    return [translateOne(ai, text, source).then((ja) => [f, ja] as const)];
  });
  const out: Partial<Record<TranslatedField, string>> = {};
  for (const [f, ja] of await Promise.all(jobs)) if (ja) out[f] = ja;
  return out;
}
