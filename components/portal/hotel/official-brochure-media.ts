import { BROCHURE_HEIGHT, BROCHURE_WIDTH, brochurePdf } from '@/lib/portal/brochure-render';
import { brochurePagesPdf } from '@/lib/portal/brochure-pages-pdf';
import { renderOfficialBrochure } from '@/lib/portal/official-brochure-render';
import { renderOfficialTrifold, TRIFOLD_WIDTH, TRIFOLD_HEIGHT, TRIFOLD_PHOTOS, TRIFOLD_QR } from '@/lib/portal/official-trifold-render';
import type { OfficialBrochureInput } from '@/lib/portal/official-brochure-types';
import { loadImage } from './brochure-media';

export interface OfficialBrochurePage {canvas:HTMLCanvasElement;side:'outside'|'inside'|'single'}
export async function prepareOfficialBrochure(input:OfficialBrochureInput):Promise<OfficialBrochurePage[]> {
  const trifold=!input.experience;
  if(trifold) {
    const face=new FontFace(`Kamehame Editorial ${input.lang}`,`url(/fonts/brochure-editorial-${input.lang}.woff)`);
    await face.load();document.fonts.add(face);
  }
  await document.fonts.ready;
  const photos=await Promise.all((trifold?TRIFOLD_PHOTOS:input.items.map(e=>e.img)).map(img=>{
    const url=new URL(img,window.location.origin);
    if(url.origin!==window.location.origin)throw new Error('画像URLが無効です / Invalid image URL.');
    return loadImage(url.href);
  }));
  const sides:OfficialBrochurePage['side'][]=trifold?['outside','inside']:['single'];
  return sides.map(side=>{
    const canvas=document.createElement('canvas');canvas.width=trifold?TRIFOLD_WIDTH:BROCHURE_WIDTH;canvas.height=trifold?TRIFOLD_HEIGHT:BROCHURE_HEIGHT;
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDFを作成できません / PDF rendering unavailable.');
    if(side==='single')renderOfficialBrochure(ctx,input,photos);else renderOfficialTrifold(ctx,input,photos,side);
    return {canvas,side};
  });
}
export function downloadOfficialBrochure(pages:OfficialBrochurePage[],input:OfficialBrochureInput) {
  const jpegs=pages.map(p=>Uint8Array.from(atob(p.canvas.toDataURL('image/jpeg',.94).split(',')[1]),c=>c.charCodeAt(0)));
  const {x,y,size}=TRIFOLD_QR,pt=72/25.4;
  const rect:[number,number,number,number]=[x*pt,(210-y-size)*pt,(x+size)*pt,(210-y)*pt];
  const bytes=input.experience?brochurePdf(jpegs[0],input.referralUrl,[34,40,562,170]):brochurePagesPdf(pages.map((p,i)=>({jpeg:jpegs[i],width:p.canvas.width,height:p.canvas.height,widthPt:841.89,heightPt:595.28,...(p.side==='outside'?{link:{url:input.referralUrl,rect}}:{})})));
  const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download=`${input.demo?'DEMO-':''}KAMEHAME-JAPAN-${input.experience??'trifold'}-${input.lang}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
