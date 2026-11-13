import { BROCHURE_HEIGHT, BROCHURE_WIDTH, brochurePdf } from '@/lib/portal/brochure-render';
import { renderOfficialBrochure } from '@/lib/portal/official-brochure-render';
import type { OfficialBrochureInput } from '@/lib/portal/official-brochure-types';
import { loadImage } from './brochure-media';

export async function prepareOfficialBrochure(input:OfficialBrochureInput):Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const photos=await Promise.all(input.items.map(e=>{
    const url=new URL(e.img,window.location.origin);
    if(url.origin!==window.location.origin)throw new Error('画像URLが無効です / Invalid image URL.');
    return loadImage(url.href);
  }));
  const canvas=document.createElement('canvas');canvas.width=BROCHURE_WIDTH;canvas.height=BROCHURE_HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDFを作成できません / PDF rendering unavailable.');
  renderOfficialBrochure(ctx,input,photos);return canvas;
}
export function downloadOfficialBrochure(canvas:HTMLCanvasElement,input:OfficialBrochureInput) {
  const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]),c=>c.charCodeAt(0));
  const bytes=brochurePdf(jpeg,input.referralUrl,[34,40,562,170]),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download=`${input.demo?'DEMO-':''}KAMEHAME-JAPAN-${input.experience??'experiences'}-${input.lang}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
