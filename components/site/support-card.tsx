import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supportCopy, type SupportService } from "@/lib/support";
import type { Lang } from "@/lib/i18n";

/** One travel-support service in the same card as an experience listing
 *  (components/site/listing-card.tsx): one photo, the category line, the
 *  title and the facts. A service that is not open yet keeps the card but
 *  loses the link and wears the "Coming soon" badge, so nothing leads to a
 *  form that does not exist. */
export function SupportCard({ service, lang, eager = false }: { service: SupportService; lang: Lang; eager?: boolean }) {
  const S = supportCopy(lang);
  const c = S.services[service.slug];
  const href = `/${lang}/support/${service.slug}/`;
  const photo = <img src={service.img} alt={c.alt} loading={eager ? "eager" : "lazy"} decoding="async" draggable={false} />;
  return (
    <article className={`lc lc-grid sc${service.live ? "" : " is-soon"}`}>
      <div className="lc-media">
        {service.live
          ? <Link className="lc-photos" href={href} aria-label={c.title} tabIndex={-1}><div className="lc-slide">{photo}</div></Link>
          : <div className="lc-photos"><div className="lc-slide">{photo}</div></div>}
        {!service.live && <span className="soon-badge">{S.comingSoon}</span>}
      </div>
      <div className="lc-body">
        <p className="lc-cat"><span>{S.category}</span></p>
        <h3 className="lc-title">{service.live ? <Link href={href}>{c.title}</Link> : <span>{c.title}</span>}</h3>
        <p className="sc-line">{c.line}</p>
        <p className="lc-facts">{c.facts.map((f) => <span key={f}>{f}</span>)}</p>
        {service.live && <span className="sc-go">{S.baby.card.cta} <ArrowRight size={14} /></span>}
      </div>
    </article>
  );
}
