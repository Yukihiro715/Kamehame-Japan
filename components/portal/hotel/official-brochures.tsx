"use client";

import { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../client';
import { PortalDialog } from '../help';
import { Button, Card, Field, Loading, Notice } from '../ui';
import type { OfficialBrochureCatalog, OfficialBrochureInput, OfficialBrochureLanguage } from '@/lib/portal/official-brochure-types';
import { TRIFOLD_PRINT } from '@/lib/portal/official-trifold-render';
import { downloadOfficialBrochure, prepareOfficialBrochure, type OfficialBrochurePage } from './official-brochure-media';

export function OfficialBrochures({hotelId,en,demo,onIssued}:{hotelId:string;en:boolean;demo:boolean;onIssued:()=>void}) {
  const [catalog,setCatalog]=useState<OfficialBrochureCatalog|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [lang,setLang]=useState<OfficialBrochureLanguage>('en'),[slug,setSlug]=useState(''),[pending,setPending]=useState(false);
  const [preview,setPreview]=useState<{input:OfficialBrochureInput;pages:OfficialBrochurePage[]}|null>(null);
  const experiences=catalog?.experiences[lang].map(e=>({slug:e.slug,title:catalog.experiences[en?'en':'ja'].find(t=>t.slug===e.slug)?.title??e.title}))??[];
  const live=useRef(true);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  useEffect(()=>{let active=true;api<OfficialBrochureCatalog>('GET',`hotel/official-brochures?hotel=${encodeURIComponent(hotelId)}`).then(c=>{if(active){setCatalog(c);setError('');}}).catch(e=>{if(active)setError(errorText(e));});return()=>{active=false;};},[hotelId,retry]);
  const create=async(download:boolean)=>{
    setPending(true);setError('');
    try {
      const result=demo
        ?await api<{input:OfficialBrochureInput}>('GET',`hotel/official-brochures/demo?hotel=${encodeURIComponent(hotelId)}&lang=${lang}&experience=${encodeURIComponent(slug)}`)
        :await api<{input:OfficialBrochureInput}>('POST','hotel/official-brochures/prepare',{hotel:hotelId,lang,experience:slug||null});
      if(!live.current)return;
      if(!demo)onIssued();
      const pages=await prepareOfficialBrochure(result.input);
      if(!live.current)return;
      if(download)downloadOfficialBrochure(pages,result.input);
      else setPreview({input:result.input,pages});
    }catch(e){if(live.current)setError(errorText(e));}finally{if(live.current)setPending(false);}
  };
  return <Card title={en?'KAMEHAME JAPAN official brochures':'KAMEHAME JAPAN公式パンフレット'}>
    <p className="pt-small pt-muted">{en?'For your front desk or guest rooms. Guests scan your hotel’s referral QR and book directly on KAMEHAME JAPAN. Company branding and marked-up prices are not needed.':'フロントや客室でご案内するパンフレットです。ホテル専用の紹介QRから、お客様自身がKAMEHAME JAPANで予約できます。会社情報や独自価格の設定は不要です。'}</p>
    {demo&&<Notice>{en?'Demo PDFs contain a sample QR that cannot be used for bookings or referral credit.':'デモのPDFにはサンプルQRが入ります。実際の予約・紹介実績には使えません。'}</Notice>}
    {error&&<Notice tone="bad">{error}</Notice>}
    {!catalog?(error?<Button onClick={()=>setRetry(n=>n+1)}>{en?'Retry':'再読み込み'}</Button>:<Loading/>):<>
      <div className="pt-official-brochure-options">
        <Field label={en?'Brochure':'パンフレットの種類'}><select value={slug} disabled={pending} onChange={e=>setSlug(e.target.value)}><option value="">{en?'Overview - A4 trifold':'総合案内（三つ折り・A4両面）'}</option>{experiences.map(e=><option key={e.slug} value={e.slug}>{e.title}</option>)}</select></Field>
        <Field label={en?'PDF language':'PDFの言語'}><select value={lang} disabled={pending} onChange={e=>{const next=e.target.value as OfficialBrochureLanguage;setLang(next);if(slug&&!catalog.experiences[next].some(x=>x.slug===slug))setSlug('');}}><option value="en">English</option><option value="ja">日本語</option></select></Field>
      </div>
      <p className="pt-small pt-muted">{slug?(en?'A4 portrait, one page with published starting prices.':'体験別はA4縦・1ページ。掲載料金の目安を表示します。'):(en?'An A4 trifold introducing food, culture and active experiences. The back cover includes booking steps and your referral QR. See the website for the latest experiences and prices.':'総合案内はA4三つ折り。食・文化・アクティブな体験を紹介し、裏表紙に利用の流れとホテル専用QRを掲載します。最新の商品・料金はサイトへ案内します。')}</p>
      {!slug&&<details className="pt-trifold-print"><summary>{en?'Printing & folding':'印刷設定・折り方'}</summary><p className="pt-small">{TRIFOLD_PRINT[en?'en':'ja']}</p><p className="pt-small">{en?'For borderless printing. A printer without borderless A4 support may leave white edges.':'フチなし印刷向けです。A4フチなし非対応のプリンターでは、紙の端に白い余白が出る場合があります。'}</p></details>}
      <p className="pt-small pt-muted">{en?'Your first preview or download creates a referral QR. Later downloads reuse the same QR for this language and brochure.':'初回のプレビュー・ダウンロード時に紹介QRを発行します。同じ言語・種類では、次回以降も同じQRを使用します。'}</p>
      <div className="pt-official-brochure-actions"><Button kind="secondary" disabled={pending} onClick={()=>void create(false)}>{en?'Preview':'プレビュー'}</Button><Button disabled={pending} onClick={()=>void create(true)}>{pending?(en?'Preparing…':'作成中…'):(en?'Download PDF':'PDFをダウンロード')}</Button></div>
    </>}
    {preview&&<PortalDialog title={`${en?'Official brochure preview':'公式パンフレットのプレビュー'} · ${preview.input.lang==='en'?'English':'日本語'}`} className="pt-brochure-dialog" onClose={()=>setPreview(null)}>
      <Button onClick={()=>{try{downloadOfficialBrochure(preview.pages,preview.input);}catch(e){setError(errorText(e));setPreview(null);}}}>{en?'Download this PDF':'このPDFをダウンロード'}</Button>
      {!preview.input.experience&&<p className="pt-note-box pt-small">{TRIFOLD_PRINT[en?'en':'ja']}</p>}
      {preview.pages.map(page=><figure className="pt-trifold-page" key={page.side}>
        {page.side!=='single'&&<figcaption><b>{page.side==='outside'?(en?'Outside':'外面'):(en?'Inside':'中面')}</b><span className="pt-small pt-muted">{page.side==='outside'?(en?'Left: fold-in flap · Middle: back cover · Right: front cover':'左：折り込み面 ／ 中央：裏表紙 ／ 右：表紙'):(en?'Food · Culture · Active experiences':'食 ／ 文化・創作 ／ アクティブな体験')}</span></figcaption>}
        <div className="pt-brochure-preview"><img src={page.canvas.toDataURL('image/png')} alt={page.side==='outside'?(en?'Trifold outside with hotel referral QR and booking steps':'三つ折りパンフレット外面・ホテル専用QRと利用の流れ'):page.side==='inside'?(en?'Trifold inside introducing experience themes':'三つ折りパンフレット中面・体験ジャンル紹介'):(en?'Official experience brochure':'公式体験パンフレット')}/></div>
      </figure>)}
    </PortalDialog>}
  </Card>;
}
