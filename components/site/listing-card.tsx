import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { ListingItem } from "@/lib/collections";

export function ListingCard({ item }: { item: ListingItem }) {
  return (
    <Link className="listing-card" href={item.href}>
      <div className="listing-art">
        <img src={item.img} alt={item.alt} loading="lazy" />
      </div>
      <div className="listing-copy">
        <p className="listing-tags">{item.tags.map((t) => <span key={t}>{t}</span>)}</p>
        <h3>{item.title}</h3>
        <p className="listing-line">{item.line}</p>
        <div className="listing-meta">
          <span><Clock3 size={14} /> {item.meta}</span>
          <span>from <b>{item.price}</b>{item.kind === "experience" ? " / person" : ""}</span>
        </div>
      </div>
    </Link>
  );
}
