import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createHmac } from 'node:crypto';

const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
const m=await vite.ssrLoadModule('/lib/experience-checkout.ts');
const {EXPERIENCE_PRODUCTS,provisionalCopy,checkoutProductConfigured}=await vite.ssrLoadModule('/lib/provisional-booking.ts');
const {PRIVATE_TEA_CHECKOUT_PRICES}=await vite.ssrLoadModule('/lib/private-tea-checkout-prices.ts');
// Payment tests use isolated fixture IDs; never create real checkout sessions.
for (const [key,p] of Object.entries(PRIVATE_TEA_CHECKOUT_PRICES)) p.price='price_fixture'+key.replaceAll('_','');
const {catalogFor}=await vite.ssrLoadModule('/lib/catalog.ts');
const {pricingFor,quote}=await vite.ssrLoadModule('/lib/pricing.ts');
const {BookingProvider,firstOpenDate}=await vite.ssrLoadModule('/components/site/booking-context.tsx');
const {EnquiryForm}=await vite.ssrLoadModule('/components/site/enquiry-form.tsx');
const {CurrencyProvider}=await vite.ssrLoadModule('/components/site/currency-context.tsx');
const {receiveWebhook}=await vite.ssrLoadModule('/lib/payment-webhooks.ts');
const now=Date.parse('2026-10-22T08:00:00Z');
const base={request_id:'11111111-2222-4333-8444-555555555555',experience:'kanji-name-calligraphy',lang:'en',name:'Example Guest',email:'guest@example.com',date:'2026-11-02',time:'10:30',guests:2,message:'',consent:true,standard:true};
const order=m.parseExperienceOrder(base,now);
const reference='KJ-E-11111111222243338444555555555555';
const env={EXPERIENCE_CHECKOUT_ENABLED:'true',STRIPE_CHECKOUT_KEY:'rk_live_example',STRIPE_READ_KEY:'rk_live_read',STRIPE_WEBHOOK_SECRET:'whsec_example',GOLF_AUTOMATION_URL:'https://script.google.com/macros/s/example/exec',GOLF_AUTOMATION_TOKEN:'test-token'};

test('server prices: minimum charge, allowed quantities, adult eligibility and tampered prices',()=>{
  assert.equal(order.amount,39600);assert.equal(order.quantity,2);assert.equal(order.guests,2);
  for(const guests of [2,3,4])assert.equal(m.parseExperienceOrder({...base,guests},now).amount,19800*guests);
  assert.equal(m.parseExperienceOrder({...base,guests:5},now),null);
  assert.equal(m.parseExperienceOrder({...base,amount:1,price:'price_fake'},now).amount,39600);
  assert.equal(m.parseExperienceOrder({...base,experience:'mt-fuji-golf-day'},now),null);
  for(const change of [{guests:1},{guests:1.5},{consent:false},{standard:false},{date:'2026-02-30'},{time:'03:00'},{date:'2026-10-22'},{email:'bad'},{name:'Header\r\nInjected'},{request_id:'invalid'}])assert.equal(m.parseExperienceOrder({...base,...change},now),null);
  assert.equal(m.parseExperienceOrder({...base,date:'2026-10-23'},Date.parse('2026-10-22T09:00:00Z')),null,'18:00 JST cutoff');
  const k={...base,experience:'tokyo-kendo-experience-tour',time:'10:00',guests:2};
  assert.equal(m.parseExperienceOrder(k,now),null);
  assert.equal(m.parseExperienceOrder({...k,adultOnly:true},now).amount,39600);
  assert.equal(m.parseExperienceOrder({...k,adultOnly:true,date:'2026-11-07'},now),null,'weekend');
  assert.equal(m.parseExperienceOrder({...base,experience:'shibuya-ramen-class',time:'11:00',guests:16},now).amount,424000);
});

