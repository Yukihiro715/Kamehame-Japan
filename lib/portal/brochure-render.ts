import qrcode from "qrcode-generator";
import type { BrochureBrand, BrochureExperience, BrochurePrice } from "./brochure-types";
import { brochureQrUrl, brochureQrCaption, visibleBrochureContacts } from './brochure-contact';

export const BROCHURE_WIDTH = 1654, BROCHURE_HEIGHT = 2339;
export interface BrochureInput { brand: BrochureBrand; experience: BrochureExperience; price: BrochurePrice; lang: "ja" | "en"; demo: boolean }
export interface BrochureLink { url: string; rect: [number,number,number,number] }
const FONT = 'Arial, "Hiragino Sans", "Noto Sans CJK JP", "Noto Sans JP", sans-serif';

/** Preview and print share one layout. Returned annotations cover only visible contact text/QR. */
export function renderBrochure(ctx: CanvasRenderingContext2D, input: BrochureInput, hero: CanvasImageSource, logo?: CanvasImageSource, detail?: CanvasImageSource): BrochureLink[] {
  const { brand: b, experience: e, price: p, lang, demo } = input, en = lang === 'en';
  const W = BROCHURE_WIDTH / 2, H = BROCHURE_HEIGHT / 2, ink = '#26231f', muted='#686159', accent=b.accentColor;
  const serif=`"Kamehame Editorial ${lang}", Georgia, "Noto Serif CJK JP", serif`;
  const links:BrochureLink[]=[];
  ctx.save();ctx.scale(2,2);ctx.textBaseline='top';
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const font=(size:number,weight=400,editorial=false)=>{ctx.font=`${weight} ${size}px ${editorial?serif:FONT}`;};
  const wrap=(value:string,width:number):string[]=>{
    const result:string[]=[];let line='';
    for(const token of value.match(/\s+|[A-Za-z0-9.,'’!?():/+@%_-]+|[^\s]/gu)??[]) {
      if(line&&ctx.measureText(line+token).width>width&&!/^[、。，．!?）)]/.test(token)){result.push(line.trim());line='';}
      for(const char of token){if(line&&ctx.measureText(line+char).width>width&&!/[、。，．!?）)]/.test(char)){result.push(line.trim());line='';}line+=char;}
    }
    if(line.trim())result.push(line.trim());return result;
  };
  const text=(value:string,x:number,y:number,w:number,size:number,maxLines:number,lh:number,color=ink,weight=400,editorial=false)=>{
    font(size,weight,editorial);ctx.fillStyle=color;const all=wrap(value,w),shown=all.slice(0,maxLines);
    if(all.length>maxLines&&shown.length){let last=shown[shown.length-1];while(last&&ctx.measureText(last+'…').width>w)last=last.slice(0,-1);shown[shown.length-1]=last+'…';}
    shown.forEach((line,i)=>ctx.fillText(line,x,y+i*lh));return shown.length*lh;
  };
  // Fit important customer terms in full; never silently drop prices, notes or contacts.
  const fitted=(value:string,x:number,y:number,w:number,h:number,start:number,min:number,color=ink,weight=400,editorial=false)=>{
    let size=start;font(size,weight,editorial);
    while(wrap(value,w).length*size*1.25>h&&size>min){size-=0.5;font(size,weight,editorial);}
    const count=wrap(value,w).length;
    if(count*size*1.25>h)throw new Error(en?'Text is too long for this PDF. Please shorten the company name, note or contact details.':'PDFに収まらない文章があります。会社名・補足・連絡先を短くしてください。');
    return text(value,x,y,w,size,count,size*1.25,color,weight,editorial);
  };
  const photo=(img:CanvasImageSource,x:number,y:number,w:number,h:number,cover=true)=>{
    const source=img as unknown as {width:number;height:number};const scale=cover?Math.max(w/source.width,h/source.height):Math.min(w/source.width,h/source.height);
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x+(w-source.width*scale)/2,y+(h-source.height*scale)/2,source.width*scale,source.height*scale);ctx.restore();
  };
  const link=(url:string,x:number,y:number,w:number,h:number)=>links.push({url,rect:[x/W*595.28,(H-y-h)/H*841.89,(x+w)/W*595.28,(H-y)/H*841.89]});
  rect(0,0,W,H,'#fcfaf6');
  if(logo)photo(logo,42,30,76,52,false);
  fitted(b.companyName||(en?'Your company':'会社名'),logo?132:42,35,logo?653:743,52,25,13,ink,400,true);
  rect(42,101,743,1,accent);
  text(en?'CURATED EXPERIENCES':'体験のご案内',42,118,743,10,1,14,accent,600);
  fitted(e.title,42,146,743,111,40,23,ink,400,true);
  photo(hero,42,275,743,330);
  rect(42,673,743,1,accent);
  text(en?'LOCATION':'エリア',42,623,290,9,1,12,muted,600);
  fitted(e.area,42,641,290,29,12,10);
  rect(350,623,1,38,accent);text(en?'DURATION':'所要時間',368,623,170,9,1,12,muted,600);
  fitted(e.duration,368,641,170,29,12,10);
  rect(555,623,1,38,accent);text(en?'GROUP':'参加人数・形式',573,623,212,9,1,12,muted,600);
  fitted(e.group,573,641,212,29,12,10);
  const hasDetail=!!detail&&e.detailImg!==e.img,copyWidth=hasDetail?419:743;
  text(en?'An experience to remember':'この体験で楽しめること',42,696,copyWidth,23,1,29,ink,400,true);
  fitted(e.tagline,42,740,copyWidth,72,12,8,muted);
  e.highlights.slice(0,2).forEach((value,i)=>{
    text(`0${i+1}`,42,824+i*47,27,12,1,17,accent,600);
    text(value,80,824+i*47,copyWidth-38,12,2,17);
  });
  if(hasDetail)photo(detail!,489,701,296,214);
  rect(42,940,743,1,accent);
  // Price and contacts use equal baselines. QR consumes space only when enabled.
  text(en?'EXPERIENCE PRICE':'ご案内価格',42,960,284,10,1,14,accent,600);
  const amount=p.priceJpy===null?(en?'Please enquire':'お問い合わせ'):new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(p.priceJpy);
  if(p.priceJpy===null) fitted(amount,42,984,280,47,34,23,ink,400,true);
  else {
    const unit=en?(p.priceUnit==='person'?'/ person':'/ group'):(p.priceUnit==='person'?'/ 1名':'/ 1組');
    font(12);const unitWidth=ctx.measureText(unit).width;let size=34;font(size,400,true);
    while(ctx.measureText(amount).width+unitWidth+10>280&&size>20){size-=0.5;font(size,400,true);}
    const amountWidth=ctx.measureText(amount).width;
    text(amount,42,984,280,size,1,47,ink,400,true);
    text(unit,42+amountWidth+10,984+size-14,unitWidth+1,12,1,15,ink);
  }
  text(en?'Tax included':'消費税込み',42,1036,280,11,1,14,muted);
  fitted((en?p.priceNoteEn:p.priceNote)||'',42,1060,280,65,11,8,muted);
  rect(343,960,1,164,accent);
  const qrUrl=brochureQrUrl(b),cx=365,cw=qrUrl?280:420;
  text(en?'BOOKINGS & ENQUIRIES':'ご予約・お問い合わせ',cx,960,cw,11,1,15,accent,600);
  const contacts=visibleBrochureContacts(b);
  // Allocate more space to long URLs; labels never stand in for a truncated address.
  if(!contacts.length&&qrUrl) text(en?'Scan the QR code to contact your agency or guide and check availability.':'QRを読み取って、代理店・ガイドへご希望の日程や人数をお知らせください。',cx,987,cw,13,5,19,muted);
  let y=987;
  for(const item of contacts){
    const h=fitted(item.value,cx,y,cw,contacts.length===3?(item.url.startsWith('https:')?60:item.url.startsWith('tel:')?24:36):contacts.length===2?63:132,12,8,ink);
    link(item.url,cx,y,cw,h);y+=h+6;
  }
  if(qrUrl){
    const qr=qrcode(0,'M');qr.addData(new URL(qrUrl).href,'Byte');qr.make();const n=qr.getModuleCount(),size=120,cell=size/(n+8),qx=665,qy=960;
    rect(qx,qy,size,size,'#fff');ctx.fillStyle='#161616';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(qx+(c+4)*cell,qy+(r+4)*cell,cell,cell);
    fitted(brochureQrCaption(b,lang),qx,1086,size,44,10,8,ink,600);
    link(qrUrl,qx,qy,size,165);
  }
  rect(42,1137,743,1,'#d8d0c5');
  text(demo?(en?'DEMO / SAMPLE - Not valid for booking':'デモ・架空サンプル / 実際の予約には使えません'):(en?'Contact your agency or guide to confirm availability and booking terms.':'空き状況・最終料金・予約条件は、案内元の代理店・ガイドへご確認ください。'),42,1147,743,9,1,12,muted);
  ctx.restore();return links;
}

