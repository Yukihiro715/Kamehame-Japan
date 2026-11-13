"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardPlus, MapPin, QrCode } from "lucide-react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { helpText, TermLabel } from "../help";
import { partnerAccess } from "../partner-access";
import { Button, Card, Loading, Notice, PeriodPicker, Stat, periodQuery } from "../ui";

interface Dash {
  period: { from: string; to: string }; updatedAt: string; visitorCountPartial: boolean;
  funnel: { accesses: number; visits: number | null; provisional: number; confirmed: number; paid: number; fullyRefunded: number; cancelled: number; estimatedCommissionNet: number };
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
  const bookingLink = data ? `/partner/reservations/?from=${data.period.from}&to=${data.period.to}` : "/partner/reservations/";
  return <>
    <div className="pt-quick-actions">
      <Link href="/partner/experiences/"><MapPin size={21}/><span><b>{en ? "Find an experience" : "体験を探す"}</b><small>{en ? "Compare prices and referral terms" : "料金・紹介条件から選ぶ"}</small></span><ArrowRight size={18}/></Link>
      {access.cases && <Link href="/partner/cases/new/"><ClipboardPlus size={21}/><span><b>{en ? "New booking request" : "代理予約・相談を依頼"}</b><small>{en ? "We check availability and prepare a quote" : "空き確認・見積もりを運営に依頼"}</small></span><ArrowRight size={18}/></Link>}
      {access.refer && <Link href="/partner/materials/"><QrCode size={21}/><span><b>{en ? "Share a referral link" : "QR・紹介リンクを共有"}</b><small>{en ? "For your guests, website and front desk" : "お客様への案内・館内掲示に"}</small></span><ArrowRight size={18}/></Link>}
    </div>
    <div className="pt-period-bar"><span className="pt-small pt-muted">{en ? "Reporting period · JST" : "集計期間 · 日本時間"}</span><PeriodPicker value={period} onChange={setPeriod}/></div>
    {err?.key === key ? <><Notice tone="bad">{err.text}</Notice><Button kind="secondary" onClick={() => setRetry((v) => v + 1)}>{en ? "Try again" : "再読み込み"}</Button></> : !data ? <Loading/> : <>
      <div className="pt-kpis pt-kpis-five">
        <Stat label={D.visits} value={data.funnel.visits ?? "—"} note={en ? "Same browser · counted once in 7 days" : "同じブラウザは7日間で1人"} help={<><p>{helpText("visits", en)}</p>{data.visitorCountPartial && <p>{D.visitsPartial}</p>}</>}/>
        <Stat label={D.provisional} value={data.funnel.provisional} note={en ? "Awaiting confirmation · by booking date" : "予約確定待ち・予約日で集計"} href={bookingLink} help={<p>{helpText("pending", en)}</p>}/>
        <Stat label={D.confirmed} value={data.funnel.confirmed} note={en ? "Includes completed · by booking date" : "実施済みを含む・予約日で集計"} href={bookingLink} help={<p>{helpText("confirmed", en)}</p>}/>
        <Stat label={D.estimated} value={yen(data.funnel.estimatedCommissionNet)} note={en ? "Not yet performed · subject to change" : "未実施分・キャンセル等で変動"} href={bookingLink} help={<p>{helpText("estimate", en)}</p>}/>
        <Stat label={en ? "Confirmed commission (excl. tax)" : "確定紹介料（税抜）"} value={yen(data.confirmed.commissionNet)} note={en ? "Performed experiences · by performance date" : "実施済み分・実施日で集計"} tone="accent" href={`/partner/reservations/?experienceFrom=${data.period.from}&experienceTo=${data.period.to}`} help={<p>{helpText("earned", en)}</p>}/>
      </div>
      {data.visitorCountPartial && <p className="pt-small pt-muted">{D.visits}: {D.visitsPartial}</p>}
      <div className="pt-dashboard-columns">
        <Card title={D.funnel} actions={<Link className="pt-inline-link" href={bookingLink}>{en ? "View bookings" : "予約実績・紹介料を見る"}<ArrowRight size={15}/></Link>}>
          <dl className="pt-metric-list">
            {[[D.accesses, data.funnel.accesses, D.accessesNote], [D.paid, data.funnel.paid, D.fullyRefunded(data.funnel.fullyRefunded)], [D.cancelled, data.funnel.cancelled, ""]].map(([name, value, note]) => <div key={String(name)}><dt>{name === D.accesses || name === D.paid ? <TermLabel label={String(name)} term={name === D.accesses ? "opens" : "payment"} en={en}/> : name}<small>{note}</small></dt><dd>{value === null ? "—" : Number(value).toLocaleString()}</dd></div>)}
          </dl>
        </Card>
        <Card title={en ? "How to read your results" : "実績の見方"}>
          <p className="pt-small pt-muted">{en ? "Bookings and estimated commission use booking dates. Confirmed commission uses the date the experience was performed." : "仮予約中・予約確定・紹介料見込みは予約日、確定紹介料は体験の実施日を基に、選択した期間で集計します。"}</p>
          <p className="pt-note-box">{D.note}</p>
          {access.settlement && <Link className="pt-inline-link" href="/partner/settlement/">{en ? "View payment schedule & history" : "支払い予定・履歴を確認する"}<ArrowRight size={15}/></Link>}
        </Card>
      </div>
      <p className="pt-small pt-muted">{D.period(data.period.from, data.period.to, jst(data.updatedAt))}</p>
    </>}
  </>;
}
