"use client";
import { useEffect, useRef, useState } from "react";
import { PortalDialog } from "../help";
import { Button, Loading, Notice } from "../ui";
import type { BrochureInput } from "@/lib/portal/brochure-render";
import { downloadBrochure, prepareBrochure } from "./brochure-media";

export function BrochurePreview({input,canDownload,en,onClose}:{input:BrochureInput;canDownload:boolean;en:boolean;onClose:()=>void}) {
  const [url,setUrl]=useState(''),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  const canvas=useRef<HTMLCanvasElement|null>(null);
  useEffect(()=>{let live=true;void prepareBrochure(input).then(c=>{if(live){canvas.current=c;setUrl(c.toDataURL('image/png'));setError('');}}).catch(e=>{if(live)setError(e instanceof Error?e.message:String(e));});return()=>{live=false;};},[input,retry]);
  return <PortalDialog title={`${en?'PDF preview':'PDFプレビュー'} · ${input.lang==='en'?'English':'日本語'}`} className="pt-brochure-dialog" onClose={onClose}>
    {!canDownload&&<Notice>{en?'Draft preview. Save the price and company settings before downloading.':'未保存のプレビューです。価格・会社設定を保存してからダウンロードしてください。'}</Notice>}
    {error?<><Notice tone="bad">{error}</Notice><Button onClick={()=>setRetry(v=>v+1)}>{en?'Retry':'再試行'}</Button></>:!url?<Loading/>:<>
      <Button disabled={!canDownload} onClick={()=>{try{if(canvas.current)downloadBrochure(canvas.current,input);}catch(e){setError(e instanceof Error?e.message:String(e));}}}>{en?'Download PDF':'PDFをダウンロード'}</Button>
      <div className="pt-brochure-preview"><img src={url} alt={`${input.experience.title} / ${input.brand.companyName} / ${input.price.priceJpy??(en?'Enquire':'お問い合わせ')}`}/></div>
    </>}
  </PortalDialog>;
}
