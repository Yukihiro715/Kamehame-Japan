"use client";

import { useEffect, useRef, useState } from 'react';
import { api, errorText } from '../client';
import { PortalDialog } from '../help';
import { Button, Card, Field, Loading, Notice } from '../ui';
import type { OfficialBrochureCatalog, OfficialBrochureInput, OfficialBrochureLanguage } from '@/lib/portal/official-brochure-types';
import { downloadOfficialBrochure, prepareOfficialBrochure } from './official-brochure-media';

export function OfficialBrochures({hotelId,en,demo,onIssued}:{hotelId:string;en:boolean;demo:boolean;onIssued:()=>void}) {
  const [catalog,setCatalog]=useState<OfficialBrochureCatalog|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const [lang,setLang]=useState<OfficialBrochureLanguage>('en'),[slug,setSlug]=useState(''),[pending,setPending]=useState(false);
  const [preview,setPreview]=useState<{input:OfficialBrochureInput;url:string;canvas:HTMLCanvasElement}|null>(null);
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
      const canvas=await prepareOfficialBrochure(result.input);
      if(!live.current)return;
      if(download)downloadOfficialBrochure(canvas,result.input);
      else setPreview({input:result.input,url:canvas.toDataURL('image/png'),canvas});
    }catch(e){if(live.current)setError(errorText(e));}finally{if(live.current)setPending(false);}
  };
  return <Card title={en?'KAMEHAME JAPAN official brochures':'KAMEHAME JAPAN公式パンフレット'}>
    <p className="pt-small pt-muted">{en?'For your front desk or guest rooms. Guests scan your hotel’s referral QR and book directly on KAMEHAME JAPAN. Company branding and marked-up prices are not needed.':'フロントや客室でご案内するパンフレットです。ホテル専用の紹介QRから、お客様自身がKAMEHAME JAPANで予約できます。会社情報や独自価格の設定は不要です。'}</p>
    {demo&&<Notice>{en?'Demo PDFs contain a sample QR that cannot be used for bookings or referral credit.':'デモのPDFにはサンプルQRが入ります。実際の予約・紹介実績には使えません。'}</Notice>}
    {error&&<Notice tone="bad">{error}</Notice>}
    {!catalog?(error?<Button onClick={()=>setRetry(n=>n+1)}>{en?'Retry':'再読み込み'}</Button>:<Loading/>):<>
      <div className="pt-official-brochure-options">
        <Field label={en?'Brochure':'パンフレットの種類'}><select value={slug} disabled={pending} onChange={e=>setSlug(e.target.value)}><option value="">{en?'Overview - discover experiences':'総合案内（体験一覧へ案内）'}</option>{experiences.map(e=><option key={e.slug} value={e.slug}>{e.title}</option>)}</select></Field>
        <Field label={en?'PDF language':'PDFの言語'}><select value={lang} disabled={pending} onChange={e=>{const next=e.target.value as OfficialBrochureLanguage;setLang(next);if(slug&&!catalog.experiences[next].some(x=>x.slug===slug))setSlug('');}}><option value="en">English</option><option value="ja">日本語</option></select></Field>
      </div>
      <p className="pt-small pt-muted">{en?'A4 portrait. The first preview or download creates your referral QR; subsequent downloads reuse it. Published starting prices are shown, with the latest prices and availability on the linked site.':'A4縦。初回のプレビュー・ダウンロード時に紹介QRを発行し、次回から同じQRを使用します。掲載料金を目安として表示し、最新料金・空き状況はリンク先で確認できます。'}</p>
      <div className="pt-official-brochure-actions"><Button kind="secondary" disabled={pending} onClick={()=>void create(false)}>{en?'Preview':'プレビュー'}</Button><Button disabled={pending} onClick={()=>void create(true)}>{pending?(en?'Preparing…':'作成中…'):(en?'Download PDF':'PDFをダウンロード')}</Button></div>
    </>}
    {preview&&<PortalDialog title={`${en?'Official brochure preview':'公式パンフレットのプレビュー'} · ${preview.input.lang==='en'?'English':'日本語'}`} className="pt-brochure-dialog" onClose={()=>setPreview(null)}>
      <Button onClick={()=>{try{downloadOfficialBrochure(preview.canvas,preview.input);}catch(e){setError(errorText(e));setPreview(null);}}}>{en?'Download this PDF':'このPDFをダウンロード'}</Button>
      <div className="pt-brochure-preview"><img src={preview.url} alt={en?'KAMEHAME JAPAN official brochure with your referral QR':'ホテル専用の紹介QR入りKAMEHAME JAPAN公式パンフレット'}/></div>
    </PortalDialog>}
  </Card>;
}
