import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { QuoteView } from "@/components/site/quote-view";
import { CONTACT_EMAIL } from "@/lib/contact";
import { isLang } from "@/lib/i18n";
import { customerFiles, quoteByToken } from "@/lib/portal/cases";
import { referralDb } from "@/lib/referral/attach";

interface Props { params: Promise<{ lang: string; token: string }> }
const H: Record<string, string> = { en: "Your quote", ja: "お見積もり", es: "Su presupuesto", fr: "Votre devis", "zh-tw": "您的報價" };

/** Reached only from the link a partner or operations hand the customer: never indexed. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${H[lang] ?? H.en} | KAMEHAME JAPAN`, robots: { index: false, follow: false, noarchive: true } };
}

export default async function QuotePage({ params }: Props) {
  const { lang, token } = await params;
  if (!isLang(lang)) notFound();
  let env: Record<string, unknown> | null = null;
  try { env = (await import("cloudflare:workers")).env as Record<string, unknown>; } catch { env = null; }
  const db = referralDb(env as { DB?: unknown } | null);
  if (!db) notFound();
  const view = await quoteByToken(db, token);
  if (!view) notFound();
  const files = view.state === "void" ? [] : await customerFiles(db, token);
  return (
    <main className="subpage detail-page xp2 quote-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <div className="prose-layout">
        <article className="detail-main">
          <h1>{H[lang] ?? H.en}</h1>
          <QuoteView v={view} files={files} token={token} contactEmail={CONTACT_EMAIL} />
        </article>
      </div>
      <SiteFooter lang={lang} />
    </main>
  );
}
