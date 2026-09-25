"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock3, CreditCard, Mail } from "lucide-react";
import { track } from "@/lib/analytics";
import { CONTACT_EMAIL } from "@/lib/contact";
import { t, type Lang } from "@/lib/i18n";

/** What the request form hands over to this page (sessionStorage, one read). */
export interface SentEnquiry {
  kind: "guest" | "trade";
  email?: string;
  experienceTitle?: string;
  experienceUrl?: string;
  dates?: string;
  guests?: string;
  estimate?: string;
  /** The enquiry_sent event, pushed here so the conversion fires on this page. */
  event: Record<string, unknown>;
}

export const SENT_KEY = "kh-enquiry-sent";

/** The confirmation after a request. It reads what the form stored, fires the
 *  conversion once (then forgets it, so a reload never counts twice), and
 *  says plainly that the request arrived and what happens next. */
export function ThanksView({ lang }: { lang: Lang }) {
  const T = t(lang);
  const K = T.thanks;
  const [sent, setSent] = useState<SentEnquiry | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SENT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(SENT_KEY);
      const s = JSON.parse(raw) as SentEnquiry;
      track("enquiry_sent", s.event);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the previous page
      setSent(s);
    } catch { /* storage blocked: the generic message below still applies */ }
  }, []);

  const trade = sent?.kind === "trade";
  const rows = sent ? [
    [K.experience, sent.experienceTitle],
    [K.dates, sent.dates],
    [K.guests, sent.guests],
    [K.estimate, sent.estimate],
  ].filter((r): r is [string, string] => !!r[1]) : [];

  return (
    <div className="thanks">
      <div className="thanks-head">
        <span className="thanks-check" aria-hidden="true"><Check size={34} strokeWidth={3} /></span>
        <h1>{K.h}</h1>
        <p>{sent?.email ? K.leadEmail(sent.email) : K.lead}</p>
      </div>

      {rows.length > 0 && (
        <section className="thanks-card">
          <h2>{K.summaryH}</h2>
          <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </section>
      )}

      <section className="thanks-card">
        <h2>{K.nextH}</h2>
        <ol className="thanks-steps">
          <li><Clock3 size={18} /><span>{trade ? K.stepReplyTrade : K.stepReply}</span></li>
          {!trade && <li><CreditCard size={18} /><span>{K.stepPay}</span></li>}
          <li><Mail size={18} /><span>{K.stepSpam(CONTACT_EMAIL)}</span></li>
        </ol>
      </section>

      <div className="thanks-actions">
        {sent?.experienceUrl && <Link className="thanks-btn" href={sent.experienceUrl}>{K.backToExperience}</Link>}
        <Link className="thanks-btn primary" href={`/${lang}/experiences/`}>{K.browse} <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
