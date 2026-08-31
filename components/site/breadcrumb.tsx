import Link from "next/link";
import { SITE_ORIGIN } from "@/lib/catalog";

export interface Crumb { label: string; href?: string }

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.label,
      ...(c.href ? { item: `${SITE_ORIGIN}${c.href}` } : {}),
    })),
  };
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((c, i) => (
        <span key={c.label}>
          {i > 0 && <span className="crumb-sep" aria-hidden="true">›</span>}
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
        </span>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </nav>
  );
}
