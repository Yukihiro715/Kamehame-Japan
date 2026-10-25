import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VariantDetail } from "@/components/site/variant-detail";
import { ClubRentalProvider } from "@/components/site/club-rental-context";
import { catalogFor } from "@/lib/catalog";
import { isLang, type Lang } from "@/lib/i18n";

// The golf page with the chosen-model club rental option switched on
// (lib/golf-club-rental.ts), for the owner's review (2026-10-25). Unlisted:
// noindex, not in the sitemap, listings or navigation. The live golf page is
// unchanged until the option is approved. `?lang=ja` shows another language.

export const metadata: Metadata = {
  title: "Golf club rental option — preview | KAMEHAME JAPAN",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function GolfClubRentalPreview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const raw = Array.isArray(q.lang) ? q.lang[0] : q.lang;
  const lang: Lang = raw && isLang(raw) ? raw : "en";
  const exp = catalogFor(lang).experiences.find((e) => e.slug === "mt-fuji-golf-day");
  if (!exp?.variants) notFound();
  return (
    <ClubRentalProvider enabled>
      <VariantDetail exp={exp} lang={lang} clubRental />
    </ClubRentalProvider>
  );
}
