"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, FileText } from "lucide-react";
import { DOCUMENT_KINDS, EXTRA_LABELS, MAX_PLANS, MAX_TIERS, PRICE_TYPES, emptyPlan, emptyTier, type SupplierPlan, type SupplierPricing, type SupplierTier } from "@/lib/supplier-pricing";
import { SUPPLIER_FILE_ACCEPT, supplierFileError, type SupplierAttachment } from "@/lib/supplier-attachments";

type Props = { value: SupplierPricing; onChange: (value: SupplierPricing) => void; files: SupplierAttachment[]; onFiles: (files: SupplierAttachment[]) => void; onReading: (reading: boolean) => void; missingFiles: string[]; onDismissMissing: () => void };
type InputProps = { id: string; label: string; value: string; onChange: (value: string) => void; required?: boolean; number?: boolean; area?: boolean; max?: number; min?: number; placeholder?: string; hint?: string };
function Input({ id, label, value, onChange, required, number, area, max, min = 1, placeholder, hint }: InputProps) {
  const props = { id, value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), required, placeholder, "aria-describedby": hint ? `${id}-hint` : undefined };
  return <label className={`sp-field${area ? " sp-full" : ""}`} htmlFor={id}><span>{label}<small>{required ? "必須" : "任意"}</small></span>
    {area ? <textarea {...props} rows={3} maxLength={max || 1500}/> : <input {...props} type={number ? "number" : "text"} {...(number ? { min, max: max || 100000000, step: 1, inputMode: "numeric" as const } : { maxLength: max || 160 })}/>}
    {hint && <em id={`${id}-hint`}>{hint}</em>}
  </label>;
}
function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className="sp-price-toggle"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/><span>{children}</span></label>;
}
function PricePair({ id, plan, retail, wholesale, onChange, unit, extra = false }: { id: string; plan: SupplierPlan; retail: string; wholesale: string; onChange: (patch: { retail?: string; wholesale?: string }) => void; unit: string; extra?: boolean }) {
  return <div className="sp-price-pair">
    {!plan.retailUnavailable && <Input id={`${id}-retail`} label={`一般価格（円${unit}・税込）`} value={retail} onChange={v => onChange({ retail: v })} required number min={extra ? 0 : 1}/>}
    {!plan.negotiable && <Input id={`${id}-wholesale`} label={`貴社へのお支払額（希望・円${unit}・税込）`} value={wholesale} onChange={v => onChange({ wholesale: v })} required number min={extra ? 0 : 1}/>}
    {!plan.retailUnavailable && !plan.negotiable && /^\d+$/.test(retail) && Number(retail) > 0 && <div className="sp-price-suggestion"><span>25％引きの目安：<b>{Math.round(Number(retail) * .75).toLocaleString("ja-JP")}円{unit}</b></span><button type="button" onClick={() => onChange({ wholesale: String(Math.round(Number(retail) * .75)) })}>お支払額に入力</button></div>}
  </div>;
}

