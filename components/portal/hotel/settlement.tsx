"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { Badge, Card, Loading, Notice, Stat, Table } from "../ui";
import { periodLabel, statementStatus } from "../statement-sheet";

interface Row { id: string; period: string; version: number; status: string; gross_jpy: number; carried_in_jpy: number; transfer_jpy: number; carried_out_jpy: number; pay_date_jst: string | null; dispute_deadline_jst: string | null; issued_at: string | null; settled_at: string | null }
interface Data { balance: { unpaidNet: number; unpaidTaxRef: number; paid: number }; profile: { id: string; name: string; min_payout_jpy: number; bank_details_masked: string | null; dispute_days: number; fee_borne_by: string; bank_fee_jpy: number } | null; billing: boolean; statements: Row[] }

export function HotelSettlement() {
  const { hotel } = usePortal();
  const L = t().settlement, C = t().common;
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (hotel) api<Data>("GET", `hotel/settlement?hotel=${hotel.id}`).then(setData).catch((e) => setErr(errorText(e))); }, [hotel]);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      <Card title={L.title}>
        <div className="pt-grid">
          <Stat label={L.unpaid} value={yen(data.balance.unpaidNet)} note={L.taxRef(yen(data.balance.unpaidNet + data.balance.unpaidTaxRef))} tone="accent" />
          <Stat label={L.paid} value={yen(data.balance.paid)} />
          <Stat label={L.minPayout} value={yen(data.profile?.min_payout_jpy ?? 3000)} note={L.minPayoutNote} />
        </div>
        <p className="pt-note-box">{L.note}{data.profile?.fee_borne_by === "hotel" && data.profile.bank_fee_jpy > 0 ? L.feeNote(yen(data.profile.bank_fee_jpy)) : ""}</p>
      </Card>
      <Card title={L.statements}>
        <Table head={L.head} rows={data.statements.map((s) => {
          const st = statementStatus(s.status);
          return [periodLabel(s.period), s.version, <Badge key="s" tone={st[1]}>{st[0]}</Badge>, yen(s.gross_jpy), yen(s.carried_in_jpy), yen(s.transfer_jpy), yen(s.carried_out_jpy), s.pay_date_jst ?? "—", s.dispute_deadline_jst ?? "—", <a key="a" href={`/hotel/settlement/${s.id}/`}>{C.open}</a>];
        })} empty={L.empty} compact />
        {!data.billing && <p className="pt-small pt-muted">{L.billingOnly}</p>}
      </Card>
      <Card title={L.profileTitle}>
        {data.profile ? (
          <dl className="pt-kv">
            <dt>{L.profileName}</dt><dd>{data.profile.name}</dd>
            <dt>{L.bank}</dt><dd>{data.profile.bank_details_masked ?? <span className="pt-muted">{L.bankMissing}</span>}</dd>
            <dt>{L.disputeDays}</dt><dd>{L.disputeDaysV(data.profile.dispute_days)}</dd>
          </dl>
        ) : <p className="pt-muted">{L.noProfile}</p>}
        <p className="pt-small pt-muted">{L.lastUpdated} {jst(new Date().toISOString())}</p>
      </Card>
    </>
  );
}
