"use client";

import { useEffect, useRef, useState } from "react";
import { api, errorText } from "../client";
import { usePortal } from "../shell";
import { Button, Card, Field, Loading, Notice } from "../ui";
import type { BrochureBrand, BrochureConfig, BrochurePrice } from "@/lib/portal/brochure-types";
import { BROCHURE_WIDTH, BROCHURE_HEIGHT, brochurePdf, renderBrochure } from "@/lib/portal/brochure-render";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>reject(new Error('画像の読み込みに失敗しました / Image loading timed out.')),15000);image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(new Error('画像を読み込めません / Could not load an image.'));};image.src=src;});
}
async function logoPng(file: File) {
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024)throw new Error('PNG・JPEG・WebP（8MB以下）を選択してください / Choose a PNG, JPEG or WebP under 8MB.');
  const url=URL.createObjectURL(file);
  try {
    const img=await loadImage(url);
    if(img.width*img.height>40000000)throw new Error('画像サイズを小さくしてください / Please use a smaller image.');
    for(const max of [600,360,240]) {
      const scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height);
      const png=canvas.toDataURL('image/png');if(png.length<=280000)return png;
    }
    throw new Error('ロゴを小さくしてください / Please use a smaller logo.');
  } finally {URL.revokeObjectURL(url);}
}

