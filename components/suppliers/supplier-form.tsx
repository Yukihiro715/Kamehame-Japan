"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, Check, Save } from "lucide-react";
import { SUPPLIER_POLICY_VERSION, SUPPLIER_PRICE_NOTE, SUPPLIER_SCOPE_NOTE } from "@/lib/supplier-policy";

const EMPTY = { company: "", name: "", email: "", phone: "", location: "", websiteUrl: "", title: "", category: "", description: "", duration: "", capacity: "", availability: "", languages: "", meetingPoint: "", included: "", excluded: "", cancellation: "", priceUnit: "1名あたり（税込）", retailPrice: "", wholesalePrice: "", photosUrl: "", notes: "" };
type Values = typeof EMPTY;
const DRAFT_KEY = "kh-supplier-draft-v1";
const LABELS: Record<keyof Values, string> = { company: "会社・施設名", name: "ご担当者名", email: "メールアドレス", phone: "電話番号", location: "所在地（市区町村まで）", websiteUrl: "公式サイト・紹介ページURL", title: "体験名", category: "体験の種類", description: "体験の内容・魅力", duration: "所要時間", capacity: "最少・最大人数", availability: "受入可能な曜日・時間／予約締切", languages: "当日の対応言語・通訳の必要性", meetingPoint: "開催場所・集合場所", included: "料金に含まれるもの", excluded: "含まれないもの・追加料金", cancellation: "キャンセル条件", priceUnit: "料金の単位・人数条件", retailPrice: "一般販売価格（税込・円）", wholesalePrice: "希望卸価格／貴社受取額（税込・円）", photosUrl: "写真・資料の共有URL", notes: "ご相談・補足事項" };
const LIMITS: Partial<Record<keyof Values, number>> = { company: 160, name: 120, email: 200, phone: 60, location: 300, websiteUrl: 1000, title: 160, category: 80, description: 4000, duration: 160, capacity: 160, availability: 1000, languages: 300, meetingPoint: 1000, included: 1500, excluded: 1500, cancellation: 2000, priceUnit: 160, photosUrl: 1000, notes: 3000 };

