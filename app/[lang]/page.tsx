import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/site/home-page";
import { isLang, LANGS } from "@/lib/i18n";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const META: Record<string, Metadata> = {
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
  const meta = META[lang];
  if (!meta) return {};
  return { ...meta, alternates: { languages: { en: "/", es: "/es/" } } };
}

export default async function LangHome({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomePage lang={lang} />;
}
