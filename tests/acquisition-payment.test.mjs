import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { openTestDb } from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const R=await vite.ssrLoadModule('/lib/referral/reservations.ts');
const A=await vite.ssrLoadModule('/lib/attribution.ts');
const E=await vite.ssrLoadModule('/lib/experience-checkout.ts');
const now=Date.now();
const touch=A.captureTouch('https://kamehame-japan.com/en/?utm_source=meta&utm_medium=paid_social&utm_campaign=tea&fbclid=test','',now);
const attribution={version:1,first:touch,last:touch,ga:{clientId:'123.456',sessionId:'789'}};
test('acquisition stays attached to request → reservation → payment, including retries',async()=>{
 const db=openTestDb();
 try {
  const input={requestId:'test-request',flow:'experience',experienceSlug:'nihonbashi-bushido-experience',marketingAttribution:attribution,lines:[{kind:'base',description:'Test',grossJpy:30000,commissionable:false}]};
  const first=await R.createReservation(db,input,null,now);
  await R.createReservation(db,{...input,marketingAttribution:undefined},null,now+1000);
  await R.applyPayment(db,first.id,{eventId:'evt_test',sessionId:'cs_test',amountTotal:30000,paymentStatus:'paid',occurredAt:new Date(now).toISOString()},now);
  const row=await db.first('SELECT r.request_id,r.marketing_attribution_json,p.stripe_session_id FROM reservations r JOIN payments p ON p.reservation_id=r.id WHERE r.id=?',[first.id]);
  assert.equal(row.request_id,'test-request');assert.equal(row.stripe_session_id,'cs_test');assert.deepEqual(JSON.parse(row.marketing_attribution_json),attribution);
  assert.equal((await db.all('SELECT * FROM reservations')).length,1);
 }finally{db.raw.close()}
});
test('unrecorded attribution stays unknown, and GA identifiers are strictly validated',async()=>{
 const db=openTestDb();try{
  const r=await R.createReservation(db,{requestId:'no-consent',flow:'contact',experienceSlug:'test',lines:[]},null,now);
  assert.equal(JSON.parse((await db.first('SELECT marketing_attribution_json FROM reservations WHERE id=?',[r.id])).marketing_attribution_json),null);
  assert.equal(A.sanitizeAttribution({...attribution,ga:{clientId:'guest@example.com',sessionId:'x'}}).ga,undefined);
 }finally{db.raw.close()}
});
test('Stripe return hop never replaces the acquisition source',()=>{
 assert.equal(A.captureTouch('https://kamehame-japan.com/en/booked/','https://checkout.stripe.com/c/pay').referrer,'');
 assert.equal(A.captureTouch('https://kamehame-japan.com/en/','https://stripe.com.evil.test/').referrer,'https://stripe.com.evil.test');
});
test('checkout carries the same request ID into session and payment intent without sending raw marketing or PII to GA',()=>{
 const o={requestId:'id-123',lang:'en',price:'price_test',quantity:1,email:'guest@example.com',slug:'test',policyVersion:'test',guests:1,attribution};
 const p=E.checkoutParameters(o,'KJ-test',now);
 assert.equal(p.get('metadata[request_id]'),'id-123');assert.equal(p.get('payment_intent_data[metadata][request_id]'),'id-123');
 assert.equal(p.get('metadata[ga_client_id]'),null);
});
test('GA identifiers require consent, tolerate blocked tags, and discard a pending result after revocation',async()=>{
 const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 globalThis.location={href:'https://kamehame-japan.com/en/?utm_source=google&utm_medium=cpc'};globalThis.document={referrer:''};globalThis.window={};
 try {
  const {collectAttribution}=await vite.ssrLoadModule('/lib/attribution-client.ts');
  assert.equal(await collectAttribution(),undefined);
  values.set('kh-consent-2','granted');
  window.gtag=(_get,_id,field,cb)=>cb(field==='client_id'?'123.456':789);
  assert.deepEqual((await collectAttribution()).ga,{clientId:'123.456',sessionId:'789'});
  window.gtag=()=>{};assert.ok(await collectAttribution());
  const callbacks=[];window.gtag=(_get,_id,_field,cb)=>callbacks.push(cb);
  const pending=collectAttribution();values.set('kh-consent-2','denied');callbacks.forEach(cb=>cb('123.456'));
  assert.equal(await pending,undefined);
 }finally{delete globalThis.window;delete globalThis.localStorage;delete globalThis.document;delete globalThis.location}
});

test('manual payment with request UUID joins the original acquisition; unlinked payments stay unmatched',async()=>{
 const S=await vite.ssrLoadModule('/lib/referral/stripe-events.ts');
 const db=openTestDb();try{
  const requestId='11111111-2222-4333-8444-555555555555';
  const r=await R.createReservation(db,{requestId,flow:'contact',experienceSlug:'tea',marketingAttribution:attribution,lines:[]},null,now);
  const event=(id,ref)=>({id,type:'checkout.session.completed',data:{object:{id:'cs_'+id,client_reference_id:ref,currency:'jpy',payment_status:'paid',amount_total:57000,metadata:{}}}});
  assert.equal(await S.recordStripeEvent(db,event('evt_linked',requestId),now),'processed');
  assert.equal(await S.recordStripeEvent(db,event('evt_unlinked','unknown'),now),'unmatched');
  assert.equal((await db.all('SELECT * FROM payments WHERE reservation_id=?',[r.id])).length,1);
  assert.deepEqual(JSON.parse((await db.first('SELECT marketing_attribution_json FROM reservations WHERE id=?',[r.id])).marketing_attribution_json),attribution);
 }finally{db.raw.close()}
});
