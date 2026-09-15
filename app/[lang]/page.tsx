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
  ja: {
    title: "KAMEHAME JAPAN | 訪日外国人向けの文化体験",
    description: "東京と京都の職人・師のもとで行う少人数の文化体験を、通訳ガイド同行で海外のお客様にご提供しています。",
  },
  fr: {
    title: "KAMEHAME JAPAN | Expériences culturelles authentiques",
    description: "Des expériences culturelles privées à Tokyo et Kyoto, menées par des maîtres japonais avec un guide-interprète à vos côtés.",
  },
  "zh-tw": {
    title: "KAMEHAME JAPAN | 道地的文化體驗",
    description: "東京與京都的私人文化體驗，由日本職人親自帶領，口譯導遊全程陪同。",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const meta = META[lang];
  return withAlternates(
    socialMeta({ lang, ...meta, path: lang === "en" ? "/" : `/${lang}/` }),
    { en: "/", es: "/es/", ja: "/ja/", fr: "/fr/", "zh-tw": "/zh-tw/" },
  );
}

export default async function LangHome({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomePage lang={lang} />;
}