export function HotelBrochures() {
  const { hotel, lang } = usePortal();
  return hotel ? <BrochureEditor key={hotel.id} hotelId={hotel.id} en={lang==='en'}/> : null;
}
function BrochureEditor({hotelId,en}:{hotelId:string;en:boolean}) {
  const [data,setData]=useState<BrochureConfig|null>(null),[brand,setBrand]=useState<BrochureBrand|null>(null),[prices,setPrices]=useState<Record<string,BrochurePrice>>({});
  const [slug,setSlug]=useState(''),[pdfLang,setPdfLang]=useState<'ja'|'en'>(en?'en':'ja'),[retry,setRetry]=useState(0);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[renderedKey,setRenderedKey]=useState(''),[previewRetry,setPreviewRetry]=useState(0),[previewError,setPreviewError]=useState('');
  const canvas=useRef<HTMLCanvasElement>(null),images=useRef(new Map<string,Promise<HTMLImageElement>>());
  useEffect(()=>{let live=true;api<BrochureConfig>('GET',`hotel/brochures?hotel=${encodeURIComponent(hotelId)}`).then(d=>{if(!live)return;setData(d);setBrand(d.brand);setPrices(d.prices);const requested=new URLSearchParams(window.location.search).get('experience');setSlug(d.experiences.ja.find(e=>e.slug===requested)?.slug??d.experiences.ja[0]?.slug??'');setError('');}).catch(e=>{if(live)setError(errorText(e));});return()=>{live=false;};},[hotelId,retry]);
  const experience=data?.experiences[pdfLang].find(x=>x.slug===slug);
  const price=prices[slug]??{priceJpy:null,priceUnit:experience?.priceUnit??'person',priceNote:''};
  const savedPrice=data?.prices[slug]??{priceJpy:null,priceUnit:experience?.priceUnit??'person',priceNote:''};
  const brandDirty=!!data&&JSON.stringify(brand)!==JSON.stringify(data.brand),priceDirty=JSON.stringify(price)!==JSON.stringify(savedPrice);
  const priceValid=price.priceJpy===null||(Number.isSafeInteger(price.priceJpy)&&price.priceJpy>=1&&price.priceJpy<=100000000);
  const canBrand=!!data&&(data.canManage||data.demo),canPrice=!!data&&(data.canPrice||data.demo);
  const input=brand&&experience&&data?{brand,experience,price,lang:pdfLang,demo:data.demo}:null;
  const previewKey=JSON.stringify(input);
  const previewBusy=renderedKey!==previewKey;
  useEffect(()=>{
    if(!input)return;
    let live=true;
    const cached=(src:string)=>{let result=images.current.get(src);if(!result){result=loadImage(src).catch(e=>{images.current.delete(src);throw e;});images.current.set(src,result);}return result;};
    const timer=setTimeout(()=>{setPreviewError('');void (async()=>{
      try {
        await document.fonts.ready;
        const heroUrl=new URL(input.experience.img,window.location.origin);if(heroUrl.origin!==window.location.origin)throw new Error('画像URLをご確認ください / Invalid image URL.');
        const hero=await cached(heroUrl.href),logo=input.brand.logoDataUrl?await cached(input.brand.logoDataUrl):undefined;
        if(!live||!canvas.current)return;
        const ctx=canvas.current.getContext('2d');if(!ctx)throw new Error('プレビューを表示できません / Preview unavailable.');
        renderBrochure(ctx,input,hero,logo);setRenderedKey(previewKey);
      }catch(e){if(live){setPreviewError(e instanceof Error?e.message:String(e));setRenderedKey(previewKey);}}
    })();},150);
    return()=>{live=false;clearTimeout(timer);};
    // The serialized input is the full preview snapshot, including unsaved fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[previewKey,previewRetry]);
  if(!data||!brand)return error?<><Notice tone="bad">{error}</Notice><Button onClick={()=>setRetry(v=>v+1)}>{en?'Retry':'再読み込み'}</Button></>:<Loading/>;
  const editBrand=(key:keyof BrochureBrand,value:string|null)=>{setBrand({...brand,[key]:value});setNotice('');};
  const editPrice=(value:Partial<BrochurePrice>)=>{setPrices({...prices,[slug]:{...price,...value}});setNotice('');};
  const save=async(kind:'brand'|'price')=>{
    setBusy(true);setError('');setNotice('');
    try {
      if(kind==='brand'){const result=await api<{brand:BrochureBrand}>('POST','hotel/brochures/brand',{hotel:hotelId,...brand});setData(d=>d?{...d,brand:result.brand}:d);setBrand(result.brand);}
      else {const result=await api<{price:BrochurePrice}>('POST','hotel/brochures/price',{hotel:hotelId,slug,...price});setData(d=>d?{...d,prices:{...d.prices,[slug]:result.price}}:d);setPrices(p=>({...p,[slug]:result.price}));}
      setNotice(en?'Saved.':'保存しました。');
    }catch(e){setError(errorText(e));}finally{setBusy(false);}
  };
  let urlValid=!brand.contactUrl;try{const u=new URL(brand.contactUrl);urlValid=u.protocol==='https:'&&!u.username&&!u.password;}catch{/* blank is valid */}
  const contactReady=!!(brand.contactEmail||brand.contactPhone||brand.contactUrl)&&urlValid&&(!brand.contactEmail||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brand.contactEmail));
  const exportPdf=()=>{
    if(!canvas.current||previewBusy||previewError||!input)return;
    try {
      const jpeg=Uint8Array.from(atob(canvas.current.toDataURL('image/jpeg',.94).split(',')[1]),c=>c.charCodeAt(0));
      const bytes=brochurePdf(jpeg,brand.contactUrl),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));
      const link=document.createElement('a');link.href=url;link.download=`${data.demo?'DEMO-':''}experience-${slug}-${pdfLang}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setError(e instanceof Error?e.message:String(e));}
  };
  return <>
    <p className="pt-page-description">{en?'Create a one-page experience guide with your brand and your quoted price.':'自社のブランドと案内価格で、お客様に渡せるA4・1枚の体験紹介資料を作成できます。'}</p>
    <Notice>{en?'Prices here are for sales materials only. KAMEHAME booking/payment amounts and commission calculations stay unchanged.':'ここで設定する価格は紹介資料用です。KAMEHAMEへの予約・決済金額や紹介料の計算は変更されません。'}</Notice>
    {data.demo&&<Notice>{en?'Demo: try edits and download a watermarked sample. Changes are not saved.':'デモでは編集・PDF出力を試せます。変更は保存されず、PDFにサンプル表記が入ります。'}</Notice>}
    {error&&<Notice tone="bad">{error}</Notice>}{notice&&<Notice tone="ok">{notice}</Notice>}
    <div className="pt-brochure-layout">
      <div className="pt-brochure-controls">
        <Card title={en?'Company & brand':'会社・ブランド設定'}>
          {!canBrand&&<p className="pt-small pt-muted">{en?'Only a partner manager can edit company settings.':'会社情報の編集はパートナー管理者が行えます。'}</p>}
          <Field label={en?'Company name':'会社名・表示名'}><input value={brand.companyName} maxLength={80} disabled={!canBrand||busy} onChange={e=>editBrand('companyName',e.target.value)}/></Field>
          <Field label={en?'Logo (PNG / JPEG / WebP)':'ロゴ（PNG・JPEG・WebP）'} hint={en?'Optional. The image is resized automatically.':'任意。画像は自動で縮小します。'}><input type="file" accept="image/png,image/jpeg,image/webp" disabled={!canBrand||busy} onChange={async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);setError('');try{editBrand('logoDataUrl',await logoPng(file));}catch(err){setError(err instanceof Error?err.message:String(err));}finally{setBusy(false);}}}/></Field>
          {brand.logoDataUrl&&<div className="pt-row"><img className="pt-brochure-logo" src={brand.logoDataUrl} alt={en?'Company logo':'会社ロゴ'}/>{canBrand&&<Button kind="link" disabled={busy} onClick={()=>editBrand('logoDataUrl',null)}>{en?'Remove logo':'ロゴを削除'}</Button>}</div>}
          <Field label={en?'Theme color':'テーマカラー'}><input type="color" value={brand.accentColor} disabled={!canBrand||busy} onChange={e=>editBrand('accentColor',e.target.value)}/></Field>
          <Field label={en?'Contact email':'お問い合わせメール'}><input type="email" value={brand.contactEmail} maxLength={120} disabled={!canBrand||busy} onChange={e=>editBrand('contactEmail',e.target.value)}/></Field>
          <Field label={en?'Contact phone':'お問い合わせ電話'}><input type="tel" value={brand.contactPhone} maxLength={40} disabled={!canBrand||busy} onChange={e=>editBrand('contactPhone',e.target.value)}/></Field>
          <Field label={en?'Company enquiry URL':'自社の問い合わせURL'} hint={en?'HTTPS. Included as a QR code in the PDF.':'https:// のURL。PDFに問い合わせ用QRを掲載します。'}><input type="url" value={brand.contactUrl} maxLength={240} disabled={!canBrand||busy} onChange={e=>editBrand('contactUrl',e.target.value)}/></Field>
          <Button disabled={!canBrand||data.demo||busy||!brandDirty} onClick={()=>void save('brand')}>{en?'Save company settings':'会社設定を保存'}</Button>
        </Card>
        <Card title={en?'Experience & quoted price':'体験・案内価格'}>
          <Field label={en?'Experience':'体験'}><select value={slug} disabled={busy} onChange={e=>{setSlug(e.target.value);setNotice('');}}>{data.experiences[en?'en':'ja'].map(x=><option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>
          <Field label={en?'PDF language':'PDFの言語'}><select value={pdfLang} onChange={e=>setPdfLang(e.target.value as 'ja'|'en')}><option value="ja">日本語</option><option value="en">English</option></select></Field>
          <p className="pt-small pt-muted">{en?'KAMEHAME listed base price':'KAMEHAME掲載基本料金'}：{experience?.basePrice}（{experience?.priceUnit==='group'?(en?'per group':'1組'):(en?'per person':'1名')}）</p>
          <Field label={en?'Your quoted price (JPY, tax included)':'自社の案内価格（税込・円）'} hint={en?'Enter the final amount including your markup. Leave empty for “Please enquire”.':'上乗せ分を含めた金額を入力。空欄は「お問い合わせ」と表示します。'}><input type="number" min="1" max="100000000" step="1" inputMode="numeric" value={price.priceJpy??''} disabled={!canPrice||busy} onChange={e=>editPrice({priceJpy:e.target.value===''?null:Number(e.target.value)})}/></Field>
          <Field label={en?'Price basis':'料金の単位'}><select value={price.priceUnit} disabled={!canPrice||busy} onChange={e=>editPrice({priceUnit:e.target.value as 'person'|'group'})}><option value="person">{en?'Per person':'1名あたり'}</option><option value="group">{en?'Per group':'1組あたり'}</option></select></Field>
          <Field label={en?'Price note':'料金の補足'} hint={en?'Write this in the language used in the PDF (e.g. inclusions, party size, validity).':'PDFの言語に合わせて、含まれる内容・人数条件・有効期限などを入力してください。'}><input value={price.priceNote} maxLength={180} disabled={!canPrice||busy} onChange={e=>editPrice({priceNote:e.target.value})}/></Field>
          {!priceValid&&<Notice tone="bad">{en?'Enter a whole-yen price from 1 to 100,000,000.':'1〜100,000,000円の整数を入力してください。'}</Notice>}
          <Button disabled={!canPrice||data.demo||busy||!priceDirty||!priceValid} onClick={()=>void save('price')}>{en?'Save this experience price':'この体験の案内価格を保存'}</Button>
        </Card>
      </div>
      <Card title={en?'A4 PDF preview':'A4 PDFプレビュー'}>
        <p className="pt-small pt-muted">{en?'Only your quoted price and contact details appear. Internal commission and supplier prices are omitted.':'自社の案内価格と問い合わせ先を掲載します。紹介料・KAMEHAME掲載料金などの内部情報は掲載しません。'}</p>
        {!contactReady&&<Notice>{en?'Add at least one contact method before downloading.':'ダウンロードするには問い合わせ先を1つ以上設定してください。'}</Notice>}
        {!data.demo&&(brandDirty||priceDirty)&&<Notice>{en?'Save the changed settings before downloading.':'変更した設定を保存してからダウンロードしてください。'}</Notice>}
        {previewError&&<><Notice tone="bad">{previewError}</Notice><Button kind="secondary" onClick={()=>{setRenderedKey('');setPreviewRetry(v=>v+1);}}>{en?'Reload':'再読み込み'}</Button></>}
        <Button disabled={busy||previewBusy||!!previewError||!experience||!priceValid||!brand.companyName.trim()||!contactReady||(!data.demo&&(brandDirty||priceDirty))} onClick={exportPdf}>{previewBusy?(en?'Preparing preview…':'プレビュー作成中…'):(en?'Download PDF':'紹介PDFをダウンロード')}</Button>
        <div className="pt-brochure-preview" aria-busy={previewBusy}><canvas ref={canvas} width={BROCHURE_WIDTH} height={BROCHURE_HEIGHT} role="img" aria-label={`${en?'PDF preview':'PDFプレビュー'}: ${experience?.title??''} / ${brand.companyName} / ${price.priceJpy??(en?'Please enquire':'お問い合わせ')}`}/></div>
      </Card>
    </div>
  </>;
}