test('enabled non-golf experiences support their priced party range and correct city return URL',()=>{
  const enquiryOnly = new Set(catalogFor('en').experiences.filter(x=>!EXPERIENCE_PRODUCTS[x.slug]).map(x=>x.slug));
  const published=catalogFor('en').experiences.filter(x=>x.category!=='golf');
  for (const x of published.filter(x=>enquiryOnly.has(x.slug))) {
    assert.equal(EXPERIENCE_PRODUCTS[x.slug],undefined);
    assert.equal(m.parseExperienceOrder({...base,experience:x.slug,guests:2,time:'10:00',adultOnly:true},now),null);
  }
  const products=published.filter(x=>!enquiryOnly.has(x.slug));
  assert.equal(products.length,13);
  assert.deepEqual(Object.keys(EXPERIENCE_PRODUCTS).sort(),products.map(x=>x.slug).sort());
  for(const x of products) {
    const product=EXPERIENCE_PRODUCTS[x.slug];
    for(let guests=product.min;guests<=product.max;guests++) {
      const input={...base,experience:x.slug,guests,time:product.timeOnConfirmation?'':x.availability?.startTimes?.[0]??'10:00',adultOnly:true,plan:product.groupPricing?'select':'',interpreter:'fr'};
      const o=m.parseExperienceOrder(input,now);
      assert.ok(o,x.slug+' '+guests);
      assert.equal(o.city,x.city);
      assert.equal(o.amount,product.privateTeaPricing?quote(pricingFor(x,'en'),'',guests,input.date).total:product.groupPricing?({2:179000,3:209000,4:231000,5:271000})[guests]:product.amount*Math.max(guests,product.minCharge));
      assert.match(m.checkoutParameters(o,reference,now).get('cancel_url'),new RegExp('/'+x.city+'/'+x.slug+'/'));
    }
    assert.equal(m.parseExperienceOrder({...base,experience:x.slug,guests:product.max+1,adultOnly:true},now),null);
  }
});

test('geiko stays enquiry-only and cannot create a provisional checkout',()=>{
  assert.equal(EXPERIENCE_PRODUCTS['evening-with-geiko'],undefined);
  for(const date of ['2027-02-02','2026-11-02']) {
    for(const plan of ['select','signature','reserve'])for(let guests=2;guests<=5;guests++) {
      assert.equal(m.parseExperienceOrder({...base,experience:'evening-with-geiko',time:'18:00',date,guests,plan,interpreter:'es',adultOnly:true},now),null);
    }
  }
});

test('ledger preserves non-Tokyo cities, group charge labels and interpreter choice',()=>{
  const c=vm.createContext({});vm.runInContext(readFileSync(new URL('../docs/experience-checkout.gs',import.meta.url),'utf8'),c);
  const saved={};c.experienceUpsert_=(sheet,id,fields)=>{saved[sheet]=fields;};
  c.writeExperienceLedger_({id:reference,createdAt:now,order:{...order,city:'kyoto',slug:'evening-with-geiko',chargeUnit:'group',quantity:1,guests:3,interpreter:'fr'}});
  assert.equal(saved['予約一覧']['体験カテゴリ'],'京都芸妓・舞妓');
  assert.equal(saved['手配・体験詳細']['エリア'],'京都');
  assert.match(saved['手配・体験詳細']['人数内訳'],/1組分（3名）/);
  assert.match(saved['手配・体験詳細']['希望・アレルギー等'],/フランス語/);
  c.writeExperienceLedger_({id:reference,createdAt:now,order:{...order,city:'osaka',slug:'dotonbori-ramen-class'}});
  assert.equal(saved['予約一覧']['体験カテゴリ'],'料理・グルメ');assert.equal(saved['手配・体験詳細']['エリア'],'大阪');
});
test('Checkout binds reference, language return URL, quantity and pending text; dynamic methods retained',()=>{
  const p=m.checkoutParameters(order,reference,now);
  assert.equal(p.get('line_items[0][quantity]'),'2');assert.equal(p.get('client_reference_id'),reference);
  assert.equal(p.get('success_url'),'https://kamehame-japan.com/en/booked/?stay=1&session_id={CHECKOUT_SESSION_ID}');
  assert.equal(p.get('metadata[booking_flow]'),'experience_provisional');
  assert.equal(p.has('payment_method_types'),false);assert.equal(p.has('automatic_tax[enabled]'),false);
  assert.match(p.get('custom_text[submit][message]'),/provisional/);
  for(const lang of ['en','ja','fr','es','zh-tw'])assert.ok(m.checkoutParameters({...order,lang},reference,now).get('custom_text[submit][message]').length<=1200);
});
test('readiness fails closed on missing key, old ledger and downstream errors',async()=>{
  assert.equal(m.checkoutConfigured({...env,STRIPE_CHECKOUT_KEY:undefined}),false);
  assert.equal(m.checkoutConfigured({...env,STRIPE_WEBHOOK_SECRET:undefined,STRIPE_EXPERIENCE_WEBHOOK_SECRET:'whsec_additional'}),true);
  assert.equal(m.checkoutConfigured({...env,STRIPE_WEBHOOK_SECRET:undefined,STRIPE_EXPERIENCE_WEBHOOK_SECRET:undefined}),false);
  const old=globalThis.fetch;
  try {
    globalThis.fetch=async()=>Response.json({ok:true,version:'old',ready:true});assert.equal(await m.checkoutReady(env),false);
    globalThis.fetch=async()=>Response.json({ok:true,version:'2026-10-22',ready:true});assert.equal(await m.checkoutReady(env),true);
    globalThis.fetch=async()=>{throw Error('offline');};assert.equal(await m.checkoutReady(env),false);
  }finally{globalThis.fetch=old;}
});

