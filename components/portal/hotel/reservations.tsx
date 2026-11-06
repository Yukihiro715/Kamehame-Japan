"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, pct, yen } from "../client";
import { label, t } from "../i18n";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice, Table } from "../ui";

interface Row { hotelRef: string; createdAt: string; experience: string; experienceDate: string | null; guests: number | null; status: string; paymentStatus: string; baseNet: number | null; rateBp: number | null; commissionNet: number | null; commissionGrossRef: number | null; entryStatus: string | null; holdCodes: string[]; performedOn: string | null }

const tone = (s: string | null) => (s === "confirmed" || s === "adjusted" ? "ok" : s === "pending" ? "warn" : s === "voided" ? "bad" : "neutral");
const EMPTY = { from: "", to: "", experienceFrom: "", experienceTo: "", status: "", ref: "" };

export function HotelReservations() {
  const { hotel } = usePortal();
  const R = t().reservations, S = t().status, C = t().common;
  const [f, setF] = useState(EMPTY);
  const [loaded, setLoaded] = useState<{ key: string; value: { rows: Row[]; total: number } } | null>(null), [err, setErr] = useState<string | null>(null);
  const [applied, setApplied] = useState(f);
  const key = `${hotel?.id ?? ""}|${JSON.stringify(applied)}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    const qs = Object.entries(applied).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    api<{ rows: Row[]; total: number }>("GET", `hotel/reservations?hotel=${hotel.id}&limit=200${qs ? `&${qs}` : ""}`).then((value) => { if (live) setLoaded({ key, value }); }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, [hotel, applied, key]);
  const data = loaded?.key === key ? loaded.value : null;
  if (err) return <Notice tone="bad">{err}</Notice>;
  return (
    <Card title={R.title}>
      <div className="pt-form">
        <label className="pt-field"><span className="pt-field-l">{R.from}</span><input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.to}</span><input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.xFrom}</span><input type="date" value={f.experienceFrom} onChange={(e) => setF({ ...f, experienceFrom: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.xTo}</span><input type="date" value={f.experienceTo} onChange={(e) => setF({ ...f, experienceTo: e.target.value })} /></label>
        <label className="pt-field"><span className="pt-field-l">{R.status}</span>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">{C.all}</option>{Object.entries(S.reservation).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <label className="pt-field"><span className="pt-field-l">{R.ref}</span><input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="R-XXXXXX" /></label>
        <div className="pt-row"><Button onClick={() => setApplied({ ...f })}>{C.search}</Button><Button kind="link" onClick={() => { setF(EMPTY); setApplied(EMPTY); }}>{C.clear}</Button></div>
      </div>
      {!data ? <Loading /> : (
        <>
          <p className="pt-small pt-muted">{C.items(data.total)} · {R.note}</p>
          <Table
            head={R.head}
            rows={data.rows.map((r) => [
              <code key="r">{r.hotelRef}</code>, jst(r.createdAt, false), r.experience, r.experienceDate ?? "—", r.guests ?? "—",
              <Badge key="s" tone={r.status === "completed" || r.status === "confirmed" ? "ok" : r.status === "cancelled" || r.status === "no_show" ? "bad" : "neutral"}>{label(S.reservation, r.status)}</Badge>,
              <Badge key="p" tone={r.paymentStatus === "paid" ? "ok" : r.paymentStatus === "unpaid" ? "neutral" : "warn"}>{label(S.payment, r.paymentStatus)}</Badge>,
              yen(r.baseNet), pct(r.rateBp), yen(r.commissionNet), yen(r.commissionGrossRef),
              <span key="e"><Badge tone={tone(r.entryStatus)}>{label(S.entry, r.entryStatus)}</Badge>{r.holdCodes.length > 0 && <small className="pt-muted"> {r.holdCodes.map((h) => label(S.hold, h)).join(", ")}</small>}{r.entryStatus === "estimated" && <small className="pt-muted"> {S.estimatedNote}</small>}</span>,
            ])}
          />
        </>
      )}
    </Card>
  );
}
