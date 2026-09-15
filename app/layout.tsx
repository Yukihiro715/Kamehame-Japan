import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/catalog";
import { socialMeta } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  ...socialMeta({
    lang: "en",
    title: "KAMEHAME JAPAN | Authentic cultural experiences",
    description:
      "Private cultural experiences in Tokyo and Kyoto, led by Japanese masters with an interpreter guide by your side.",
    path: "/",
  }),
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