test('additional Stripe secret accepts the new endpoint and preserves legacy verification',async()=>{
  const timestamp=Math.floor(Date.now()/1000);
  const raw=JSON.stringify({id:'evt_signature_probe',type:'checkout.session.expired',data:{object:{client_reference_id:'SIGNATURE-CHECK-NO-BOOKING'}}});
  const request=(secret,body=raw)=>new Request('https://kamehame-japan.com/api/webhooks/stripe',{
    method:'POST',body,headers:{'stripe-signature':`t=${timestamp},v1=${createHmac('sha256',secret).update(timestamp+'.'+raw).digest('hex')}`}
  });
  const dual={...env,STRIPE_EXPERIENCE_WEBHOOK_SECRET:'whsec_additional'};
  for(const key of ['whsec_example','whsec_additional']) {
    const result=await receiveWebhook('stripe',request(key),dual);
    assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true,ignored:true});
  }
  assert.equal((await receiveWebhook('stripe',request('whsec_example'),env)).status,200);
  assert.equal((await receiveWebhook('stripe',request('whsec_additional'),{...dual,STRIPE_WEBHOOK_SECRET:undefined})).status,200);
  assert.equal((await receiveWebhook('stripe',request('whsec_unknown'),dual)).status,400);
  assert.equal((await receiveWebhook('stripe',request('whsec_additional',raw+' '),dual)).status,400);
  assert.equal((await receiveWebhook('stripe',request('whsec_additional'),{...env,STRIPE_WEBHOOK_SECRET:undefined})).status,503);
});
test('retry uses same Stripe idempotency key; no redirect until session is persisted',async()=>{
  const old=globalThis.fetch,calls=[];let failPersist=true;const createdAt=Date.now();
  try{
    globalThis.fetch=async(url,init)=>{
      if(String(url).startsWith('https://api.stripe.com')){calls.push(init);return Response.json({id:'cs_live_example',url:'https://checkout.stripe.com/c/pay/example',status:'open',livemode:true,amount_total:39600,currency:'jpy'});}
      const b=JSON.parse(init.body);
      if(b.action==='experience_create')return Response.json({ok:true,id:reference,createdAt,status:'awaiting_payment'});
      return Response.json({ok:!failPersist});
    };
    await assert.rejects(m.openExperienceCheckout(env,order));failPersist=false;
    assert.equal((await m.openExperienceCheckout(env,order)).ok,true);
    assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
    assert.equal(calls[0].body.toString(),calls[1].body.toString());
  }finally{globalThis.fetch=old;}
});

