"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, pct, yen } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, ReasonAction, Table } from "../ui";

type Rec = Record<string, unknown>;
interface Detail { reservation: Rec; lines: Rec[]; referral: Rec | null; entry: Rec | null; payments: Rec[]; refunds: Rec[]; disputes: Rec[]; attendance: Rec | null; adjustments: Rec[]; logs: Rec[]; hotels: { id: string; name: string; public_id: string }[] }

const s = (v: unknown) => (v === null || v === undefined ? "—" : String(v));
const n = (v: unknown) => (typeof v === "number" ? v : v === null || v === undefined ? null : Number(v));
const KIND_JA: Record<string, string> = { base: "基本体験", addon: "追加オプション", arrangement: "別途手配費", onsite: "現地払い" };

export function OpsReservationDetail({ id }: { id: string }) {
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(() => api<Detail>("GET", `ops/reservations/${id}`).then(setD).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); }, [load]);
  const act = async (action: string, body: Rec) => {
    setErr(null); setMsg(null);
    try { const r = await api<Detail>("POST", `ops/reservations/${id}/${action}`, body); setD(r); setMsg("保存しました。"); }
    catch (e) { setErr(errorText(e)); throw e; }
  };
  if (err && !d) return <Notice tone="bad">{err}</Notice>;
  if (!d) return <Loading />;
  const r = d.reservation, e = d.entry, ref = d.referral;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={`予約 ${s(r.hotel_ref)}`}>
        <dl className="pt-kv">
          <dt>体験</dt><dd>{s(r.experience)}（{s(r.experience_slug)}）</dd>
          <dt>体験日 / 人数</dt><dd>{s(r.experience_date)} / {s(r.guests)}</dd>
          <dt>予約日時</dt><dd>{jst(String(r.created_at))}</dd>
          <dt>経路 / 外部参照 / 申込ID</dt><dd>{s(r.flow)} / {s(r.external_ref)} / <code>{s(r.request_id)}</code></dd>
          <dt>予約状況 / 決済 / 金額</dt><dd>{s(r.statusJa)} / {s(r.paymentJa)} / {r.amount_status === "pending" ? <Badge tone="warn">未確定</Badge> : "確定"}</dd>
          <dt>Stripe</dt><dd>{s(r.stripe_session_id)} {s(r.stripe_payment_intent)}</dd>
        </dl>
        <div className="pt-row">
          <ReasonAction label="予約確定にする" onConfirm={(reason) => act("outcome", { outcome: "confirmed", reason })} />
          <ReasonAction label="手配中にする" onConfirm={(reason) => act("outcome", { outcome: "arranging", reason })} />
          <ReasonAction label="キャンセル" kind="danger" onConfirm={(reason) => act("outcome", { outcome: "cancelled", reason })} />
          <ReasonAction label="未実施（無断キャンセル）" kind="danger" onConfirm={(reason) => act("outcome", { outcome: "no_show", reason })} />
        </div>
      </Card>

      <Card title="紹介元と紹介料">
        <dl className="pt-kv">
          <dt>紹介元ホテル</dt><dd>{ref ? <>{s(ref.hotel_name)} ({s(ref.public_id)}) <Badge tone={ref.status === "attributed" || ref.status === "corrected" ? "ok" : "warn"}>{s(ref.status)}</Badge> · 根拠 {s(ref.basis)} · 媒体 {s(ref.medium)} · 固定 {jst(String(ref.fixed_at))}</> : <span className="pt-muted">紹介なし</span>}</dd>
          {ref?.previous_hotel_id ? <><dt>訂正履歴</dt><dd>前の施設 {s(ref.previous_hotel_id)} · {s(ref.correction_reason)} · {s(ref.corrected_by)} · {jst(String(ref.corrected_at))}</dd></> : null}
          <dt>適用料率 / 版</dt><dd>{pct(n(ref?.rate_bp))} / {s(ref?.policy_version)}</dd>
          <dt>紹介料</dt><dd>{e ? <>対象 {yen(n(e.base_net_jpy))} × {pct(n(e.rate_bp))} = <b>{yen(n(e.commission_net_jpy))}</b>（税抜） <Badge tone={e.status === "confirmed" || e.status === "adjusted" ? "ok" : e.status === "pending" ? "warn" : "neutral"}>{s(e.statusJa)}</Badge> {e.holdJa ? <Badge tone="warn">{s(e.holdJa)}</Badge> : null}</> : "—"}</dd>
          <dt>実施確認</dt><dd>{d.attendance ? <>{jst(String(d.attendance.performed_at))}（{s(d.attendance.performed_on_jst)} JST）· {s(d.attendance.confirmed_by)} · {jst(String(d.attendance.confirmed_at))}</> : <span className="pt-muted">未確認</span>}</dd>
          {e?.settlement_profile_id ? <><dt>精算設定</dt><dd>{s(e.settlement_profile_id)}（版 {s(e.settlement_profile_version)}）</dd></> : null}
        </dl>
        <AttendanceForm onSubmit={(performedAt, note) => act("attendance", { performedAt, note })} />
        <ReferralForm hotels={d.hotels} current={ref ? String(ref.hotel_id ?? "") : ""} onSubmit={(hotelId, reason) => act("referral", { hotelId, reason })} />
        {d.adjustments.length > 0 && <Table head={["日時", "差分（税抜）", "理由", "担当"]} rows={d.adjustments.map((a) => [jst(String(a.created_at)), yen(n(a.delta_net_jpy)), s(a.reason), s(a.created_by)])} compact />}
      </Card>

      <Card title="明細">
        <Table head={["種別", "内容", "対象", "税率", "数量", "税込", "割引", "返金", "税抜", "出所"]} rows={d.lines.map((l) => [KIND_JA[String(l.kind)] ?? s(l.kind), s(l.description), l.commissionable ? <Badge key="c" tone="ok">対象</Badge> : <Badge key="c">対象外</Badge>, pct(n(l.tax_rate_bp)), s(l.quantity), yen(n(l.gross_jpy)), yen(n(l.discount_jpy)), yen(n(l.refunded_gross_jpy)), yen(n(l.net_jpy)), s(l.source)])} empty="明細がありません（金額未確定）。" compact />
        <LinesForm onSubmit={(lines, reason) => act("lines", { lines, reason })} />
      </Card>

      <Card title="決済・返金・紛争">
        <Table head={["種類", "日時", "金額", "状態", "参照"]} rows={[
          ...d.payments.map((p) => ["決済", jst(String(p.occurred_at)), yen(n(p.amount_total_jpy)), s(p.payment_status), `${s(p.stripe_session_id ?? p.client_reference_id)} ${s(p.stripe_event_id)}`]),
          ...d.refunds.map((f) => ["返金", jst(String(f.occurred_at)), yen(n(f.amount_delta_jpy)), f.allocation_status === "pending" ? <Badge key="b" tone="warn">配賦待ち</Badge> : s(f.allocation_status), s(f.stripe_event_id)]),
          ...d.disputes.map((x) => ["紛争", jst(String(x.opened_at)), yen(n(x.amount_jpy)), s(x.status), s(x.stripe_dispute_id)]),
        ]} empty="決済の記録はありません。" compact />
        <PaymentForm onSubmit={(amountJpy, occurredAt, reference, reason) => act("payment", { amountJpy, occurredAt, reference, reason })} />
        {d.refunds.filter((f) => f.allocation_status === "pending").map((f) => (
          <RefundAllocation key={String(f.id)} refund={f} lines={d.lines} onSubmit={(allocations, reason) => act("refund-allocation", { refundId: f.id, allocations, reason })} />
        ))}
      </Card>

      <Card title="操作履歴">
        <Table head={["日時", "操作", "担当", "理由"]} rows={d.logs.map((l) => [jst(String(l.at)), s(l.action), s(l.actor), s(l.reason)])} empty="なし" compact />
      </Card>
    </>
  );
}

