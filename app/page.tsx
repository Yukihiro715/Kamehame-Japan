import type { Metadata } from "next";
import { HomePage } from "@/components/site/home-page";
import { socialMeta, withAlternates } from "@/lib/seo";

export const metadata: Metadata = withAlternates(
  socialMeta({
    lang: "en",
    title: "KAMEHAME JAPAN | Authentic cultural experiences",
    description:
      "Private cultural experiences in Tokyo and Kyoto, led by Japanese masters with an interpreter guide by your side.",
    path: "/",
  }),
  { en: "/", es: "/es/", ja: "/ja/", fr: "/fr/", "zh-tw": "/zh-tw/" },
);

export default function Home() {
  return <HomePage lang="en" />;
}
