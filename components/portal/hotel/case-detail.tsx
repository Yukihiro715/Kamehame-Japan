"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Button, Card, Field, Loading, Notice, ReasonAction } from "../ui";
import { CaseFacts, CaseLedger, CaseMessages, QuoteCard, StatusBadge, type CaseDetail } from "../case-common";

const NEXT: Record<string, string> = {
  received: "KAMEHAME JAPAN が内容を確認します。", checking: "運営が空き・条件を確認しています。質問があれば下の連絡欄に届きます。", proposed: "見積もりを共有しました。お客様向け URL をお渡しください（オンライン決済なし）。",
  awaiting_customer: "お客様の回答をお待ちしています。回答が届いたら連絡欄でお知らせください。", awaiting_payment: "お客様向け URL をお渡しください。お客様がページから決済すると自動で進みます。",
  paid: "決済を確認しました。運営が空き枠を確保し、予約確定を登録します。", confirmed: "予約が確定しました。集合場所・当日の案内は連絡欄をご覧ください。", performed: "実施済みです。紹介料は実施確認後に確定し、四半期の精算に載ります。",
  cancelled: "キャンセルされました。", unavailable: "手配できませんでした。理由は連絡欄をご覧ください。",
};

export function HotelCaseDetail({ id }: { id: string }) {
  const [d, setD] = useState<CaseDetail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState(false), [f, setF] = useState({ customerName: "", customerEmail: "", customerPhone: "", customerCountry: "", requirements: "", preferredDate: "", guests: "" });
  const load = useCallback(() => api<CaseDetail>("GET", `hotel/cases/${id}`).then((x) => { setD(x); setF({ customerName: x.case.customer_name, customerEmail: x.case.customer_email ?? "", customerPhone: x.case.customer_phone ?? "", customerCountry: x.case.customer_country ?? "", requirements: x.case.requirements ?? "", preferredDate: x.case.preferred_date ?? "", guests: x.case.guests ? String(x.case.guests) : "" }); }).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const c = d.case;
  const open = !["paid", "confirmed", "performed", "cancelled", "unavailable"].includes(c.displayStatus);
  const current = d.quotes.find((q) => ["shared", "paid"].includes(q.status));
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{c.public_ref} · {c.experienceTitle} <StatusBadge status={c.displayStatus} label={c.displayStatusJa} /></span>} actions={<Link className="pt-btn pt-btn-link pt-btn-small" href="/hotel/cases/">一覧へ</Link>}>
        <p className="pt-note-box">{NEXT[c.displayStatus]}</p>
        {current?.shareUrl && open && <p className="pt-small">お客様向け URL: <a href={current.shareUrl} target="_blank" rel="noreferrer">{current.shareUrl}</a></p>}
        {!edit ? <CaseFacts c={c} /> : (
          <div className="pt-form">
            <Field label="お客様の代表者名"><input value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>
            <Field label="メールアドレス"><input type="email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} /></Field>
            <Field label="電話番号"><input value={f.customerPhone} onChange={(e) => setF({ ...f, customerPhone: e.target.value })} /></Field>
            <Field label="国・地域"><input value={f.customerCountry} onChange={(e) => setF({ ...f, customerCountry: e.target.value })} /></Field>
            <Field label="希望日"><input type="date" value={f.preferredDate} onChange={(e) => setF({ ...f, preferredDate: e.target.value })} /></Field>
            <Field label="人数"><input type="number" min={1} max={99} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></Field>
            <div className="pt-form-full"><Field label="希望条件・備考"><textarea value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></Field></div>
            <div className="pt-row pt-form-full"><Button onClick={() => run(async () => { await api("POST", `hotel/cases/${id}/update`, { ...f, guests: f.guests ? Number(f.guests) : null }); setEdit(false); }, "保存しました。")}>保存</Button><Button kind="link" onClick={() => setEdit(false)}>やめる</Button></div>
          </div>
        )}
        <p className="pt-small pt-muted">登録 {jst(c.created_at)} · 更新 {jst(c.updated_at)} · 登録者 {c.createdBy ?? "—"}</p>
        {open && !edit && <div className="pt-row"><Button kind="secondary" small onClick={() => setEdit(true)}>お客様情報・希望を編集</Button><ReasonAction label="案件を取り下げる" kind="danger" confirmLabel="取り下げる" placeholder="理由（お客様の都合、日程変更など）" onConfirm={(reason) => run(() => api("POST", `hotel/cases/${id}/cancel`, { reason }), "取り下げました。")} /></div>}
      </Card>
      <Card title="見積もり">
        {d.quotes.length === 0 ? <p className="pt-small pt-muted">運営が見積もりを作成・共有するとここに表示されます。</p> : d.quotes.map((q) => <QuoteCard key={q.id} q={q} kind="hotel" />)}
      </Card>
      <Card title="予約・紹介料"><CaseLedger d={d} kind="hotel" /></Card>
      <Card title="連絡・資料"><CaseMessages kind="hotel" caseId={id} messages={d.messages} onPosted={load} /></Card>
    </>
  );
}
