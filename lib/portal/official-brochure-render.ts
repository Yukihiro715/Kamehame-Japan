import qrcode from 'qrcode-generator';
import type { OfficialBrochureInput } from './official-brochure-types';

/** A4 at 200dpi, shared by the official preview and download. */
export function renderOfficialBrochure(ctx:CanvasRenderingContext2D,input:OfficialBrochureInput,photos:CanvasImageSource[]) {
  const en=input.lang==='en',accent='#b74908',ink='#292723',muted='#69645c';
  ctx.save();ctx.scale(2,2);ctx.textBaseline='top';
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const font=(size:number,weight=400)=>{ctx.font=`${weight} ${size}px Arial, "Hiragino Sans", "Noto Sans CJK JP", sans-serif`;};
  const wrap=(value:string,width:number)=>{
    const lines:string[]=[];let line='';
    for(const token of value.match(/\s+|[A-Za-z0-9.,'’!?():/+@%_-]+|[^\s]/gu)??[]) {
      if(line&&ctx.measureText(line+token).width>width&&!/^[、。，．!?）)]/.test(token)){lines.push(line.trimEnd());line='';}
      for(const c of token){if(line&&ctx.measureText(line+c).width>width&&!/[、。，．!?）)]/.test(c)){lines.push(line.trimEnd());line='';}line+=c;}
    }
    if(line.trim())lines.push(line.trim());return lines;
  };
  const text=(value:string,x:number,y:number,width:number,size:number,max:number,height:number,color=ink,weight=400)=>{
    font(size,weight);ctx.fillStyle=color;const all=wrap(value,width),shown=all.slice(0,max);
    if(all.length>max&&shown.length){let last=shown[shown.length-1];while(last&&ctx.measureText(last+'…').width>width)last=last.slice(0,-1);shown[shown.length-1]=last+'…';}
    shown.forEach((line,i)=>ctx.fillText(line,x,y+i*height));
  };
  const photo=(image:CanvasImageSource,x:number,y:number,w:number,h:number)=>{
    const i=image as unknown as {width:number;height:number};const s=Math.max(w/i.width,h/i.height);
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-i.width*s)/2,y+(h-i.height*s)/2,i.width*s,i.height*s);ctx.restore();
  };
  rect(0,0,827,1169.5,'#fff');rect(0,0,827,10,accent);
  // Match the site's 亀 / kikko brand mark, drawn as vectors on the high-resolution canvas.
  ctx.strokeStyle=accent;ctx.lineWidth=1.5;ctx.beginPath();[[59,38],[83,38],[96,60],[83,82],[59,82],[46,60]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
  text('亀',60,49,28,21,1,25,accent);text('KAMEHAME JAPAN',112,43,667,26,1,32,ink,700);
  text(en?'EXPERIENCES IN JAPAN':'日本で楽しむ、特別な体験',112,77,667,10,1,14,accent,600);
  if(input.experience) {
    const e=input.items[0];
    text(e.area,48,112,731,12,1,16,accent,700);
    text(e.title,48,139,731,27,3,31,ink,700);
    font(27,700);const titleLines=Math.min(3,wrap(e.title,731).length);
    text(e.tagline,48,139+titleLines*31+14,731,13,3,18,muted);
    photo(photos[0],48,310,731,280);
    rect(48,610,731,66,'#f8f5ef');
    text(en?'DURATION':'所要時間',65,622,330,10,1,13,muted,700);
    text(e.duration,65,643,330,14,2,16,ink,600);
    text(en?'GROUP':'参加人数・形式',421,622,340,10,1,13,muted,700);
    text(e.group,421,643,340,14,2,16,ink,600);
    text(en?'WHAT YOU WILL EXPERIENCE':'体験のポイント',48,699,731,12,1,16,accent,700);
    e.highlights.forEach((item,i)=>{rect(49,731+i*34,4,4,accent);text(item,65,725+i*34,714,12,2,16);});
    text(e.price,48,837,731,27,1,32,accent,700);
    text(e.priceNote,48,875,731,11,2,15,muted);
  } else {
    text(en?'Make your stay unforgettable.':'旅の思い出に、日本ならではの体験を。',48,128,731,en?32:29,2,37,ink,700);
    text(en?'Discover hands-on experiences, check availability and request your booking online.':'料理や文化に触れる体験を見つけて、空き状況の確認からご予約までオンラインで。',48,218,731,14,2,21,muted);
    input.items.slice(0,3).forEach((e,i)=>{
      const y=290+i*200;
      photo(photos[i],48,y,232,176);
      text(e.area,303,y+2,476,11,1,15,accent,700);
      text(e.title,303,y+26,476,20,3,24,ink,700);
      text(e.duration,303,y+104,476,12,1,16,muted);
      text(e.price,303,y+129,476,20,1,25,accent,700);
      text(e.priceNote,303,y+158,476,10,2,13,muted);
    });
  }
  rect(48,935,731,178,'#fbf1e5');
  text(en?'SCAN TO EXPLORE & BOOK':'QRから体験を選んで予約',68,955,510,18,1,24,accent,700);
  (en?['1. Scan the QR code','2. Check dates and latest prices','3. Follow the online booking steps']:['1. QRコードを読み取る','2. 日程・最新料金を確認する','3. サイトの案内に沿って予約する']).forEach((line,i)=>text(line,68,990+i*25,500,13,1,18));
  text(en?'Request bookings are confirmed after availability checks.':'リクエスト予約は、空き状況の確認後に確定します。',68,1081,510,10,2,13,muted);
  const qr=qrcode(0,'M');qr.addData(input.referralUrl);qr.make();const n=qr.getModuleCount(),size=142,cell=size/(n+8),x=617,y=950;
  rect(x,y,size,size,'#fff');ctx.fillStyle=ink;
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qr.isDark(r,c))ctx.fillRect(x+(c+4)*cell,y+(r+4)*cell,cell,cell);
  text(en?'Scan or tap the QR':'QRの読み取り・タップ',617,1094,142,9,1,12,muted);
  text(input.demo?(en?'DEMO / SAMPLE - Not valid for booking':'デモ・サンプル / 実際の予約には使えません'):(en?'Prices and availability may change. Check the linked page before booking.':'料金・空き状況は変動します。ご予約前にリンク先でご確認ください。'),48,1130,731,10,1,14,muted);
  text(`${en?'Issued':'発行日'}: ${input.issuedOn}  |  KAMEHAME JAPAN`,48,1148,731,9,1,12,muted);
  ctx.restore();
}
