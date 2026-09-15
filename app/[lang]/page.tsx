import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/site/home-page";
import { isLang, LANGS, type Lang } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const META: Record<Lang, { title: string; description: string }> = {
  en: {
    title: "KAMEHAME JAPAN | Authentic cultural experiences",
    description: "Private cultural experiences in Tokyo and Kyoto, led by Japanese masters with an interpreter guide by your side.",
  },
  es: {
    title: "KAMEHAME JAPAN | Experiencias culturales auténticas",
    description: "Experiencias culturales privadas en Tokio y Kioto, dirigidas por maestros japoneses con un guía intérprete a tu lado.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const meta = META[lang];
  return withAlternates(
    socialMeta({ lang, ...meta, path: lang === "en" ? "/" : `/${lang}/` }),
    { en: "/", es: "/es/" },
  );
}

export default async function LangHome({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomePage lang={lang} />;
}
