// Japanese translations of what a visitor typed, for the team's notification.
//
// Runs on Workers AI (the AI binding) inside the Worker, so no key or outside
// service is involved and the visitor's text stays on Cloudflare. An
// instruction-tuned model is used rather than a plain translation model: it
// keeps hotel and place names as they are and reads golf terms correctly. Best effort: a missing binding, a timeout or an error leaves the
// field untranslated and the notification says so. Never translates Japanese.

import type { Enquiry } from "@/lib/contact";

type Ai = { run(model: string, input: Record<string, unknown>): Promise<unknown> };

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SOURCE: Record<string, string> = { en: "English", es: "Spanish", fr: "French", "zh-tw": "Traditional Chinese" };
const SYSTEM = "You translate short customer messages for a Japanese travel company's staff. Translate the user's text into natural Japanese. Keep names of people, hotels, places and brands as written (Latin letters are fine). Golf terms: caddie = キャディ, cart = カート, tee time = スタート時刻, rental clubs = レンタルクラブ, stiff/regular/ladies shaft = スティッフ/レギュラー/レディースシャフト. Output only the translation, nothing else.";

/** The fields whose text the visitor wrote or that the page composed in its
 *  own language. Golf choices that arrive as keys are rendered in Japanese
 *  directly (lib/notification.ts) and are not translated here. */
export const TRANSLATED_FIELDS = ["message", "clubs", "pickup", "course", "plan", "addons", "interpreter", "dates", "party", "level", "rental", "estimate"] as const;
export type TranslatedField = (typeof TRANSLATED_FIELDS)[number];

async function translateOne(ai: Ai, text: string, source: string): Promise<string | undefined> {
  const run = ai.run(MODEL, {
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Source language: ${source}\n\n${text}` },
    ],
    max_tokens: 400,
    temperature: 0.2,
  }) as Promise<{ response?: string }>;
  const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 10000));
  try {
    const out = await Promise.race([run, timeout]);
    const ja = out?.response?.trim().replace(/^["「『]|["」』]$/g, "");
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
