import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/site/breadcrumb";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { BookingFacts } from "@/components/site/experience-facts";
import { Gallery } from "@/components/site/gallery";
import { HeroCarousel } from "@/components/site/hero-carousel";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { StickyRequestBar } from "@/components/site/sticky-request-bar";
import { SupportBanner } from "@/components/site/support-banner";
import { terraceCopy, terraceName, terracePath, terracePhotoPaths, terraceSlug } from "@/lib/bamboo-sky-terrace";
import { CONTACT_EMAIL } from "@/lib/contact";
import { isLang, langHome, LANGS, t } from "@/lib/i18n";
import { SITE_NAME, socialMeta, withAlternates } from "@/lib/seo";

interface Props { params: Promise<{ lang: string }> }

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = terraceCopy[lang];
  return withAlternates(
    socialMeta({ lang, title: `${terraceName} · ${copy.kyoto} | ${SITE_NAME}`, description: copy.lead, path: terracePath(lang), image: terracePhotoPaths[0] }),
    Object.fromEntries(LANGS.map((locale) => [locale, terracePath(locale)])),
  );
}

export default async function BambooSkyTerracePage({ params }: Props) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const copy = terraceCopy[lang];
  const T = t(lang);
  const D = T.detail;
  const photos = terracePhotoPaths.map((img, index) => ({ img, alt: copy.photoAlt[index] }));
  const flow = [
    { title: copy.send, body: copy.prompt },
    { title: copy.review, body: copy.reviewBody },
    { title: copy.confirm, body: copy.confirmBody },
  ];

  return (
    <main className="subpage detail-page xp xp2" lang={lang}>
      <SiteHeader variant="solid" lang={lang} />
      <Breadcrumbs trail={[
        { label: T.home, href: langHome(lang) },
        { label: copy.kyoto, href: `/${lang}/kyoto/` },
        { label: terraceName },
      ]} />

      <header className="xp-head"><h1>{terraceName}</h1></header>
      <section className="xp-mv" aria-label={D.gallery}>
        <div className="xp-hero-photo"><HeroCarousel photos={photos} lang={lang} /></div>
        <Gallery photos={photos} lang={lang} />
        <ul className="xp-conditions">
          <li><MapPin size={14} aria-hidden="true" /> {copy.area}</li>
          <li><Clock3 size={14} aria-hidden="true" /> {copy.hours}</li>
          <li><Users size={14} aria-hidden="true" /> {copy.capacity}</li>
        </ul>
      </section>

      <div className="xp-cols">
        <aside className="xp-side">
          <div className="bk-card" id="booking">
            <div className="bk-price"><b className="bk-quote-heading">{D.priceOnRequest}</b><small>{copy.capacity}</small></div>
            <a className="bk-cta" href="#request-form">{copy.quote}<ArrowRight size={16} aria-hidden="true" /></a>
            <ul className="bk-trust"><li><ShieldCheck size={14} aria-hidden="true" /> {D.noPaymentNow}</li></ul>
          </div>
        </aside>

        <div className="xp-main">
          <BookingFacts facts={copy.facts.map(([name, value]) => ({ name, value }))} lang={lang} />
          <section className="xp-section" id="overview">
            <h2>{D.overviewH}</h2>
            <p className="xp-lede">{copy.lead}</p>
          </section>
          <section className="xp-section" id="pricing">
            <h2>{D.pricingH}</h2>
            <p className="xp-lede">{copy.pricing}</p>
          </section>

          <SupportBanner lang={lang} />
          <section className="xp-section">
            <h2>{D.includedH}</h2>
            <div className="xp-included">
              <div><ul className="check-list"><li><span className="tick" aria-hidden="true">✓</span><span>{copy.included}</span></li></ul></div>
              <div>
                <h3>{D.notIncludedH}</h3>
                <ul className="check-list muted"><li><span className="tick" aria-hidden="true">—</span><span>{copy.catering}</span></li></ul>
              </div>
            </div>
          </section>

          <section className="xp-section xp-request" id="request">
            <h2>{D.flowH}</h2>
            <ol className="xp-flow">
              {flow.map((step, index) => <li key={step.title}><span>{index + 1}</span><div><b>{step.title}</b><p>{step.body}</p></div></li>)}
            </ol>
            <h3 className="xp-cancel-h">{D.cancellationH}</h3>
            <p className="xp-cancel">{copy.cancellation}</p>
            <h3 id="request-form">{copy.quote}</h3>
            <EnquiryForm kind="guest" lang={lang} fallbackEmail={CONTACT_EMAIL} experience={{ slug: terraceSlug, title: terraceName }} />
          </section>
          <SupportBanner lang={lang} place="end" />
        </div>
      </div>

      <StickyRequestBar price={D.priceOnRequest} condition={copy.capacity} label={copy.quote} lang={lang} watchHero="#booking" watchTarget="#request-form" />
      <SiteFooter lang={lang} />
    </main>
  );
}