function gasRuntime(orderOverride=order){
  const order=orderOverride;
  const c=vm.createContext({console,Date,JSON,Number,String,Error,isNaN});
  vm.runInContext(readFileSync(new URL('../docs/experience-checkout.gs',import.meta.url),'utf8'),c);
  const jobs=[],writes=[],sends=[];
  c.experienceRows_=()=>jobs.map((job,i)=>({job:structuredClone(job),row:i+2}));
  c.saveExperience_=(j,row)=>jobs[row-2]=structuredClone(j);
  c.sheet_=()=>({getLastRow:()=>jobs.length+1});
  c.writeExperienceLedger_=j=>writes.push(structuredClone(j));
  c.experienceSend_=(j,kind)=>{sends.push({id:j.id,kind});return 'email_'+kind;};
  c.props_=()=>({getProperty:k=>k==='TEAM_EMAIL'?'team@example.com':'true'});
  c.LockService={getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})};
  const created=c.experienceAction_({action:'experience_create',order,receipt:{subject:'Payment received',text:'Pending host confirmation'}});
  const session={id:'cs_live_example',reference:created.id,paymentStatus:'paid',status:'complete',amount:order.amount,subtotal:order.amount,currency:'jpy',livemode:true,flow:'experience_provisional',policyVersion:'2026-10-22',slug:order.slug,items:[{price:order.price,quantity:order.quantity}],moreItems:false};
  const event=(id='evt_example',patch={},eventType='checkout.session.completed')=>({action:'experience_event',eventId:id,eventType,session:{...session,...patch}});
  return {c,jobs,writes,sends,created,session,event};
}
test('ledger creates provisional request once; retries and conflicting requests are handled',()=>{
  const {c,jobs,created}=gasRuntime();
  const again=c.experienceAction_({action:'experience_create',order,receipt:{text:'same'}});assert.equal(again.id,created.id);assert.equal(jobs.length,1);
  assert.equal(jobs[0].status,'awaiting_payment');
  assert.throws(()=>c.experienceAction_({action:'experience_create',order:{...order,guests:3},receipt:{text:'x'}}),/conflict/);
});
test('no fulfillment on unpaid; async success and retries result in one receipt and one team alert',()=>{
  const {c,jobs,sends,event}=gasRuntime();
  c.experienceAction_(event('evt_unpaid',{paymentStatus:'unpaid'}));c.processExperienceQueue();assert.equal(sends.length,0);
  c.experienceAction_(event('evt_paid',{},'checkout.session.async_payment_succeeded'));
  c.experienceAction_(event('evt_paid',{},'checkout.session.async_payment_succeeded'));
  c.processExperienceQueue();c.processExperienceQueue();
  assert.equal(jobs[0].status,'paid_pending');assert.equal(sends.length,2);
  c.experienceAction_(event('evt_old',{paymentStatus:'unpaid'},'checkout.session.async_payment_failed'));
  assert.equal(jobs[0].status,'paid_pending','late failure cannot regress paid state');
});
test('money, product, quantity, currency, mode and duplicate sessions cannot be marked paid',()=>{
  for(const patch of [{amount:1},{subtotal:1},{currency:'usd'},{livemode:false},{slug:'other'},{items:[{price:'wrong',quantity:2}]},{items:[{price:order.price,quantity:1}]},{moreItems:true}]){
    const {c,jobs,event}=gasRuntime();assert.throws(()=>c.experienceAction_(event('evt_bad',patch)));assert.equal(jobs[0].paidAt,undefined);
  }
  const {c,event}=gasRuntime();c.experienceAction_(event());assert.throws(()=>c.experienceAction_(event('evt_other',{id:'cs_live_other'})),/duplicate payment/);
});
test('paid record survives downstream failure; queue resumes without resending completed receipt',()=>{
  const {c,jobs,event,sends}=gasRuntime();c.experienceAction_(event());
  let failed=false;
  c.experienceSend_=(j,kind)=>{if(kind==='team'&&!failed){failed=true;throw Error('unavailable');}sends.push(kind);return 'mail_'+kind;};
  c.processExperienceQueue();assert.equal(jobs[0].receiptId,'mail_receipt');assert.equal(jobs[0].status,'paid_pending');
  c.processExperienceQueue();assert.deepEqual(sends,['receipt','team']);
});
test('signed experience webhook is routed separately; invalid signatures and failed ledger are retried',async()=>{
  const old=globalThis.fetch;
  const event={id:'evt_example',type:'checkout.session.completed',data:{object:{id:'cs_live_example',client_reference_id:reference}}};
  const raw=JSON.stringify(event),timestamp=Math.floor(Date.now()/1000);
  const signature=createHmac('sha256','whsec_example').update(timestamp+'.'+raw).digest('hex');
  const req=(sig=signature)=>new Request('https://kamehame-japan.com/api/webhooks/stripe',{method:'POST',body:raw,headers:{'stripe-signature':`t=${timestamp},v1=${sig}`}});
  const calls=[];
  try {
    globalThis.fetch=async(url,init)=>{
      if(String(url).includes('api.stripe.com'))return Response.json({id:'cs_live_example',client_reference_id:reference,metadata:{booking_flow:'experience_provisional'},livemode:true,line_items:{data:[]}});
      calls.push(JSON.parse(init.body));return Response.json({ok:true});
    };
    assert.equal((await receiveWebhook('stripe',req('0'.repeat(64)),env)).status,400);assert.equal(calls.length,0);
    assert.equal((await receiveWebhook('stripe',req(),env)).status,200);assert.equal(calls[0].action,'experience_event');
    globalThis.fetch=async()=>{throw Error('offline');};assert.equal((await receiveWebhook('stripe',req(),env)).status,503);
  }finally{globalThis.fetch=old;}
});
test('enabled request form renders paid-provisional copy, charge minimum and consent in all languages',()=>{
  for(const lang of ['en','ja','es','fr','zh-tw']){
    const x=catalogFor(lang).experiences.find(x=>x.slug==='kanji-name-calligraphy');
    const b={slug:x.slug,title:x.title,provisionalCheckout:true,leadDays:1,cutoffTime:'18:00',minGuests:2,defaultGuests:2,listedMax:4,maxGuests:4,startTimes:x.availability.startTimes,interpreter:false,cancellationText:x.cancellation,cancellationTiers:x.cancellationTiers};
    const html=renderToStaticMarkup(React.createElement(CurrencyProvider,null,React.createElement(BookingProvider,{experience:b,pricing:pricingFor(x,lang),lang},React.createElement(EnquiryForm,{kind:'guest',lang,fallbackEmail:'hello@kamehame-japan.com',experience:x}))));
    assert.ok(html.includes(provisionalCopy(lang).cta));assert.ok(html.includes('checkout_consent'));assert.ok(html.includes('39,600'));assert.ok(html.includes('required=""'));
    assert.ok(!html.includes('No payment now'));
  }
});

