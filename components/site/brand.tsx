import Link from "next/link";
import { langHome, type Lang } from "@/lib/i18n";

// Brand mark: 亀 (kame) inside a kikko (tortoise-shell) hexagon.
export function Brand({ lang = "en" }: { lang?: Lang }) {
  return (
    <Link className="brand" href={langHome(lang)} aria-label="KAMEHAME JAPAN home">
      <svg className="brand-mark" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <polygon points="10,3.5 26,3.5 34,18 26,32.5 10,32.5 2,18" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <text x="18" y="23.5" textAnchor="middle" fontSize="14" fontFamily="Georgia, 'Times New Roman', serif" fill="currentColor">亀</text>
      </svg>
      <span><b>KAMEHAME</b><small>JAPAN</small></span>
    </Link>
  );
}
