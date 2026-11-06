"use client";

import { jst, pct, yen } from "./client";

export const STATEMENT_STATUS_JA: Record<string, [string, "neutral" | "ok" | "warn" | "bad" | "info"]> = {
  draft: ["下書き", "neutral"], issued: ["発行済み・確認待ち", "info"], acknowledged: ["確認済み", "ok"], disputed: ["異議あり", "warn"], settled: ["支払済み", "ok"], void: ["無効（訂正済み）", "bad"],
};
export const periodJa = (period: string) => { const [y, q] = period.split("-Q"); return `${y}年 第${q}四半期（${(Number(q) - 1) * 3 + 1}〜${Number(q) * 3}月）`; };

export interface SheetStatement { id: string; period: string; version: number; status: string; net_jpy: number; tax_jpy: number; gross_jpy: number; carried_in_jpy: number; payable_jpy: number; carried_out_jpy: number; bank_fee_jpy: number; transfer_jpy: number; min_payout_jpy: number; pay_date_jst: string | null; dispute_deadline_jst: string | null; issued_at: string | null; acknowledged_at: string | null; settled_at: string | null }
export interface SheetItem { id: string; kind: string; performed_on_jst: string | null; hotel_ref: string | null; experience_slug: string | null; hotel_name?: string | null; base_net_jpy: number; rate_bp: number | null; amount_net_jpy: number; note: string | null }
export interface SheetParty { name: string; address?: string | null; registration_number?: string | null }
export interface SheetProfile { name: string; payee_name: string | null; bank_details_masked: string | null; fee_borne_by: string }

/** The payment notice (支払通知書) as the partner sees and prints it: the same figures the API and the CSV carry. */
export function StatementSheet({ s, items, entity, profile, experienceNames = {} }: { s: SheetStatement; items: SheetItem[]; entity: SheetParty | null; profile: SheetProfile | null; experienceNames?: Record<string, string> }) {
  const { from, to } = bounds(s.period);
  return (
    <div className="pt-sheet">
      <header className="pt-sheet-h">
        <div>
          <h1>紹介料 お支払い通知書</h1>
          <p className="pt-sheet-sub">{periodJa(s.period)} · 対象期間 {from} 〜 {to}{s.version > 1 ? ` · 訂正版 ${s.version}` : ""}</p>
        </div>
        <div className="pt-sheet-meta">
          <p>通知書番号: <b>{s.id.slice(0, 12).toUpperCase()}</b></p>
          <p>発行日: {s.issued_at ? jst(s.issued_at, false) : "（未発行・下書き）"}</p>
        </div>
      </header>
      <div className="pt-sheet-parties">
        <div className="pt-sheet-to"><p className="pt-sheet-l">宛先</p><p><b>{entity?.name ?? "—"} 御中</b></p>{entity?.address && <p>{entity.address}</p>}{entity?.registration_number && <p>登録番号 {entity.registration_number}</p>}{profile && <p className="pt-small">精算設定: {profile.name}{profile.payee_name ? ` · 振込先名義 ${profile.payee_name}` : ""}{profile.bank_details_masked ? ` · ${profile.bank_details_masked}` : ""}</p>}</div>
        <div className="pt-sheet-from"><p className="pt-sheet-l">発行者</p><p><b>KAMEHAME JAPAN</b></p><p>株式会社プロセント</p><p>hello@kamehame-japan.com</p></div>
      </div>
      <table className="pt-sheet-totals">
        <tbody>
          <tr><th>紹介料（税抜）</th><td>{yen(s.net_jpy)}</td></tr>
          <tr><th>消費税（10%・合計に対して1回計算）</th><td>{yen(s.tax_jpy)}</td></tr>
          <tr><th>税込合計</th><td>{yen(s.gross_jpy)}</td></tr>
          <tr><th>前期からの繰越</th><td>{yen(s.carried_in_jpy)}</td></tr>
          <tr><th>お支払い対象額</th><td>{yen(s.payable_jpy)}</td></tr>
          {s.carried_out_jpy !== 0 && <tr><th>次回への繰越（{s.carried_out_jpy < 0 ? "返金による差額" : `最低お支払額 ${yen(s.min_payout_jpy)} 未満`}）</th><td>{yen(s.carried_out_jpy)}</td></tr>}
          {s.bank_fee_jpy > 0 && <tr><th>振込手数料（{profile?.fee_borne_by === "hotel" ? "貴社ご負担" : "当社負担"}）</th><td>−{yen(s.bank_fee_jpy)}</td></tr>}
          <tr className="pt-sheet-grand"><th>お振込額</th><td>{yen(s.transfer_jpy)}</td></tr>
          <tr><th>お振込予定日</th><td>{s.transfer_jpy > 0 ? s.pay_date_jst ?? "—" : "今回のお振込はありません"}</td></tr>
        </tbody>
      </table>
      <table className="pt-table pt-table-compact pt-sheet-items">
        <thead><tr><th>区分</th><th>実施日</th><th>照合番号</th><th>体験</th><th>紹介元</th><th>対象額（税抜）</th><th>料率</th><th>金額（税抜）</th><th>備考</th></tr></thead>
        <tbody>{items.length === 0 ? <tr><td colSpan={9} className="pt-empty">明細はありません。</td></tr> : items.map((i) => <tr key={i.id}><td>{i.kind === "entry" ? "紹介料" : "前期訂正"}</td><td>{i.performed_on_jst ?? "—"}</td><td>{i.hotel_ref ?? "—"}</td><td>{(i.experience_slug && experienceNames[i.experience_slug]) || i.experience_slug || "—"}</td><td>{i.hotel_name ?? "—"}</td><td>{yen(i.base_net_jpy)}</td><td>{pct(i.rate_bp)}</td><td>{yen(i.amount_net_jpy)}</td><td>{i.note ?? ""}</td></tr>)}</tbody>
      </table>
      <div className="pt-sheet-notes">
        <p>紹介料は、実施確認済みの予約について、割引・返金反映後の税抜金額に契約料率を乗じ、予約ごとに1回四捨五入して算出しています。消費税は通知書の合計に対して1回計算します。</p>
        <p>お支払い対象額が最低お支払額（税込 {yen(s.min_payout_jpy)}）に満たない場合、および返金等で差額がマイナスになった場合は、次回の通知書に繰り越して合算・相殺します。</p>
        {s.dispute_deadline_jst && <p>内容に相違がある場合は <b>{s.dispute_deadline_jst}</b> までに紹介管理画面からお知らせください。期限までにご連絡がない場合は、ご確認いただいたものとしてお支払い手続きを進めます。</p>}
        <p>本通知書は KAMEHAME JAPAN（株式会社プロセント）が作成する支払通知書であり、貴社からの請求書のご提出は不要です。税務上の記載事項はご契約条件に従います。</p>
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
