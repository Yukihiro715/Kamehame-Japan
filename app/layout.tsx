import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/catalog";
import { headers } from "next/headers";
import { isLang } from "@/lib/i18n";
import { GTM_ID } from "@/lib/analytics";
import { consentDefaultScript } from "@/lib/consent";
import { RouteChangeEvent } from "@/components/site/route-change-event";
import { socialMeta, SITE_NAME } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  ...socialMeta({
    lang: "en",
    title: "KAMEHAME JAPAN | Curated experiences in Japan",
    description:
      "Private cultural experiences in Tokyo and Kyoto, led by Japanese masters with an interpreter guide by your side.",
    path: "/",
  }),
  // SVG for modern browsers, .ico for older ones and crawlers that ask for
  // /favicon.ico, PNG for iOS home screens (no SVG there) and Android.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};

const gtmSnippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

// Who runs the site, in a form search engines and reputation services can
// read: the brand, the company behind it, its corporate number and address.
// The same details appear on the legal-notice page.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_ORIGIN}/#organization`,
  name: SITE_NAME,
  legalName: "Prosent Inc. (株式会社プロセント)",
  url: `${SITE_ORIGIN}/`,
  logo: `${SITE_ORIGIN}/icon-512.png`,
  email: "hello@kamehame-japan.com",
  taxID: "7010001232139",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Kachidoki 1-3-1, 43F",
    addressLocality: "Chuo-ku",
    addressRegion: "Tokyo",
    postalCode: "104-0054",
    addressCountry: "JP",
  },
  areaServed: "JP",
  sameAs: ["https://prosent.co.jp/"],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The document language follows the locale segment of the URL (/ja/, /fr/…).
  // The root layout does not receive that segment's params, so the Worker
  // passes it as a request header (worker/index.ts); pages outside a locale
  // (the root page, the partner page, 404) stay English.
  const fromHeader = (await headers()).get("x-kh-lang") ?? "";
  const lang = isLang(fromHeader) ? fromHeader : "en";
  return (
    <html lang={lang}>
      <head>
        {/* Consent Mode v2 defaults. This has to run before the container,
            or tags would load with storage already allowed. */}
        <script dangerouslySetInnerHTML={{ __html: consentDefaultScript }} />
        {/* Google Tag Manager — GA4, Ads conversions and Search Console
            verification are all configured inside the container. */}
        <script dangerouslySetInnerHTML={{ __html: gtmSnippet }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body>
        <RouteChangeEvent />
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0" width="0" style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
