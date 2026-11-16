import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {openTestDb} from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {createReservation,applyPayment,applyRefund}=await vite.ssrLoadModule('/lib/referral/reservations.ts');
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
