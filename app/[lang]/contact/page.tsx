import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, Mail, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { CONTACT_EMAIL } from "@/lib/contact";
import { isLang, langHome, LANGS, t, type Lang } from "@/lib/i18n";
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
    socialMeta({ lang, title: `${T.contactH} | KAMEHAME JAPAN`, description: T.contactLead, path: `/${lang}/contact/` }),
    { en: "/en/contact/", es: "/es/contact/", ja: "/ja/contact/" },
  );
}

/** Questions we would otherwise have to ask in a reply. */
const CHECKLIST: Record<Lang, string[]> = {
  en: [
    "The dates you are in Japan, and which city",
    "How many of you, and any children's ages",
    "The experience or experiences you are drawn to",
    "Dietary needs, mobility needs, or anything else we should check with the venue",
  ],
  es: [
    "Las fechas en Japón y en qué ciudad",
    "Cuántos sois y la edad de los niños, si los hay",
    "La experiencia o experiencias que te interesan",
    "Dietas, movilidad o cualquier otra cosa que debamos consultar con el local",
  ],
  ja: [
    "日本での滞在日程と都市",
    "ご人数(お子様がいらっしゃる場合は年齢)",
    "ご関心のある体験",
    "食事制限、移動のご事情など、受け入れ先に確認すべきこと",
  ],
};

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);

  return (
    <main className="subpage detail-page" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: T.contactH }]} />

      <div className="prose-layout">
        <article className="detail-main">
          <h1>{T.contactH}</h1>
          <p className="detail-tagline">{T.contactLead}</p>

          <div className="contact-routes">
            <div className="contact-route primary">
              <Mail size={18} />
              <h2>{T.contactGuestH}</h2>
              <p>{T.contactGuestBody}</p>
              <a className="contact-cta" href="#enquiry">{T.contactGuestCta} <ArrowRight size={15} /></a>
              <span className="contact-address">{CONTACT_EMAIL}</span>
            </div>

            <div className="contact-route">
              <Briefcase size={18} />
              <h2>{T.contactTradeH}</h2>
              <p>{T.contactTradeBody}</p>
              <Link className="underlined-link" href={`/${lang}/trade/`}>{T.contactTradeCta} <ArrowRight /></Link>
            </div>

            <div className="contact-route">
              <MapPin size={18} />
              <h2>{T.contactPartnerH}</h2>
              <p>{T.contactPartnerBody}</p>
              <Link className="underlined-link" href="/partners/">{T.contactPartnerCta} <ArrowRight /></Link>
            </div>
          </div>

          <section id="enquiry">
            <h2>{T.contactGuestH}</h2>
            <EnquiryForm kind="guest" lang={lang} fallbackEmail={CONTACT_EMAIL} />
          </section>

          <section>
            <h2>{T.contactIncludeH}</h2>
            <ul className="know-list">
              {CHECKLIST[lang].map((item) => <li key={item}>{item}</li>)}
            </ul>
            <p className="contact-hours">{T.contactHours}</p>
          </section>
        </article>
      </div>

      <SiteFooter lang={lang} />
    </main>
  );
}