function AttendanceForm({ onSubmit }: { onSubmit: (performedAt: string, note: string) => Promise<void> }) {
  const [open, setOpen] = useState(false), [date, setDate] = useState(""), [time, setTime] = useState("10:00"), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  if (!open) return <div className="pt-row"><Button kind="primary" small onClick={() => setOpen(true)}>実施済みを登録</Button></div>;
  return (
    <div className="pt-form">
      <Field label="実施日（JST）"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="開始時刻（JST）"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
      <Field label="メモ"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
      <div className="pt-row">
        <Button small disabled={busy || !date} onClick={async () => { setBusy(true); try { await onSubmit(new Date(`${date}T${time}:00+09:00`).toISOString(), note); setOpen(false); } catch { /* shown above */ } finally { setBusy(false); } }}>登録</Button>
        <Button kind="link" small onClick={() => setOpen(false)}>やめる</Button>
      </div>
    </div>
  );
}

function ReferralForm({ hotels, current, onSubmit }: { hotels: { id: string; name: string; public_id: string }[]; current: string; onSubmit: (hotelId: string | null, reason: string) => Promise<void> }) {
  const [hotel, setHotel] = useState(current);
  return (
    <ReasonAction label="紹介元を訂正する" confirmLabel="訂正する" placeholder="訂正の根拠（必須）"
      extra={<select value={hotel} onChange={(e) => setHotel(e.target.value)}><option value="">紹介なし（帰属を外す）</option>{hotels.map((h) => <option key={h.id} value={h.id}>{h.name} ({h.public_id})</option>)}</select>}
      onConfirm={(reason) => onSubmit(hotel || null, reason)} />
  );
}

