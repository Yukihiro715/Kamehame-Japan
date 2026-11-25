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
const openAiKey={OPENAI_ADS_API_KEY:'test-advertiser-key'};
const openAiAccount={id:'adacct_fixture',url:'https://kamehame-japan.com/en/golf-tours/',currency_code:'JPY',timezone:'Asia/Tokyo'};
const reportStart=Date.parse('2026-11-01T00:00:00+09:00')/1000;
const reportEnd=Date.parse('2026-11-17T00:00:00+09:00')/1000;
const accountSpend={ad_account_id:openAiAccount.id,start_time:reportStart+86400,end_time:reportEnd,spend:1000.42};
const insights=data=>({object:'list',has_more:false,data});
test('ChatGPT Ads sync uses the verified account and an exclusive JST end, storing reported spend in JPY',async(t)=>{
 const db=openTestDb();const calls=[];
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  calls.push(url);
  assert.equal(init.headers.Authorization,'Bearer test-advertiser-key');
  assert.equal(init.redirect,'manual');
  if(calls.length===1){
   assert.equal(url,'https://api.ads.openai.com/v1/ad_account');
   return json(openAiAccount);
  }
  const request=new URL(url);
  assert.equal(request.origin+request.pathname,'https://api.ads.openai.com/v1/ad_account/insights');
  assert.equal(request.searchParams.get('time_granularity'),'none');
  assert.equal(request.searchParams.get('aggregation_level'),'ad_account');
  assert.deepEqual(JSON.parse(request.searchParams.get('time_ranges[]')),{type:'unix_range',start:reportStart,end:reportEnd});
  return json(insights([accountSpend]));
 });
 assert.ok(syncSources(openAiKey).includes('openai_ads'));
 assert.ok(!syncSources({BUSINESS_METRICS_URL:'https://example.invalid',BUSINESS_METRICS_TOKEN:'fixture'}).includes('openai_ads'));
 const r=await sync(db,openAiKey,{source:'openai_ads',...period},'test');
 assert.deepEqual(r.data,{currency:'JPY',spend:1000.42});
 assert.equal(calls.length,2);
 const stored=JSON.parse((await db.first('SELECT payload FROM business_records')).payload);
 assert.deepEqual(stored.data,r.data);
});
test('ChatGPT Ads preserves measured zero and missing spend and keeps the previous snapshot after a failed refresh',async(t)=>{
 const db=openTestDb();let account=openAiAccount;let report=insights([]);
 t.mock.method(globalThis,'fetch',async url=>json(url.endsWith('/ad_account')?account:report));
 const run=()=>sync(db,openAiKey,{source:'openai_ads',...period},'test');
 assert.equal((await run()).data.spend,null);
 report=insights([{...accountSpend,spend:0}]);
 assert.equal((await run()).data.spend,0);
 const previous=await db.first('SELECT payload,revision FROM business_records');
 report={...insights([accountSpend]),has_more:true};
 await assert.rejects(run(),e=>e.code==='invalid_report');
 report=insights([{...accountSpend,ad_account_id:'adacct_unrelated'}]);
 await assert.rejects(run(),e=>e.code==='invalid_report');
 account={...openAiAccount,currency_code:'USD'};
 await assert.rejects(run(),e=>e.code==='account_settings_mismatch');
 account={...openAiAccount,url:'https://different.example/kamehame-japan.com'};
 await assert.rejects(run(),e=>e.code==='wrong_account');
 assert.deepEqual(await db.first('SELECT payload,revision FROM business_records'),previous);
});
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
test('Google Ads reports safe, actionable production/account/scope/API errors and retains cached data',async(t)=>{
 const db=openTestDb();
 await db.run(`INSERT INTO business_records VALUES ('snapshot:google:2026-11-01:2026-11-16','snapshot','{"previous":true}',5,'2026-11-01','test')`);
 const cases=[
  ['CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION','authorizationError','google_ads_production_access_required','Explorer'],
  ['USER_PERMISSION_DENIED','authorizationError','google_ads_account_access_denied','GOOGLE_ADS_LOGIN_CUSTOMER_ID'],
  ['ACCESS_TOKEN_SCOPE_INSUFFICIENT',null,'google_ads_scope_required','adwords'],
  ['SERVICE_DISABLED',null,'google_ads_api_disabled','有効'],
 ];
 for(const [reason,field,expectedCode,action] of cases) {
  t.mock.method(globalThis,'fetch',async(url)=>{
   if(url.includes('/token'))return json({access_token:'test-access'});
   const detail=field?{'@type':'type.googleapis.com/google.ads.googleads.v26.errors.GoogleAdsFailure',errors:[{errorCode:{[field]:reason},message:'secret-provider-message',trigger:{stringValue:'private-trigger'}}],requestId:'private-request-id'}:{'@type':'type.googleapis.com/google.rpc.ErrorInfo',reason,metadata:{consumer:'private-consumer'}};
   return json({error:{message:'secret-provider-message',details:[detail]}},403);
  });
  await assert.rejects(sync(db,{...env,GOOGLE_ADS_LOGIN_CUSTOMER_ID:'5258159341'},{source:'google',...period},'test'),e=>e.code===expectedCode&&e.message.includes(action)&&e.message.includes(reason)&&!/secret|private/.test(e.message));
  const previous=await db.first('SELECT revision, payload FROM business_records');
  assert.equal(previous.revision,5);assert.equal(previous.payload,'{"previous":true}');
 }
});
test('Google Ads unknown or malformed upstream errors stay generic and never expose provider payloads',async(t)=>{
 const db=openTestDb();
 const bodies=[
  {error:{message:'secret-provider-message',details:[{'@type':'type.googleapis.com/google.ads.googleads.v26.errors.GoogleAdsFailure',errors:[{errorCode:{authorizationError:'PRIVATE_UNKNOWN_REASON'},message:'private-account'}]}]}},
  {error:{details:'secret-malformed-details'}},
  {error:{details:[null,{}, {errors:'private-malformed-errors'}]}},
  {error:{details:[{'@type':'unexpected-type',reason:'SERVICE_DISABLED'}]}},
 ];
 for(const body of [...bodies,null]) {
  t.mock.method(globalThis,'fetch',async(url)=>url.includes('/token')?json({access_token:'test-access'}):body===null?new Response('secret-error-page',{status:403}):json(body,403));
  await assert.rejects(sync(db,env,{source:'google',...period},'test'),e=>e.code==='source_access_failed'&&e.message.includes('HTTP 403')&&!/secret|private|PRIVATE_UNKNOWN_REASON/.test(e.message));
 }
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,0);
});
const permissionDenied=()=>json({error:{details:[{'@type':'type.googleapis.com/google.ads.googleads.v26.errors.GoogleAdsFailure',errors:[{errorCode:{authorizationError:'USER_PERMISSION_DENIED'}}]}]}},403);
test('Google Ads retries denied direct reads through the verified manager and retains it for every report page',async(t)=>{
 const db=openTestDb();const calls=[];let pages=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  assert.equal(url,'https://googleads.googleapis.com/v26/customers/1700154296/googleAds:search');
  const b=JSON.parse(init.body);calls.push({manager:init.headers['login-customer-id'],...b});
  if(!init.headers['login-customer-id'])return permissionDenied();
  assert.equal(init.headers['login-customer-id'],'5258159341');
  if(b.query.includes('FROM customer'))return json({results:[{customer:{id:'1700154296',currencyCode:'JPY',timeZone:'Asia/Tokyo'}}]});
  if(++pages===2)assert.equal(b.pageToken,'two');
  return json({results:[{campaign:{id:String(pages),name:'Test'},metrics:{costMicros:'1000000'}}],...(pages===1?{nextPageToken:'two'}:{})});
 });
 const r=await sync(db,env,{source:'google',...period},'test');
 assert.equal(r.data.rows.length,2);assert.equal(calls.length,4);
 assert.equal(calls[0].manager,undefined);assert.deepEqual(calls.slice(1).map(c=>c.manager),['5258159341','5258159341','5258159341']);
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,1);
});
test('Google Ads manager fallback is bounded, honors explicit configuration and preserves reports on denial',async(t)=>{
 const db=openTestDb();let calls=0;
 await db.run(`INSERT INTO business_records VALUES ('snapshot:google:2026-11-01:2026-11-16','snapshot','{"previous":true}',5,'2026-11-01','test')`);
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  calls++;assert.equal(init.headers['login-customer-id'],calls===1?undefined:'5258159341');return permissionDenied();
 });
 await assert.rejects(sync(db,env,{source:'google',...period},'test'),e=>e.code==='google_ads_account_access_denied'&&e.message.includes('管理アカウント経由でも'));
 assert.equal(calls,2);
 calls=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  calls++;assert.equal(init.headers['login-customer-id'],'1234567890');return permissionDenied();
 });
 await assert.rejects(sync(db,{...env,GOOGLE_ADS_LOGIN_CUSTOMER_ID:'1234567890'},{source:'google',...period},'test'),e=>e.code==='google_ads_account_access_denied');
 assert.equal(calls,1);assert.equal((await db.first('SELECT revision FROM business_records')).revision,5);
});
test('Google Ads never retries unrelated failures or accepts a wrong account through the manager',async(t)=>{
 const db=openTestDb();let calls=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  calls++;return json({error:{details:[{'@type':'type.googleapis.com/google.ads.googleads.v26.errors.GoogleAdsFailure',errors:[{errorCode:{authorizationError:'CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION'}}]}]}},403);
 });
 await assert.rejects(sync(db,env,{source:'google',...period},'test'),e=>e.code==='google_ads_production_access_required');assert.equal(calls,1);
 calls=0;
 t.mock.method(globalThis,'fetch',async(url,init)=>{
  if(url.includes('/token'))return json({access_token:'test-access'});
  calls++;return init.headers['login-customer-id']?json({results:[{customer:{id:'9999999999',currencyCode:'JPY',timeZone:'Asia/Tokyo'}}]}):permissionDenied();
 });
 await assert.rejects(sync(db,env,{source:'google',...period},'test'),e=>e.code==='wrong_account');assert.equal(calls,2);
 assert.equal((await db.first('SELECT count(*) n FROM business_records')).n,0);
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
