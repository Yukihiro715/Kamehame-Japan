import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {openTestDb} from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {sync,syncSources}=await vite.ssrLoadModule('/lib/business/sync.ts');
const env={GOOGLE_ADS_CLIENT_ID:'test-client',GOOGLE_ADS_CLIENT_SECRET:'test-secret',GOOGLE_ADS_REFRESH_TOKEN:'test-refresh',GOOGLE_ADS_DEVELOPER_TOKEN:'test-developer'};
const period={start:'2026-11-01',end:'2026-11-16'};
const json=(d,status=200)=>new Response(JSON.stringify(d),{status});
test('Google refresh exchanges server credentials, validates account and consumes all pages',async(t)=>{
 const db=openTestDb();let pages=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url==='https://oauth2.googleapis.com/token'){assert.equal(init.body.get('grant_type'),'refresh_token');return json({access_token:'test-access'})}
  assert.equal(url,'https://googleads.googleapis.com/v26/customers/1700154296/googleAds:search');
  assert.equal(init.headers.Authorization,'Bearer test-access');
  const b=JSON.parse(init.body);
  if(b.query.includes('FROM customer'))return json({results:[{customer:{id:'1700154296',currencyCode:'JPY',timeZone:'Asia/Tokyo'}}]});
  pages++;assert.match(b.query,/2026-11-01/);
  if(pages===2)assert.equal(b.pageToken,'next-page');
  return json({results:[{campaign:{id:String(pages),name:'Test campaign'},metrics:{costMicros:'123000000',clicks:'5',impressions:'100',conversions:1}}],...(pages===1?{nextPageToken:'next-page'}:{})});
 });
 const r=await sync(db,env,{source:'google',...period},'test');
 assert.equal(r.data.rows.length,2);assert.equal(r.data.rows[0].spend,123);
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
});
test('Meta pagination uses only a cursor on fixed account; never sums duplicate conversion aliases',async(t)=>{
 const db=openTestDb();let pages=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  assert.ok(!url.includes('test-access'));assert.equal(init.headers.Authorization,'Bearer test-access');
  assert.ok(url.startsWith('https://graph.facebook.com/v27.0/act_1089610383773886'));
  if(!url.includes('/insights?'))return json({id:'act_1089610383773886',currency:'JPY',timezone_name:'Asia/Tokyo'});
  pages++;if(pages===2)assert.equal(new URL(url).searchParams.get('after'),'page-2');
  return json({data:[{campaign_id:String(pages),campaign_name:'Test campaign',spend:'500',clicks:'10',impressions:'1000',actions:[{action_type:'lead',value:'3'},{action_type:'offsite_conversion.fb_pixel_lead',value:'3'}]}],...(pages===1?{paging:{next:'https://do-not-follow.example/',cursors:{after:'page-2'}}}:{})});
 });
 const r=await sync(db,{META_ADS_ACCESS_TOKEN:'test-access'},{source:'meta',...period},'test');
 assert.equal(r.data.rows.length,2);assert.equal(r.data.rows[0].conversions,3);
});
test('access failures and wrong currency never replace cached reports or save partial pages',async(t)=>{
 const db=openTestDb();
 await db.run(`INSERT INTO business_records VALUES ('snapshot:stripe:2026-11-01:2026-11-16','snapshot','{}',1,'2026-11-01','test')`);
 t.mock.method(globalThis,'fetch',async()=>json({error:{message:'secret must not leak'}},403));
 await assert.rejects(sync(db,{STRIPE_READ_KEY:'test-key'},{source:'stripe',...period},'test'),e=>e.message.includes('残高取引')&&!e.message.includes('secret'));
 assert.equal((await db.first('SELECT revision FROM business_records')).revision,1);
 t.mock.method(globalThis,'fetch',async()=>json({id:'act_1089610383773886',currency:'USD',timezone_name:'Asia/Tokyo'}));
 await assert.rejects(sync(db,{META_ADS_ACCESS_TOKEN:'test'},{source:'meta',...period},'test'),e=>e.code==='account_settings_mismatch');
 let calls=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(!url.includes('/insights'))return json({id:'act_1089610383773886',currency:'JPY',timezone_name:'Asia/Tokyo'});
  if(++calls===1)return json({data:[],paging:{next:'yes',cursors:{after:'two'}}});return json({},401);
 });
 await assert.rejects(sync(db,{META_ADS_ACCESS_TOKEN:'test'},{source:'meta',...period},'test'));
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
});
test('only fully configured sources can refresh and invalid dates never reach providers',async()=>{
 assert.deepEqual(syncSources({GOOGLE_ADS_CLIENT_ID:'partial'}),[]);
 assert.deepEqual(syncSources({...env,META_ADS_ACCESS_TOKEN:'test'}),['google','meta']);
 const db=openTestDb();
 await assert.rejects(sync(db,{}, {source:'google',...period},'test'),e=>e.code==='source_unconfigured');
 await assert.rejects(sync(db,env,{source:'google',start:"2026-11-01'",end:'2026-11-16'},'test'));
});
test('Workers-compatible redirect handling rejects redirects without forwarding secrets or saving reports',async(t)=>{
 const db=openTestDb();let calls=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  calls++;assert.equal(init.redirect,'manual');
  return new Response(null,{status:302,headers:{Location:'https://untrusted.example/'}});
 });
 await assert.rejects(sync(db,{META_ADS_ACCESS_TOKEN:'test'},{source:'meta',...period},'test'),e=>e.code==='source_redirect_blocked');
 assert.equal(calls,1);
 await assert.rejects(sync(db,{BUSINESS_METRICS_URL:'https://bridge.example/',BUSINESS_METRICS_TOKEN:'test'},{source:'meta',...period},'test'));
 assert.equal(calls,2);
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,0);
});
test('transport failures distinguish timeout without exposing upstream error text',async(t)=>{
 const db=openTestDb();
 t.mock.method(globalThis,'fetch',async()=>{throw new DOMException('secret token in internal error','TimeoutError')});
 await assert.rejects(sync(db,{META_ADS_ACCESS_TOKEN:'test'},{source:'meta',...period},'test'),e=>e.code==='source_timeout'&&!e.message.includes('secret'));
 t.mock.method(globalThis,'fetch',async()=>{throw new TypeError('secret token in internal error')});
 await assert.rejects(sync(db,{META_ADS_ACCESS_TOKEN:'test'},{source:'meta',...period},'test'),e=>e.code==='source_unreachable'&&!e.message.includes('secret'));
});
