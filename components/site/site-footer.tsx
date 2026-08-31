import Link from "next/link";
import { Brand } from "@/components/site/brand";

export function SiteFooter() {
  return (
    <footer>
      <Brand />
      <div className="footer-links">
        <Link href="/en/tokyo/">Tokyo</Link>
        <Link href="/en/kyoto/">Kyoto</Link>
        <Link href="/en/experiences/">Experiences</Link>
        <Link href="/en/tours/">Tours</Link>
        <Link href="/#approach">About</Link>
      </div>
      <div className="footer-meta"><p>Operated by Prosent Inc. with our tour operations partner.</p><p>© 2026 OMOTENASHI JAPAN</p></div>
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
