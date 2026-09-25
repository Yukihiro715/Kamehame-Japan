"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY } from "@/lib/consent";
import { t, type Lang } from "@/lib/i18n";

type Choice = "granted" | "denied";

/** Timezones that mean "probably in the EEA, the UK or Switzerland". Used
 *  only to decide whether to show the banner unprompted; the legal defaults
 *  are enforced by region inside Consent Mode, so a miss fails safe. */
function inStrictRegion() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return tz.startsWith("Europe/") || ["Atlantic/Canary", "Atlantic/Madeira", "Atlantic/Azores", "Atlantic/Reykjavik"].includes(tz);
  } catch { return false; }
}

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
  w.dataLayer.push({ event: "consent_choice", consent_choice: choice });
  try { localStorage.setItem(CONSENT_KEY, choice); } catch { /* private mode */ }
}

export function ConsentBanner({ lang }: { lang: Lang }) {
  const C = t(lang).consent;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch { /* private mode */ }
    if (stored !== "granted" && stored !== "denied" && inStrictRegion()) setOpen(true);
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
          {C.body}{" "}
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
