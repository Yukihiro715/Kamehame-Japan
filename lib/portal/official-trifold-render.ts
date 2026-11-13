import qrcode from 'qrcode-generator';
import type { OfficialBrochureInput } from './official-brochure-types';

// A4 landscape, 200 dpi. The 97 mm flap nests inside the two 100 mm panels.
export const TRIFOLD_WIDTH = 2339, TRIFOLD_HEIGHT = 1654;
export const TRIFOLD_PHOTOS = ['/images/ramen-noodle-machine.jpg','/images/kanji-hero-results.jpg','/images/kendo-match.jpg'];
export const TRIFOLD_QR = {x:127.5,y:144,size:39};
export const TRIFOLD_PRINT = {
  en: 'A4 landscape · 2 pages · double-sided, flip on short edge · actual size (100%). With the inside facing up, fold the right 97 mm flap inward first, then fold the left cover over it. Test one sheet before printing a batch.',
  ja: 'A4横・全2ページ。両面印刷「短辺とじ」・倍率100%（実際のサイズ）。中面を上にして右の97mm幅の面を内側へ折り、左の表紙を重ねます。まず1枚試し刷りしてください。',
};
const copy = {
  en: {
    flapTitle:['A little','curiosity.','A lasting','memory.'],
    flapBody:['Go beyond sightseeing. Discover experiences that bring you closer to the food, traditions and people of Japan.','Explore the full collection online and find something that fits your trip.'],
    ideas:['Make something new.','Meet a different side of Japan.','Take a story home.'],more:'More to discover online.',
    how:'HOW IT WORKS',backTitle:['From discovery','to experience.'],
    steps:[['Find your experience','Scan the QR and explore the collection.'],['Choose your details','Check dates, guest numbers and prices.'],['Send your request','Follow the booking steps online.']],
    request:'For request bookings, availability is confirmed before your booking is final.',scan:'Scan to explore & book.',
    eyebrow:'EXPERIENCES IN JAPAN',cover:['Don’t just','see Japan.','Experience it.'],coverBody:['Food, culture and moments','to make your own.'],
    inside:'FIND YOUR KIND OF JAPAN',
    themes:[
      {tag:'TASTE',title:['Food &','flavour'],intro:'Get closer to Japan through its food.',body:'Discover hands-on food experiences and the joy of making something delicious.',foot:'These are just a few possibilities.'},
      {tag:'CREATE',title:['Arts &','culture'],intro:'Connect with traditions through doing.',body:'Explore Japanese creativity, learn a craft and make a memory that is yours.',foot:'Explore the latest experiences online.'},
      {tag:'DISCOVER',title:['Move &','explore'],intro:'Try a different side of Japan.',body:'Find active experiences that invite you to take part, learn and challenge yourself.',foot:'SCAN THE QR ON THE BACK'},
    ],demo:'DEMO / SAMPLE - QR not valid for booking',
  },
  ja: {
    flapTitle:['小さな好奇心が、','忘れられない','思い出に。'],
    flapBody:['観光の、その先へ。日本の食や文化、そこに暮らす人々に近づく体験を見つけませんか。','最新の体験はサイトでご紹介しています。旅の予定や好みに合う体験をお選びください。'],
    ideas:['新しいことを、やってみる。','日本の違う一面に、出会う。','旅の物語を、持ち帰る。'],more:'もっとたくさんの体験を、サイトで。',
    how:'ご利用の流れ',backTitle:['見つける楽しみを、','体験する喜びへ。'],
    steps:[['体験を探す','QRを読み取り、気になる体験を見つけます。'],['日程・人数を選ぶ','希望日・人数・最新料金を確認します。'],['予約を申し込む','サイトの案内に沿ってお申し込みください。']],
    request:'リクエスト予約は、空き状況の確認後に確定します。',scan:'QRから体験を探す・予約する',
    eyebrow:'日本で出会う、特別な体験',cover:['日本を、','見るだけでなく、','体験しよう。'],coverBody:['食、文化、そして、','あなただけの思い出を。'],
    inside:'あなたらしい、日本の楽しみ方を。',
    themes:[
      {tag:'TASTE',title:['食を、','楽しむ。'],intro:'おいしい体験から、日本を知る。',body:'自分の手で作り、味わう。食を通して、日本ならではの楽しさに触れてみませんか。',foot:'ここにあるのは、体験のほんの一例。'},
      {tag:'CREATE',title:['文化に、','触れる。'],intro:'やってみることで、伝統が身近に。',body:'日本の創造性や手仕事に触れ、新しいことを学ぶ。自分だけの思い出を形にしましょう。',foot:'最新の体験は、サイトでご紹介しています。'},
      {tag:'DISCOVER',title:['体を動かし、','発見する。'],intro:'いつもと違う、日本に出会う。',body:'参加して、学んで、挑戦する。心も体も動かす体験で、日本の新しい一面を見つけましょう。',foot:'裏面のQRから体験をチェック'},
    ],demo:'デモ・サンプル / このQRでは予約できません',
  },
};

