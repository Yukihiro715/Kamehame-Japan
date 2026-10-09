"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Mail, MapPin, Receipt } from "lucide-react";
import { track } from "@/lib/analytics";
import { acceptedExplicitly } from "@/lib/consent";
import { CONTACT_EMAIL } from "@/lib/contact";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { yen } from "@/lib/pricing";

interface Lookup { ok: boolean; paid?: boolean; amount?: number; currency?: string; email?: string; error?: string; items?: { name: string; quantity: number; amount: number }[]; reference?: string }

/** Where a Stripe payment link sends the guest after paying. Stripe only
 *  redirects on success; the lookup confirms it and supplies the real amount.
 *  Without a confirmed lookup the page still thanks the guest but reports nothing.
 *  The "booking_paid" conversion fires once per checkout session. */
export function BookedView({ lang }: { lang: Lang }) {
  const K = t(lang).booked;
  const [amount, setAmount] = useState<string>();
  // Rendered as "confirmed" only once a checkout session id is seen in the
  // browser. Without one (a crawler, a shared link, a typed URL) the page
  // explains what it is instead of announcing a payment that did not happen.
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // The head script moves session_id out of the URL before any tag loads.
    // (and, for this document only, into window.khCheckoutSession when storage is blocked).
    let id = params.get("session_id") ?? "";
    const w = window as unknown as { khCheckoutSession?: string };
    if (!id && w.khCheckoutSession) { id = w.khCheckoutSession; delete w.khCheckoutSession; }
    if (!id) { try { id = sessionStorage.getItem("kh-checkout-session") ?? ""; } catch { /* storage blocked */ } }

    // One redirect URL serves every language: send the guest to their own.
    if (lang === "en" && !params.has("stay")) {
      const pref = (navigator.languages ?? [navigator.language]).map((l) => l.toLowerCase());
      const match = pref.map((l) => (l.startsWith("zh-tw") || l.startsWith("zh-hant") ? "zh-tw" : l.slice(0, 2)))
        .find((l) => l !== "en" && (LANGS as readonly string[]).includes(l));
      // The id rides along only as far as the next page's head script, which strips it again.
      if (match) { const q = new URLSearchParams(window.location.search); if (id) q.set("session_id", id); const qs = q.toString(); window.location.replace(`/${match}/booked/${qs ? `?${qs}` : ""}`); return; }
    }
    if (!/^cs_(test|live)_/.test(id)) return;

    let cancelled = false;
    (async () => {
      // A well-formed session id is enough to show the confirmation; the
      // lookup below only adds the amount and reports the conversion.
      setConfirmed(true);
      let data: Lookup = { ok: false };
      try { data = (await (await fetch(`/api/booking?session_id=${encodeURIComponent(id)}${acceptedExplicitly() ? "&email=1" : ""}`)).json()) as Lookup; } catch { /* offline */ }
      if (cancelled) return;
      if (data.ok && typeof data.amount === "number") setAmount(data.currency === "JPY" || !data.currency ? yen(data.amount) : `${data.amount} ${data.currency}`);
      // Only a payment Stripe confirms as paid counts: a made-up or mistyped
      // session_id must never become a conversion.
      if (!data.ok || !data.paid) return;
      const flag = `kh-paid-${id}`;
      try { if (localStorage.getItem(flag)) return; localStorage.setItem(flag, "1"); } catch { /* private mode */ }
      const paid = {
        transaction_id: id,
        value: data.amount,
        currency: data.currency ?? "JPY",
        user_data: data.email ? { email: data.email.trim().toLowerCase() } : undefined,
        language: lang,
      };
      track("booking_paid", paid);
      // GA4 e-commerce shape of the same payment: one item per payment-link
      // product, so the areas (named in the Stripe product) can be told apart.
      track("purchase", {
        ...paid,
        booking_reference: data.reference,
        items: (data.items ?? []).map((it) => ({ item_name: it.name, quantity: it.quantity, price: it.amount })),
      });
    })();
    return () => { cancelled = true; };
  }, [lang]);

  if (!confirmed) {
    return (
      <div className="thanks">
        <div className="thanks-head">
          <h1>{K.noSessionH}</h1>
          <p>{K.noSession(CONTACT_EMAIL)}</p>
        </div>
        <div className="thanks-actions">
          <Link className="thanks-btn primary" href={`/${lang}/experiences/`}>{K.browse} <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

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
