import type { Metadata } from "next";
import "../portal.css";

/** The hotel partner portal (docs/HOTEL_REFERRAL.md). Japanese only, never
 *  indexed, nothing hotel-specific in the HTML: every page signs in through
 *  the portal API and fetches what the signed-in user may see. */
export const metadata: Metadata = {
  title: "ホテル向け紹介管理 | KAMEHAME JAPAN",
  robots: { index: false, follow: false, noarchive: true },
};

export default function HotelLayout({ children }: { children: React.ReactNode }) {
  return <div lang="ja">{children}</div>;
}