test('ledger vacancies respect manual input, preserve formulas and reject duplicate IDs',()=>{
  const c=vm.createContext({});vm.runInContext(readFileSync(new URL('../docs/experience-checkout.gs',import.meta.url),'utf8'),c);
  const t={headers:['予約・案件ID','名前','計算'],values:[['予約・案件ID','名前','計算'],['','手入力あり',''],['','','']],formulas:[['','',''],['','',''],['','','=A3']]};
  assert.equal(c.experienceLedgerSlot_(t,'KJ-261018-01',{'名前':'Test'}),3);
  assert.throws(()=>c.experienceLedgerSlot_(t,'x',{'不明列':1}),/見出し/);
  t.values[1][0]='same';t.values[2][0]='same';
  assert.throws(()=>c.experienceLedgerSlot_(t,'same',{}),/重複/);
});
test('experience ledger uses production dropdown labels for every product and language',()=>{
  const c=vm.createContext({});vm.runInContext(readFileSync(new URL('../docs/experience-checkout.gs',import.meta.url),'utf8'),c);
  const allowed={
    '体験カテゴリ':['プライベートゴルフ','京都芸妓・舞妓','東京芸者','漢字・書道','茶道','料理・グルメ','その他'],
    '対応言語':['日本語','英語','スペイン語','フランス語','繁体字中国語','その他'],
    '対応ステータス':['仮予約受領','入金済・手配待ち'],
    '支払い状況':['未請求','入金済'],
    '受付経路':['Webフォーム'],
    '手配状況':['未着手'],
    '運用区分':['通常'],
    'リマインド運用':['手動','停止'],
  };
  const languages={en:'英語',ja:'日本語',es:'スペイン語',fr:'フランス語','zh-tw':'繁体字中国語'};
  let reservation;
  c.experienceUpsert_=(sheet,id,fields)=>{
    for(const [name,value] of Object.entries(fields)) if(allowed[name]) assert.ok(allowed[name].includes(value),`${sheet}: ${name} rejects ${value}`);
    if(sheet==='予約一覧')reservation=fields;
  };
  for(const slug of Object.keys(EXPERIENCE_PRODUCTS))for(const [lang,label] of Object.entries(languages))for(const paidAt of [undefined,Date.now()]) {
    c.writeExperienceLedger_({id:reference,createdAt:Date.now(),order:{...order,slug,lang},paidAt});
    assert.equal(reservation['対応言語'],label);
  }
});
test('ledger registration fills empty inputs only and state changes require expected values',()=>{
  const c=vm.createContext({});vm.runInContext(readFileSync(new URL('../docs/experience-checkout.gs',import.meta.url),'utf8'),c); const written=[];c.literal_=x=>x;
  const headers=['予約・案件ID','名前','対応ステータス','計算','金額'];
  const row=['KJ-261018-01','Staff edited','キャンセル手続き中',123,''];
  const formulas=['','','','=SUM(A1)', ''];
  const sheet={getMaxRows:()=>10,setRowHeight(){},getRange:(r,col,n,w)=>({getValues:()=>[row],getFormulas:()=>[formulas],setWrap(){},setValue(v){written.push([col,v]);row[col-1]=v;}})};
  c.experienceLedgerSnapshot_=()=>({sheet,headers,values:[headers,row],formulas:[[],formulas],width:5});
  c.experienceUpsert_('予約一覧',row[0],{'名前':'Replacement','対応ステータス':'支払待ち','計算':0,'金額':250000},{'対応ステータス':['仮予約受領']});
  assert.deepEqual(written,[[5,250000]]);
  row[2]='仮予約受領';c.experienceUpsert_('予約一覧',row[0],{'対応ステータス':'支払待ち'},{'対応ステータス':['仮予約受領']});
  assert.equal(row[2],'支払待ち');
});

