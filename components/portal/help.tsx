"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info, X } from "lucide-react";
import { t } from "./i18n";

/** Native modal: focus containment, inert background and mobile tap support. */
export function InfoHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null), dialog = useRef<HTMLDialogElement>(null);
  const id = useId(), C = t().common;
  useEffect(() => {
    if (!open || !dialog.current) return;
    const el = dialog.current, button = trigger.current, overflow = document.body.style.overflow;
    el.showModal(); document.body.style.overflow = "hidden";
    return () => { el.close(); document.body.style.overflow = overflow; button?.focus(); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className="pt-info-button" aria-label={C.about(label)} title={C.about(label)} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Info size={17} aria-hidden="true"/></button>
    {open && createPortal(<dialog ref={dialog} className="pt-help-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} onCancel={e => { e.preventDefault(); setOpen(false); }} onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="pt-help-content"><header><h2 id={`${id}-title`}>{label}</h2><button type="button" className="pt-info-button" aria-label={C.close} onClick={() => setOpen(false)}><X size={22} aria-hidden="true"/></button></header><div id={`${id}-body`}>{children}</div><button type="button" className="pt-btn pt-btn-primary" onClick={() => setOpen(false)}>{C.close}</button></div>
    </dialog>, document.body)}
  </>;
}

const explanations = {
  visits: ["同じブラウザからの訪問を、パートナーごとに初回から7日間で1人として集計します。QR・体験別リンクの重複もまとめ、7日経過後は再カウントします。別端末やCookie削除時は別人数になるため目安です。選択期間内にアクセスがあった人数を表示します。", "One browser counts once per partner in a fixed seven-day window across QR codes and links, then counts again. Different devices or cleared cookies count separately. This is an estimate for accesses within the selected period."],
  pending: ["選択期間中に作成された予約のうち、現在「仮予約」または「手配中」の件数です。予約確定・実施済み・キャンセルは含みません。まだ予約として成立していないため、今後変わる可能性があります。", "Bookings created in the selected period that are currently provisional or being arranged. Confirmed, completed and cancelled bookings are excluded. These are not yet confirmed."],
  confirmed: ["選択期間中に作成され、現在「予約確定」または「実施済み」の予約件数です。仮予約中の件数とは重複しません。予約確定だけでは紹介料のお支払いは確定せず、体験の実施確認が必要です。", "Bookings created in the selected period that are currently confirmed or completed. These do not overlap with bookings awaiting confirmation. Commission becomes final after attendance is verified."],
  estimate: ["選択期間中に作成された、まだ実施確認前の仮予約・手配中・予約確定分の紹介料見込みです。現在の税抜対象額と料率を基に集計し、キャンセルや金額変更で変動します。実施済みの確定紹介料や支払い予定額とは異なります。", "Estimated commission for bookings created in the selected period that are provisional, being arranged or confirmed and have not been marked as performed. Based on current commissionable amounts and rates; cancellations and price changes can alter it. It is not a scheduled payment."],
  earned: ["選択期間中に実施が確認され、紹介料が確定した体験の合計です。予約日ではなく実施日で集計し、返金等による確定後の調整を含みます。支払い済みかどうかは「精算」で確認できます。", "Commission confirmed for experiences performed in the selected period, including subsequent adjustments. Uses the performance date, not booking date. See Settlement for payment status."],
  opens: ["QRコード・紹介リンクが開かれた延べ回数です。同じ人が繰り返し開いた分も含みます。判別できたボット・リンクプレビュー・テストアクセスは除外しています。", "Total QR and referral link opens, including repeat opens. Recognized bots, link previews and test clicks are excluded."],
  bookingStatus: ["「仮予約」「手配中」は予約確定前、「予約確定」は手配が成立した状態、「実施済み」は体験の実施が確認された状態です。キャンセルや未実施の予約は区別して表示します。", "Provisional and Arranging are awaiting confirmation. Confirmed means the booking is secured; Completed means attendance was verified. Cancelled and no-show bookings are shown separately."],
  payment: ["お客様からの決済状況です。「決済済み」はお客様の支払いが確認された状態で、パートナーへの紹介料支払い済みという意味ではありません。", "The guest’s payment status. Paid means the guest’s payment was received, not that commission has been transferred to the partner."],
  base: ["紹介料を計算する対象部分の税抜金額です。対象外のオプション、値引き・返金などを反映するため、予約の総額とは異なる場合があります。", "The eligible amount excluding tax used to calculate commission. Ineligible extras, discounts and refunds can make it differ from the booking total."],
  rate: ["紹介料の税抜対象額に適用する割合です。標準は5%で、個別条件がある場合はその料率を表示します。予約実績には、その予約に適用された料率を表示します。", "The rate applied to the eligible amount excluding tax. The standard is 5%; agreed individual rates take precedence. Booking records show the rate applicable to that booking."],
  commission: ["税抜対象額とその予約の料率を基に計算した紹介料です。見込み段階ではキャンセル・返金などで変わる場合があります。確定状況は「精算状態」で確認できます。", "Commission based on the eligible amount excluding tax and the booking’s rate. Estimates can change following cancellation or refund. Check Settlement status to see whether it is final."],
  tax: ["税抜紹介料に消費税を加えた参考額です。正式な税額は精算時に合計額から計算するため、予約ごとの参考額の合計と差が出る場合があります。", "Commission including tax for reference. Formal tax is calculated on settlement totals, so summed booking estimates may differ."],
  entry: ["「見込」は実施前、「確認待ち」は実施確認後も決済・料率・精算設定などの確認が残る状態です。「確定」は紹介料が確定した状態、「確定（調整あり）」は返金等の調整を含みます。実際の振込状況は「精算」で確認してください。", "Estimated means before attendance verification. Pending means verification or settings still need attention. Confirmed means commission is final; Adjusted includes later changes such as refunds. Actual transfer status appears in Settlement."],
  quarter: ["1〜3月・4〜6月・7〜9月・10〜12月の区切りです。実施確認済みの紹介料を四半期ごとに精算し、原則として翌月末に振り込みます。", "Calendar quarters are Jan–Mar, Apr–Jun, Jul–Sep and Oct–Dec. Verified commission is settled quarterly, normally for transfer by the end of the following month."],
  transfer: ["消費税・前期からの繰越・振込手数料などを反映した、口座に振り込む金額です。「未確定」の場合は精算書発行前のため、まだ振込額が決まっていません。", "The bank transfer amount after tax, prior carry-over and bank fees. Not final means a statement has not yet established the transfer amount."],
  carry: ["最低振込額に満たない残高など、次の精算へ持ち越す金額です。紹介料が失われるわけではなく、次回の精算に反映されます。", "Balances such as amounts below the minimum payout carried into the next settlement. They are not forfeited."],
  scheduled: ["発行済みの精算書に基づく振込予定額の合計です。「集計中」や「確認中」、次期へ繰り越す金額は含みません。対象四半期と予定日は下の表で確認できます。", "Total scheduled transfers from issued statements. Excludes accruing, disputed and carried balances. The table identifies the quarters and scheduled dates."],
  paidTotal: ["過去の全四半期で、支払い済みと記録された振込額の合計です。振込手数料控除後の実際の支払額を表示します。", "Total transfers recorded as paid across all quarters, after bank fees."],
  settlementStatus: ["「集計中」は実施確認済みで精算書発行前、「支払い予定」は発行済みの振込予定、「支払い済み」は振込済みです。「次期へ繰越」は今回振り込まず次回へ持ち越し、「確認中」は精算内容を確認している状態です。", "Accruing: verified commission awaiting a statement. Scheduled: transfer due on an issued statement. Paid: transfer recorded. Carried forward: deferred to the next settlement. Under review: the statement is being reviewed."],
} as const;
export type HelpTerm = keyof typeof explanations;
export const helpText = (term: HelpTerm, en: boolean) => explanations[term][en ? 1 : 0];
export function TermLabel({ label, term, en }: { label: string; term: HelpTerm; en: boolean }) {
  return <span className="pt-term-label">{label}<InfoHelp label={label}><p>{helpText(term, en)}</p></InfoHelp></span>;
}
