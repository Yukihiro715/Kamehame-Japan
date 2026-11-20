"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readAttribution } from "@/lib/attribution-client";
import { CONSENT_KEY } from "@/lib/consent";
import { t, type Lang } from "@/lib/i18n";

import { GOLF_ADS_CONSENT, golfPage, initGolfLanding, setGolfAdsConsent } from "@/lib/golf-ads";

const golfDisclosure: Record<Lang, string> = {
  en: "With your consent, OpenAI also measures golf enquiries and payments from ChatGPT ads.",
  ja: "同意すると、OpenAIもChatGPT広告経由のゴルフのお問い合わせ・決済を計測します。",
  es: "Con tu consentimiento, OpenAI también mide las consultas y los pagos de golf procedentes de anuncios de ChatGPT.",
  fr: "Avec votre accord, OpenAI mesure aussi les demandes et paiements de golf issus des publicités ChatGPT.",
  "zh-tw": "經您同意，OpenAI 也會衡量來自 ChatGPT 廣告的高爾夫詢問與付款。",
};

type Choice = "granted" | "denied";

function update(choice: Choice) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // Consent Mode only reads the Arguments object that gtag() pushes — a plain
  // array is ignored, which left an "Accept" without effect until the next page.
  const gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  } as (...args: unknown[]) => void;
  gtag("consent", "update", {
    ad_storage: choice, ad_user_data: choice, ad_personalization: choice, analytics_storage: choice,
  });
  // Clarity keeps its own consent state (stub defined in the head script).
  const clarity = (window as unknown as { clarity?: (...args: unknown[]) => void }).clarity;
  clarity?.("consentv2", { ad_Storage: choice, analytics_Storage: choice });
  // The Meta Pixel ignores Consent Mode; GTM only loads it with ad_storage granted.
  // If it is already running on this page, a change of mind has to reach it too.
  // (Never define window.fbq here: Meta's loader skips itself when fbq exists.)
  const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  fbq?.("consent", choice === "granted" ? "grant" : "revoke");
  w.dataLayer.push({ event: "consent_choice", consent_choice: choice });
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* private mode */ }
  setGolfAdsConsent(choice);
  readAttribution();
}

export function ConsentBanner({ lang }: { lang: Lang }) {
  const C = t(lang).consent;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch { /* private mode */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read persisted browser consent after SSR; default remains closed for hydration
    if (stored !== "granted" && stored !== "denied") setOpen(true);
    if (stored === "granted" && golfPage()) {
      try { if (!localStorage.getItem(GOLF_ADS_CONSENT)) setOpen(true); } catch { /* storage blocked */ }
    }
    initGolfLanding();
    // The footer link re-opens this from anywhere on the page.
    const onOpen = () => setOpen(true);
    window.addEventListener("kh:consent", onOpen);
    return () => window.removeEventListener("kh:consent", onOpen);
  }, []);

  if (!open) return null;

  const choose = (c: Choice) => { update(c); setOpen(false); };

  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label={C.title}>
      <div className="consent-copy">
        <b>{C.title}</b>
        <p>
          {C.body} {golfDisclosure[lang]}{" "}
          <Link href={`/${lang}/privacy/`}>{C.more}</Link>
        </p>
      </div>
      <div className="consent-actions">
        <button type="button" className="consent-btn ghost" onClick={() => choose("denied")}>{C.reject}</button>
        <button type="button" className="consent-btn" onClick={() => choose("granted")}>{C.accept}</button>
      </div>
    </div>
  );
}

/** Footer link: lets anyone change their mind later, which consent law requires. */
export function ConsentSettingsLink({ lang }: { lang: Lang }) {
  const C = t(lang).consent;
  return (
    <button type="button" className="consent-reopen" onClick={() => window.dispatchEvent(new Event("kh:consent"))}>
      {C.settings}
    </button>
  );
}
