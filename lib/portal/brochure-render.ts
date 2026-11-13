import qrcode from "qrcode-generator";
import type { BrochureBrand, BrochureExperience, BrochurePrice } from "./brochure-types";

export const BROCHURE_WIDTH = 1654, BROCHURE_HEIGHT = 2339;
export interface BrochureInput { brand: BrochureBrand; experience: BrochureExperience; price: BrochurePrice; lang: "ja" | "en"; demo: boolean }
const FONT = 'Arial, "Hiragino Sans", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';

/** Shared by the on-screen preview and the downloaded A4 PDF. All amounts are sales-material prices. */
export function renderBrochure(ctx: CanvasRenderingContext2D, input: BrochureInput, hero: CanvasImageSource, logo?: CanvasImageSource, detail?: CanvasImageSource) {
  const { brand: b, experience: e, price: p, lang, demo } = input, en = lang === 'en';
  ctx.save(); ctx.scale(2,2); ctx.textBaseline = 'top';
  const W = BROCHURE_WIDTH / 2, H = BROCHURE_HEIGHT / 2, ink = '#242a2d', accent = b.accentColor;
  const rect = (x:number,y:number,w:number,h:number,color:string) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const font = (size:number,weight=400) => {ctx.font=`${weight} ${size}px ${FONT}`;};
  const lines = (text:string,width:number):string[] => {
    const result:string[]=[]; let line='';
    const tokens = text.match(/\s+|[A-Za-z0-9.,'’!?():/+@%_-]+|[^\s]/gu) ?? [];
    for(const token of tokens) {
      if(ctx.measureText(line+token).width>width && line && !/^[、。，．!?）)]/.test(token)) {result.push(line.trimEnd());line='';}
      for(const char of token) {if(ctx.measureText(line+char).width>width && line && !/[、。，．!?）)]/.test(char)){result.push(line.trimEnd());line='';}line+=char;}
    }
    if(line.trim()) result.push(line.trim());
    return result;
  };
  const text = (value:string,x:number,y:number,width:number,size:number,maxLines:number,lineHeight:number,color=ink,weight=400) => {
    font(size,weight);ctx.fillStyle=color;const wrapped=lines(value,width), shown=wrapped.slice(0,maxLines);
    if(wrapped.length>maxLines && shown.length) {let last=shown[shown.length-1];while(last && ctx.measureText(last+'…').width>width)last=last.slice(0,-1);shown[shown.length-1]=last+'…';}
    shown.forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
  };
  const drawImage = (image:CanvasImageSource,x:number,y:number,w:number,h:number,cover:boolean) => {
    const source=image as unknown as {width:number;height:number};const scale=cover?Math.max(w/source.width,h/source.height):Math.min(w/source.width,h/source.height);
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-source.width*scale)/2,y+(h-source.height*scale)/2,source.width*scale,source.height*scale);ctx.restore();
  };
  rect(0,0,W,H,'#fff'); rect(0,0,W,12,accent);
  if(logo)drawImage(logo,48,45,105,60,false);
  const companyWidth=logo?607:731;let companySize=25;
  font(companySize,700);while(lines(b.companyName,companyWidth).length>2&&companySize>14){companySize--;font(companySize,700);}
  text(b.companyName || (en?'Your company':'会社名'),logo?172:48,50,companyWidth,companySize,2,31,ink,700);
  text(en?'EXPERIENCE GUIDE':'体験のご案内',logo?172:48,111,607,10,1,13,accent,700);
  if(detail) {drawImage(hero,48,142,483,280,true);drawImage(detail,539,142,240,280,true);}
  else drawImage(hero,48,142,731,280,true);
  text(e.area,48,442,731,12,1,18,accent,700);
  text(e.title,48,468,731,28,3,32,ink,700);
  font(28,700);const titleHeight=Math.min(3,lines(e.title,731).length)*32;
  text(e.tagline,48,468+titleHeight+14,731,14,3,20,'#535a5d');
  rect(48,642,731,70,'#f4f5f5');
  text(en?'DURATION':'所要時間',66,654,330,10,1,14,'#626b70',700);
  text(e.duration,66,674,330,14,2,17,ink,600);
  text(en?'GROUP':'参加人数・形式',421,654,340,10,1,14,'#626b70',700);
  text(e.group,421,674,340,14,2,17,ink,600);
  text(en?'EXPERIENCE HIGHLIGHTS':'この体験のポイント',48,735,731,13,1,18,accent,700);
  e.highlights.slice(0,3).forEach((item,i)=>{rect(49,766+i*38,4,4,accent);text(item,65,760+i*38,714,13,2,17);});
  rect(48,885,731,112,'#f5f6f6');rect(48,885,5,112,accent);
  text(en?'YOUR PRICE · JPY':'ご案内価格（税込）',68,901,320,11,1,16,'#626b70',700);
  text(p.priceJpy===null?(en?'Please enquire':'お問い合わせ'):new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(p.priceJpy),68,927,340,p.priceJpy===null?27:34,1,39,ink,700);
  text(en?(p.priceUnit==='person'?'Tax included · per person':'Tax included · per group'):(p.priceUnit==='person'?'1名あたり':'1組あたり'),68,974,320,11,1,14,'#626b70');
  text((en?p.priceNoteEn:p.priceNote) || (en?'Availability and final booking terms will be confirmed when you enquire.':'空き状況・ご予約条件はお問い合わせ時にご案内します。'),430,901,327,11,7,13,'#535a5d');
  text(en?'BOOKINGS & ENQUIRIES':'ご予約・お問い合わせ',48,1020,600,13,1,18,accent,700);
  const contactWidth=b.contactUrl?590:731;let contactY=1047;
  for(const value of [b.contactEmail,b.contactPhone,b.contactUrl].filter(Boolean)) {const count=value===b.contactEmail?2:1;text(value,48,contactY,contactWidth,12,count,17);font(12);contactY+=Math.min(count,lines(value,contactWidth).length)*17+4;}
  if(b.contactUrl) {
    const qr=qrcode(0,'M');qr.addData(b.contactUrl);qr.make();const n=qr.getModuleCount(),size=104,cell=size/(n+8);
    rect(675,1016,size,size,'#fff');ctx.fillStyle=ink;
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(675+(c+4)*cell,1016+(r+4)*cell,cell,cell);
  }
  rect(48,1131,731,1,'#e4e7e8');
  text(demo?(en?'DEMO / SAMPLE - Not valid for booking':'デモ・架空サンプル / 実際の予約には使えません'):(en?'Contact the company shown above to confirm availability, price and booking terms.':'空き状況・最終料金・予約条件は、上記の案内元へご確認ください。'),48,1143,731,10,1,14,'#626b70');
  ctx.restore();
}

