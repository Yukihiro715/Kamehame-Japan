/** What the home page needs beyond the catalog: the "Popular right now"
 *  order (lib/popular.ts, from the demand ledger when it is reachable) and
 *  whether the golf cards should open the golf landing. Shared by "/" and
 *  "/{lang}/" so both render the same page. */
import type { Experience } from "./catalog";
import { golfpaqEnabled } from "./golfpaq-env";
import type { Lang } from "./i18n";
import { popularExperiences } from "./popular";
import { d1Db, isD1Like } from "./referral/db";

export async function homeData(lang: Lang): Promise<{ popular: Experience[]; golfLanding: boolean }> {
  let db = null;
  try { const { env } = await import("cloudflare:workers"); const e = env as { DB?: unknown }; db = isD1Like(e.DB) ? d1Db(e.DB) : null; } catch { db = null; }
  const [popular, golfLanding] = await Promise.all([popularExperiences(db, lang), golfpaqEnabled()]);
  return { popular, golfLanding };
}
