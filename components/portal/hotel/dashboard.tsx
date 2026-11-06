"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { Card, Loading, Notice, PeriodPicker, Stat, periodQuery } from "../ui";

interface Dash {
  period: { from: string; to: string }; updatedAt: string;
  funnel: { accesses: number; visits: number; provisional: number; confirmed: number; paid: number; fullyRefunded: number; cancelled: number; estimatedCommissionNet: number };
  confirmed: { count: number; baseNet: number; commissionNet: number; commissionTaxRef: number };
  balance: { unpaidNet: number; unpaidTaxRef: number; paid: number };
}

export function HotelDashboard() {
  const { hotel } = usePortal();
  const D = t().dashboard;
  const [period, setPeriod] = useState<{ period?: string; from?: string; to?: string }>({ period: "this_month" });
  const [loaded, setLoaded] = useState<{ key: string; value: Dash } | null>(null), [err, setErr] = useState<string | null>(null);
  const key = `${hotel?.id ?? ""}|${periodQuery(period)}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    api<Dash>("GET", `hotel/dashboard?hotel=${hotel.id}&${periodQuery(period)}`).then((value) => { if (live) setLoaded({ key, value }); }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, [hotel, period, key]);
  const data = loaded?.key === key ? loaded.value : null;
  if (err) return <Notice tone="bad">{err}</Notice>;
  return (
    <>
      <Card title={D.title(hotel?.name ?? "")} actions={<PeriodPicker value={period} onChange={setPeriod} />}>
        {!data ? <Loading /> : (
          <>
            <p className="pt-small pt-muted">{D.period(data.period.from, data.period.to, jst(data.updatedAt))}</p>
            <h3 className="pt-section-h">{D.funnel}</h3>
            <div className="pt-grid">
              <Stat label={D.accesses} value={data.funnel.accesses} note={D.accessesNote} />
              <Stat label={D.visits} value={data.funnel.visits} note={D.visitsNote} />
              <Stat label={D.provisional} value={data.funnel.provisional} note={D.provisionalNote} />
              <Stat label={D.confirmed} value={data.funnel.confirmed} />
              <Stat label={D.paid} value={data.funnel.paid} note={D.fullyRefunded(data.funnel.fullyRefunded)} />
              <Stat label={D.cancelled} value={data.funnel.cancelled} />
              <Stat label={D.estimated} value={yen(data.funnel.estimatedCommissionNet)} note={D.estimatedNote} tone="muted" />
            </div>
            <h3 className="pt-section-h">{D.confirmedH}</h3>
            <div className="pt-grid">
              <Stat label={D.performed} value={data.confirmed.count} note={D.performedNote} tone="accent" />
              <Stat label={D.baseNet} value={yen(data.confirmed.baseNet)} />
              <Stat label={D.commissionNet} value={yen(data.confirmed.commissionNet)} note={D.taxRef(yen(data.confirmed.commissionNet + data.confirmed.commissionTaxRef))} tone="accent" />
              <Stat label={D.unpaid} value={yen(data.balance.unpaidNet)} note={D.unpaidNote(yen(data.balance.unpaidNet + data.balance.unpaidTaxRef))} />
              <Stat label={D.paidOut} value={yen(data.balance.paid)} note={D.paidOutNote} />
            </div>
            <p className="pt-note-box">{D.note}</p>
          </>
        )}
      </Card>
    </>
  );
}
