import Link from "next/link";
import { ArrowRight, Baby } from "lucide-react";
import { supportCopy } from "@/lib/support";
import type { Lang } from "@/lib/i18n";

/** A low, wide link from an experience page to the travel-support index, for
 *  guests who want childcare while they are at the experience. It sits under
 *  the overview, never near the booking button, and stays one line tall on a
 *  phone. */
export function SupportBanner({ lang }: { lang: Lang }) {
  const S = supportCopy(lang);
  return (
    <Link className="support-banner" href={`/${lang}/support/`}>
      <span className="sb-icon" aria-hidden="true"><Baby size={18} /></span>
      <span className="sb-copy">
        <b>{S.banner.title}</b>
        <small>{S.banner.body}</small>
      </span>
      <span className="sb-cta">{S.banner.cta} <ArrowRight size={14} /></span>
    </Link>
  );
}
