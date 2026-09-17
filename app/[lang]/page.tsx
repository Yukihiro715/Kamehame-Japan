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
    title: "KAMEHAME JAPAN | Curated experiences in Japan",
    description: "The curated way to experience Japan: selected experiences with local experts, starting with a private geiko evening in Kyoto — food, craft, pop culture and more to come.",
  },
  es: {
    title: "KAMEHAME JAPAN | Experiencias seleccionadas en Japón",
    description: "La forma seleccionada de vivir Japón: experiencias elegidas con anfitriones locales, empezando por una velada privada con una geiko en Kioto — comida, oficio, cultura pop y más.",
  },
  ja: {
    title: "KAMEHAME JAPAN | 厳選した日本の体験",
    description: "厳選という日本の楽しみ方。地元の専門家がもてなす体験を、京都の芸妓・舞妓との貸切の夕べから。食・工芸・ポップカルチャーも順次。",
  },
  fr: {
    title: "KAMEHAME JAPAN | Expériences sélectionnées au Japon",
    description: "Le Japon façon sélection : des expériences choisies avec des hôtes locaux, à commencer par une soirée privée avec une geiko à Kyoto — cuisine, artisanat, pop culture et plus encore.",
  },
  "zh-tw": {
    title: "KAMEHAME JAPAN | 精選的日本體驗",
    description: "精選的日本體驗方式：與在地專家共度的精選體驗，從京都藝妓的私人晚宴開始——美食、工藝、流行文化陸續加入。",
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
