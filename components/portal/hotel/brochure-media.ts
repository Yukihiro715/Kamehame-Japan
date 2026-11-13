import type { BrochureInput } from "@/lib/portal/brochure-render";
import { BROCHURE_WIDTH, BROCHURE_HEIGHT, brochurePdf, renderBrochure } from "@/lib/portal/brochure-render";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>reject(new Error('画像の読み込みに失敗しました / Image loading timed out.')),15000);image.onload=()=>{clearTimeout(timer);resolve(image);};image.onerror=()=>{clearTimeout(timer);reject(new Error('画像を読み込めません / Could not load an image.'));};image.src=src;});
}
export async function logoPng(file: File) {
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

export async function prepareBrochure(input: BrochureInput): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const heroUrl=new URL(input.experience.img,window.location.origin);
  if(heroUrl.origin!==window.location.origin)throw new Error('画像URLが無効です / Invalid image URL.');
  const detailUrl=input.experience.detailImg?new URL(input.experience.detailImg,window.location.origin):null;
  if(detailUrl&&detailUrl.origin!==window.location.origin)throw new Error('画像URLが無効です / Invalid image URL.');
  const [hero,logo,detail]=await Promise.all([loadImage(heroUrl.href),input.brand.logoDataUrl?loadImage(input.brand.logoDataUrl):Promise.resolve(undefined),detailUrl?loadImage(detailUrl.href):Promise.resolve(undefined)]);
  const canvas=document.createElement('canvas');canvas.width=BROCHURE_WIDTH;canvas.height=BROCHURE_HEIGHT;
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('PDFを作成できません / PDF rendering unavailable.');
  renderBrochure(ctx,input,hero,logo,detail);return canvas;
}
export function downloadBrochure(canvas: HTMLCanvasElement, input: BrochureInput) {
  const jpeg=Uint8Array.from(atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]),c=>c.charCodeAt(0));
  const bytes=brochurePdf(jpeg,input.brand.contactUrl),url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));
  const link=document.createElement('a');link.href=url;link.download=`${input.demo?'DEMO-':''}experience-${input.experience.slug}-${input.lang}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
