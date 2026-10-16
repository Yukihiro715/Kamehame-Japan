import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHmac, randomBytes } from "node:crypto";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = readFileSync(new URL("../docs/payment-automation.gs", import.meta.url), "utf8");
const clock = Date.parse("2026-10-13T14:59:00Z"); // 23:59 JST
const p = { requestId: "11111111-2222-4333-8444-555555555555", priceVersion: "2026-10-10", baseTotal: 270000, payment: {version:"photo-2026-10-16",html:'<a href="{{PAYMENT_URL}}">¥{{TOTAL}}</a><a href="{{PAYMENT_URL}}">¥{{TOTAL}}</a>',text:"¥{{TOTAL}} {{PER_PERSON}} {{PAYMENT_URL}} {{CADDIE_LINE}}"}, followUp: {text:"intro"}, enquiry: { experience:"mt-fuji-golf-day", dates:"2026-10-18 07:00", courseMode:"recommended", pickupRegion:"tokyo", pickup:"Example Hotel", party:"2", areaId:"fuji", caddie:"none", lang:"en", email:"guest@example.com", rentalKeys:"required:left,required:right", rental:"Left handed requested" }};
const link = { 区分:"標準プラン", 体験カテゴリ:"プライベートゴルフ", エリア:"富士山エリア", 人数:2, キャディ:"なし", 料金版:"2026-10-10", 自動送信可:"可", 顧客用決済URL:"https://book.stripe.com/EXAMPLE123", Stripeリンク状態:"有効", 通貨:"JPY", "Payment Link ID（plink_）":"plink_example", "キャディ追加料金（税込）":0, "決済総額（税込）":270000 };
function runtime() { const c=vm.createContext({ console, Date, Number, String, JSON, encodeURIComponent, isFinite }); vm.runInContext(source,c); return c; }
const gas=runtime();
const decide = (e={}, l=link, now=clock) => gas.decision_({...p,enquiry:{...p.enquiry,...e}},[l],now);

