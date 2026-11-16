import assert from 'node:assert/strict';
import test,{after} from 'node:test';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import {openTestDb} from './helpers/sqlite-db.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true},logLevel:'silent'});
after(()=>vite.close());
const {sync,syncSources}=await vite.ssrLoadModule('/lib/business/sync.ts');
const env={GOOGLE_ADS_CLIENT_ID:'test-client',GOOGLE_ADS_CLIENT_SECRET:'test-secret',GOOGLE_ADS_REFRESH_TOKEN:'test-refresh'};
const period={start:'2026-11-01',end:'2026-11-16'};
const json=(d,status=200)=>new Response(JSON.stringify(d),{status});
test('Google refresh exchanges server credentials, validates account and consumes all pages',async(t)=>{
 const db=openTestDb();let pages=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url==='https://oauth2.googleapis.com/token'){assert.equal(init.body.get('grant_type'),'refresh_token');return json({access_token:'test-access'})}
  assert.equal(url,'https://googleads.googleapis.com/v26/customers/1700154296/googleAds:search');
  assert.equal(init.headers.Authorization,'Bearer test-access');assert.equal(init.headers['developer-token'],undefined);
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
 assert.deepEqual(syncSources({...env,META_ADS_ACCESS_TOKEN:'test'}),['google','meta','seo','aio','organic']);
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
test('Search Console uses fixed domain and separate totals, converts CTR, retains fresh-data boundary',async(t)=>{
 const db=openTestDb();
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  assert.equal(url,'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Akamehame-japan.com/searchAnalytics/query');
  const b=JSON.parse(init.body);assert.equal(b.dataState,'all');assert.equal(b.aggregationType,'byProperty');
  return json(b.dimensions.length?{rows:[{keys:['2026-11-02'],clicks:2},{keys:['2026-11-01'],clicks:8}],metadata:{first_incomplete_date:'2026-11-15'}}:{rows:[{clicks:10,impressions:100,ctr:0.1,position:4.5}]});
 });
 const r=await sync(db,env,{source:'seo',...period},'test');
 assert.equal(r.data.current.ctr,10);assert.equal(r.data.current.avgPosition,4.5);assert.equal(r.data.settledThrough,'2026-11-14');assert.equal(r.data.dailyRows[0].date,'2026-11-01');
});
function ga(dimensions,rows,count=rows.length,metadata={}){return {dimensionHeaders:dimensions.map(name=>({name})),metricHeaders:[{name:'sessions'},{name:'keyEvents'}],rows:rows.map(([key,sessions,keyEvents])=>({dimensionValues:dimensions.length?[{value:key}]:[],metricValues:[{value:String(sessions)},{value:String(keyEvents)}]})),rowCount:count,metadata:{timeZone:'Asia/Tokyo',...metadata}}}
test('GA4 filters organic by session channel, reads key events and never substitutes revenue',async(t)=>{
 const db=openTestDb();
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  assert.equal(url,'https://analyticsdata.googleapis.com/v1beta/properties/554299976:runReport');
  const b=JSON.parse(init.body);assert.equal(b.dimensionFilter.filter.fieldName,'sessionDefaultChannelGroup');assert.equal(b.dimensionFilter.filter.stringFilter.value,'Organic Search');
  return json(ga([],[['',50,3]]));
 });
 const r=await sync(db,env,{source:'organic',...period},'test');assert.equal(r.data.sessions,50);assert.equal(r.data.conversions,3);
});
test('GA4 AI uses exact domains, independent totals, and all landing-page pages',async(t)=>{
 const db=openTestDb();
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  const b=JSON.parse(init.body),dims=b.dimensions.map(d=>d.name);
  if(!b.dimensionFilter)return json(ga([],[['',100,10]]));
  const f=b.dimensionFilter.filter;assert.equal(f.fieldName,'sessionSource');
  const regex=new RegExp('^(?:'+f.stringFilter.value+')$','i');assert.ok(regex.test('chatgpt.com'));assert.ok(regex.test('www.perplexity.ai'));assert.ok(!regex.test('evilchatgpt.com'));assert.ok(!regex.test('google'));assert.ok(!regex.test('chatgpt.com.evil.example'));
  if(!dims.length)return json(ga([],[['',10,2]]));
  if(dims[0]==='sessionSource')return json(ga(dims,[['chatgpt.com',10,2]]));
  return json(ga(dims,[[b.offset?'/en/golf/':'/en/',5,1]],2));
 });
 const r=await sync(db,env,{source:'aio',...period},'test');assert.equal(r.data.llmShareOfSessions,0.1);assert.equal(r.data.summary.keyEvents,2);assert.equal(r.data.landingPages.length,2);
});
test('incomplete GA4 or failed later page preserves the previous snapshot',async(t)=>{
 const db=openTestDb();
 t.mock.method(globalThis,'fetch',async(url)=>url.includes('/token')?json({access_token:'test-access'}):json(ga([],[['',50,3]])));
 await sync(db,env,{source:'organic',...period},'test');
 t.mock.method(globalThis,'fetch',async(url)=>url.includes('/token')?json({access_token:'test-access'}):json(ga([],[],0,{subjectToThresholding:true})));
 await assert.rejects(sync(db,env,{source:'organic',...period},'test'),e=>e.code==='analytics_incomplete');
 assert.equal((await db.first('SELECT revision FROM business_records')).revision,1);
 t.mock.method(globalThis,'fetch',async(url)=>url.includes('/token')?json({access_token:'test-access'}):json(ga([],[],0,{timeZone:'America/New_York'})));
 await assert.rejects(sync(db,env,{source:'organic',...period},'test'),e=>e.code==='analytics_timezone_mismatch');
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  const b=JSON.parse(init.body),dims=b.dimensions.map(d=>d.name);
  if(!dims.length)return json(ga([],[['',10,1]]));
  if(dims[0]==='sessionSource')return json(ga(dims,[['chatgpt.com',10,1]]));
  return b.offset?json({error:{message:'secret'}},403):json(ga(dims,[['/en/',5,1]],2));
 });
 await assert.rejects(sync(db,env,{source:'aio',...period},'test'));
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
});
