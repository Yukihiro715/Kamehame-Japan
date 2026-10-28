"use client";

import { useEffect, useState } from "react";
import { api, errorText, yen } from "../client";
import { usePortal } from "../shell";
import { Card, Loading, Notice, Stat } from "../ui";

interface Data { balance: { unpaidNet: number; unpaidTaxRef: number; paid: number }; profile: { id: string; name: string; min_payout_jpy: number; bank_details_masked: string | null } | null; statements: unknown[]; note: string }

export function HotelSettlement() {
  const { hotel, me } = usePortal();
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (hotel) api<Data>("GET", `hotel/settlement?hotel=${hotel.id}`).then(setData).catch((e) => setErr(errorText(e))); }, [hotel]);
  const billing = me.memberships?.some((m) => m.role === "hotel_billing" && m.scopeId === hotel?.id);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <Card title="精算">
        <div className="pt-grid">
          <Stat label="確定未払残高（税抜）" value={yen(data.balance.unpaidNet)} note={`税込参考 ${yen(data.balance.unpaidNet + data.balance.unpaidTaxRef)}`} tone="accent" />
          <Stat label="支払済み額" value={yen(data.balance.paid)} />
          <Stat label="最低振込額（税込）" value={yen(data.profile?.min_payout_jpy ?? 3000)} note="未満は次回へ繰越" />
        </div>
        <p className="pt-note-box">精算は暦四半期（1–3月、4–6月、7–9月、10–12月）ごとに、実施確認済みの紹介料を集計し、翌月末にお支払いします。振込手数料はホテル負担として支払額から差し引きます。{data.note}</p>
      </Card>
      <Card title="精算・振込設定">
        {data.profile ? (
          <dl className="pt-kv">
            <dt>設定名</dt><dd>{data.profile.name}</dd>
            <dt>振込口座</dt><dd>{data.profile.bank_details_masked ?? <span className="pt-muted">未登録（請求担当者が登録します。入力画面は精算機能と同時に公開します）</span>}</dd>
          </dl>
        ) : <p className="pt-muted">精算設定がまだありません。KAMEHAME JAPAN が登録します。</p>}
        {!billing && <p className="pt-small pt-muted">口座・登録番号の申請と精算書の確認は、請求担当者の権限を持つ方だけが行えます。</p>}
      </Card>
    </>
  );
}
