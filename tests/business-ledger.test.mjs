import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {openTestDb} from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {mergeLedgerRecord,syncLedgerRecord,resolveLedgerReview,fetchLedger,parseLedger,syncLedger,ledgerState}=await vite.ssrLoadModule('/lib/business/ledger-sync.ts');
const {saveRecord}=await vite.ssrLoadModule('/lib/business/storage.ts');
const {LEDGER_TABS,ledgerSheetId}=await vite.ssrLoadModule('/lib/business/ledger-contract.ts');
const {settingsSet}=await vite.ssrLoadModule('/lib/portal/ops.ts');
const {handlePortalApi}=await vite.ssrLoadModule('/lib/portal/api.ts');
const {sha256Hex,SESSION_COOKIE}=await vite.ssrLoadModule('/lib/portal/auth.ts');
const sheet='test_sheet_identifier_123456789',at='2026-11-16T00:00:00.000Z';
const env={GOOGLE_ADS_CLIENT_ID:'test-client',GOOGLE_ADS_CLIENT_SECRET:'test-secret',GOOGLE_ADS_REFRESH_TOKEN:'test-refresh'};
const cost={id:'c',label:'Course fee',supplier:'Example supplier',unit:12340,qty:2,status:'confirmed',payer:'company',paid:false,source:'https://example.invalid/agreement',note:''};
const booking={id:'case-one',requestId:'request-one',name:'Example guest',product:'Example activity',date:'2026-12-01',people:2,status:'確認中',sales:40000,received:40000,fee:1200,paymentDate:'2026-11-16',stripeSource:'pi_example',costs:[cost],complete:false,note:''};
const master={id:'master-one',name:'Example standard',supplier:'Example supplier',category:'体験',price:12340,unit:'人',status:'confirmed',source:'agreement',note:''};
const snapshot=(bookings=[booking],masters=[master])=>({spreadsheetId:sheet,valueRanges:[{values:[LEDGER_TABS.bookings.headers,...bookings.map(b=>[b.id,'','','','','','','','','',JSON.stringify(b)])]},{values:[LEDGER_TABS.masters.headers,...masters.map(m=>[m.id,'','','','','','','','',JSON.stringify(m)])]},{values:[LEDGER_TABS.reviews.headers]}]});
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
test('three-way merge preserves manual costs while reflecting independently updated payment facts and removed auto-rules',()=>{
 const current={...booking,name:'Manual display name',costs:[{...cost,unit:9876}]},incoming={...booking,received:0,status:'キャンセル',costs:[{...cost,unit:7654}]};
 const m=mergeLedgerRecord(current,incoming,booking);assert.equal(m.merged.received,0);assert.equal(m.merged.name,'Manual display name');assert.equal(m.merged.costs[0].unit,9876);assert.deepEqual(m.conflicts,['costs']);
 const autoCost={slug:'example',from:'2026-11-01',through:'',quantity:'person'};
 assert.equal(mergeLedgerRecord({...master,autoCost},master,{...master,autoCost}).merged.autoCost,undefined);
});
test('source records are idempotent, retain unresolved cost conflicts across other source changes, and require current approval',async()=>{
 const db=openTestDb();assert.equal((await syncLedgerRecord(db,sheet,'booking',booking,at)).result,'imported');
 await syncLedgerRecord(db,sheet,'booking',booking,at);assert.equal((await db.first('SELECT count(*) n FROM business_audit')).n,1);
 await saveRecord(db,'booking',{...booking,name:'Manual display name',costs:[{...cost,unit:9876}]},1,'operator');
 const changed={...booking,received:35000,costs:[{...cost,unit:7654}]};await syncLedgerRecord(db,sheet,'booking',changed,at);
 let stored=await db.first('SELECT payload,revision FROM business_records');assert.equal(JSON.parse(stored.payload).received,35000);assert.equal(JSON.parse(stored.payload).costs[0].unit,9876);
 await syncLedgerRecord(db,sheet,'booking',{...changed,status:'予約確定'},at);
 let link=await db.first('SELECT * FROM business_ledger_links');assert.deepEqual(JSON.parse(link.conflicts_json),['costs']);stored=await db.first('SELECT payload,revision FROM business_records');
 await assert.rejects(resolveLedgerReview(db,{sourceKey:link.source_key,hash:'stale',revision:stored.revision,action:'apply'},'operator'));
 await assert.rejects(resolveLedgerReview(db,{sourceKey:link.source_key,hash:link.source_hash,revision:stored.revision-1,action:'apply'},'operator'));
 await resolveLedgerReview(db,{sourceKey:link.source_key,hash:link.source_hash,revision:stored.revision,action:'apply'},'operator');
 stored=await db.first('SELECT payload,revision FROM business_records');assert.equal(JSON.parse(stored.payload).costs[0].unit,7654);assert.equal(JSON.parse(stored.payload).name,'Manual display name');assert.equal((await db.first('SELECT pending_json FROM business_ledger_links')).pending_json,null);
});
test('initial existing edits are never overwritten; keeping the current value records the decision',async()=>{
 const db=openTestDb();await saveRecord(db,'booking',{...booking,costs:[{...cost,unit:8765}]},0,'operator');
 await assert.rejects(resolveLedgerReview(db,null,'operator'),e=>e.status===400);
 await syncLedgerRecord(db,sheet,'booking',booking,at);const link=await db.first('SELECT * FROM business_ledger_links');assert.deepEqual(JSON.parse(link.conflicts_json),['costs']);
 await resolveLedgerReview(db,{sourceKey:link.source_key,hash:link.source_hash,revision:1,action:'keep'},'operator');
 assert.equal(JSON.parse((await db.first('SELECT payload FROM business_records')).payload).costs[0].unit,8765);
 await syncLedgerRecord(db,sheet,'booking',booking,at);assert.equal((await db.first('SELECT conflicts_json FROM business_ledger_links')).conflicts_json,'[]');
});
test('explicit request identities prevent duplicate cases and conflicting aliases never cross-link financial records',async()=>{
 const db=openTestDb();await saveRecord(db,'booking',booking,0,'operator');
 await syncLedgerRecord(db,sheet,'booking',{...booking,id:'sheet-alias'},at);assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
 await assert.rejects(syncLedgerRecord(db,sheet,'booking',{...booking,id:'wrong-alias',requestId:'different-request'},at),e=>e.code==='ledger_identity_conflict');
});
test('all source rows validate before any record mutation, including headers, duplicate IDs and review states',()=>{
 const valid=snapshot();assert.equal(parseLedger(valid,sheet).bookings.length,1);
 const badHeader=snapshot();badHeader.valueRanges[0].values[0]=['changed'];assert.throws(()=>parseLedger(badHeader,sheet),e=>e.code==='ledger_headers_invalid');
 const badMaster=snapshot();badMaster.valueRanges[1].values.push(['other','','','','','','','','','not-json']);assert.throws(()=>parseLedger(badMaster,sheet),e=>e.code==='ledger_record_invalid');
 assert.throws(()=>parseLedger(snapshot([booking,booking]),sheet),e=>e.code==='ledger_record_invalid');
 const badReview=snapshot();badReview.valueRanges[2].values.push(['q','b','費用','確認','https://example.invalid','unknown','']);assert.throws(()=>parseLedger(badReview,sheet),e=>e.code==='ledger_review_invalid');
 assert.equal(ledgerSheetId('https://docs.google.com/spreadsheets/d/'+sheet+'/edit'),sheet);assert.equal(ledgerSheetId('https://evil.invalid/spreadsheets/d/'+sheet), '');
});
test('Sheets reads stay on the fixed Google endpoint, reject redirects/oversize bodies and sanitize provider errors',async(t)=>{
 t.mock.method(globalThis,'fetch',async(url,init)=>{if(url==='https://oauth2.googleapis.com/token')return json({access_token:'test-access'});const u=new URL(url);assert.equal(u.hostname,'sheets.googleapis.com');assert.equal(u.searchParams.getAll('ranges').length,3);assert.equal(init.headers.Authorization,'Bearer test-access');assert.equal(init.redirect,'manual');return json(snapshot());});
 assert.equal((await fetchLedger(env,sheet)).bookings.length,1);
 for(const mode of ['scope','redirect','oversize']){
  t.mock.method(globalThis,'fetch',async url=>url==='https://oauth2.googleapis.com/token'?json({access_token:'test-access'}):mode==='scope'?json({error:{message:'private-provider-secret',details:[{reason:'ACCESS_TOKEN_SCOPE_INSUFFICIENT'}]}},403):mode==='redirect'?new Response(null,{status:302,headers:{location:'https://evil.invalid'}}):new Response('x'.repeat(2000001)));
  await assert.rejects(fetchLedger(env,sheet),e=>!e.message.includes('private-provider-secret')&&e.code===({scope:'ledger_scope_required',redirect:'ledger_redirect_blocked',oversize:'ledger_too_large'}[mode]));
 }
});
test('failed source reads retain existing data and last success, release the lease, and disabled sync makes no fetch',async(t)=>{
 const db=openTestDb();await saveRecord(db,'booking',booking,0,'operator');await db.run(`UPDATE business_ledger_sync_state SET payload=?`,[JSON.stringify({lastSuccessAt:at})]);
 await settingsSet(db,{values:{business_ledger_sheet_id:sheet,business_ledger_sync:'true'},by:'operator'});
 t.mock.method(globalThis,'fetch',async url=>url==='https://oauth2.googleapis.com/token'?json({access_token:'test-access'}):json({error:{details:[{reason:'ACCESS_TOKEN_SCOPE_INSUFFICIENT'}]}},403));
 await assert.rejects(syncLedger(db,env));assert.equal((await ledgerState(db,env)).lastSuccessAt,at);assert.equal((await db.first('SELECT lease_token FROM business_ledger_sync_state')).lease_token,null);assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
 await settingsSet(db,{values:{business_ledger_sync:'false'},by:'operator'});t.mock.method(globalThis,'fetch',async()=>{throw Error('must not fetch')});assert.equal((await syncLedger(db,env)).skipped,true);
});
test('overlapping syncs share a lease, successful reads import once, and later manual costs survive refresh',async(t)=>{
 const db=openTestDb();await settingsSet(db,{values:{business_ledger_sheet_id:sheet,business_ledger_sync:'true'},by:'operator'});
 let release,started;const waiting=new Promise(r=>{release=r}),seen=new Promise(r=>{started=r});
 t.mock.method(globalThis,'fetch',async url=>{if(url==='https://oauth2.googleapis.com/token')return json({access_token:'test-access'});started();await waiting;return json(snapshot());});
 const first=syncLedger(db,env);await seen;assert.equal((await syncLedger(db,env)).busy,true);release();assert.equal((await first).imported,2);
 await saveRecord(db,'booking',{...booking,costs:[{...cost,unit:9876}]},1,'operator');
 const second=await syncLedger(db,env);assert.equal(second.imported,0);assert.equal(second.preserved,2);
 assert.equal(JSON.parse((await db.first(`SELECT payload FROM business_records WHERE kind='booking'`)).payload).costs[0].unit,9876);
 assert.equal((await db.first(`SELECT lease_token FROM business_ledger_sync_state`)).lease_token,null);
});
test('source sync endpoints retain session, role and same-origin protections',async()=>{
 const db=openTestDb();const request=(method,cookie='',body={})=>new Request('https://example.invalid/api/portal/ops/business/ledger-state',{method,headers:{...(cookie?{cookie}:{}),...(method==='POST'?{'content-type':'application/json',origin:'https://example.invalid','x-kh-portal':'1'}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
 assert.equal((await handlePortalApi(request('GET'),{DB:db.d1},['ops','business','ledger-state'])).status,401);
 await db.run(`INSERT INTO users (id,email,status,created_at) VALUES ('ops','ops@example.invalid','active',?)`,[at]);await db.run(`INSERT INTO memberships (id,user_id,scope_type,scope_id,role,created_at) VALUES ('ops-role','ops','ops',NULL,'ops_booking',?)`,[at]);
 const token='x'.repeat(44);await db.run(`INSERT INTO sessions (id,user_id,kind,created_at,expires_at,last_seen_at) VALUES (?,'ops','ops',?,'2030-01-01T00:00:00Z',?)`,[await sha256Hex(token),at,at]);const cookie=SESSION_COOKIE.ops+'='+token;
 assert.equal((await handlePortalApi(request('GET',cookie),{DB:db.d1},['ops','business','ledger-state'])).status,403);
 await db.run(`UPDATE memberships SET role='ops_finance' WHERE id='ops-role'`);assert.equal((await handlePortalApi(request('GET',cookie),{DB:db.d1},['ops','business','ledger-state'])).status,200);
 assert.equal((await handlePortalApi(request('POST',cookie),{DB:db.d1},['ops','business','ledger-sync'])).status,403);
 const cross=new Request('https://example.invalid/api/portal/ops/business/ledger-review',{method:'POST',headers:{cookie,origin:'https://evil.invalid','x-kh-portal':'1','content-type':'application/json'},body:'{}'});assert.equal((await handlePortalApi(cross,{DB:db.d1},['ops','business','ledger-review'])).status,403);
});