test("eligibility: prefectures, rental and inclusive four-day JST boundary",()=>{
  for(const pickupRegion of ["tokyo","saitama","chiba"]) assert.equal(decide({pickupRegion}).mode,"payment");
  assert.equal(decide({pickupRegion:"other"}).mode,"manual");
  assert.equal(decide({dates:"2026-10-17 07:00"}).mode,"manual");
  assert.equal(decide({},link,clock+60000).mode,"manual","midnight advances Japan calendar day");
  for(const rentalKeys of ["own,own","required:right,own","unsure,required:left", "", "required:right"]) assert.equal(decide({rentalKeys}).mode,"manual");
  assert.equal(decide({clubs:"Extra-long shaft"}).mode,"manual");
  for(const e of [{courseMode:"specific"},{caddie:"unsure"},{message:"Need a child seat"},{addons:"film"},{addonIds:["film"]},{lang:"fr"},{dates:"2026-02-30 07:00"}]) assert.equal(decide(e).mode,"manual");
  assert.equal(decide({message:"Thank you!"}).mode,"payment");
});
test("approval, amount, currency, active state, caddie price and ambiguity all fail closed",()=>{
  for(const change of [{自動送信可:"不可"},{Stripeリンク状態:"未確認"},{通貨:"USD"},{"決済総額（税込）":260000},{"Payment Link ID（plink_）":""},{料金版:"old"}]) assert.equal(decide({}, {...link,...change}).mode,"manual");
  assert.equal(gas.decision_(p,[link,link],clock).mode,"manual");
  const caddie={...link,キャディ:"あり","キャディ追加料金（税込）":11000,"決済総額（税込）":281000};
  assert.equal(decide({caddie:"required"},caddie).mode,"payment");
  assert.equal(decide({caddie:"required"},{...caddie,"キャディ追加料金（税込）":""}).mode,"manual");
});
function queue(mode, human="", now=clock) {
  const c=runtime(), calls=[], notices=[];
  class Clock extends Date { static now(){return now;} constructor(...a){super(...(a.length?a:[now]));} }
  c.Date=Clock;
  const j={...structuredClone(p),id:"KJ-261018-G11111111",mode,status:"queued",audit:{},ackAt:new Date(clock-10*60000).toISOString(),dueAt:new Date(clock+(mode==="payment"?0:5*60000)).toISOString()};
  c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};
  c.jobs_=()=>[{job:j,row:2}];c.saveJob_=()=>{};c.master_=()=>[link];c.humanActivity_=()=>human;
  c.send_=(j,kind,text,to,html)=>{calls.push({kind,text,html});return "email-id";};c.notify_=(_j,_r,key)=>notices.push(key);c.updatePaymentLedger_=()=>{};c.props_=()=>({setProperty(){}});
  return {c,j,calls,notices};
}
test("10-minute path sends only payment; manual waits for 15; replies suppress both",()=>{
  const a=queue("payment");a.c.processGolfQueue();a.c.processGolfQueue();assert.deepEqual(a.calls.map(x=>x.kind),["payment"]);assert.match(a.calls[0].text,/client_reference_id=KJ-261018-G11111111/);assert.doesNotMatch(a.calls[0].text,/\{\{/);
  const b=queue("manual");b.c.processGolfQueue();assert.equal(b.calls.length,0);b.j.dueAt=new Date(clock).toISOString();b.c.processGolfQueue();assert.deepEqual(b.calls.map(x=>x.kind),["intro"]);
  for(const mode of ["manual","payment"]) {const c=queue(mode,"担当者が返信済み");c.c.processGolfQueue();assert.equal(c.calls.length,0);assert.equal(c.j.status,"held");}
});
test("Gmail failure, manual stop, stale jobs and revoked approval never send payment",()=>{
  const a=queue("payment");a.c.humanActivity_=()=>{throw Error("Gmail unavailable");};a.c.processGolfQueue();assert.equal(a.calls.length,0);assert.equal(a.j.status,"error");
  const b=queue("payment");b.j.stop="停止";b.c.processGolfQueue();assert.equal(b.calls.length,0);
  const d=queue("payment");d.j.dueAt=new Date(clock-3600001).toISOString();d.c.processGolfQueue();assert.equal(d.calls.length,0);
  const e=queue("payment");e.c.master_=()=>[];e.c.processGolfQueue();assert.equal(e.calls.length,0);assert.equal(e.j.mode,"manual");assert.equal(Date.parse(e.j.dueAt)-Date.parse(e.j.ackAt),15*60000);
});
test("Stripe reconciliation is amount-bound, link-bound, live-only and idempotent",()=>{
  const c=runtime(), rows=[], writes=[], j={...structuredClone(p),id:"KJ-261018-G11111111",paymentId:"mail-payment",expectedAmount:270000,paymentLinkId:"plink_example",audit:{}};
  c.jobs_=()=>[{job:j,row:2}];c.saveJob_=()=>{};c.notify_=()=>{};c.upsert_=(...a)=>writes.push(a);
  c.sheet_=()=>({getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows.map(r=>[r[0]])}),appendRow:r=>rows.push(r)});
  const session={id:"cs_live_example",client_reference_id:j.id,payment_status:"paid",payment_link:"plink_example",currency:"jpy",amount_subtotal:270000,amount_total:270000,total_details:{amount_discount:0,amount_shipping:0,amount_tax:0},livemode:true};
  const event=(id,patch={})=>({provider:"stripe",eventId:id,event:{type:"checkout.session.completed",created:clock/1000,data:{object:{...session,...patch}}}});
  c.event_(event("wrong",{amount_total:1}));assert.equal(j.paidAt,undefined);
  c.event_(event("test",{livemode:false}));assert.equal(j.paidAt,undefined);
  c.event_(event("right"));assert.equal(j.paidAmount,270000);assert.equal(writes.length,2);
  assert.equal(c.event_(event("right")).duplicate,true);assert.equal(writes.length,2);
  c.event_(event("another",{id:"cs_live_second"}));assert.equal(j.paidSession,"cs_live_example");
});
test("discount reconciliation checks original package price and records paid residual",()=>{
  const s={id:"cs_live_discount",amount_subtotal:270000,amount_total:243000,total_details:{amount_discount:27000,amount_shipping:0,amount_tax:0},discounts:[{promotion_code:{id:"promo_example",code:"WELCOME10"}}]};
  assert.equal(gas.validPaidAmount_(s,270000),true);
  assert.equal(gas.discountReference_(s),"WELCOME10 (promo_example)");
  assert.equal(gas.discountReference_({...s,discounts:[{promotion_code:"promo_example"}]}),"promo_example");
  for(const patch of [{amount_subtotal:250000},{amount_total:242999},{amount_total:0,total_details:{amount_discount:270000,amount_shipping:0,amount_tax:0}},{total_details:undefined},{amount_total:"243000"},{amount_total:243000.5},{total_details:{amount_discount:-1,amount_shipping:0,amount_tax:0}},{total_details:{amount_discount:27000,amount_shipping:1,amount_tax:0}},{total_details:{amount_discount:27000,amount_shipping:0,amount_tax:1}}]) assert.ok(!gas.validPaidAmount_({...s,...patch},270000));
  const c=runtime(),rows=[],j={...structuredClone(p),id:"KJ-261018-G11111111",paymentId:"mail",expectedAmount:270000,paymentLinkId:"plink_example"};
  c.jobs_=()=>[{job:j,row:2}];c.saveJob_=()=>{};c.notify_=()=>{};c.upsert_=()=>{};c.sheet_=()=>({getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows.map(r=>[r[0]])}),appendRow:r=>rows.push(r)});
  c.event_({provider:"stripe",eventId:"discount",event:{type:"checkout.session.completed",data:{object:{...s,client_reference_id:j.id,payment_status:"paid",payment_link:j.paymentLinkId,currency:"jpy",livemode:true}}}});
  assert.equal(j.paidAmount,243000);assert.equal(j.paidSubtotal,270000);assert.equal(j.paidDiscount,27000);assert.equal(j.paidDiscountReference,"WELCOME10 (promo_example)");
});
test("Gmail ignores our automated messages and drafts, but detects staff and customer replies",()=>{
  const c=runtime(), j={...p,id:"KJ-261018-G11111111",createdAt:new Date(clock-60000).toISOString()};
  let messages=[];
  c.props_=()=>({getProperty:()=>"staff@example.com"});c.Session={getEffectiveUser:()=>({getEmail:()=>"staff@example.com"})};
  c.GmailApp={getAliases:()=>["hello@kamehame-japan.com"],search:()=>[{getMessages:()=>messages}]};
  const mail=(from,auto=false,draft=false)=>({getSubject:()=>`Re: [${j.id}] Golf`,getDate:()=>new Date(clock),isDraft:()=>draft,getHeader:()=>auto?"1":"",getFrom:()=>from,getTo:()=>j.enquiry.email,getCc:()=>""});
  messages=[mail("hello@kamehame-japan.com",true),mail("staff@example.com",false,true)];assert.equal(c.humanActivity_(j),"");
  messages.push(mail("Yukihiro <staff@example.com>"));assert.equal(c.humanActivity_(j),"担当者が返信済み");
  messages=[mail(j.enquiry.email)];assert.equal(c.humanActivity_(j),"お客様から返信");
});
test("a repeated enqueue returns the saved job without another email",()=>{
  const c=runtime();c.jobs_=()=>[{job:{requestId:p.requestId,id:"existing",ackId:"saved"}}];c.send_=()=>{throw Error("must not send");};
  const result=c.enqueue_({...p,ack:{text:"ack"},ledger:{}});assert.equal(result.id,"existing");assert.equal(result.ackSent,true);
});
test("payment-click metrics exclude company-signature clicks and deduplicate event deliveries",()=>{
  const c=runtime(),rows=[],j={...p,id:"KJ-261018-G11111111",paymentId:"payment",ackId:"ack",paymentUrl:"https://book.stripe.com/EXAMPLE123?client_reference_id=KJ-261018-G11111111",audit:{}};
  c.jobs_=()=>[{job:j,row:2}];c.saveJob_=()=>{};c.notify_=()=>{};c.sheet_=()=>({getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows.map(r=>[r[0]])}),appendRow:r=>rows.push(r)});
  const event=(id,url)=>({provider:"resend",eventId:id,event:{type:"email.clicked",created_at:new Date(clock).toISOString(),data:{email_id:"payment",click:{link:url}}}});
  c.event_(event("about","https://travel.mimipo.jp/"));assert.equal(j.audit.clicked,undefined);
  c.event_(event("pay",j.paymentUrl));assert.equal(j.audit.clicked,new Date(clock).toISOString());
  c.event_(event("pay",j.paymentUrl));assert.equal(rows.length,2);
});

