"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Button, Card, Field, Loading, Notice, ReasonAction } from "../ui";
import { CaseFacts, CaseLedger, CaseMessages, LANG_JA, LINE_KIND_JA, QuoteCard, StatusBadge, type CaseDetail, type ExtraField, type QuoteLine } from "../case-common";

interface Options { experiences: { slug: string; title: string; price: string | null; extraFields: ExtraField[] }[]; statuses: { value: string; label: string }[] }
type Line = Omit<QuoteLine, "grossJpy">;
const blankLine = (): Line => ({ kind: "base", description: "", quantity: 1, unitJpy: 0, taxRateBp: 1000, commissionable: true });
const plusDays = (n: number) => new Date(Date.now() + n * 86400000 + 9 * 3600000).toISOString().slice(0, 10);

/** Operations on one case: facts, status, the quote composer, share, payment, confirmation, the thread. */
export function OpsCaseDetail({ id }: { id: string }) {
  const [d, setD] = useState<CaseDetail | null>(null), [opt, setOpt] = useState<Options | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState(false), [f, setF] = useState({ experience: "", preferredDate: "", guests: "", lang: "", assignedOps: "", customerEmail: "", requirements: "" });
  const [status, setStatus] = useState(""), [reason, setReason] = useState("");
  const [composer, setComposer] = useState(false);
  const [qf, setQf] = useState({ title: "", experience: "", includes: "", excludes: "", onsiteNote: "", cancelTerms: "Free cancellation up to 7 days before the experience. Full refund if the session is cancelled by the venue.", confirmationNote: "", validUntil: plusDays(7), paymentMode: "stripe" });
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [pay, setPay] = useState({ amountJpy: "", reference: "", reason: "" });
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const load = useCallback(() => api<CaseDetail>("GET", `ops/cases/${id}`).then((x) => {
    setD(x);
    setF({ experience: x.case.experience_slug ?? "", preferredDate: x.case.preferred_date ?? "", guests: x.case.guests ? String(x.case.guests) : "", lang: x.case.lang ?? "", assignedOps: x.case.assigned_ops ?? "", customerEmail: x.case.customer_email ?? "", requirements: x.case.requirements ?? "" });
    setQf((v) => ({ ...v, experience: v.experience || x.case.experience_slug || "" }));
  }).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); api<Options>("GET", "ops/case-options").then(setOpt).catch(() => {}); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const c = d.case;
  const closed = ["performed", "cancelled", "unavailable"].includes(c.displayStatus);
  const current = d.quotes.find((q) => q.status === "shared");
  const draft = d.quotes.find((q) => q.status === "draft");
  const total = lines.filter((l) => l.kind !== "onsite").reduce((s, l) => s + l.unitJpy * l.quantity, 0);
  const prefill = (q: QuoteLine[]) => { setLines(q.map(({ grossJpy, ...l }) => { void grossJpy; return l; })); setComposer(true); };
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={<span>{c.public_ref} · {c.experienceTitle} <StatusBadge status={c.displayStatus} label={c.displayStatusJa} /></span>} actions={<Link className="pt-btn pt-btn-link pt-btn-small" href="/ops/cases/">一覧へ</Link>}>
        <p className="pt-small pt-muted">{c.entityName} / {c.siteName}（{c.sitePublicId}） · 登録 {jst(c.created_at)} by {c.createdBy ?? "—"} · 担当（運営） {c.assigned_ops ?? "—"}{c.status_reason ? ` · ${c.status_reason}` : ""}</p>
        {!edit ? <CaseFacts c={c} /> : (
          <div className="pt-form">
            <Field label="体験（自由相談に商品を割り当てる）"><select value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })}><option value="">未定</option>{opt?.experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>
            <Field label="希望日"><input type="date" value={f.preferredDate} onChange={(e) => setF({ ...f, preferredDate: e.target.value })} /></Field>
            <Field label="人数"><input type="number" min={1} max={99} value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} /></Field>
            <Field label="お客様の言語"><select value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value })}><option value="">—</option>{Object.entries(LANG_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="お客様のメール"><input type="email" value={f.customerEmail} onChange={(e) => setF({ ...f, customerEmail: e.target.value })} /></Field>
            <Field label="担当（運営）"><input value={f.assignedOps} onChange={(e) => setF({ ...f, assignedOps: e.target.value })} /></Field>
            <div className="pt-form-full"><Field label="希望条件・備考"><textarea value={f.requirements} onChange={(e) => setF({ ...f, requirements: e.target.value })} /></Field></div>
            <div className="pt-row pt-form-full"><Button onClick={() => run(async () => { await api("POST", `ops/cases/${id}/update`, { ...f, guests: f.guests ? Number(f.guests) : null }); setEdit(false); }, "保存しました。")}>保存</Button><Button kind="link" onClick={() => setEdit(false)}>やめる</Button></div>
          </div>
        )}
        {!closed && (
          <div className="pt-row">
            {!edit && <Button kind="secondary" small onClick={() => setEdit(true)}>案件を編集</Button>}
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="状態"><option value="">状態を変更…</option>{opt?.statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
            {["cancelled", "unavailable"].includes(status) && <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="理由（必須）" style={{ minWidth: 220 }} />}
            <Button small disabled={!status || (["cancelled", "unavailable"].includes(status) && !reason.trim())} onClick={() => run(async () => { await api("POST", `ops/cases/${id}/status`, { status, reason }); setStatus(""); setReason(""); }, "状態を変更しました。")}>変更</Button>
            {c.displayStatus === "paid" && <ReasonAction label="予約確定を登録" kind="primary" confirmLabel="確定する" placeholder="確保した枠・時間など（任意）" onConfirm={(note) => run(() => api("POST", `ops/cases/${id}/confirm`, { note }), "予約を確定し、パートナーに通知しました。")} />}
            {current && current.paymentMode !== "stripe" && c.displayStatus !== "paid" && (
              <details className="pt-details"><summary className="pt-btn pt-btn-secondary pt-btn-small">決済済みを登録（提携先払い・現地払い）</summary>
                <div className="pt-form" style={{ marginTop: 8 }}>
                  <Field label="金額（空欄なら見積もり総額）"><input type="number" value={pay.amountJpy} onChange={(e) => setPay({ ...pay, amountJpy: e.target.value })} placeholder={String(current.totalJpy)} /></Field>
                  <Field label="参照番号（領収書・予約番号）"><input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
                  <Field label="理由・根拠（必須）"><input value={pay.reason} onChange={(e) => setPay({ ...pay, reason: e.target.value })} /></Field>
                  <div className="pt-row"><Button small disabled={!pay.reason.trim()} onClick={() => run(() => api("POST", `ops/cases/${id}/payment`, { amountJpy: pay.amountJpy ? Number(pay.amountJpy) : undefined, reference: pay.reference, reason: pay.reason }), "決済済みにしました。")}>登録（経理権限）</Button></div>
                </div>
              </details>
            )}
          </div>
        )}
      </Card>

      <Card title="見積もり" actions={!closed && !["paid", "confirmed"].includes(c.displayStatus) && !composer ? <Button small onClick={() => { if (current) prefill(current.lines); else setComposer(true); }}>{d.quotes.length ? "新しい版を作る" : "見積もりを作る"}</Button> : undefined}>
        {composer && (
          <div className="pt-quote pt-quote-edit">
            <div className="pt-form">
              <Field label="件名（お客様に表示）" hint="空欄なら体験名をお客様の言語で表示します"><input value={qf.title} onChange={(e) => setQf({ ...qf, title: e.target.value })} placeholder={c.experienceTitle} /></Field>
              <Field label="対象の体験"><select value={qf.experience} onChange={(e) => setQf({ ...qf, experience: e.target.value })}><option value="">—</option>{opt?.experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>
              <Field label="お支払い方法"><select value={qf.paymentMode} onChange={(e) => setQf({ ...qf, paymentMode: e.target.value })}><option value="stripe">オンライン決済（カード）</option><option value="external">提携先への支払い（乗合バスなど、運営が決済済みを登録）</option><option value="none">決済なし（現地払いのみ）</option></select></Field>
              <Field label="有効期限"><input type="date" value={qf.validUntil} onChange={(e) => setQf({ ...qf, validUntil: e.target.value })} /></Field>
            </div>
            <table className="pt-table pt-table-compact">
              <thead><tr><th>区分</th><th>内容（お客様に表示）</th><th>単価（税込）</th><th>数量</th><th>税率</th><th>紹介対象</th><th /></tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td><select value={l.kind} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, kind: e.target.value as Line["kind"], commissionable: e.target.value === "onsite" ? false : x.commissionable } : x))}>{Object.entries(LINE_KIND_JA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
                    <td><input value={l.description} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} style={{ minWidth: 240 }} /></td>
                    <td><input type="number" min={0} value={l.unitJpy} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, unitJpy: Number(e.target.value) } : x))} style={{ width: 110 }} /></td>
                    <td><input type="number" min={1} max={99} value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, quantity: Number(e.target.value) } : x))} style={{ width: 64 }} /></td>
                    <td><select value={l.taxRateBp} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, taxRateBp: Number(e.target.value) } : x))}><option value={1000}>10%</option><option value={800}>8%</option><option value={0}>0%</option></select></td>
                    <td><input type="checkbox" checked={l.commissionable} disabled={l.kind === "onsite"} onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, commissionable: e.target.checked } : x))} /></td>
                    <td><Button kind="link" small onClick={() => setLines(lines.filter((_, j) => j !== i))}>削除</Button></td>
                  </tr>
                ))}
                <tr><td colSpan={7}><Button kind="secondary" small onClick={() => setLines([...lines, blankLine()])}>明細を追加</Button> <span className="pt-small">お支払い総額（税込） <b>{yen(total)}</b></span></td></tr>
              </tbody>
            </table>
            <div className="pt-form">
              <Field label="含まれるもの"><textarea value={qf.includes} onChange={(e) => setQf({ ...qf, includes: e.target.value })} /></Field>
              <Field label="含まれないもの"><textarea value={qf.excludes} onChange={(e) => setQf({ ...qf, excludes: e.target.value })} /></Field>
              <Field label="現地払いの金額・条件"><textarea value={qf.onsiteNote} onChange={(e) => setQf({ ...qf, onsiteNote: e.target.value })} /></Field>
              <Field label="キャンセル条件"><textarea value={qf.cancelTerms} onChange={(e) => setQf({ ...qf, cancelTerms: e.target.value })} /></Field>
              <Field label="空き枠・予約確定の条件"><textarea value={qf.confirmationNote} onChange={(e) => setQf({ ...qf, confirmationNote: e.target.value })} placeholder="決済後に会場の空きを確保して確定します、など" /></Field>
            </div>
            <p className="pt-note-box">お客様向けページには件名・明細・総額・含む/含まない・現地払い・キャンセル条件・有効期限・確定条件だけが載ります。紹介料・パートナー名・内部メモは表示されません。</p>
            <div className="pt-row">
              <Button disabled={!lines.length || lines.some((l) => !l.description.trim())} onClick={() => run(async () => { await api("POST", `ops/cases/${id}/quote`, { ...qf, lines }); setComposer(false); }, "下書きを作成しました。内容を確認して共有してください。")}>下書きとして保存</Button>
              <Button kind="link" onClick={() => setComposer(false)}>やめる</Button>
            </div>
          </div>
        )}
        {d.quotes.length === 0 && !composer && <p className="pt-small pt-muted">まだ見積もりはありません。</p>}
        {d.quotes.map((q) => (
          <QuoteCard key={q.id} q={q} kind="ops" actions={
            q.status === "draft" ? (
              <>
                <label className="pt-small"><input type="checkbox" checked={notifyCustomer} onChange={(e) => setNotifyCustomer(e.target.checked)} /> お客様にもメールで送る{c.customer_email ? `（${c.customer_email}）` : "（メール未登録）"}</label>
                <Button small onClick={() => run(async () => { const r = await api<{ expire: string; superseded: number }>("POST", `ops/quotes/${q.id}/share`, { notifyCustomer: notifyCustomer && !!c.customer_email }); if (r.expire === "failed") setErr("共有しましたが、旧版の Stripe セッションを失効できませんでした。Stripe ダッシュボードで確認してください。"); }, "共有しました。パートナーに通知済みです。")}>共有する</Button>
                <ReasonAction label="下書きを破棄" kind="danger" confirmLabel="破棄" placeholder="理由（任意）" onConfirm={(reason) => run(() => api("POST", `ops/quotes/${q.id}/void`, { reason }), "破棄しました。")} />
              </>
            ) : q.status === "shared" ? (
              <ReasonAction label="共有を取り下げる" kind="danger" confirmLabel="取り下げる" placeholder="理由（必須）" onConfirm={(reason) => run(() => api("POST", `ops/quotes/${q.id}/void`, { reason }), "取り下げました。決済リンクは失効しています。")} />
            ) : undefined
          } />
        ))}
        {draft && !composer && <p className="pt-small pt-muted">下書きは共有するまでパートナーに見えません。</p>}
      </Card>
      <Card title="予約台帳・紹介料"><CaseLedger d={d} kind="ops" /></Card>
      <Card title="連絡・資料"><CaseMessages kind="ops" caseId={id} messages={d.messages} onPosted={load} /></Card>
    </>
  );
}
