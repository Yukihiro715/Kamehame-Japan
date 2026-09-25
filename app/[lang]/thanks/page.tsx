import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { ThanksView } from "@/components/site/thanks-view";
import { isLang, LANGS, t } from "@/lib/i18n";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

/** Reached only after sending a request: kept out of the index. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: `${t(lang).thanks.h} | KAMEHAME JAPAN`, robots: { index: false, follow: false } };
}

export default async function ThanksPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <main className="subpage thanks-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <ThanksView lang={lang} />
      <SiteFooter lang={lang} />
    </main>
  );
}
