"use client";

import { jst, pct, yen } from "./client";
import { label, t } from "./i18n";

const TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "info"> = { draft: "neutral", issued: "info", acknowledged: "ok", disputed: "warn", settled: "ok", void: "bad" };
/** [label, tone] for a statement status in the portal's language. */
export const statementStatus = (status: string): [string, "neutral" | "ok" | "warn" | "bad" | "info"] => [label(t().status.statement, status), TONE[status] ?? "neutral"];
/** Kept for the operations screens, which stay Japanese. */
export const STATEMENT_STATUS_JA: Record<string, [string, "neutral" | "ok" | "warn" | "bad" | "info"]> = {
  draft: ["下書き", "neutral"], issued: ["発行済み・確認待ち", "info"], acknowledged: ["確認済み", "ok"], disputed: ["異議あり", "warn"], settled: ["支払済み", "ok"], void: ["無効（訂正済み）", "bad"],
};
export const periodJa = (period: string) => { const [y, q] = period.split("-Q"); return `${y}年 第${q}四半期（${(Number(q) - 1) * 3 + 1}〜${Number(q) * 3}月）`; };
export const periodLabel = (period: string) => { const [y, q] = period.split("-Q"); return t().settlement.periodLabel(y, q); };

export interface SheetStatement { id: string; period: string; version: number; status: string; net_jpy: number; tax_jpy: number; gross_jpy: number; carried_in_jpy: number; payable_jpy: number; carried_out_jpy: number; bank_fee_jpy: number; transfer_jpy: number; min_payout_jpy: number; pay_date_jst: string | null; dispute_deadline_jst: string | null; issued_at: string | null; acknowledged_at: string | null; settled_at: string | null }
export interface SheetItem { id: string; kind: string; performed_on_jst: string | null; hotel_ref: string | null; experience_slug: string | null; hotel_name?: string | null; base_net_jpy: number; rate_bp: number | null; amount_net_jpy: number; note: string | null }
export interface SheetParty { name: string; address?: string | null; registration_number?: string | null }
export interface SheetProfile { name: string; payee_name: string | null; bank_details_masked: string | null; fee_borne_by: string }

/** The payment notice (支払通知書) as the partner sees and prints it, in the portal's language: the same figures the API and the CSV carry. */
export function StatementSheet({ s, items, entity, profile, experienceNames = {} }: { s: SheetStatement; items: SheetItem[]; entity: SheetParty | null; profile: SheetProfile | null; experienceNames?: Record<string, string> }) {
  const { from, to } = bounds(s.period);
  const H = t().statement.sheet;
  return (
    <div className="pt-sheet">
      <header className="pt-sheet-h">
        <div>
          <h1>{H.h}</h1>
          <p className="pt-sheet-sub">{periodLabel(s.period)} · {H.period} {from} – {to}{s.version > 1 ? ` · ${H.revision(s.version)}` : ""}</p>
        </div>
        <div className="pt-sheet-meta">
          <p>{H.no}: <b>{s.id.slice(0, 12).toUpperCase()}</b></p>
          <p>{H.issuedOn}: {s.issued_at ? jst(s.issued_at, false) : H.unissued}</p>
        </div>
      </header>
      <div className="pt-sheet-parties">
        <div className="pt-sheet-to"><p className="pt-sheet-l">{H.to}</p><p><b>{entity?.name ?? "—"}{H.toSuffix}</b></p>{entity?.address && <p>{entity.address}</p>}{entity?.registration_number && <p>{H.regNo} {entity.registration_number}</p>}{profile && <p className="pt-small">{H.profile}: {profile.name}{profile.payee_name ? ` · ${H.payee} ${profile.payee_name}` : ""}{profile.bank_details_masked ? ` · ${profile.bank_details_masked}` : ""}</p>}</div>
        <div className="pt-sheet-from"><p className="pt-sheet-l">{H.from}</p><p><b>KAMEHAME JAPAN</b></p><p>{H.company}</p><p>hello@kamehame-japan.com</p></div>
      </div>
      <table className="pt-sheet-totals">
        <tbody>
          <tr><th>{H.net}</th><td>{yen(s.net_jpy)}</td></tr>
          <tr><th>{H.tax}</th><td>{yen(s.tax_jpy)}</td></tr>
          <tr><th>{H.gross}</th><td>{yen(s.gross_jpy)}</td></tr>
          <tr><th>{H.carriedIn}</th><td>{yen(s.carried_in_jpy)}</td></tr>
          <tr><th>{H.payable}</th><td>{yen(s.payable_jpy)}</td></tr>
          {s.carried_out_jpy !== 0 && <tr><th>{H.carriedOut(s.carried_out_jpy < 0 ? H.carriedOutRefund : H.carriedOutMin(yen(s.min_payout_jpy)))}</th><td>{yen(s.carried_out_jpy)}</td></tr>}
          {s.bank_fee_jpy > 0 && <tr><th>{H.fee(profile?.fee_borne_by === "hotel" ? H.feeHotel : H.feeUs)}</th><td>−{yen(s.bank_fee_jpy)}</td></tr>}
          <tr className="pt-sheet-grand"><th>{H.transfer}</th><td>{yen(s.transfer_jpy)}</td></tr>
          <tr><th>{H.payDate}</th><td>{s.transfer_jpy > 0 ? s.pay_date_jst ?? "—" : H.noTransfer}</td></tr>
        </tbody>
      </table>
      <table className="pt-table pt-table-compact pt-sheet-items">
        <thead><tr>{H.itemsHead.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{items.length === 0 ? <tr><td colSpan={9} className="pt-empty">{H.noItems}</td></tr> : items.map((i) => <tr key={i.id}><td>{i.kind === "entry" ? H.entry : H.adjustment}</td><td>{i.performed_on_jst ?? "—"}</td><td>{i.hotel_ref ?? "—"}</td><td>{(i.experience_slug && experienceNames[i.experience_slug]) || i.experience_slug || "—"}</td><td>{i.hotel_name ?? "—"}</td><td>{yen(i.base_net_jpy)}</td><td>{pct(i.rate_bp)}</td><td>{yen(i.amount_net_jpy)}</td><td>{i.note ?? ""}</td></tr>)}</tbody>
      </table>
      <div className="pt-sheet-notes">
        <p>{H.note1}</p>
        <p>{H.note2(yen(s.min_payout_jpy))}</p>
        {s.dispute_deadline_jst && <p>{H.note3(s.dispute_deadline_jst)}</p>}
        <p>{H.note4}</p>
      </div>
    </div>
  );
}

function bounds(period: string) {
  const [y, q] = period.split("-Q").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  const last = new Date(Date.UTC(y, q * 3, 0)).getUTCDate();
  return { from: `${y}-${pad((q - 1) * 3 + 1)}-01`, to: `${y}-${pad(q * 3)}-${pad(last)}` };
}
