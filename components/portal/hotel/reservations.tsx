"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, pct, yen } from "../client";
import { label, t } from "../i18n";
import { TermLabel, type HelpTerm } from "../help";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice, Table } from "../ui";

interface Row { hotelRef: string; createdAt: string; experience: string; experienceDate: string | null; guests: number | null; status: string; paymentStatus: string; baseNet: number | null; rateBp: number | null; commissionNet: number | null; commissionGrossRef: number | null; entryStatus: string | null; holdCodes: string[]; performedOn: string | null }

const tone = (s: string | null) => (s === "confirmed" || s === "adjusted" ? "ok" : s === "pending" ? "warn" : s === "voided" ? "bad" : "neutral");
const HEADER_HELP: Record<number, HelpTerm> = { 5: "bookingStatus", 6: "payment", 7: "base", 8: "rate", 9: "commission", 10: "tax", 11: "entry" };
const EMPTY = { from: "", to: "", experienceFrom: "", experienceTo: "", status: "", ref: "" };

export function HotelReservations() {
  const { hotel, lang } = usePortal();
  const R = t().reservations, S = t().status, C = t().common;
  const [f, setF] = useState(() => {
    const query = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    return Object.fromEntries(Object.keys(EMPTY).map((k) => [k, query.get(k) ?? ""])) as typeof EMPTY;
  });
  const [page, setPage] = useState(0), [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ key: string; value: { rows: Row[]; total: number } } | null>(null), [err, setErr] = useState<{ key: string; text: string } | null>(null);
  const [applied, setApplied] = useState(f);
  const key = `${hotel?.id ?? ""}|${JSON.stringify(applied)}|${page}|${retry}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    const qs = Object.entries(applied).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api<{ rows: Row[]; total: number }>("GET", `hotel/reservations?hotel=${hotel.id}&limit=25&offset=${page * 25}${qs ? `&${qs}` : ""}`).then((value) => { if (live) { setLoaded({ key, value }); setErr(null); } }).catch((e) => { if (live) setErr({ key, text: errorText(e) }); });
    return () => { live = false; };
  }, [hotel, applied, key, page]);
  const data = loaded?.key === key ? loaded.value : null;
  return (
    <Card title={R.title}>
      <div className="pt-help-terms">{[7,8,9,11].map(i => <TermLabel key={i} label={R.head[i]} term={HEADER_HELP[i]} en={lang === "en"}/>)}</div>
      <p className="pt-note-box">{lang === "en" ? "Results and commissions for guest bookings through referral links and completed booking requests. To arrange a booking on behalf of a guest, use Bookings on behalf of guests." : "紹介リンクからのお客様の予約や、代理予約で成立した予約の実績・紹介料を確認する画面です。お客様に代わって予約を依頼する場合は「代理予約・相談」をご利用ください。"}</p>
      <div className="pt-form">
        <label className="pt-field"><span className="pt-field-l">{R.from}</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.to}</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.xFrom}</span><input type="date" value={f.experienceFrom} onChange={(e) => setF({ ...f, experienceFrom: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.xTo}</span><input type="date" value={f.experienceTo} onChange={(e) => setF({ ...f, experienceTo: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.status}</span>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">{C.all}</option>{Object.entries(S.reservation).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="pt-field"><span className="pt-field-l">{R.ref}</span><input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="R-XXXXXX" /></label>
        <div className="pt-row"><Button onClick={() => { setApplied({ ...f }); setPage(0); }}>{C.search}</Button><Button kind="link" onClick={() => { setF(EMPTY); setApplied(EMPTY); setPage(0); }}>{C.clear}</Button></div>
      </div>
      {err?.key === key ? <><Notice tone="bad">{err.text}</Notice><Button kind="secondary" onClick={() => setRetry((v) => v + 1)}>{lang === "en" ? "Try again" : "再読み込み"}</Button></> : !data ? <Loading /> : (
        <>
          <p className="pt-small pt-muted">{C.items(data.total)} · {R.note}</p>
          <div className="pt-reservation-table"><Table
            head={R.head.map((name, i) => HEADER_HELP[i] ? <TermLabel key={i} label={name} term={HEADER_HELP[i]} en={lang === "en"}/> : name)}
            rows={data.rows.map((r) => [
              <code key="r">{r.hotelRef}</code>, jst(r.createdAt, false), r.experience, r.experienceDate ?? "—", r.guests ?? "—",
              <Badge key="s" tone={r.status === "completed" || r.status === "confirmed" ? "ok" : r.status === "cancelled" || r.status === "no_show" ? "bad" : "neutral"}>{label(S.reservation, r.status)}</Badge>,
              <Badge key="p" tone={r.paymentStatus === "paid" ? "ok" : r.paymentStatus === "unpaid" ? "neutral" : "warn"}>{label(S.payment, r.paymentStatus)}</Badge>,
              yen(r.baseNet), pct(r.rateBp), yen(r.commissionNet), yen(r.commissionGrossRef),
              <span key="e"><Badge tone={tone(r.entryStatus)}>{label(S.entry, r.entryStatus)}</Badge>{r.holdCodes.length > 0 && <small className="pt-muted"> {r.holdCodes.map((h) => label(S.hold, h)).join(", ")}</small>}{r.entryStatus === "estimated" && <small className="pt-muted"> {S.estimatedNote}</small>}</span>,
            ])}
          /></div>
          <div className="pt-reservation-mobile">{data.rows.map((r) => <details className="pt-booking-summary" key={r.hotelRef}>
            <summary><span className="pt-case-reference">{r.hotelRef}</span><strong>{r.experience}</strong><span>{r.experienceDate ?? C.undecided} · {r.guests ?? "—"}{lang === "en" ? " guests" : "名"}</span><span><Badge tone={r.status === "completed" || r.status === "confirmed" ? "ok" : "neutral"}>{label(S.reservation, r.status)}</Badge> <Badge tone={tone(r.entryStatus)}>{label(S.entry, r.entryStatus)}</Badge></span><span className="pt-booking-value">{R.head[9]} <b>{yen(r.commissionNet)}</b></span><small className="pt-inline-link">{lang === "en" ? "Payment & commission details" : "決済・紹介料の詳細"}</small></summary>
            <dl className="pt-kv"><dt>{R.head[1]}</dt><dd>{jst(r.createdAt, false)}</dd><dt>{R.head[6]}</dt><dd>{label(S.payment, r.paymentStatus)}</dd><dt>{R.head[7]}</dt><dd>{yen(r.baseNet)}</dd><dt>{R.head[8]}</dt><dd>{pct(r.rateBp)}</dd><dt>{R.head[10]}</dt><dd>{yen(r.commissionGrossRef)}</dd></dl>
            {r.holdCodes.length > 0 && <p className="pt-small pt-muted">{r.holdCodes.map((h) => label(S.hold, h)).join(", ")}</p>}{r.entryStatus === "estimated" && <p className="pt-small pt-muted">{S.estimatedNote}</p>}
          </details>)}{data.rows.length === 0 && <p className="pt-empty">{C.empty}</p>}</div>
          {data.total > 25 && <div className="pt-pagination"><span>{data.total ? `${page * 25 + 1}–${page * 25 + data.rows.length} / ${data.total}` : "0"}</span><Button kind="secondary" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>{lang === "en" ? "Previous" : "前へ"}</Button><Button kind="secondary" disabled={(page + 1) * 25 >= data.total} onClick={() => setPage((v) => v + 1)}>{lang === "en" ? "Next" : "次へ"}</Button></div>}
        </>
      )}
    </Card>
  );
}
