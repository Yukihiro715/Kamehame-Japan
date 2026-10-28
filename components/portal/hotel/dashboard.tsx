"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
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
      <Card title={`${hotel?.name ?? ""} の実績`} actions={<PeriodPicker value={period} onChange={setPeriod} />}>
        {!data ? <Loading /> : (
          <>
            <p className="pt-small pt-muted">期間 {data.period.from} 〜 {data.period.to}（日本時間）· 更新 {jst(data.updatedAt)}</p>
            <h3 className="pt-section-h">集客・予約状況</h3>
            <div className="pt-grid">
              <Stat label="QR・リンク経由アクセス数" value={data.funnel.accesses} note="紹介URLへの到達で数えます" />
              <Stat label="訪問数" value={data.funnel.visits} note="同一セッション30分以内は1訪問" />
              <Stat label="仮予約件数" value={data.funnel.provisional} note="予約作成日で集計" />
              <Stat label="予約確定件数" value={data.funnel.confirmed} />
              <Stat label="決済済み件数" value={data.funnel.paid} note={`全額返金 ${data.funnel.fullyRefunded} 件`} />
              <Stat label="キャンセル件数" value={data.funnel.cancelled} />
              <Stat label="未実施予約の見込紹介料（税抜）" value={yen(data.funnel.estimatedCommissionNet)} note="見込・精算対象外" tone="muted" />
            </div>
            <h3 className="pt-section-h">確定実績・精算（体験実施後）</h3>
            <div className="pt-grid">
              <Stat label="実施確認済み件数" value={data.confirmed.count} note="実施日で集計" tone="accent" />
              <Stat label="実施済み予約の税抜対象売上" value={yen(data.confirmed.baseNet)} />
              <Stat label="確定税抜紹介料" value={yen(data.confirmed.commissionNet)} note={`税込参考 ${yen(data.confirmed.commissionNet + data.confirmed.commissionTaxRef)}`} tone="accent" />
              <Stat label="確定未払残高（税抜）" value={yen(data.balance.unpaidNet)} note={`現在残高 · 税込参考 ${yen(data.balance.unpaidNet + data.balance.unpaidTaxRef)}`} />
              <Stat label="支払済み額" value={yen(data.balance.paid)} note="精算書の支払後に計上" />
            </div>
            <p className="pt-note-box">「決済済み」は確定実績ではありません。紹介料は体験の実施確認後に確定し、四半期ごとに精算します。正式な税額と支払額は精算書に表示します。</p>
          </>
        )}
      </Card>
    </>
  );
}
