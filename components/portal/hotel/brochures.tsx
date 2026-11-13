"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { api, errorText } from "../client";
import { usePortal } from "../shell";
import { partnerAccess } from "../partner-access";
import { Badge, Button, Card, Field, Loading, Notice } from "../ui";
import { emptyBrochurePrice, brochurePriceReady, sameBrochurePrice, type BrochureBrand, type BrochureConfig, type BrochurePrice, type BrochureExperience } from "@/lib/portal/brochure-types";
import type { BrochureInput } from "@/lib/portal/brochure-render";
import { logoPng, prepareBrochure, downloadBrochure } from "./brochure-media";
import { BrochurePreview } from "./brochure-preview";

function brandReady(brand: BrochureBrand) {
  let urlValid=!brand.contactUrl;
  try {const url=new URL(brand.contactUrl);urlValid=url.protocol==='https:'&&!url.username&&!url.password;}catch{/* Empty URL is allowed. */}
  return !!brand.companyName.trim() && !!(brand.contactEmail||brand.contactPhone||brand.contactUrl) && urlValid && (!brand.contactEmail||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.contactEmail));
}
export function HotelBrochures() {
  const {hotel,lang,me}=usePortal();
  return hotel?<BrochureLibrary key={hotel.id} hotelId={hotel.id} en={lang==='en'} canBook={partnerAccess(hotel,me.memberships).cases}/>:null;
}
function BrochureLibrary({hotelId,en,canBook}:{hotelId:string;en:boolean;canBook:boolean}) {
  const [data,setData]=useState<BrochureConfig|null>(null),[brand,setBrand]=useState<BrochureBrand|null>(null),[prices,setPrices]=useState<Record<string,BrochurePrice>>({});
  const [pdfLang,setPdfLang]=useState<'ja'|'en'>(en?'en':'ja'),[search,setSearch]=useState(''),[filter,setFilter]=useState('all');
  const [brandOpen,setBrandOpen]=useState(false),[expanded,setExpanded]=useState<string|null>(null),[preview,setPreview]=useState<{input:BrochureInput;canDownload:boolean}|null>(null);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[pending,setPending]=useState(''),[retry,setRetry]=useState(0);
  const busy=!!pending;
  useEffect(()=>{let live=true;api<BrochureConfig>('GET',`hotel/brochures?hotel=${encodeURIComponent(hotelId)}`).then(d=>{
    if(!live)return;setData(d);setBrand(d.brand);setPrices(d.prices);setBrandOpen(!brandReady(d.brand));setError('');
    const requested=new URLSearchParams(window.location.search).get('experience');if(d.experiences.ja.some(x=>x.slug===requested))setSearch(requested!);
  }).catch(e=>{if(live)setError(errorText(e));});return()=>{live=false;};},[hotelId,retry]);
  const brandDirty=!!data&&JSON.stringify(brand)!==JSON.stringify(data.brand);
  const unsaved=brandDirty||Object.entries(prices).some(([slug,p])=>!sameBrochurePrice(p,data?.prices[slug]??emptyBrochurePrice(p.priceUnit)));
  useEffect(()=>{if(!unsaved)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[unsaved]);
  if(!data||!brand)return error?<><Notice tone="bad">{error}</Notice><Button onClick={()=>setRetry(n=>n+1)}>{en?'Retry':'再読み込み'}</Button></>:<Loading/>;
  const canBrand=data.canManage||data.demo,canPrice=data.canPrice||data.demo;
  const saved=(e:BrochureExperience)=>data.prices[e.slug]??emptyBrochurePrice(e.priceUnit);
  const draft=(e:BrochureExperience)=>prices[e.slug]??emptyBrochurePrice(e.priceUnit);
  const dirty=(e:BrochureExperience)=>!sameBrochurePrice(saved(e),draft(e));
  const editBrand=(key:keyof BrochureBrand,value:string|null)=>{setBrand({...brand,[key]:value});setNotice('');};
  const editPrice=(e:BrochureExperience,value:Partial<BrochurePrice>)=>{setPrices(p=>({...p,[e.slug]:{...(p[e.slug]??emptyBrochurePrice(e.priceUnit)),...value}}));setNotice('');};
  const saveBrand=async()=>{
    setPending('brand');setError('');setNotice('');
    try {const result=data.demo?{brand}:await api<{brand:BrochureBrand}>('POST','hotel/brochures/brand',{hotel:hotelId,...brand});setData(d=>d?{...d,brand:result.brand}:d);setBrand(result.brand);setBrandOpen(false);setNotice(en?'Company settings saved.':'会社設定を保存しました。');}
    catch(e){setError(errorText(e));}finally{setPending('');}
  };
  const savePrice=async(e:BrochureExperience)=>{
    const value=draft(e);setPending(e.slug);setError('');setNotice('');
    try {const result=data.demo?{price:value}:await api<{price:BrochurePrice}>('POST','hotel/brochures/price',{hotel:hotelId,slug:e.slug,...value});setData(d=>d?{...d,prices:{...d.prices,[e.slug]:result.price}}:d);setPrices(p=>({...p,[e.slug]:result.price}));setNotice(`${e.title}: ${data.demo?(en?'Applied in this demo session.':'このデモ内に反映しました。'):(en?'Saved.':'保存しました。')}`);}
    catch(err){setError(errorText(err));}finally{setPending('');}
  };
  const makeInput=(e:BrochureExperience):BrochureInput=>({brand,experience:data.experiences[pdfLang].find(x=>x.slug===e.slug)!,price:draft(e),lang:pdfLang,demo:data.demo});
  const ready=(e:BrochureExperience)=>brandReady(brand)&&!brandDirty&&!dirty(e)&&brochurePriceReady(saved(e));
  const download=async(e:BrochureExperience)=>{
    if(!ready(e))return;const input=makeInput(e);setPending(`pdf:${e.slug}`);setError('');
    try {const canvas=await prepareBrochure(input);downloadBrochure(canvas,input);}catch(err){setError(err instanceof Error?err.message:String(err));}finally{setPending('');}
  };
  const query=search.trim().toLocaleLowerCase(),options=data.experiences[en?'en':'ja'];
  const filtered=options.filter(e=>{
    const configured=brochurePriceReady(saved(e));
    const other=data.experiences[en?'ja':'en'].find(x=>x.slug===e.slug);
    return (!query||`${e.slug} ${e.title} ${other?.title??''}`.toLocaleLowerCase().includes(query))&&(filter==='all'||(filter==='configured'?configured:!configured));
  });
  return <>
    <p className="pt-page-description">{en?'Save your prices once, download your sales PDFs whenever needed, then submit a booking request when your guest is ready.':'体験ごとの案内価格を保存し、いつでも紹介PDFを再発行できます。お客様の希望が決まったら「代理予約」へ進めます。'}</p>
    {data.demo&&<Notice>{en?'Demo: settings apply only until you leave this page. Downloads are marked as samples.':'デモの変更はこの画面内のみ有効です。PDFにはサンプル表記が入ります。'}</Notice>}
    {error&&<Notice tone="bad">{error}</Notice>}{notice&&<Notice tone="ok">{notice}</Notice>}
    <details className="pt-brand-settings" open={brandOpen} onToggle={e=>setBrandOpen(e.currentTarget.open)}>
      <summary><span>{en?'Company & brand settings':'会社・ブランド設定'}</span><small>{brand.companyName} · {brandDirty?(en?'Unsaved changes':'未保存の変更あり'):brandReady(brand)?(en?'Configured':'設定済み'):(en?'Contact details needed':'問い合わせ先を設定')}</small></summary>
      <Card>
          {!canBrand&&<p className="pt-small pt-muted">{en?'Only a partner manager can edit company settings.':'会社情報の編集はパートナー管理者が行えます。'}</p>}
          <Field label={en?'Company name':'会社名・表示名'}><input value={brand.companyName} maxLength={80} disabled={!canBrand||busy} onChange={e=>editBrand('companyName',e.target.value)}/></Field>
          <Field label={en?'Logo (PNG / JPEG / WebP)':'ロゴ（PNG・JPEG・WebP）'} hint={en?'Optional. The image is resized automatically.':'任意。画像は自動で縮小します。'}><input type="file" accept="image/png,image/jpeg,image/webp" disabled={!canBrand||busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setPending('logo');setError('');try{editBrand('logoDataUrl',await logoPng(file));}catch(err){setError(err instanceof Error?err.message:String(err));}finally{setPending('');}}}/></Field>
          {brand.logoDataUrl&&<div className="pt-row"><img className="pt-brochure-logo" src={brand.logoDataUrl} alt={en?'Company logo':'会社ロゴ'}/>{canBrand&&<Button kind="link" disabled={busy} onClick={()=>editBrand('logoDataUrl',null)}>{en?'Remove logo':'ロゴを削除'}</Button>}</div>}
          <Field label={en?'Theme color':'テーマカラー'}><input type="color" value={brand.accentColor} disabled={!canBrand||busy} onChange={e=>editBrand('accentColor',e.target.value)}/></Field>
          <Field label={en?'Contact email':'お問い合わせメール'}><input type="email" value={brand.contactEmail} maxLength={120} disabled={!canBrand||busy} onChange={e=>editBrand('contactEmail',e.target.value)}/></Field>
          <Field label={en?'Contact phone':'お問い合わせ電話'}><input type="tel" value={brand.contactPhone} maxLength={40} disabled={!canBrand||busy} onChange={e=>editBrand('contactPhone',e.target.value)}/></Field>
          <Field label={en?'Company enquiry URL':'自社の問い合わせURL'} hint={en?'HTTPS. Included as a QR code in the PDF.':'https:// のURL。PDFに問い合わせ用QRを掲載します。'}><input type="url" value={brand.contactUrl} maxLength={240} disabled={!canBrand||busy} onChange={e=>editBrand('contactUrl',e.target.value)}/></Field>
          <Button disabled={!canBrand||busy||!brandDirty} onClick={()=>void saveBrand()}>{data.demo?(en?'Apply in demo':'デモに反映'):(en?'Save company settings':'会社設定を保存')}</Button>
      </Card>
    </details>
    {!brandReady(brand)&&<Notice>{en?'Set your company contact details to enable PDF downloads.':'PDF出力には、上の会社設定で問い合わせ先を1つ以上登録してください。'}</Notice>}
    {brandDirty&&<Notice>{en?'Save the company changes to enable downloads.':'会社情報に未保存の変更があります。保存するとPDFをダウンロードできます。'}</Notice>}
    <Card title={en?'Saved experience brochures':'体験別の紹介資料'}>
      <div className="pt-brochure-toolbar">
        <Field label={en?'Search experiences':'体験名で検索'}><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={en?'Experience name':'体験名'}/></Field>
        <Field label={en?'Configuration':'設定状態'}><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{en?'All experiences':'すべて'}</option><option value="configured">{en?'Configured':'設定済みのみ'}</option><option value="unset">{en?'Not configured':'未設定のみ'}</option></select></Field>
        <Field label={en?'Download PDF in':'ダウンロードするPDFの言語'}><select value={pdfLang} onChange={e=>setPdfLang(e.target.value as 'ja'|'en')}><option value="ja">日本語</option><option value="en">English</option></select></Field>
        {(search||filter!=='all')&&<Button kind="link" onClick={()=>{setSearch('');setFilter('all');}}>{en?'Clear filters':'条件を消す'}</Button>}
      </div>
      <p className="pt-small pt-muted">{en?'Prices are for sales materials only, separate from KAMEHAME booking, payment and commission amounts. Blank prices cannot be downloaded; select “Enquire” when you intentionally omit a price.':'案内価格は紹介資料用です。KAMEHAMEへの予約・決済額や紹介料とは別に保存します。入力忘れを防ぐため、価格を載せない場合は「お問い合わせ」を選択してください。'}</p>
      <p className="pt-small" role="status">{filtered.length}{en?' experiences':'件'} · {en?'PDF language':'PDF出力言語'}：{pdfLang==='ja'?'日本語':'English'}</p>
      <div className="pt-brochure-table-wrap" role="region" aria-label={en?'Experience brochure settings':'体験別の紹介資料設定'} tabIndex={0}>
        <table className="pt-table pt-brochure-table"><thead><tr><th>{en?'Experience':'体験'}</th><th>{en?'Your price (tax incl.)':'案内価格（税込）'}</th><th>{en?'Unit':'単位'}</th><th>{en?'Status':'設定状態'}</th><th>{en?'PDF & details':'資料・補足'}</th><th>{en?'Booking':'予約'}</th></tr></thead><tbody>
          {filtered.map(e=>{const p=draft(e),changed=dirty(e),valid=brochurePriceReady(p),isUnset=p.priceMode==='unset';return <Fragment key={e.slug}>
            <tr><th scope="row"><span className="pt-brochure-title">{e.title}</span><small>{en?'Listed base price':'掲載基本料金'} {e.basePrice} / {e.priceUnit==='group'?(en?'group':'1組'):(en?'person':'1名')}</small></th>
              <td><div className="pt-brochure-price-input"><select aria-label={`${e.title}: ${en?'Price display':'価格表示'}`} value={p.priceMode} disabled={!canPrice||busy} onChange={event=>{const mode=event.target.value as BrochurePrice['priceMode'];editPrice(e,{priceMode:mode,priceJpy:mode==='fixed'?p.priceJpy:null});}}><option value="unset">{en?'Not configured':'未設定'}</option><option value="fixed">{en?'Set price':'金額を設定'}</option><option value="inquiry">{en?'Enquire':'お問い合わせ'}</option></select>
                {p.priceMode==='fixed'&&<input aria-label={`${e.title}: ${en?'Quoted price JPY':'案内価格・円'}`} type="number" min="1" max="100000000" step="1" inputMode="numeric" value={p.priceJpy??''} placeholder={en?'Enter price':'金額を入力'} disabled={!canPrice||busy} onChange={event=>editPrice(e,{priceJpy:event.target.value===''?null:Number(event.target.value)})}/>}
                {p.priceMode==='fixed'&&!valid&&<small className="pt-brochure-invalid">{en?'Enter a whole-yen amount':'1円以上の整数を入力'}</small>}
              </div></td>
              <td><select aria-label={`${e.title}: ${en?'Unit':'料金単位'}`} value={p.priceUnit} disabled={!canPrice||busy} onChange={event=>editPrice(e,{priceUnit:event.target.value as 'person'|'group'})}><option value="person">{en?'Per person':'1名'}</option><option value="group">{en?'Per group':'1組'}</option></select></td>
              <td><div className="pt-brochure-row-status"><Badge tone={changed?'warn':valid?'ok':'neutral'}>{changed?(en?'Unsaved':'未保存'):valid?(p.priceMode==='inquiry'?(en?'Enquire':'お問い合わせ'):(en?'Configured':'設定済み')):(en?'Not configured':'未設定')}</Badge>
                {changed&&canPrice&&<><Button small disabled={busy||(!valid&&!isUnset)} onClick={()=>void savePrice(e)}>{pending===e.slug?(en?'Saving…':'保存中…'):data.demo?(en?'Apply':'反映'):(en?'Save':'保存')}</Button><Button small kind="link" disabled={busy} onClick={()=>setPrices(old=>({...old,[e.slug]:saved(e)}))}>{en?'Revert':'戻す'}</Button></>}
              </div></td>
              <td><div className="pt-brochure-row-actions"><Button small kind="secondary" disabled={busy||!valid} onClick={()=>setPreview({input:makeInput(e),canDownload:ready(e)})}>{en?'Preview':'プレビュー'}</Button><Button small disabled={busy||!ready(e)} onClick={()=>void download(e)}>{pending===`pdf:${e.slug}`?(en?'Creating…':'作成中…'):'PDF'}</Button><button type="button" className="pt-btn pt-btn-link pt-btn-small" aria-expanded={expanded===e.slug} aria-controls={`notes-${e.slug}`} onClick={()=>setExpanded(expanded===e.slug?null:e.slug)}>{en?'Price notes':'料金の補足'}</button></div></td>
              <td>{canBook?<Link className="pt-btn pt-btn-secondary pt-btn-small" href={`/partner/cases/new/?experience=${encodeURIComponent(e.slug)}`}>{en?'Request booking':'代理予約'}</Link>:<span className="pt-muted">—</span>}</td>
            </tr>
            {expanded===e.slug&&<tr id={`notes-${e.slug}`} className="pt-brochure-notes-row"><td colSpan={6}><div className="pt-brochure-notes"><b>{e.title}</b><p className="pt-small pt-muted">{en?'Notes are saved separately for each PDF language. They are not automatically translated.':'料金補足は日本語・英語を別々に保存します。自動翻訳は行いません。'}</p><Field label="料金補足（日本語）"><input value={p.priceNote} maxLength={180} disabled={!canPrice||busy} placeholder="含まれる内容・人数条件・有効期限など" onChange={event=>editPrice(e,{priceNote:event.target.value})}/></Field><Field label="Price note (English)"><input value={p.priceNoteEn} maxLength={180} disabled={!canPrice||busy} placeholder="Inclusions, party size or validity" onChange={event=>editPrice(e,{priceNoteEn:event.target.value})}/></Field>{changed&&canPrice&&<Button small disabled={busy||(!valid&&!isUnset)} onClick={()=>void savePrice(e)}>{data.demo?(en?'Apply changes':'変更を反映'):(en?'Save this row':'この行を保存')}</Button>}</div></td></tr>}
          </Fragment>;})}
          {!filtered.length&&<tr><td colSpan={6} className="pt-empty">{en?'No matching experiences.':'該当する体験がありません。'}</td></tr>}
        </tbody></table>
      </div>
      <p className="pt-small pt-muted">{en?'Scroll sideways for more columns. Saved settings are reused for future PDFs; catalogue and company updates are reflected when you download again.':'左右にスクロールして操作できます。保存した設定を次回も使えます。体験内容・会社情報の更新は、再ダウンロード時に反映されます。'}</p>
    </Card>
    {preview&&<BrochurePreview input={preview.input} canDownload={preview.canDownload} en={en} onClose={()=>setPreview(null)}/>}
  </>;
}
