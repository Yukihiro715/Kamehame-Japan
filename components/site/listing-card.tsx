import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { ListingItem } from "@/lib/collections";
import { RatingSummary } from "@/components/site/reviews";
import { t, type Lang } from "@/lib/i18n";

export function ListingCard({ item, lang = "en" }: { item: ListingItem; lang?: Lang }) {
  const T = t(lang);
  return (
    <Link className="listing-card" href={item.href}>
      <div className="listing-art">
        <img src={item.img} alt={item.alt} loading="lazy" />
      </div>
      <div className="listing-copy">
        <p className="listing-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</p>
        <h3>{item.title}</h3>
        {item.kind === "experience" && <RatingSummary experience={item.slug} lang={lang} size={12} />}
        <p className="listing-line">{item.line}</p>
        <div className="listing-meta">
          <span><Clock3 size={14} /> {item.meta}</span>
          <span>{T.from} <b>{item.price}</b>{item.kind === "experience" ? ` ${item.unit === "group" ? T.perGroupShort : T.perPerson}` : ""}</span>
        </div>
      </div>
    </Link>
  );
}