function LinesForm({ onSubmit }: { onSubmit: (lines: Rec[], reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<{ kind: string; description: string; commissionable: boolean; grossJpy: string; discountJpy: string; taxRateBp: string }[]>([{ kind: "base", description: "", commissionable: true, grossJpy: "", discountJpy: "0", taxRateBp: "1000" }]);
  if (!open) return <div className="pt-row"><Button kind="secondary" small onClick={() => setOpen(true)}>明細を入力・置き換える</Button></div>;
  const set = (i: number, patch: Partial<(typeof lines)[number]>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p className="pt-note-box">税込金額を明細ごとに入れます。税抜は明細の税率で計算します。現地払い・追加オプション・別途手配費は「対象」を外してください。既存の明細はすべて置き換わります。</p>
      {lines.map((l, i) => (
        <div className="pt-form" key={i}>
          <Field label="種別"><select value={l.kind} onChange={(e) => set(i, { kind: e.target.value })}><option value="base">基本体験</option><option value="arrangement">別途手配費（手配料）</option><option value="addon">追加オプション</option><option value="onsite">現地払い</option></select></Field>
          <Field label="内容"><input value={l.description} onChange={(e) => set(i, { description: e.target.value })} /></Field>
          <Field label="税込金額"><input inputMode="numeric" value={l.grossJpy} onChange={(e) => set(i, { grossJpy: e.target.value })} /></Field>
          <Field label="割引（税込）"><input inputMode="numeric" value={l.discountJpy} onChange={(e) => set(i, { discountJpy: e.target.value })} /></Field>
          <Field label="税率（bp）"><input inputMode="numeric" value={l.taxRateBp} onChange={(e) => set(i, { taxRateBp: e.target.value })} /></Field>
          <label className="pt-field"><span className="pt-field-l">紹介料対象</span><input type="checkbox" checked={l.commissionable} onChange={(e) => set(i, { commissionable: e.target.checked })} style={{ width: "auto" }} /></label>
        </div>
      ))}
      <div className="pt-row">
        <Button kind="link" small onClick={() => setLines([...lines, { kind: "onsite", description: "", commissionable: false, grossJpy: "0", discountJpy: "0", taxRateBp: "1000" }])}>行を足す</Button>
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="根拠（必須。例: 見積り合意メール 10/28）" style={{ flex: 1, minWidth: 240 }} />
        <Button small disabled={busy || !reason.trim()} onClick={async () => { setBusy(true); try { await onSubmit(lines.map((l) => ({ ...l, grossJpy: Number(l.grossJpy), discountJpy: Number(l.discountJpy), taxRateBp: Number(l.taxRateBp) })), reason.trim()); setOpen(false); } catch { /* shown above */ } finally { setBusy(false); } }}>保存</Button>
        <Button kind="link" small onClick={() => setOpen(false)}>やめる</Button>
      </div>
    </div>
  );
}

function PaymentForm({ onSubmit }: { onSubmit: (amountJpy: number, occurredAt: string | undefined, reference: string, reason: string) => Promise<void> }) {
  const [open, setOpen] = useState(false), [amount, setAmount] = useState(""), [date, setDate] = useState(""), [reference, setReference] = useState(""), [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  if (!open) return <div className="pt-row"><Button kind="secondary" small onClick={() => setOpen(true)}>入金を手動登録（決済リンク等）</Button></div>;
  return (
    <div className="pt-form">
      <Field label="入金額（税込）"><input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
      <Field label="入金日"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="参照（Stripe の決済ID等）"><input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
      <Field label="根拠（必須）"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      <div className="pt-row">
        <Button small disabled={busy || !amount || !reason.trim()} onClick={async () => { setBusy(true); try { await onSubmit(Number(amount), date ? new Date(`${date}T12:00:00+09:00`).toISOString() : undefined, reference, reason.trim()); setOpen(false); } catch { /* shown above */ } finally { setBusy(false); } }}>登録</Button>
        <Button kind="link" small onClick={() => setOpen(false)}>やめる</Button>
      </div>
    </div>
  );
}

function RefundAllocation({ refund, lines, onSubmit }: { refund: Rec; lines: Rec[]; onSubmit: (allocations: { lineId: string; amountJpy: number }[], reason: string) => Promise<void> }) {
  const charged = lines.filter((l) => l.kind !== "onsite");
  const [alloc, setAlloc] = useState<Record<string, string>>(Object.fromEntries(charged.map((l) => [String(l.id), "0"])));
  const [reason, setReason] = useState(""), [busy, setBusy] = useState(false);
  const total = Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0), target = Number(refund.amount_delta_jpy);
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Notice tone="warn">返金 {yen(target)}（{jst(String(refund.occurred_at))}）の配賦先が未確定です。どの明細の返金か入力してください。</Notice>
      <div className="pt-form">
        {charged.map((l) => <Field key={String(l.id)} label={`${KIND_JA[String(l.kind)] ?? l.kind}: ${s(l.description)}（残 ${yen(Number(l.gross_jpy) - Number(l.discount_jpy) - Number(l.refunded_gross_jpy))}）`}><input inputMode="numeric" value={alloc[String(l.id)]} onChange={(e) => setAlloc({ ...alloc, [String(l.id)]: e.target.value })} /></Field>)}
        <Field label="根拠（必須）"><input value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <div className="pt-row">
          <span className={total === target ? "pt-small" : "pt-small pt-err"}>合計 {yen(total)} / {yen(target)}</span>
          <Button small disabled={busy || total !== target || !reason.trim()} onClick={async () => { setBusy(true); try { await onSubmit(Object.entries(alloc).map(([lineId, v]) => ({ lineId, amountJpy: Number(v) || 0 })), reason.trim()); } catch { /* shown above */ } finally { setBusy(false); } }}>配賦を確定</Button>
        </div>
      </div>
    </div>
  );
}