test('earliest displayed date skips weekends, closures and empty announced slots',()=>{
  assert.equal(firstOpenDate({weekdaysOnly:true},'2026-10-25'),'2026-10-26');
  assert.equal(firstOpenDate({weekdaysOnly:true,closed:[{from:'10-26',to:'10-26'}]},'2026-10-25'),'2026-10-27');
  assert.equal(firstOpenDate({closed:[{from:'12-29',to:'01-03'}]},'2026-12-31'),'2027-01-04');
  assert.equal(firstOpenDate({dates:[{date:'2026-10-25',times:[]},{date:'2026-10-26',times:['10:00']}]},'2026-10-25'),'2026-10-26');
  assert.equal(firstOpenDate({dates:[]},'2026-10-25'),undefined);
  assert.equal(firstOpenDate({},'2026-10-25'),'2026-10-25');
});


test('Nihonbashi validates party limits, eligibility and date-only requests including weekends',()=>{
  for(const [slug,min,amount] of [['nihonbashi-kendo-experience',1,25000],['nihonbashi-bushido-experience',2,10000]]) {
    const input={...base,experience:slug,date:'2026-11-07',time:'',guests:min,adultOnly:true};
    const o=m.parseExperienceOrder(input,now);
    assert.equal(o.amount,amount*min);assert.equal(o.time,'To be confirmed');
    for(const patch of [{adultOnly:false},{guests:min-1},{guests:9},{time:'10:00'}]) assert.equal(m.parseExperienceOrder({...input,...patch},now),null);
    for(const lang of ['en','ja','es','fr','zh-tw']) {
      const x=catalogFor(lang).experiences.find(e=>e.slug===slug);
      const b={slug,title:x.title,provisionalCheckout:true,minGuests:min,defaultGuests:min,listedMax:8,maxGuests:8,interpreter:false};
      const html=renderToStaticMarkup(React.createElement(CurrencyProvider,{lang},React.createElement(BookingProvider,{experience:b,pricing:pricingFor(x,lang)},React.createElement(EnquiryForm,{lang,card:true}))));
      assert.ok(html.includes('checkout_adult'));assert.ok(!html.includes('name="time"'));
    }
  }
  for(const lang of ['en','ja','es','fr','zh-tw']) assert.equal(catalogFor(lang).experiences.find(e=>e.slug==='kanji-name-calligraphy').partySize.min,2);
});

