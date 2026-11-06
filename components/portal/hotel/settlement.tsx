"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { usePortal } from "../shell";
import { Badge, Card, Loading, Notice, Stat, Table } from "../ui";
import { STATEMENT_STATUS_JA, periodJa } from "../statement-sheet";

interface Row { id: string; period: string; version: number; status: string; gross_jpy: number; carried_in_jpy: number; transfer_jpy: number; carried_out_jpy: number; pay_date_jst: string | null; dispute_deadline_jst: string | null; issued_at: string | null; settled_at: string | null }
interface Data { balance: { unpaidNet: number; unpaidTaxRef: number; paid: number }; profile: { id: string; name: string; min_payout_jpy: number; bank_details_masked: string | null; dispute_days: number; fee_borne_by: string; bank_fee_jpy: number } | null; billing: boolean; statements: Row[] }

export function HotelSettlement() {
  const { hotel } = usePortal();
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (hotel) api<Data>("GET", `hotel/settlement?hotel=${hotel.id}`).then(setData).catch((e) => setErr(errorText(e))); }, [hotel]);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <Card title="精算">
        <div className="pt-grid">
          <Stat label="確定未払残高（税抜）" value={yen(data.balance.unpaidNet)} note={`税込参考 ${yen(data.balance.unpaidNet + data.balance.unpaidTaxRef)}`} tone="accent" />
          <Stat label="お支払い済み額（税込）" value={yen(data.balance.paid)} />
          <Stat label="最低お支払額（税込）" value={yen(data.profile?.min_payout_jpy ?? 3000)} note="未満は次回へ繰越" />
        </div>
        <p className="pt-note-box">精算は暦四半期（1–3月、4–6月、7–9月、10–12月）ごとに、実施確認済みの紹介料を集計した「お支払い通知書」を KAMEHAME JAPAN が発行し、翌月末にお振込みします（貴社からの請求書は不要です）。通知書の内容に相違がある場合は、記載の期限までに異議をお申し立てください。{data.profile?.fee_borne_by === "hotel" && data.profile.bank_fee_jpy > 0 ? ` 振込手数料（${yen(data.profile.bank_fee_jpy)}）は貴社ご負担として振込額から差し引きます。` : ""}</p>
      </Card>
      <Card title="お支払い通知書">
        <Table head={["期間", "版", "状態", "税込合計", "前期繰越", "お振込額", "次回繰越", "振込予定日", "異議期限", ""]} rows={data.statements.map((s) => {
          const st = STATEMENT_STATUS_JA[s.status] ?? [s.status, "neutral" as const];
          return [periodJa(s.period), s.version, <Badge key="s" tone={st[1]}>{st[0]}</Badge>, yen(s.gross_jpy), yen(s.carried_in_jpy), yen(s.transfer_jpy), yen(s.carried_out_jpy), s.pay_date_jst ?? "—", s.dispute_deadline_jst ?? "—", <a key="a" href={`/hotel/settlement/${s.id}/`}>開く</a>];
        })} empty="お支払い通知書はまだありません。四半期の締め後に発行されます。" compact />
        {!data.billing && <p className="pt-small pt-muted">通知書の確認・異議申立ては、請求担当者の権限を持つ方だけが行えます。</p>}
      </Card>
      <Card title="精算・振込設定">
        {data.profile ? (
          <dl className="pt-kv">
            <dt>設定名</dt><dd>{data.profile.name}</dd>
            <dt>振込口座</dt><dd>{data.profile.bank_details_masked ?? <span className="pt-muted">未登録（KAMEHAME JAPAN にご連絡ください）</span>}</dd>
            <dt>異議申立て期限</dt><dd>発行から {data.profile.dispute_days} 日</dd>
          </dl>
        ) : <p className="pt-muted">精算設定がまだありません。KAMEHAME JAPAN が登録します。</p>}
        <p className="pt-small pt-muted">最終更新 {jst(new Date().toISOString())}</p>
      </Card>
    </>
  );
}
