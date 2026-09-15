import Link from "next/link";
import { Brand } from "@/components/site/brand";
import { FooterLanguages } from "@/components/site/language-switcher";
import { langHome, t, type Lang } from "@/lib/i18n";

export function SiteFooter({ lang = "en" }: { lang?: Lang }) {
  const T = t(lang);
  return (
    <footer>
      <Brand lang={lang} />
      <div className="footer-links">
        <Link href={`/${lang}/tokyo/`}>{T.navTokyo}</Link>
        <Link href={`/${lang}/kyoto/`}>{T.navKyoto}</Link>
        <Link href={`/${lang}/experiences/`}>{T.navExperiences}</Link>
        <Link href={`${langHome(lang)}#approach`}>{T.footerAbout}</Link>
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
          The Metropolitan Museum of Art (kimono). Full attribution in IMAGE_CREDITS.md.
        </p>
      </details>
    </footer>
  );
}