const vite=await createServer({appType:"custom",configFile:false,root,resolve:{alias:{"@":root}},server:{middlewareMode:true}});
const {paymentTemplate,photoFollowUp}=await vite.ssrLoadModule("/lib/golf-automation.ts");
after(()=>vite.close());
const {verifyWebhook,receiveWebhook}=await vite.ssrLoadModule("/lib/payment-webhooks.ts");
test("Svix signature, tampering, expired timestamp and rotation with ephemeral test keys",async()=>{
  // Generate a fresh test key in memory. No deployed credential or private email fixture.
  const key=randomBytes(32), secret="whsec_"+key.toString("base64"), raw=JSON.stringify({event_type:"ping",data:{success:true}});
  const id="test-message",timestamp="1731705121";
  const signature=createHmac("sha256",key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  const h=new Headers({"svix-id":id,"svix-timestamp":timestamp,"svix-signature":`v1,${signature}`});
  assert.equal(await verifyWebhook("resend",raw,h,secret,1731705121000),true);
  assert.equal(await verifyWebhook("resend",raw+" ",h,secret,1731705121000),false);
  assert.equal(await verifyWebhook("resend",raw,h,secret,1731705521000),false);
  h.set("svix-signature",`v1,${randomBytes(32).toString("base64")} `+h.get("svix-signature"));
  assert.equal(await verifyWebhook("resend",raw,h,secret,1731705121000),true);
});
test("Stripe HMAC accepts valid signatures, rejects mutations and future timestamps",async()=>{
  const raw='{"id":"evt_test","data":{}}',secret=randomBytes(32).toString("hex"),ts=String(Math.floor(clock/1000));
  const sig=createHmac("sha256",secret).update(`${ts}.${raw}`).digest("hex"),h=new Headers({"stripe-signature":`t=${ts},v1=${sig}`});
  assert.equal(await verifyWebhook("stripe",raw,h,secret,clock),true);
  assert.equal(await verifyWebhook("stripe",raw+" ",h,secret,clock),false);
  assert.equal(await verifyWebhook("stripe",raw,h,secret,clock-301000),false);
  assert.equal((await receiveWebhook("stripe",new Request("https://example.com",{method:"POST",body:raw}),{})).status,503);
});
test("signed Stripe webhook forwards discount fields but strips unrelated customer data",async()=>{
  const ts=String(Math.floor(Date.now()/1000)),secret=randomBytes(32).toString("hex"),originalFetch=globalThis.fetch;
  const raw=JSON.stringify({id:"evt_discount",type:"checkout.session.completed",data:{object:{id:"cs_live_discount",client_reference_id:"KJ-261018-G11111111",payment_status:"paid",currency:"jpy",livemode:true,payment_link:"plink_example",amount_subtotal:270000,amount_total:243000,total_details:{amount_discount:27000,amount_tax:0,amount_shipping:0},discounts:[{promotion_code:{id:"promo_example",code:"WELCOME10",customer:"redaction-fixture"}}],customer_details:{email:"redaction-fixture@example.invalid"}}}});
  let forwarded;globalThis.fetch=async(_url,init)=>{forwarded=JSON.parse(init.body);return Response.json({ok:true});};
  try {
    const sig=createHmac("sha256",secret).update(`${ts}.${raw}`).digest("hex");
    const response=await receiveWebhook("stripe",new Request("https://example.com",{method:"POST",body:raw,headers:{"stripe-signature":`t=${ts},v1=${sig}`}}),{STRIPE_WEBHOOK_SECRET:secret,GOLF_AUTOMATION_TOKEN:randomBytes(32).toString("hex"),GOLF_AUTOMATION_URL:"https://script.google.com/macros/s/test/exec"});
    assert.equal(response.status,200);const s=forwarded.event.data.object;
    assert.equal(s.amount_subtotal,270000);assert.equal(s.total_details.amount_discount,27000);assert.deepEqual(s.discounts,[{promotion_code:{id:"promo_example",code:"WELCOME10"}}]);assert.equal(s.customer_details,undefined);
  }finally{globalThis.fetch=originalFetch;}
});


test("photo payment HTML is dynamic, shoes inclusive, escaped, with both CTAs before and after photos",()=>{
  for(const areaId of ["tokyo","fuji"]) for(const party of ["2","3","4"]) {
    const t=paymentTemplate({...p.enquiry,areaId,party,name:'<img src=x> {{PAYMENT_URL}}'});
    assert.equal(t.version,"photo-2026-10-16");
    assert.match(t.text,/Rental golf shoes are included/);
    assert.doesNotMatch(t.text,/shoes and gloves are not included/);
    assert.match(t.html,/&lt;img src=x&gt;/);
    assert.equal((t.html.match(/Proceed to payment/g)||[]).length,2);
    assert.ok(t.html.indexOf("Proceed to payment")<t.html.indexOf('<img src="https://'));
    assert.ok(t.html.lastIndexOf("Proceed to payment")>t.html.lastIndexOf('<img src="https://'));
    assert.match(t.html,new RegExp(areaId==="fuji"?"fuji-oyama.jpg":"chiba-isumi.jpg"));
    const rendered=gas.fillPayment_(t.html,{TOTAL:"270,000",PER_PERSON:"135,000",PAYMENT_URL:"https://book.stripe.com/TEST?client_reference_id=CASE",CADDIE_LINE:"No caddie",CLUB_DISCOUNT_LINE:"Standard rental clubs included"},true);
    assert.equal((rendered.match(/href="https:\/\/book.stripe.com/g)||[]).length,3);
    assert.doesNotMatch(rendered,/\{\{[A-Z_]+\}\}/);
  }
  assert.equal(photoFollowUp({...p.enquiry,name:"Test",lang:"ja"}).html,undefined);
});
test("queued HTML survives retry unchanged and sends exact approved amount and all payment links",()=>{
  const q=queue("payment");q.c.processGolfQueue();assert.equal(q.calls.length,1);
  assert.equal((q.calls[0].html.match(/270,000/g)||[]).length,2);
  assert.equal((q.calls[0].html.match(/client_reference_id=/g)||[]).length,2);
  const saved=JSON.stringify(q.j.pendingMessage);q.j.status="sending";
  q.j.payment.html="CHANGED TEMPLATE";q.c.processGolfQueue();
  assert.equal(JSON.stringify(q.j.pendingMessage),saved);
});
test("a reply arriving while the payload is saved suppresses transmission",()=>{
  const q=queue("payment");let checks=0;q.c.humanActivity_=()=>++checks===1?"":"担当者が返信済み";
  q.c.processGolfQueue();assert.equal(q.calls.length,0);assert.equal(q.j.status,"held");
});
test("manual queue approvals and sent/uncertain mail suppress automation without Gmail Sent",()=>{
  const c=runtime(), j={...p,id:"CASE",createdAt:new Date(clock).toISOString()};
  c.QC={to:0,caseId:1,status:2,sentAt:3,approvedAt:4,createdAt:5};
  c.QS={approved:"approved",sending:"sending",sent:"sent",check:"check",error:"error"};
  for(const status of ["approved","sending","sent","check","error"]){
    c.qrows_=()=>[{r:[p.enquiry.email,"OTHER",status,new Date(clock+1)]}];
    assert.ok(c.manualQueueActivity_(j));
  }
  for(const r of [[p.enquiry.email,"CASE","draft",new Date(clock+1)],["other@example.com","CASE","sent",new Date(clock+1)],[p.enquiry.email,"OLD","sent",new Date(clock-1)]]){
    c.qrows_=()=>[{r}];assert.equal(c.manualQueueActivity_(j),"");
  }
});


test("own-club discounts select exact approved count and price across both areas",()=>{
  for(const areaId of ["tokyo","fuji"]) for(const n of [2,3,4]) for(let own=0;own<=n;own++) {
    const base=(areaId==="fuji"?270000:250000)+(n-2)*40000;
    const enquiry={...p.enquiry,areaId,party:String(n),rentalKeys:[...Array(own).fill("own"),...Array(n-own).fill("required:right")].join(",")};
    for(const caddie of ["none","required"]) {
      const extra=caddie==="required"?11000:0, total=base+extra-own*5000;
      const req={...p,baseTotal:base,enquiry:{...enquiry,caddie}};
      const row={...link,エリア:areaId==="fuji"?"富士山エリア":"東京近郊",人数:n,キャディ:extra?"あり":"なし",クラブ不要人数:own,"キャディ追加料金（税込）":extra,"決済総額（税込）":total};
      const others=Array.from({length:n+1},(_,k)=>({...row,クラブ不要人数:k,"決済総額（税込）":base+extra-k*5000}));
      const result=gas.decision_(req,others,clock);
      assert.equal(result.mode,"payment");assert.equal(result.link["決済総額（税込）"],total);assert.equal(result.clubDiscount,own*5000);
      assert.equal(gas.decision_(req,[{...row,"決済総額（税込）":total-10000}],clock).mode,"manual","campaign is not automatic");
      assert.equal(gas.decision_(req,[row,row],clock).mode,"manual");
      assert.equal(gas.decision_(req,[{...row,自動送信可:"不可"}],clock).mode,"manual");
      if(own) assert.equal(gas.decision_(req,[{...row,クラブ不要人数:""}],clock).mode,"manual");
    }
  }
  for(const count of [-1,3,1.5,"NaN",true]) assert.equal(decide({}, {...link,クラブ不要人数:count}).mode,"manual");
});
test("discounted queue sends and reconciles discounted amount, holds if matching link disappears",()=>{
  const q=queue("payment"), discounted={...link,クラブ不要人数:1,"決済総額（税込）":265000};
  q.j.enquiry.rentalKeys="own,required:right";
  q.j.payment=paymentTemplate({...q.j.enquiry,name:"Example Guest"});q.c.master_=()=>[discounted];
  q.c.processGolfQueue();assert.equal(q.calls.length,1);assert.equal(q.j.expectedAmount,265000);
  for(const content of [q.calls[0].text,q.calls[0].html]) {assert.match(content,/265,000/);assert.match(content,/5,000 discount/);assert.doesNotMatch(content,/\{\{/);}
  assert.equal(gas.validPaidAmount_({id:"cs_live_example",amount_subtotal:265000,amount_total:265000,total_details:{amount_discount:0,amount_tax:0,amount_shipping:0}},265000),true);
  const held=queue("payment");held.j.enquiry.rentalKeys="own,required:right";held.c.processGolfQueue();assert.equal(held.calls.length,0);assert.equal(held.j.mode,"manual");
});

test('ledger ID allocation reuses request references and checks all tabs plus queued IDs',()=>{
  const c=runtime();c.Utilities={formatDate:()=> '261016'};
  const h=['予約・案件ID','メール','体験カテゴリ','人数','体験日','確認メモ'];
  let rows=[h,['KJ-261018-01','other@example.com','プライベートゴルフ',2,'2026-10-18','']];
  c.ledgerSnapshot_=()=>({headers:h,values:rows});c.jobs_=()=>[{job:{id:'KJ-261018-03'}}];
  const payload={...p,ledger:{experienceDate:'2026-10-18'}};
  assert.equal(c.allocateCaseId_(payload,clock),'KJ-261018-04');
  rows.push(['KJ-261018-02',p.enquiry.email,'プライベートゴルフ',2,'2026-10-18','']);
  assert.throws(()=>c.allocateCaseId_(payload,clock),/重複/);
  rows[2][5]='自動化ID: '+p.requestId;
  assert.equal(c.allocateCaseId_(payload,clock),'KJ-261018-02');
  rows=[h];c.jobs_=()=>[];
  assert.equal(c.allocateCaseId_({...payload,ledger:{}},clock),'KJ-INQ-261016-01');
});
test('ledger vacancies respect manual input, preserve formulas and reject duplicate IDs',()=>{
  const c=runtime();
  const t={headers:['予約・案件ID','名前','計算'],values:[['予約・案件ID','名前','計算'],['','手入力あり',''],['','','']],formulas:[['','',''],['','',''],['','','=A3']]};
  assert.equal(c.ledgerSlot_(t,'KJ-261018-01',{'名前':'Test'}),3);
  assert.throws(()=>c.ledgerSlot_(t,'x',{'不明列':1}),/見出し/);
  t.values[1][0]='same';t.values[2][0]='same';
  assert.throws(()=>c.ledgerSlot_(t,'same',{}),/重複/);
});
test('ledger registration fills empty inputs only and state changes require expected values',()=>{
  const c=runtime(), written=[];
  const headers=['予約・案件ID','名前','対応ステータス','計算','金額'];
  const row=['KJ-261018-01','Staff edited','キャンセル手続き中',123,''];
  const formulas=['','','','=SUM(A1)', ''];
  const sheet={getMaxRows:()=>10,setRowHeight(){},getRange:(r,col,n,w)=>({getValues:()=>[row],getFormulas:()=>[formulas],setWrap(){},setValue(v){written.push([col,v]);row[col-1]=v;}})};
  c.ledgerSnapshot_=()=>({sheet,headers,values:[headers,row],formulas:[[],formulas],width:5});
  c.upsert_('予約一覧',row[0],{'名前':'Replacement','対応ステータス':'支払待ち','計算':0,'金額':250000},{'対応ステータス':['仮予約受領']});
  assert.deepEqual(written,[[5,250000]]);
  row[2]='仮予約受領';c.upsert_('予約一覧',row[0],{'対応ステータス':'支払待ち'},{'対応ステータス':['仮予約受領']});
  assert.equal(row[2],'支払待ち');
});
