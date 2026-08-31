import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAMEHAME JAPAN | Authentic cultural experiences",
  description: "Private cultural experiences in Tokyo and Kyoto, led by Japanese masters with an interpreter guide by your side.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