export function SupplierForm() {
  const [kind] = useState<"apply" | "consult">("apply");
  const [values, setValues] = useState<Values>(EMPTY);
  const [step, setStep] = useState(0), [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [saved, setSaved] = useState(""), [hasDraft, setHasDraft] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const request = useRef<{ id: string; content: string } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser storage is read only after hydration
    try { setHasDraft(!!localStorage.getItem(DRAFT_KEY)); } catch { /* Storage is optional. */ }
  }, []);
  function changeStep(n: number) { setStep(n); setError(""); requestAnimationFrame(() => heading.current?.focus()); }
  function save() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, kind })); setHasDraft(true); setSaved("この端末に下書きを保存しました。共有端末では、使用後に削除してください。"); }
    catch { setSaved("この端末では保存できません。入力内容は画面に残っています。"); }
  }
  function restore() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
      if (!d.values || typeof d.values !== "object") throw new Error();
      setValues(Object.fromEntries(Object.keys(EMPTY).map(k => [k, typeof d.values[k] === "string" ? d.values[k] : EMPTY[k as keyof Values]])) as Values);
      setConsent(false); changeStep(0); setSaved("下書きを復元しました。内容・掲載条件をご確認ください。");
    } catch { setSaved("下書きを復元できませんでした。"); }
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); setHasDraft(false); setSaved("保存済みの下書きを削除しました。"); } catch { setSaved("下書きを削除できませんでした。"); } }
  function field(key: keyof Values, options: { required?: boolean; area?: boolean; placeholder?: string; hint?: ReactNode; type?: string; full?: boolean } = {}) {
    const props = { id: `supplier-${key}`, name: key, value: values[key], required: options.required, maxLength: LIMITS[key], placeholder: options.placeholder, onChange: (e: { target: { value: string } }) => setValues(v => ({ ...v, [key]: e.target.value })), "aria-describedby": options.hint ? `supplier-${key}-hint` : undefined };
    return <label className={`sp-field${options.full || options.area ? " sp-full" : ""}`} key={key} htmlFor={props.id}><span>{LABELS[key]} <small>{options.required ? "必須" : "任意"}</small></span>{options.area ? <textarea {...props} rows={3}/> : <input {...props} type={options.type || "text"} {...(options.type === "number" ? { min: 1, max: 100000000, step: 1, inputMode: "numeric" as const } : {})}/>} {options.hint && <em id={`supplier-${key}-hint`}>{options.hint}</em>}</label>;
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (kind === "apply" && step < 2) { changeStep(step + 1); return; }
    if (!consent || busy) return;
    setBusy(true); setError("");
    const data = { ...values, kind, consent, policyVersion: SUPPLIER_POLICY_VERSION, website: honeypot };
    const content = JSON.stringify(data);
    if (!request.current || request.current.content !== content) request.current = { id: crypto.randomUUID(), content };
    try {
      const response = await fetch("/api/supplier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, requestId: request.current.id }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.reference) throw new Error(response.status === 429 ? "送信が続いています。しばらく時間をおいてお試しください。" : "送信を確認できませんでした。入力内容を残したまま再送するか、hello@kamehame-japan.comへご連絡ください。");
      setReceipt(result.reference); try { localStorage.removeItem(DRAFT_KEY); } catch { /* optional */ }
      requestAnimationFrame(() => document.getElementById("supplier-received")?.focus());
    } catch (err) { setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "送信結果を確認できませんでした。入力内容は残っていますので、再送をお試しください。"); }
    finally { setBusy(false); }
  }
  if (receipt) return <div className="sp-success" id="supplier-received" tabIndex={-1}><Check size={32}/><h3>体験情報を受け付けました。</h3><p>担当者が体験内容・受入条件・希望卸価格を確認し、メールでご連絡します。審査と条件の合意後に掲載します。</p><p>受付番号：<code>{receipt}</code></p><p>内容の追加・修正は、受付番号を添えてこちらへ： <a href="mailto:hello@kamehame-japan.com">hello@kamehame-japan.com</a> 。</p><button className="sp-button sp-secondary" onClick={() => { setReceipt(""); setValues({ ...EMPTY, company: values.company, name: values.name, email: values.email, phone: values.phone, location: values.location, websiteUrl: values.websiteUrl }); setConsent(false); setStep(0); request.current = null; }}>別の体験を申請する <ArrowRight size={16}/></button></div>;
  return <div className="sp-form-card">
    {hasDraft && <div className="sp-draft"><span>この端末に保存した下書きがあります。</span><button type="button" onClick={restore}>復元する</button><button type="button" onClick={clearDraft}>削除</button></div>}
    {kind === "apply" && <ol className="sp-progress">{["事業者情報", "体験の内容", "料金・確認"].map((x, i) => <li key={x} aria-current={step === i ? "step" : undefined} className={i <= step ? "is-active" : ""}><span>{i + 1}</span>{x}</li>)}</ol>}
    <h3 tabIndex={-1} ref={heading}>{kind === "consult" ? "まずは、体験について教えてください。" : ["事業者様について", "どんな体験を届けたいですか？", "受取額を確認して、申請へ。"][step]}</h3>
    <p className="sp-help">日本語でご入力ください。連絡先・卸価格は一般のお客様には公開されません。</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <div className="sp-honey" aria-hidden="true"><label>Website<input value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off"/></label></div>
        <div className="sp-form-grid">
          {(step === 0 || kind === "consult") && <>
            {field("company", { required: true, placeholder: "例：○○工房" })}{field("name", { required: true })}
            {field("email", { required: true, type: "email" })}{field("phone", { type: "tel" })}
            {field("location", { required: true, placeholder: "例：東京都台東区" })}{field("category", { required: true, placeholder: "例：料理、茶道、剣道、工芸、ゴルフ" })}
            {field("websiteUrl", { type: "url", full: true, placeholder: "https://", hint: "既存の体験紹介ページでも構いません。" })}
          </>}
          {kind === "apply" && step === 1 && <>
            {field("title", { required: true, full: true })}{field("description", { required: true, area: true, placeholder: "体験の流れや、ここでしか味わえない魅力をお知らせください。" })}
            {field("duration", { required: true, placeholder: "例：約90分" })}{field("capacity", { required: true, placeholder: "例：2〜8名／貸切可" })}
            {field("availability", { required: true, area: true, placeholder: "例：平日10〜16時。予約は3日前まで。空き状況は都度確認。" })}
            {field("languages", { required: true, full: true, placeholder: "例：日本語のみ。英語の通訳が必要。" })}
            {field("meetingPoint", { required: true, area: true })}{field("included", { required: true, area: true, placeholder: "例：材料費・道具レンタル・お土産" })}
            {field("excluded", { area: true })}{field("photosUrl", { type: "url", full: true, placeholder: "https://", hint: "Google Drive等の写真・資料の共有リンク。閲覧可能な設定にしてください。未準備の場合は後日ご提出いただけます。掲載に使用できる素材をご用意ください。" })}
          </>}
          {kind === "apply" && step === 2 && <>
            {field("priceUnit", { required: true, full: true, hint: "一般価格と卸価格は、同じ人数・同じ内容の税込金額で入力してください。" })}
            {field("retailPrice", { required: true, type: "number" })}{field("wholesalePrice", { required: true, type: "number" })}
            <div className="sp-price-helper sp-full"><span>一般価格の25％引きの目安 <b>{Number(values.retailPrice) > 0 ? `¥${Math.round(Number(values.retailPrice) * .75).toLocaleString("ja-JP")}` : "—"}</b></span><button type="button" disabled={!Number(values.retailPrice)} onClick={() => setValues(v => ({ ...v, wholesalePrice: String(Math.round(Number(v.retailPrice) * .75)) }))}>この目安を入力</button><p>推奨値です。希望する卸価格に変更できます。条件が合わない場合もご相談ください。</p></div>
            <p className="sp-price-note sp-full">{SUPPLIER_PRICE_NOTE}</p>
            {field("cancellation", { required: true, area: true, placeholder: "例：3日前まで無料、前日50％、当日100％。天候等による中止条件もご記入ください。" })}
          </>}
          {(kind === "consult" || step === 2) && <>
            {field("notes", { area: true, placeholder: "複数プラン、人数別料金、掲載にあたってのご希望など" })}
            {kind === "consult" && <p className="sp-price-note sp-full">{SUPPLIER_PRICE_NOTE}</p>}
            {kind === "apply" && <div className="sp-review sp-full"><b>送信内容</b><p>{values.company} ／ {values.name}<br/>{values.email}<br/>{values.title} ／ {values.duration}<br/>{values.capacity} ／ {values.languages}</p><button type="button" onClick={() => changeStep(0)}>事業者情報を修正</button><button type="button" onClick={() => changeStep(1)}>体験内容を修正</button></div>}
            <div className="sp-agreement sp-full"><p>{SUPPLIER_SCOPE_NOTE}</p><p>掲載内容・卸価格・販売価格・支払条件は、審査後に確認します。申請のみで掲載・契約が確定することはありません。</p><label><input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}/><span>上記の価格・対応範囲と<a href="https://kamehame-japan.com/ja/privacy/" target="_blank" rel="noreferrer">プライバシーポリシー</a>を確認し、申請への対応のための情報利用に同意します。</span></label></div>
          </>}
        </div>
        {error && <p className="sp-error" role="alert">{error}</p>}
        <div className="sp-form-actions"><div>{kind === "apply" && step > 0 && <button type="button" className="sp-text-button" onClick={() => changeStep(step - 1)}>戻る</button>}<button type="button" className="sp-text-button" onClick={save}><Save size={15}/> 下書き保存</button></div><button type="submit" className="sp-button">{busy ? "送信中…" : kind === "apply" && step < 2 ? "次へ" : kind === "apply" ? "この内容で掲載を申請する" : "相談を送信する"}<ArrowRight size={17}/></button></div>
      </fieldset>
      {saved && <p role="status" className="sp-help">{saved}</p>}
    </form>
  </div>;
}
