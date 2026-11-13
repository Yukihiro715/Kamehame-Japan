"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardPlus, MapPin, QrCode } from "lucide-react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { partnerAccess } from "../partner-access";
import { Button, Card, Loading, Notice, PeriodPicker, Stat, periodQuery } from "../ui";

interface Dash {
  period: { from: string; to: string }; updatedAt: string;
  funnel: { accesses: number; visits: number; provisional: number; confirmed: number; paid: number; fullyRefunded: number; cancelled: number; estimatedCommissionNet: number };
  confirmed: { count: number; baseNet: number; commissionNet: number; commissionTaxRef: number };
  balance: { unpaidNet: number; unpaidTaxRef: number; paid: number };
}

export function HotelDashboard() {
  const { hotel, me, lang } = usePortal();
  const D = t().dashboard, en = lang === "en", access = partnerAccess(hotel, me.memberships);
  const [period, setPeriod] = useState<{ period?: string; from?: string; to?: string }>({ period: "this_month" });
  const [loaded, setLoaded] = useState<{ key: string; value: Dash } | null>(null), [err, setErr] = useState<{ key: string; text: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = `${hotel?.id ?? ""}|${periodQuery(period)}|${retry}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    api<Dash>("GET", `hotel/dashboard?hotel=${hotel.id}&${periodQuery(period)}`).then((value) => { if (live) setLoaded({ key, value }); }).catch((e) => { if (live) setErr({ key, text: errorText(e) }); });
    return () => { live = false; };
  }, [hotel, period, key]);
  const data = loaded?.key === key ? loaded.value : null;
  const bookingLink = data ? `/hotel/reservations/?from=${data.period.from}&to=${data.period.to}` : "/hotel/reservations/";
  return <>
    <div className="pt-quick-actions">
      <Link href="/hotel/experiences/"><MapPin size={21}/><span><b>{en ? "Find an experience" : "体験を探す"}</b><small>{en ? "Compare prices and referral terms" : "料金・紹介条件から選ぶ"}</small></span><ArrowRight size={18}/></Link>
      {access.cases && <Link href="/hotel/cases/new/"><ClipboardPlus size={21}/><span><b>{en ? "New booking request" : "予約・相談を登録"}</b><small>{en ? "We check availability and prepare a quote" : "空き確認・見積もりを運営に依頼"}</small></span><ArrowRight size={18}/></Link>}
      {access.refer && <Link href="/hotel/materials/"><QrCode size={21}/><span><b>{en ? "Share a referral link" : "QR・紹介リンクを共有"}</b><small>{en ? "For your guests, website and front desk" : "お客様への案内・館内掲示に"}</small></span><ArrowRight size={18}/></Link>}
    </div>
    <div className="pt-period-bar"><span className="pt-small pt-muted">{en ? "Reporting period · JST" : "集計期間 · 日本時間"}</span><PeriodPicker value={period} onChange={setPeriod}/></div>
    {err?.key === key ? <><Notice tone="bad">{err.text}</Notice><Button kind="secondary" onClick={() => setRetry((v) => v + 1)}>{en ? "Try again" : "再読み込み"}</Button></> : !data ? <Loading/> : <>
      <div className="pt-kpis">
        <Stat label={en ? "Confirmed commission (excl. tax)" : "確定紹介料（税抜）"} value={yen(data.confirmed.commissionNet)} note={`${D.performedNote} · ${D.taxRef(yen(data.confirmed.commissionNet + data.confirmed.commissionTaxRef))}`} tone="accent" href={access.settlement ? "/hotel/settlement/" : undefined}/>
        <Stat label={D.confirmed} value={data.funnel.confirmed} note={D.provisionalNote} href={bookingLink}/>
        <Stat label={en ? "Completed experiences" : "実施確認済み"} value={data.confirmed.count} note={D.performedNote} href="/hotel/reservations/"/>
        <Stat label={en ? "Current unpaid commission (excl. tax)" : "現在の未払紹介料（税抜）"} value={yen(data.balance.unpaidNet)} note={en ? "All periods · See statements for payment amounts" : "全期間の残高 · 振込額は精算書で確認"} href={access.settlement ? "/hotel/settlement/" : undefined}/>
      </div>
      <div className="pt-dashboard-columns">
        <Card title={D.funnel} actions={<Link className="pt-inline-link" href={bookingLink}>{en ? "View bookings" : "紹介予約を見る"}<ArrowRight size={15}/></Link>}>
          <dl className="pt-metric-list">
            {[[D.accesses, data.funnel.accesses, D.accessesNote], [D.visits, data.funnel.visits, D.visitsNote], [D.provisional, data.funnel.provisional, D.provisionalNote], [D.paid, data.funnel.paid, D.fullyRefunded(data.funnel.fullyRefunded)], [D.cancelled, data.funnel.cancelled, ""]].map(([name, value, note]) => <div key={String(name)}><dt>{name}<small>{note}</small></dt><dd>{Number(value).toLocaleString()}</dd></div>)}
          </dl>
        </Card>
        <Card title={en ? "Commission overview" : "紹介料の内訳"}>
          <div className="pt-commission-estimate"><span>{D.estimated}</span><strong>{yen(data.funnel.estimatedCommissionNet)}</strong><small>{D.estimatedNote} · {en ? "All periods" : "全期間"}</small></div>
          <dl className="pt-metric-list"><div><dt>{D.baseNet}</dt><dd>{yen(data.confirmed.baseNet)}</dd></div><div><dt>{D.paidOut}<small>{D.paidOutNote}</small></dt><dd>{yen(data.balance.paid)}</dd></div></dl>
          <p className="pt-note-box">{D.note}</p>
        </Card>
      </div>
      <p className="pt-small pt-muted">{D.period(data.period.from, data.period.to, jst(data.updatedAt))}</p>
    </>}
  </>;
}