/** Layout in millimetres; each photo occurs once, on the inside only. */
export function renderOfficialTrifold(ctx:CanvasRenderingContext2D,input:OfficialBrochureInput,photos:CanvasImageSource[],side:'outside'|'inside') {
  const c=copy[input.lang],en=input.lang==='en',paper='#f4f0e7',orange='#b74908',ink='#292621';
  ctx.save();ctx.scale(TRIFOLD_WIDTH/297,TRIFOLD_HEIGHT/210);ctx.textBaseline='top';
  const rect=(x:number,y:number,w:number,h:number,color:string)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const font=(s:number,serif=false,bold=false)=>{ctx.font=`${bold?600:400} ${s}px ${serif?`"Kamehame Editorial ${input.lang}", Georgia, "Noto Serif CJK JP", serif`:'Arial, "Hiragino Sans", "Noto Sans CJK JP", sans-serif'}`;};
  const line=(x:number,y:number,w:number,color=orange)=>{rect(x,y,w,.2,color);};
  const text=(value:string,x:number,y:number,w:number,s=3.7,color=ink,serif=false,bold=false,leading=s*1.4)=>{
    font(s,serif,bold);ctx.fillStyle=color;
    const lines:string[]=[];let current='';
    for(const token of value.match(/\s+|[A-Za-z0-9’'.,!&/()-]+|[^\s]/gu)??[]) {
      if(current&&ctx.measureText(current+token).width>w&&!/^[、。！）」]/.test(token)){lines.push(current.trim());current='';}
      current+=token;
    }
    if(current.trim())lines.push(current.trim());
    lines.forEach((v,i)=>ctx.fillText(v,x,y+i*leading));return y+lines.length*leading;
  };
  const heading=(lines:string[],x:number,y:number,w:number,s:number,color=ink)=>{lines.forEach((v,i)=>text(v,x,y+i*s*1.04,w,s,color,true));};
  const brand=(x:number,y:number,w:number,color=orange)=>text('KAMEHAME JAPAN',x,y,w,3.4,color,false,true);
  const photo=(image:CanvasImageSource,x:number,y:number,w:number,h:number)=>{const p=image as unknown as {width:number;height:number};const s=Math.max(w/p.width,h/p.height);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(image,x+(w-p.width*s)/2,y+(h-p.height*s)/2,p.width*s,p.height*s);ctx.restore();};
  rect(0,0,297,210,paper);
  if(side==='outside') {
    // Fold-in flap: 97 mm. Back cover: 100 mm. Front cover: 100 mm.
    brand(9,12,79);heading(c.flapTitle,9,24,79,en?11:8.2);
    line(9,76,12);let y=84;
    c.flapBody.forEach(p=>{y=text(p,9,y,78,en?3.9:3.7)+5;});
    y=Math.max(151,y+2);
    c.ideas.forEach(p=>{line(9,y,79);y=text(p,9,y+3,79,en?3.8:3.6,ink,false,true)+5;});
    text(c.more,9,199,79,3.1);
    rect(97,0,100,210,orange);
    text(c.how,106,12,82,3.3,paper,false,true);
    heading(c.backTitle,106,24,82,en?8.4:7,paper);
    c.steps.forEach(([title,body],i)=>{
      const sy=63+i*21;
      text(`0${i+1}`,106,sy,13,6,paper,false,true);
      text(title,124,sy,63,en?4:3.8,paper,false,true);
      text(body,124,sy+6,63,3.5,paper);
      if(i<2)line(106,sy+18,82,'#e5b596');
    });
    text(c.request,106,126,82,en?2.8:3,paper);
    // Move QR down sufficiently to clear the booking caveat in both languages.
    const {y:qrY,size:qrSize,x:qrX}=TRIFOLD_QR;
    const qr=qrcode(0,'M');qr.addData(input.referralUrl);qr.make();const n=qr.getModuleCount(),cell=qrSize/(n+8);
    rect(qrX,qrY,qrSize,qrSize,'#fff');ctx.fillStyle=ink;
    for(let r=0;r<n;r++)for(let col=0;col<n;col++)if(qr.isDark(r,col))ctx.fillRect(qrX+(col+4)*cell,qrY+(r+4)*cell,cell,cell);
    text(c.scan,112,188,73,en?4:3.6,paper);brand(122,200,65,paper);
    // Front cover. Keep the large title above the rack edge.
    ctx.strokeStyle=orange;ctx.lineWidth=.35;ctx.beginPath();[[207,12],[210,10.3],[213,12],[213,15.4],[210,17.1],[207,15.4]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
    brand(218,12,70,ink);
    text(c.eyebrow,206,29,82,3.3,orange,false,true);
    c.cover.forEach((v,i)=>text(v,206,44+i*(en?13.3:13.7),82,en?11.6:9.2,i===2?orange:ink,true));
    line(206,91,12);
    c.coverBody.forEach((v,i)=>text(v,206,101+i*5.8,82,en?4.2:4));
    // Folded-paper ribbon, a vector interpretation of the approved concept.
    ctx.save();ctx.beginPath();ctx.rect(197,126,100,84);ctx.clip();
    ctx.fillStyle=orange;ctx.beginPath();ctx.moveTo(197,171);ctx.bezierCurveTo(224,139,237,137,264,152);ctx.lineTo(297,172);ctx.lineTo(297,193);ctx.bezierCurveTo(260,161,239,156,197,203);ctx.closePath();ctx.fill();
    ctx.fillStyle='#84330b';ctx.beginPath();ctx.moveTo(264,152);ctx.bezierCurveTo(279,160,300,165,297,172);ctx.lineTo(280,170);ctx.closePath();ctx.fill();
    ctx.fillStyle='#cb5a12';ctx.beginPath();ctx.moveTo(297,123);ctx.bezierCurveTo(263,131,251,147,278,163);ctx.lineTo(297,174);ctx.lineTo(297,156);ctx.bezierCurveTo(279,147,284,143,297,139);ctx.closePath();ctx.fill();ctx.restore();
    // Tiny, unobtrusive fold guides at the sheet edges; no rules across the artwork.
    for(const x of [97,197]){line(x-.1,0,.2,'#d6c5b4');rect(x-.1,208,.2,2,'#d6c5b4');}
  } else {
    text(c.inside,9,10,91,3.4,ink,false,true);
    c.themes.forEach((theme,i)=>{
      const x=i*100+9,w=i===2?79:82;
      text(theme.tag,x,23,w,3.5,orange,false,true);line(x,30,w);
      heading(theme.title,x,35,w,en?12.5:9.3);
      text(theme.intro,x,65,w,en?4:3.8);
      photo(photos[i],x-3,87,w+6,61);
      text(theme.body,x,154,w,en?4:3.8,ink,false,false,en?5.7:6.1);
      line(x,189,w);text(theme.foot,x,195,w,en?3.15:2.9,i===2?orange:ink,false,i===2);
    });
  }
  if(input.demo){rect(0,205.5,297,4.5,'#fff');text(c.demo,side==='outside'?100:9,206.1,190,2.3,orange);}
  ctx.restore();
}
