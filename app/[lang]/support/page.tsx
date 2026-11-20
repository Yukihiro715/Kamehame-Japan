import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { SupportCard } from "@/components/site/support-card";
import { SUPPORT_SERVICES, supportCopy } from "@/lib/support";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const S = supportCopy(lang);
  return withAlternates(
    socialMeta({ lang, title: `${S.nav} | KAMEHAME JAPAN`, description: S.lead, path: `/${lang}/support/`, image: "/images/support-babysitter.webp" }),
    Object.fromEntries(LANGS.map((l) => [l, `/${l}/support/`])),
  );
}

/** Travel support: the four services side by side, in the listing's own
 *  cards. Only babysitting links through; the rest say "Coming soon". */
export default async function SupportIndex({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const T = t(lang);
  const S = supportCopy(lang);
  return (
    <main className="subpage detail-page sp-index" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[{ label: T.home, href: langHome(lang) }, { label: S.nav }]} />
      <header className="xp-head sp-head">
        <p className="eyebrow dark"><span /> {S.eyebrow}</p>
        <h1>{S.title[0]}<br />{S.title[1]}</h1>
        <p className="xp-lede">{S.indexLead}</p>
      </header>
      <section className="sp-list" aria-label={S.nav}>
        <div className="lg-items lg-items-grid sp-grid">
          {SUPPORT_SERVICES.map((s, i) => <SupportCard key={s.slug} service={s} lang={lang} eager={i < 2} />)}
        </div>
        <p className="xp-note sp-soon-note">{S.comingSoonBody}</p>
      </section>
      <SiteFooter lang={lang} />
    </main>
  );
}