/** A dependency-free, single-page A4 PDF containing the exact high-resolution preview. */
export function brochurePdf(jpeg: Uint8Array, contactUrl = '', linkRect: [number,number,number,number] = [34,32,562,110]): Uint8Array {
  return brochurePdfWithLinks(jpeg, contactUrl ? [{url:contactUrl,rect:linkRect}] : []);
}
export function brochurePdfWithLinks(jpeg:Uint8Array, links:BrochureLink[]):Uint8Array {
  const encode=(s:string)=>new TextEncoder().encode(s), chunks:Uint8Array[]=[], offsets=[0];let length=0;
  const add=(bytes:Uint8Array)=>{chunks.push(bytes);length+=bytes.length;};
  const object=(id:number,parts:(string|Uint8Array)[])=>{offsets[id]=length;add(encode(`${id} 0 obj\n`));for(const part of parts)add(typeof part==='string'?encode(part):part);add(encode('\nendobj\n'));};
  add(encode('%PDF-1.4\n'));
  object(1,['<< /Type /Catalog /Pages 2 0 R >>']);object(2,['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  const safe=links.filter(l=>{
    try { const u=new URL(l.url); return ['https:','mailto:','tel:'].includes(u.protocol)&&!u.username&&!u.password&&!/[\x00-\x20\x7f]/.test(l.url); } catch {return false;}
  });
  const escaped=(url:string)=>new URL(url).href.replace(/[\\()]/g,'\\$&');
  object(3,[`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R${safe.length?` /Annots [${safe.map((_,i)=>`${6+i} 0 R`).join(' ')}]`:''} >>`]);
  object(4,[`<< /Type /XObject /Subtype /Image /Width ${BROCHURE_WIDTH} /Height ${BROCHURE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,jpeg,'\nendstream']);
  const content='q 595.28 0 0 841.89 0 0 cm /Im0 Do Q';
  object(5,[`<< /Length ${content.length} >>\nstream\n${content}\nendstream`]);
  safe.forEach((l,i)=>object(6+i,[`<< /Type /Annot /Subtype /Link /Rect [${l.rect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI (${escaped(l.url)}) >> >>`]));
  const start=length;add(encode(`xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`));
  const pdf=new Uint8Array(length);let cursor=0;for(const part of chunks){pdf.set(part,cursor);cursor+=part.length;}return pdf;
}
