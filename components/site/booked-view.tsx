"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, MapPin, Receipt } from "lucide-react";
import { track } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/contact";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { yen } from "@/lib/pricing";

interface Lookup { ok: boolean; paid?: boolean; amount?: number; currency?: string; email?: string; error?: string }

/** Where a Stripe payment link sends the guest after paying. Stripe only
 *  redirects on success; the lookup confirms it and supplies the real amount.
 *  Without a confirmed lookup the page still thanks the guest but reports nothing.
 *  The "booking_paid" conversion fires once per checkout session. */
export function BookedView({ lang }: { lang: Lang }) {
  const K = t(lang).booked;
  const [amount, setAmount] = useState<string>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id") ?? "";

    // One redirect URL serves every language: send the guest to their own.
    if (lang === "en" && !params.has("stay")) {
      const pref = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase());
      const match = pref.map((l) => (l.startsWith("zh-tw") || l.startsWith("zh-hant") ? "zh-tw" : l.slice(0, 2)))
        .find((l) => l !== "en" && (LANGS as readonly string[]).includes(l));
      if (match) { window.location.replace(`/${match}/booked/${window.location.search}`); return; }
    }
    if (!/^cs_(test|live)_/.test(id)) return;

    let cancelled = false;
    (async () => {
      let data: Lookup = { ok: false };
      try { data = (await (await fetch(`/api/booking?session_id=${encodeURIComponent(id)}`)).json()) as Lookup; } catch { /* offline */ }
      if (cancelled) return;
      if (data.ok && typeof data.amount === "number") setAmount(data.currency === "JPY" || !data.currency ? yen(data.amount) : `${data.amount} ${data.currency}`);
      // Only a payment Stripe confirms as paid counts: a made-up or mistyped
      // session_id must never become a conversion.
      if (!data.ok || !data.paid) return;
      const flag = `kh-paid-${id}`;
      try { if (localStorage.getItem(flag)) return; localStorage.setItem(flag, "1"); } catch { /* private mode */ }
      track("booking_paid", {
        transaction_id: id,
        value: data.amount,
        currency: data.currency ?? "JPY",
        user_data: data.email ? { email: data.email.trim().toLowerCase() } : undefined,
        language: lang,
      });
    })();
    return () => { cancelled = true; };
  }, [lang]);

  return (
    <div className="thanks">
      <div className="thanks-head">
        <span className="thanks-check" aria-hidden="true"><Check size={34} strokeWidth={3} /></span>
        <h1>{K.h}</h1>
        <p>{amount ? K.leadAmount(amount) : K.lead}</p>
      </div>
      <section className="thanks-card">
        <h2>{K.nextH}</h2>
        <ol className="thanks-steps">
          <li><Receipt size={18} /><span>{K.stepReceipt}</span></li>
          <li><MapPin size={18} /><span>{K.stepConfirm}</span></li>
          <li><Mail size={18} /><span>{K.stepHelp(CONTACT_EMAIL)}</span></li>
        </ol>
      </section>
      <div className="thanks-actions">
        <Link className="thanks-btn primary" href={`/${lang}/journal/`}>{K.read} <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
