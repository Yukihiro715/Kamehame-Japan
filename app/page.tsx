import type { Metadata } from "next";
import { HomePage } from "@/components/site/home-page";
import { socialMeta, withAlternates } from "@/lib/seo";

export const metadata: Metadata = withAlternates(
  socialMeta({
    lang: "en",
    title: "KAMEHAME JAPAN | Curated experiences in Japan",
    description:
      "The curated way to experience Japan: selected experiences with local experts, starting with a private geiko evening in Kyoto — food, craft, pop culture and more to come.",
    path: "/",
  }),
  { en: "/", es: "/es/", ja: "/ja/", fr: "/fr/", "zh-tw": "/zh-tw/" },
);

export default function Home() {
  return <HomePage lang="en" />;
}
