"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Card, Loading, Notice, Table } from "../ui";
import { EXCEPTION_LABEL } from "./overview";

interface Row { id: string; hotel_ref: string; experience: string; experience_date: string | null; status: string; payment_status: string; amount_status: string; created_at: string; hotel_name: string | null; hold_reason: string | null; entry_status: string | null }
interface Unmatched { provider: string; event_id: string; event_type: string; occurred_at: string | null; status: string; note: string | null }
type Data = Record<string, Row[]> & { unmatched: Unmatched[] };

const HELP: Record<string, string> = {
  rateMissing: "体験の料率が未設定のまま紹介された予約。「料率」で登録すると、再計算で見込が立ちます（予約時点で有効な料率が必要なため、既存予約は紹介元訂正で再適用します）。",
  payeeMissing: "チェーン共通リンクなど、支払先の精算設定がない紹介。精算設定を紐付けるか、紹介元を施設に訂正します。",
  amountPending: "サイトが金額を確定できなかった予約（見積り型など）。予約詳細で明細を入力すると紹介料が計算されます。",
  awaitingAttendance: "体験日を過ぎたのに実施確認がない予約。実施していれば実施確認、していなければキャンセル・未実施を登録します。日付経過だけでは確定しません。",
  refundAllocation: "複数明細の予約に返金があり、どの明細の返金か未確定。予約詳細で配賦します。配賦までその予約の紹介料は支払保留です。",
  disputes: "Stripeで支払紛争が開いている予約。解決まで確定しません。",
  unmatched: "Stripeから届いたが予約に結び付かなかったイベント（予約IDのない決済リンクなど）。予約詳細の「入金を手動登録」で紐付けます。",
};

export function OpsExceptions() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null);
  useEffect(() => { api<Data>("GET", "ops/exceptions").then(setData).catch((e) => setErr(errorText(e))); }, []);
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  return (
    <>
      {Object.entries(EXCEPTION_LABEL).filter(([k]) => k !== "unmatched").map(([k, label]) => (
        <Card key={k} title={`${label}（${(data[k] ?? []).length}）`}>
          <p className="pt-note-box">{HELP[k]}</p>
          <Table head={["照合番号", "予約日", "体験", "体験日", "ホテル", "予約状況", "決済", "保留理由"]} rows={(data[k] ?? []).map((r) => [<a key="a" href={`/ops/reservations/${r.id}/`}>{r.hotel_ref}</a>, jst(r.created_at, false), r.experience, r.experience_date ?? "—", r.hotel_name ?? "—", r.status, r.payment_status, r.hold_reason ?? "—"])} empty="なし" compact />
        </Card>
      ))}
      <Card title={`${EXCEPTION_LABEL.unmatched}（${data.unmatched.length}）`}>
        <p className="pt-note-box">{HELP.unmatched}</p>
        <Table head={["イベントID", "種類", "発生", "状態", "メモ"]} rows={data.unmatched.map((u) => [<code key="i">{u.event_id}</code>, u.event_type, jst(u.occurred_at), u.status, u.note ?? "—"])} empty="なし" compact />
      </Card>
    </>
  );
}
