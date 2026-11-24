import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {openTestDb} from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {createReservation,applyPayment,applyRefund,confirmAttendance,setReservationOutcome}=await vite.ssrLoadModule('/lib/referral/reservations.ts');
const {costTotal,sortBookingsByDate}=await vite.ssrLoadModule('/lib/business/model.ts');
const {allData,saveRecord,importData}=await vite.ssrLoadModule('/lib/business/storage.ts');
const {knownCosts}=await vite.ssrLoadModule('/lib/business/reservation-data.ts');
const {courseList,saveCourse}=await vite.ssrLoadModule('/lib/golf-courses-db.ts');
const master={id:'rate',name:'Standard',supplier:'Supplier',category:'体験',price:12345,unit:'人',status:'confirmed',source:'agreement',note:'All participants',autoCost:{slug:'nerima-herbal-bath-private-spa',from:'2026-11-16',through:'2027-01-31',quantity:'person'}};
const base={id:'manual',name:'Guest',product:'Spa',date:'2026-12-01',people:2,status:'予約確定',sales:40000,received:40000,fee:123,paymentDate:'2026-11-16',stripeSource:'pi_test',costs:[],complete:false,note:''};
test('ledger reservations appear with names, deduplicate Stripe events, reflect refunds and use explicit dated costs',async()=>{
 const db=openTestDb();await saveRecord(db,'master',master,0,'test');
 const r=await createReservation(db,{requestId:'request-test',customerName:'Test guest',flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:2,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 const pay={eventId:'evt1',paymentIntent:'pi_test',amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'};
 await applyPayment(db,r.id,pay);await applyPayment(db,r.id,{...pay,eventId:'evt2'});
 await applyRefund(db,r.id,{eventId:'refund1',paymentIntent:'pi_test',amountRefundedTotal:5000,occurredAt:'2026-11-16T11:00:00Z'});
 let d=await allData(db);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].name,'Test guest');assert.equal(d.bookings[0].received,35000);assert.equal(d.bookings[0].costs[0].unit,12345);assert.equal(d.bookings[0].costs[0].qty,2);assert.equal(d.bookings[0].fee,null);
 await saveRecord(db,'booking',{...base,requestId:'request-test',costs:[{id:'custom',label:'Manual',supplier:'Other',unit:10000,qty:1,status:'confirmed',payer:'company',paid:true,source:'manual',note:''}]},0,'user');
 d=await allData(db);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].costs[0].unit,10000);
 const imported=await importData(db,{bookings:[{...base,name:'Old value'}],masters:[master],snapshots:[]},'import');assert.deepEqual(imported,{imported:0,skipped:2});assert.equal((await allData(db)).bookings[0].name,'Guest');
});
test('uncertain, expired, overlapping and cancelled costs are never auto-filled',()=>{
 const slug=master.autoCost.slug;
 assert.equal(knownCosts(base,slug,[{...master,status:'estimate'}]).costs.length,0);
 assert.equal(knownCosts({...base,date:'2028-01-01'},slug,[master]).costs.length,0);
 assert.equal(knownCosts(base,slug,[master,{...master,id:'conflict'}]).costs.length,0);
 assert.equal(knownCosts({...base,status:'キャンセル'},slug,[master]).costs.length,0);
 assert.equal(knownCosts({...base,people:null},slug,[master]).costs.length,0);
});
test('booking lists derive dates and payment groups from live payments and exact historical references',async()=>{
 const db=openTestDb();
 const cases=[
  {...base,id:'saved-before-payment',requestId:'later-stripe',stripeSource:'',received:null,paymentDate:''},
  {...base,id:'checkout-only',stripeSource:'cs_live_pending',received:null,paymentDate:''},
  {...base,id:'historical',stripeSource:'ch_historical',received:null,paymentDate:''},
  {...base,id:'historical-intent',stripeSource:'pi_historical',received:null,paymentDate:''},
  {...base,id:'historical-undated',stripeSource:'ch_undated',received:null,paymentDate:''},
  {...base,id:'legacy-refunded',stripeSource:'ch_legacy',received:0},
  {...base,id:'manual-receipt',stripeSource:''},
  {...base,id:'same-quote',stripeSource:'',received:null,paymentDate:''},
 ];
 for(const b of cases)await saveRecord(db,'booking',b,0,'operator');
 await saveRecord(db,'snapshot',{id:'stripe-history',source:'stripe',start:'2026-09-01',end:'2026-09-30',data:{payments:[{source:'ch_historical',amount:40000,date:'2026-09-08'},{source:'ch_undated',amount:40000}]}},0,'operator');
 await db.run('INSERT INTO business_stripe_identities VALUES (?,?,?)',['ch_historical','pi_historical','2026-11-16T10:00:00Z']);
 const create=requestId=>createReservation(db,{requestId,flow:'experience',experienceSlug:master.autoCost.slug,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 const [stripe,manual,sandbox]=await Promise.all(['later-stripe','manual-native','test-mode'].map(create));
 const facts={amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T16:00:00Z'};
 await applyPayment(db,stripe.id,{...facts,eventId:'stripe-paid',paymentIntent:'pi_later'});
 await applyRefund(db,stripe.id,{eventId:'stripe-refunded',paymentIntent:'pi_later',chargeId:'ch_later',amountRefundedTotal:40000,occurredAt:'2026-11-19T11:00:00Z'});
 await applyPayment(db,manual.id,{...facts,eventId:'manual-paid'});
 await applyPayment(db,sandbox.id,{...facts,eventId:'test-paid',paymentIntent:'pi_sandbox',livemode:false});
 const {bookings}=await allData(db);
 const groups=Object.fromEntries(bookings.map(b=>[b.id,b.paymentGroup]));
 assert.deepEqual(groups,{
  'saved-before-payment':'stripe','checkout-only':'unpaid','historical':'stripe',
  'historical-intent':'stripe','historical-undated':'stripe',
  'legacy-refunded':'stripe','manual-receipt':'other','same-quote':'unpaid',
  ['reservation:'+manual.id]:'other',['reservation:'+sandbox.id]:'unpaid',
 });
 const dates=Object.fromEntries(bookings.map(b=>[b.id,b.listPaymentDate]));
 assert.deepEqual(dates,{
  'saved-before-payment':'2026-11-17','checkout-only':'','historical':'2026-09-08',
  'historical-intent':'2026-09-08','historical-undated':'',
  'legacy-refunded':'2026-11-16','manual-receipt':'2026-11-16','same-quote':'',
  ['reservation:'+manual.id]:'2026-11-17',['reservation:'+sandbox.id]:'',
 });
 const saved=bookings.find(b=>b.id==='saved-before-payment');
 assert.equal(saved.received,null);
 assert.equal(saved.paymentDate,'');
});
test('booking dates sort in both directions with unknown dates last',()=>{
 const rows=[
  {...base,id:'undated',date:'',listPaymentDate:''},
  {...base,id:'recent',date:'2026-12-02',listPaymentDate:'2026-11-18'},
  {...base,id:'earlier',date:'2026-12-03',listPaymentDate:'2026-11-10'},
  {...base,id:'upcoming-unpaid',date:'2026-12-04',listPaymentDate:''},
 ];
 const ids=order=>sortBookingsByDate(rows,order).map(b=>b.id);
 assert.deepEqual(ids('payment-newest'),['recent','earlier','upcoming-unpaid','undated']);
 assert.deepEqual(ids('payment-oldest'),['earlier','recent','upcoming-unpaid','undated']);
 assert.deepEqual(ids('experience-earliest'),['recent','earlier','upcoming-unpaid','undated']);
 assert.deepEqual(ids('experience-latest'),['upcoming-unpaid','earlier','recent','undated']);
 assert.deepEqual(rows.map(b=>b.id),['undated','recent','earlier','upcoming-unpaid']);
});
test('charge-only saved cases use Stripe-verified intent identities and never duplicate supplier costs',async(t)=>{
 const db=openTestDb();await saveRecord(db,'master',master,0,'test');
 const r=await createReservation(db,{requestId:'charge-request',flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:2,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 await applyPayment(db,r.id,{eventId:'charge-paid',paymentIntent:'pi_unrelatedIdentifier',amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'});
 const saved={...base,stripeSource:'ch_differentIdentifier',costs:[{id:'manual-cost',label:'Manual',supplier:'Supplier',unit:6543,qty:1,status:'confirmed',payer:'company',paid:true,source:'agreement',note:''}]};
 await saveRecord(db,'booking',saved,0,'operator');let reads=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{reads++;assert.equal(url,'https://api.stripe.com/v1/charges/ch_differentIdentifier');assert.equal(init.redirect,'manual');assert.equal(init.headers.Authorization,'Bearer fixture-key');return Response.json({id:'ch_differentIdentifier',object:'charge',livemode:true,currency:'jpy',payment_intent:'pi_unrelatedIdentifier'});});
 for(let n=0;n<2;n++){const d=await allData(db,{STRIPE_READ_KEY:'fixture-key'});assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].id,saved.id);assert.equal(costTotal(d.bookings[0]),6543);}
 assert.equal(reads,1);assert.equal((await db.first(`SELECT count(*) n FROM business_records WHERE kind='booking'`)).n,1);
});
test('completed experiences keep automatic costs after a full refund; explicit cancellation stays separate',async()=>{
 const db=openTestDb();await saveRecord(db,'master',master,0,'test');
 const r=await createReservation(db,{requestId:'completed-refund',flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:2,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 await applyPayment(db,r.id,{eventId:'completed-paid',paymentIntent:'pi_completed',amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'});
 await confirmAttendance(db,r.id,{performedAt:'2026-12-01T03:00:00Z',by:'operator'});
 await applyRefund(db,r.id,{eventId:'completed-refund',paymentIntent:'pi_completed',chargeId:'ch_completed',amountRefundedTotal:40000,occurredAt:'2026-12-02T03:00:00Z'});
 let d=await allData(db);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].status,'実施済');assert.equal(d.bookings[0].received,0);assert.equal(costTotal(d.bookings[0]),24690);
 await setReservationOutcome(db,r.id,'cancelled','operator','Explicit cancellation');d=await allData(db);assert.equal(d.bookings[0].status,'キャンセル');assert.equal(d.bookings[0].costs.length,0);
});
test('saved projected IDs and exact refund charge links preserve operator precedence without an external lookup',async(t)=>{
 const db=openTestDb();const r=await createReservation(db,{requestId:'projection-request',flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:2,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 await applyPayment(db,r.id,{eventId:'projection-paid',paymentIntent:'pi_projection',amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'});
 await applyRefund(db,r.id,{eventId:'projection-refund',paymentIntent:'pi_projection',chargeId:'ch_projection',amountRefundedTotal:1000,occurredAt:'2026-11-16T11:00:00Z'});
 t.mock.method(globalThis,'fetch',async()=>{throw Error('no provider read expected')});
 await saveRecord(db,'booking',{...base,stripeSource:'ch_projection'},0,'operator');assert.equal((await allData(db)).bookings.length,1);
 await db.run(`DELETE FROM business_records WHERE kind='booking'`);
 await saveRecord(db,'booking',{...base,id:'reservation:'+r.id,stripeSource:''},0,'operator');assert.equal((await allData(db)).bookings.length,1);
});
test('unverified charge identities fail closed instead of returning duplicate financial records or caching wrong links',async(t)=>{
 const db=openTestDb();const r=await createReservation(db,{requestId:'unverified-request',flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:2,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
 await applyPayment(db,r.id,{eventId:'unverified-paid',paymentIntent:'pi_native',amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'});
 await saveRecord(db,'booking',{...base,stripeSource:'ch_saved'},0,'operator');
 await assert.rejects(allData(db),e=>e.code==='stripe_identity_unconfigured');
 t.mock.method(globalThis,'fetch',async()=>Response.json({id:'ch_wrong',object:'charge',livemode:true,currency:'jpy',payment_intent:'pi_native'}));
 await assert.rejects(allData(db,{STRIPE_READ_KEY:'fixture-key'}),e=>e.code==='stripe_identity_invalid');
 assert.equal((await db.first(`SELECT count(*) n FROM business_stripe_identities`)).n,0);
 assert.equal((await db.first(`SELECT count(*) n FROM business_records WHERE kind='booking'`)).n,1);
});
async function seedColdIdentities(db,count){
 for(let n=0;n<count;n++){
  const r=await createReservation(db,{requestId:'cold-request-'+n,flow:'experience',experienceSlug:master.autoCost.slug,experienceDate:base.date,guests:1,lines:[{kind:'base',description:'Spa',commissionable:true,grossJpy:40000}]},null);
  await applyPayment(db,r.id,{eventId:'cold-paid-'+n,paymentIntent:'pi_cold'+n,amountTotal:40000,paymentStatus:'paid',occurredAt:'2026-11-16T10:00:00Z'});
  await saveRecord(db,'booking',{...base,id:'cold-case-'+n,stripeSource:'ch_cold'+n,costs:[{id:'cost-'+n,label:'Supplier',supplier:'Supplier',unit:1000+n,qty:1,status:'confirmed',payer:'company',paid:true,source:'agreement',note:''}]},0,'operator');
 }
}
test('a cold cache above 25 identities makes bounded progress and completes without duplicate costs',async(t)=>{
 const db=openTestDb();await saveRecord(db,'master',master,0,'test');await seedColdIdentities(db,26);
 let reads=0,active=0,maxActive=0;
 t.mock.method(globalThis,'fetch',async url=>{reads++;maxActive=Math.max(maxActive,++active);await new Promise(r=>setImmediate(r));active--;const id=new URL(url).pathname.split('/').at(-1);return Response.json({id,object:'charge',livemode:true,currency:'jpy',payment_intent:id.replace('ch_','pi_')});});
 await assert.rejects(allData(db,{STRIPE_READ_KEY:'fixture-key'}),e=>e.code==='stripe_identity_pending'&&e.status===503);
 assert.equal(reads,25);assert.equal(maxActive,5);assert.equal((await db.first('SELECT count(*) n FROM business_stripe_identities')).n,25);
 let d=await allData(db,{STRIPE_READ_KEY:'fixture-key'});assert.equal(reads,26);assert.equal(d.bookings.length,26);assert.equal(d.bookings.reduce((s,b)=>s+costTotal(b),0),26325);
 d=await allData(db,{STRIPE_READ_KEY:'fixture-key'});assert.equal(reads,26);assert.equal(d.bookings.length,26);assert.equal((await db.first(`SELECT count(*) n FROM business_records WHERE kind='booking'`)).n,26);
});
test('a failed later identity group retains verified progress and a retry starts with only missing IDs',async(t)=>{
 const db=openTestDb();await seedColdIdentities(db,26);let fail=true;const reads=[];
 t.mock.method(globalThis,'fetch',async url=>{const id=new URL(url).pathname.split('/').at(-1);reads.push(id);if(fail&&id==='ch_cold5')return Response.json({error:{message:'private-provider-details'}},{status:403});return Response.json({id,object:'charge',livemode:true,currency:'jpy',payment_intent:id.replace('ch_','pi_')});});
 await assert.rejects(allData(db,{STRIPE_READ_KEY:'fixture-key'}),e=>e.code==='stripe_identity_failed'&&!e.message.includes('private-provider-details'));
 assert.equal((await db.first('SELECT count(*) n FROM business_stripe_identities')).n,5);
 fail=false;const start=reads.length,d=await allData(db,{STRIPE_READ_KEY:'fixture-key'});assert.equal(d.bookings.length,26);assert.equal(reads.length-start,21);
 assert.ok(reads.slice(start).every(id=>Number(id.replace('ch_cold',''))>=5));assert.equal(d.bookings.reduce((s,b)=>s+costTotal(b),0),26325);
});
test('golf prices retain manual values and unknowns, validate GORA URLs and expose dated official references',async()=>{
 const db=openTestDb();const rows=await courseList(db,[]);assert.ok(rows.length>=9);
 const numazu=rows.find(c=>c.name==='沼津ゴルフクラブ');assert.equal(numazu.pricing.clubs,3300);assert.equal(numazu.pricing.weekday,null);
 await saveCourse(db,{name:numazu.name,pricing:{...numazu.pricing,clubs:4500},by:'user'});
 await saveCourse(db,{name:numazu.name,name_en:'Custom',by:'user'});
 assert.equal((await courseList(db,[])).find(c=>c.name===numazu.name).pricing.clubs,4500);
 await assert.rejects(saveCourse(db,{name:numazu.name,pricing:{...numazu.pricing,goraUrl:'https://example.invalid/'},by:'user'}));
});

test('shared-bus enquiries supply recorded tour cost without treating a quote as payment or sales rental as supplier cost',async()=>{
 const db=openTestDb();await db.run(`INSERT INTO bus_tour_enquiries (id, reference, request_id, tour_id, tour_date, course, pickup, people, renters, source_yen, fee_yen, per_person_yen, tours_yen, rentals_yen, total_yen, name, email, status, created_at, updated_at,golfers_json) VALUES ('bus1','GP-QATEST','bus-request','tour','2026-12-01','Course','Tokyo',2,1,12340,10000,22340,44680,3300,47980,'Test guest','qa@example.invalid','confirmed','2026-11-16','2026-11-16','[{"name":"A","clubs":true,"hand":"left","shoes":false},{"name":"B","clubs":false,"shoes":false}]')`);
 let d=await allData(db);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].received,null);assert.equal(d.bookings[0].costs[0].unit,12340);assert.equal(d.bookings[0].costs[0].qty,2);assert.equal(d.bookings[0].costs[1].unit,null);
 await saveRecord(db,'booking',{...base,id:'legacy-bus',externalRef:'GP-QATEST'},0,'user');d=await allData(db);assert.equal(d.bookings.length,1);assert.equal(d.bookings[0].id,'legacy-bus');
});