export function PricingFields({ value, onChange, files, onFiles, onReading, missingFiles, onDismissMissing }: Props) {
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const changePlan = (index: number, patch: Partial<SupplierPlan>) => onChange({ ...value, plans: value.plans.map((p, i) => i === index ? { ...p, ...patch } : p) });
  async function selectFiles(list: FileList | null) {
    if (!list?.length) return;
    const selected = Array.from(list);
    const error = supplierFileError([...files.map(f => ({ name: f.filename, size: f.content.length / 4 * 3 - (f.content.endsWith("==") ? 2 : f.content.endsWith("=") ? 1 : 0) })), ...selected]);
    setFileError(error);
    if (error) { if (fileInput.current) fileInput.current.value = ""; return; }
    setReading(true); onReading(true);
    try {
      const added = await Promise.all(selected.map(file => new Promise<SupplierAttachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error());
        reader.onload = () => resolve({ filename: file.name, content: String(reader.result).split(",")[1] });
        reader.readAsDataURL(file);
      })));
      onFiles([...files, ...added]);
    } catch { setFileError("ファイルを読み込めませんでした。もう一度選択してください。"); }
    finally { setReading(false); onReading(false); if (fileInput.current) fileInput.current.value = ""; }
  }
  return <div className="sp-full sp-pricing-fields">
    <fieldset className="sp-price-mode"><legend>料金の提出方法</legend><div>
      {([ ["plans", "フォームに入力", "人数別・貸切などを設定"], ["document", "料金表を提出", "ファイル添付・共有URL"] ] as const).map(([mode, title, sub]) => <label key={mode} className={value.mode === mode ? "is-selected" : ""}><input type="radio" name="pricing-mode" value={mode} checked={value.mode === mode} onChange={() => onChange({ ...value, mode })}/><span><strong>{title}</strong><small>{sub}</small></span></label>)}
    </div></fieldset>
    {value.mode === "plans" ? <>
      <p className="sp-help">まず1名あたりの料金欄を表示しています。貸切・人数別・個別見積もり等は「料金の決まり方」で切り替えられます。すべて税込でご入力ください。</p>
      {value.plans.map((plan, index) => {
        const id = `price-${index}`;
        const updateTier = (j: number, patch: Partial<SupplierTier>) => changePlan(index, { tiers: plan.tiers.map((t, i) => i === j ? { ...t, ...patch } : t) });
        return <section className="sp-plan-card" key={index} aria-labelledby={`${id}-heading`}>
          <div className="sp-plan-heading"><h4 id={`${id}-heading`}>プラン {String(index + 1).padStart(2, "0")}</h4>{value.plans.length > 1 && <button type="button" className="sp-price-remove" aria-label={`プラン${index + 1}を削除`} onClick={() => onChange({ ...value, plans: value.plans.filter((_, i) => i !== index) })}><Trash2 size={15}/>削除</button>}</div>
          <div className="sp-price-grid">
            <Input id={`${id}-name`} label="プラン名" value={plan.name} onChange={v => changePlan(index, { name: v })} required placeholder="例：通常参加／貸切90分"/>
            <label className="sp-field" htmlFor={`${id}-type`}><span>料金の決まり方<small>必須</small></span><select id={`${id}-type`} required value={plan.type} onChange={e => changePlan(index, { type: e.target.value as SupplierPlan["type"] })}><option value="">選択してください</option>{Object.entries(PRICE_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          </div>
          {plan.type && plan.type !== "quote" && <>
            <div className="sp-price-toggles"><Toggle checked={plan.retailUnavailable} onChange={v => changePlan(index, { retailUnavailable: v })}>一般のお客様向けの定価がない</Toggle><Toggle checked={plan.negotiable} onChange={v => changePlan(index, { negotiable: v })}>貴社へのお支払額は相談して決めたい</Toggle><p className="sp-help sp-full">自社サイト等で通常の販売価格を決めていない場合に選択してください。KAMEHAMEでの販売価格と貴社へのお支払額は、掲載前に相談して決めます。人数や内容によって金額が変わる場合は「個別見積もり」を選べます。</p></div>
            {plan.type === "tiered" ? <div className="sp-tier-list"><p className="sp-help">予約人数に応じて、参加者全員の1名あたり単価が変わる料金です。超過人数だけに追加する場合は「基本料金＋追加人数分」を選んでください。</p>
              {plan.tiers.map((tier, j) => <div className="sp-tier-card" key={j}><div className="sp-plan-heading"><h5>人数帯 {j + 1}</h5>{plan.tiers.length > 1 && <button type="button" className="sp-price-remove" aria-label={`プラン${index + 1}の人数帯${j + 1}を削除`} onClick={() => changePlan(index, { tiers: plan.tiers.filter((_, i) => i !== j) })}><Trash2 size={14}/>削除</button>}</div><div className="sp-price-grid">
                <Input id={`${id}-tier-${j}-min`} label="最少人数（名）" value={tier.minPeople} onChange={v => updateTier(j, { minPeople: v })} number required max={10000}/>
                <Input id={`${id}-tier-${j}-max`} label="最大人数（名）" value={tier.maxPeople} onChange={v => updateTier(j, { maxPeople: v })} number required max={10000}/>
              </div><PricePair id={`${id}-tier-${j}`} plan={plan} retail={tier.retail} wholesale={tier.wholesale} onChange={v => updateTier(j, v)} unit="／名"/></div>)}
              {plan.tiers.length < MAX_TIERS && <button type="button" className="sp-price-add" onClick={() => changePlan(index, { tiers: [...plan.tiers, emptyTier()] })}><Plus size={16}/>人数帯を追加</button>}
            </div> : <>
              <div className="sp-price-grid"><Input id={`${id}-min`} label="申込可能な最少人数（名）" value={plan.minPeople} onChange={v => changePlan(index, { minPeople: v })} required number max={10000}/><Input id={`${id}-max`} label="申込可能な最大人数（名）" value={plan.maxPeople} onChange={v => changePlan(index, { maxPeople: v })} required number max={10000}/></div>
              {plan.type === "private" && <p className="sp-help sp-unit-note">人数の範囲内で共通の、1組の合計料金を入力してください。</p>}
              {plan.type === "base_plus" && <><p className="sp-help sp-unit-note">まず1組の基本料金を入力し、次に含まれる人数と追加1名の料金を設定します。</p><Input id={`${id}-included`} label="基本料金に含まれる人数（名）" value={plan.includedPeople} onChange={v => changePlan(index, { includedPeople: v })} number required min={0} max={10000} hint="全員分に人数料金を加算する場合は0名。例：6名まで基本料金なら6名。"/></>}
              <PricePair id={id} plan={plan} retail={plan.retail} wholesale={plan.wholesale} onChange={v => changePlan(index, v)} unit={plan.type === "per_person" ? "／名" : "／組"}/>
              {plan.type === "base_plus" && <div className="sp-extra-charge"><h5>追加1名あたりの料金</h5><p className="sp-help">含まれる人数を超えた人数分だけ加算します。</p><PricePair id={`${id}-extra`} plan={plan} retail={plan.extraRetail} wholesale={plan.extraWholesale} onChange={v => changePlan(index, { ...(v.retail !== undefined ? { extraRetail: v.retail } : {}), ...(v.wholesale !== undefined ? { extraWholesale: v.wholesale } : {}) })} unit="／追加1名" extra/></div>}
            </>}
          </>}
          {plan.type && <div className="sp-plan-conditions"><Input id={`${id}-conditions`} label={plan.type === "quote" ? "見積もりに必要な条件・参考料金" : "このプランの条件・補足"} value={plan.conditions} onChange={v => changePlan(index, { conditions: v })} area required={plan.type === "quote"} placeholder={plan.type === "quote" ? "例：人数・希望日・体験時間によってお見積もり。参考料金があれば一般価格／貴社へのお支払額を区別して記載。" : "例：90分のプラン。貸切は平日のみ。"}/></div>}
        </section>;
      })}
      {value.plans.length < MAX_PLANS && <button className="sp-price-add sp-add-plan" type="button" onClick={() => onChange({ ...value, plans: [...value.plans, emptyPlan("")] })}><Plus size={18}/>料金プランを追加</button>}
    </> : <section className="sp-plan-card sp-document-card" aria-label="料金表の提出">
      <div className="sp-plan-heading"><h4><FileText size={18}/>お持ちの料金表をお送りください</h4></div>
      <p className="sp-help">添付または共有URLのどちらかで提出できます。金額の転記は不要です。担当者が内容を整理し、掲載前に確認します。</p>
      <label className="sp-field" htmlFor="price-doc-kind"><span>資料に記載されている価格<small>必須</small></span><select id="price-doc-kind" value={value.document.priceKind} required onChange={e => onChange({ ...value, document: { ...value.document, priceKind: e.target.value as SupplierPricing["document"]["priceKind"] } })}><option value="">選択してください</option>{Object.entries(DOCUMENT_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="sp-field sp-file-picker" htmlFor="price-files"><span>料金表のファイル</span><input ref={fileInput} id="price-files" type="file" accept={SUPPLIER_FILE_ACCEPT} multiple disabled={reading} onChange={e => void selectFiles(e.target.files)}/><em>PDF・Excel（xlsx／xls）・PNG・JPEG・WebP。3件まで、1件5MB・合計8MBまで。</em></label>
      {reading && <p role="status" className="sp-help">ファイルを読み込んでいます…</p>}
      {!!files.length && <ul className="sp-price-files">{files.map((f, i) => <li key={i}><span><FileText size={16}/>{f.filename}</span><button type="button" disabled={reading} className="sp-price-remove" onClick={() => onFiles(files.filter((_, j) => i !== j))} aria-label={`${f.filename}を削除`}>削除</button></li>)}</ul>}
      {!!missingFiles.length && <p className="sp-file-notice" role="status">下書きには添付ファイルを保存していません。再選択してください：{missingFiles.join("、")}<br/><button type="button" className="sp-price-remove" onClick={onDismissMissing}>添付せずに進む</button></p>}
      {fileError && <p className="sp-error" role="alert">{fileError}</p>}
      <Input id="price-doc-url" label="料金表の共有URL" value={value.document.url} max={1000} onChange={v => onChange({ ...value, document: { ...value.document, url: v } })} placeholder="https://" hint="Google Driveなど。担当者が閲覧できる設定にしてください。"/>
      <div className="sp-price-toggles"><Toggle checked={value.document.negotiable} onChange={v => onChange({ ...value, document: { ...value.document, negotiable: v } })}>貴社へのお支払額は相談して決めたい</Toggle></div>
      <Input id="price-doc-notes" label="貴社へのお支払額・料金表の補足" value={value.document.receiptNotes} onChange={v => onChange({ ...value, document: { ...value.document, receiptNotes: v } })} area max={2000} required={value.document.priceKind === "retail" && !value.document.negotiable} placeholder="例：当社からのお支払額は一般価格の25％引きを希望。貸切料金は別紙に記載。"/>
    </section>}
    <details className="sp-price-extras"><summary>追加の料金条件を設定する <span>任意</span></summary><p className="sp-help">該当する項目だけご入力ください。金額は一般価格／貴社へのお支払額と、1名／1組などの単位を区別してください。</p><div className="sp-price-grid">{(Object.keys(EXTRA_LABELS) as (keyof typeof EXTRA_LABELS)[]).map(key => <Input key={key} id={`price-extra-${key}`} label={EXTRA_LABELS[key]} value={value.extras[key]} onChange={v => onChange({ ...value, extras: { ...value.extras, [key]: v } })} area max={key === "options" || key === "other" ? 2000 : key === "minimum" ? 1000 : 1500} placeholder={key === "children" ? "例：6〜12歳は一般5,000円／名、お支払額3,750円／名。5歳以下は無料。" : key === "seasonal" ? "例：土日祝は一般・受取額ともに1組あたり2,000円追加。" : undefined}/>)}</div></details>
  </div>;
}
