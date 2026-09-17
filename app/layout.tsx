import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/catalog";
import { GTM_ID } from "@/lib/analytics";
import { consentDefaultScript } from "@/lib/consent";
import { socialMeta } from "@/lib/seo";
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
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const gtmSnippet = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Consent Mode v2 defaults. This has to run before the container,
            or tags would load with storage already allowed. */}
        <script dangerouslySetInnerHTML={{ __html: consentDefaultScript }} />
        {/* Google Tag Manager — GA4, Ads conversions and Search Console
            verification are all configured inside the container. */}
        <script dangerouslySetInnerHTML={{ __html: gtmSnippet }} />
      </head>
      <body>
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
