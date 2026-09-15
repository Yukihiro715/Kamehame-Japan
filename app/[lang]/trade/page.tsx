import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { mailto, TRADE_EMAIL } from "@/lib/contact";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const T = t(lang);
  return withAlternates(
    socialMeta({ lang, title: `${T.tradeH} | KAMEHAME JAPAN`, description: T.tradeLead, path: `/${lang}/trade/` }),
    { en: "/en/trade/", es: "/es/trade/", ja: "/ja/trade/" },
  );
}

export default async function TradePage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);

  const enquiry = mailto(TRADE_EMAIL, "Trade enquiry — KAMEHAME JAPAN", [
    ...T.tradeAsk.map((line) => `- ${line}: `),
    "",
  ]);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: T.tradeH }]} />

      <div className="prose-layout">
        <article className="detail-main">
          <h1>{T.tradeH}</h1>
          <p className="detail-tagline">{T.tradeLead}</p>

          <section>
            <h2>{T.tradeWhatH}</h2>
            <ul className="check-list">
              {T.tradeWhat.map((item) => <li key={item}><Check size={15} /> <span>{item}</span></li>)}
            </ul>
          </section>

          <section>
            <h2>{T.tradeTermsH}</h2>
            <ul className="check-list">
              {T.tradeTerms.map((item) => <li key={item}><Check size={15} /> <span>{item}</span></li>)}
            </ul>
          </section>

          <section>
            <h2>{T.tradeAskH}</h2>
            <ul className="know-list">
              {T.tradeAsk.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>

          <section className="trade-cta-block">
            <a className="contact-cta" href={enquiry}>{T.tradeCta} <ArrowRight size={15} /></a>
            <span className="contact-address">{TRADE_EMAIL}</span>
            <p>{T.tradeNote}</p>
          </section>
        </article>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
