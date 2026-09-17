import Link from "next/link";
import { Brand } from "@/components/site/brand";
import { FooterLanguages } from "@/components/site/language-switcher";
import { ConsentBanner, ConsentSettingsLink } from "@/components/site/consent-banner";
import { catalogFor } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

export function SiteFooter({ lang = "en" }: { lang?: Lang }) {
  const T = t(lang);
  const { cities } = catalogFor(lang);
  return (
    <footer className="site-footer-block">
      <Brand lang={lang} />
      <div className="footer-links">
        {cities.map((c) => <Link key={c.slug} href={`/${lang}/${c.slug}/`}>{c.title}</Link>)}
        <Link href={`/${lang}/experiences/`}>{T.navExperiences}</Link>
        <Link href={`/${lang}/about/`}>{T.footerAbout}</Link>
        <Link href={`/${lang}/faq/`}>{T.navFaq}</Link>
        <Link href={`/${lang}/journal/`}>{T.journalH}</Link>
        <Link href={`/${lang}/contact/`}>{T.contactH}</Link>
        <Link href={`/${lang}/trade/`}>{T.contactTradeCta}</Link>
        <Link href={`/${lang}/privacy/`}>{T.footerPrivacy}</Link>
        <Link href={`/${lang}/legal/`}>{T.footerLegal}</Link>
        <Link href={`/${lang}/terms/`}>{T.footerTerms}</Link>
        <ConsentSettingsLink lang={lang} />
      </div>
      <div className="footer-meta"><p>{T.footerOperated}</p><p>© 2026 KAMEHAME JAPAN</p></div>
      <FooterLanguages lang={lang} />
      <Link className="partner-link" href="/partners/">体験パートナー募集 →</Link>
      <details className="photo-credits">
        <summary>Photo credits</summary>
        <p>
          Photography via <a href="https://commons.wikimedia.org/" rel="noreferrer">Wikimedia Commons</a>, used under CC BY / CC BY-SA / CC0 / public-domain licenses:
          Zairon (Sensō-ji) · Basile Morin (Yasaka-dōri, Fushimi Inari) · Bobby.Creations (omakase counter) · tjabeljan (sumo stable) ·
          Japanexperterna.se (maiko dance) · Yanay Rosen (sushi chef) · Simon Q (dohyō-iri) · Ermell (tea ceremony) · KuboBella (serving tea) ·
          Maiko &amp; Geiko (maiko) · Rama (katana) · ElHeineken (Akihabara) · Erol Ahmed (bamboo grove) · H.Hmoderato (kimono garden) ·
          The Metropolitan Museum of Art (kimono). Geiko-evening photographs courtesy of the host venue. Full attribution in IMAGE_CREDITS.md.
        </p>
      </details>
      <ConsentBanner lang={lang} />
    </footer>
  );
}