/** A dependency-free, single-page A4 PDF containing the exact high-resolution preview. */
export function brochurePdf(jpeg: Uint8Array, contactUrl = '', linkRect: [number,number,number,number] = [34,32,562,110]): Uint8Array {
  const encode=(s:string)=>new TextEncoder().encode(s), chunks:Uint8Array[]=[], offsets=[0];let length=0;
  const add=(bytes:Uint8Array)=>{chunks.push(bytes);length+=bytes.length;};
  const object=(id:number,parts:(string|Uint8Array)[])=>{offsets[id]=length;add(encode(`${id} 0 obj\n`));for(const part of parts)add(typeof part==='string'?encode(part):part);add(encode('\nendobj\n'));};
  add(encode('%PDF-1.4\n'));
  object(1,['<< /Type /Catalog /Pages 2 0 R >>']);object(2,['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  const url=contactUrl.startsWith('https://')?encodeURI(contactUrl).replace(/[\\()]/g,'\\$&'):'';
  object(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R${url?' /Annots [6 0 R]':''} >>`]);
  object(4,[`<< /Type /XObject /Subtype /Image /Width ${BROCHURE_WIDTH} /Height ${BROCHURE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,jpeg,'\nendstream']);
  const content='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  object(5,[`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  if(url)object(6,[`<< /Type /Annot /Subtype /Link /Rect [${linkRect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${url}) >> >>`]);
  const start=length;add(encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`));
  const pdf=new Uint8Array(length);let cursor=0;for(const part of chunks){pdf.set(part,cursor);cursor+=part.length;}return pdf;
}