const teaInput={...base,experience:'kyoto-higashiyama-private-tea-ceremony',date:'2026-12-31',time:'15:00',guests:3,adultOnly:true};
test('private tea prices match displayed totals across seasons, year boundary, all party sizes and languages',()=>{
  const expected={
    '2026-12-27':[25000,33000,49500,66000,82500],
    '2026-12-28':[27500,38000,57000,76000,95000],
    '2027-01-03':[27500,38000,57000,76000,95000],
    '2027-01-04':[25000,33000,49500,66000,82500],
    '2027-03-01':[27500,38000,57000,76000,95000],
    '2027-04-30':[27500,38000,57000,76000,95000],
    '2027-05-01':[25000,33000,49500,66000,82500],
    '2026-11-30':[27500,38000,57000,76000,95000],
    '2026-12-01':[25000,33000,49500,66000,82500],
  };
  for(const [date,totals] of Object.entries(expected))for(let guests=1;guests<=5;guests++)for(const lang of ['en','ja','es','fr','zh-tw']) {
    const o=m.parseExperienceOrder({...teaInput,date,guests,lang,amount:1,price:'price_tampered'},now);
    const x=catalogFor(lang).experiences.find(e=>e.slug===teaInput.experience) ?? catalogFor('en').experiences.find(e=>e.slug===teaInput.experience);
    assert.equal(o.amount,totals[guests-1]);
    assert.equal(o.amount,quote(pricingFor(x,lang),'',guests,date).total);
    assert.equal(o.quantity,guests);assert.equal(o.city,'kyoto');
    const p=m.checkoutParameters(o,reference,now);
    assert.equal(p.get('line_items[0][price]'),o.price);
    assert.equal(p.get('line_items[0][quantity]'),String(guests));
  }
});
test('private tea rejects unpaid extras, invalid parties, times, age consent and missing Stripe configuration',()=>{
  for(const change of [{guests:0},{guests:6},{adultOnly:false},{time:'15:30'},{addOns:['kimono']},{plan:'fake'}]) assert.equal(m.parseExperienceOrder({...teaInput,...change},now),null);
  const price=PRIVATE_TEA_CHECKOUT_PRICES.peak_guest.price;
  try {
    PRIVATE_TEA_CHECKOUT_PRICES.peak_guest.price='';
    assert.equal(checkoutProductConfigured(teaInput.experience),false);
    assert.equal(m.parseExperienceOrder(teaInput,now),null);
  } finally {PRIVATE_TEA_CHECKOUT_PRICES.peak_guest.price=price;}
});
test('private tea respects the published rolling 24-hour cutoff',()=>{
  const at=Date.parse('2026-11-14T06:00:00Z'); // 15:00 JST
  assert.ok(m.parseExperienceOrder({...teaInput,date:'2026-11-15',time:'15:00'},at));
  assert.equal(m.parseExperienceOrder({...teaInput,date:'2026-11-15',time:'14:00'},at),null);
  assert.equal(m.parseExperienceOrder({...teaInput,date:'2026-11-15',time:'15:00'},at+1),null);
});
test('private tea uses existing paid-pending ledger and notification queue without duplicate fulfillment',()=>{
  const o=m.parseExperienceOrder(teaInput,now);
  const {c,jobs,writes,sends,event}=gasRuntime(o);
  c.experienceAction_(event());c.processExperienceQueue();c.processExperienceQueue();
  assert.equal(jobs[0].status,'paid_pending');assert.equal(jobs[0].order.amount,57000);
  assert.equal(sends.length,2);assert.ok(writes.some(j=>j.paidAt&&j.order.city==='kyoto'));
});
test('private tea consent and provisional payment form render in all supported languages',()=>{
  for(const lang of ['en','ja','es','fr','zh-tw']) {
    const x=catalogFor(lang).experiences.find(e=>e.slug===teaInput.experience) ?? catalogFor('en').experiences.find(e=>e.slug===teaInput.experience);
    const b={slug:x.slug,title:x.title,provisionalCheckout:true,leadDays:1,cutoffTime:'00:00',cutoffHours:24,minGuests:1,defaultGuests:3,listedMax:5,maxGuests:5,startTimes:x.availability.startTimes,interpreter:false,cancellationText:x.cancellation,cancellationTiers:x.cancellationTiers};
    const html=renderToStaticMarkup(React.createElement(CurrencyProvider,null,React.createElement(BookingProvider,{experience:b,pricing:pricingFor(x,lang),lang},React.createElement(EnquiryForm,{kind:'guest',lang,fallbackEmail:'hello@kamehame-japan.com',experience:x}))));
    assert.ok(html.includes(provisionalCopy(lang).cta));assert.ok(html.includes('checkout_adult'));assert.ok(html.includes('checkout_consent'));
    assert.ok(html.includes('action="/api/experience-checkout"'));
    if(lang==='en'){assert.ok(html.includes('aged 4 or over'));assert.ok(html.includes('Kimono rental'));assert.ok(!html.includes('aged 14'));}
  }
});
