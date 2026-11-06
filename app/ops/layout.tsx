import type { Metadata } from "next";
import "../portal.css";

/** The operations portal for the hotel referral programme (docs/HOTEL_REFERRAL.md).
 *  Japanese only, never indexed; every page fetches what the signed-in operator may do. */
export const metadata: Metadata = {
  title: "運営画面 | KAMEHAME JAPAN",
  robots: { index: false, follow: false, noarchive: true },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <div lang="ja">{children}</div>;
}
