import { ArrowRight } from "lucide-react";
import { supportCopy } from "@/lib/support";
import type { Lang } from "@/lib/i18n";

/** The travel-support banner on experience pages: a photo, the message that
 *  KAMEHAME JAPAN handles the rest of the trip (babysitting, interpreter
 *  guide, transfers, planning), and a link to the index. It sits under the
 *  overview; the booking box stays the page's main action. */
export function SupportBanner({ lang, place = "mid" }: { lang: Lang; place?: "mid" | "end" }) {
  const S = supportCopy(lang);
  // A new tab: the guest keeps the experience page (and any half-filled request) open.
  return (
    <a className={`support-banner sb-${place}`} href={`/${lang}/support/`} target="_blank" rel="noopener">
      <span className="sb-photo" aria-hidden="true"><img src="/images/support-banner.webp" alt="" loading="lazy" decoding="async" /></span>
      <span className="sb-copy">
        <small className="sb-kicker">{S.banner.kicker}</small>
        <b>{S.banner.title}</b>
        <span className="sb-body">{S.banner.body}</span>
      </span>
      <span className="sb-cta">{S.banner.cta} <ArrowRight size={15} /></span>
    </a>
  );
}
