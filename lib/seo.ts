// Shared Open Graph / Twitter Card metadata.
//
// Social apps (WhatsApp, LINE, Instagram DM, Facebook, X) only read absolute
// image URLs, so every helper here returns fully-qualified URLs built from
// SITE_ORIGIN rather than relying on metadataBase resolution.

import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/catalog";
import type { Lang } from "@/lib/i18n";

export const SITE_NAME = "KAMEHAME JAPAN";

/** Locale codes as Open Graph expects them. */
const OG_LOCALE: Record<Lang, string> = { en: "en_US", es: "es_ES" };

/** Falls back to the branded share card when a page has no image of its own. */
const defaultImage = (lang: Lang) => (lang === "es" ? "/og-default-es.jpg" : "/og-default.jpg");

export const absolute = (path: string) => `${SITE_ORIGIN}${path}`;

export function socialMeta({
  lang, title, description, path, image, type = "website",
}: {
  lang: Lang;
  title: string;
  description: string;
  /** Site-root-relative, with trailing slash (e.g. "/es/kyoto/"). */
  path: string;
  /** Site-root-relative image; the branded card is used when omitted. */
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const url = absolute(path);
  const src = image ?? defaultImage(lang);
  const img = absolute(src);

  // Only the cards under /og (and the og-default pair) are rendered at exactly
  // 1200x630. Declaring those dimensions for a catalog photo would be a lie —
  // several are portrait — so for anything else we let the scraper measure.
  const sized = src.startsWith("/og");

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: OG_LOCALE[lang],
      images: [sized ? { url: img, width: 1200, height: 630, alt: title } : { url: img, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}

/** Merges social metadata with the hreflang map a page already declares. */
export function withAlternates(meta: Metadata, languages: Record<string, string>): Metadata {
  return {
    ...meta,
    alternates: {
      ...meta.alternates,
      languages: Object.fromEntries(
        Object.entries(languages).map(([code, p]) => [code, absolute(p)]),
      ),
    },
  };
}
