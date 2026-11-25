import { ApiError } from '@/lib/portal/util';
import { googleAccessToken, read, type AdsEnv } from './ad-sources';
import { metricNumber } from './metrics.mjs';

const number=(v:unknown)=>{const n=metricNumber(v);if(n===null)throw new ApiError(502,'invalid_report','Googleから数値を取得できませんでした。');return n;};
const headers=(token:string)=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
type SearchRow={keys?:string[];clicks:number;impressions:number;ctr:number;position:number};
type SearchReport={rows?:SearchRow[];metadata?:{first_incomplete_date?:string}};

export async function searchConsole(env:AdsEnv,start:string,end:string){
 const token=await googleAccessToken(env);
 const query=(dimensions:string[])=>read<SearchReport>('https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent('sc-domain:kamehame-japan.com')+'/searchAnalytics/query',{
  method:'POST',headers:headers(token),body:JSON.stringify({startDate:start,endDate:end,type:'web',aggregationType:'byProperty',dimensions,dataState:'all',rowLimit:25000})
 },'Search Console');
 const [total,daily]=await Promise.all([query([]),query(['date'])]);
 if((total.rows!==undefined&&!Array.isArray(total.rows))||(daily.rows!==undefined&&!Array.isArray(daily.rows))||(total.rows?.length??0)>1)throw new ApiError(502,'invalid_report');
 const r=total.rows?.[0];
 const dailyRows=(daily.rows??[]).map(d=>{
  const date=d.keys?.[0];if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<start||date>end)throw new ApiError(502,'invalid_report');
  return {date,clicks:number(d.clicks)};
 }).sort((a,b)=>a.date.localeCompare(b.date));
 const first=daily.metadata?.first_incomplete_date;
 const settledThrough=first&&/^\d{4}-\d{2}-\d{2}$/.test(first)?new Date(Date.parse(first+'T00:00:00Z')-86400000).toISOString().slice(0,10):undefined;
 return {current:{clicks:r?number(r.clicks):0,impressions:r?number(r.impressions):0,ctr:r?number(r.ctr)*100:0,avgPosition:r&&number(r.impressions)>0?number(r.position):null},dailyRows,...(settledThrough?{settledThrough}:{}),timeZone:'America/Los_Angeles',siteUrl:'sc-domain:kamehame-japan.com'};
}

type GaReport={dimensionHeaders?:{name:string}[];metricHeaders?:{name:string}[];rows?:{dimensionValues?:{value:string}[];metricValues?:{value:string}[]}[];rowCount?:number;metadata?:{timeZone?:string;dataLossFromOtherRow?:boolean;subjectToThresholding?:boolean;samplingMetadatas?:unknown[];dataTruncationReasons?:unknown[]}};
const aiDomains=['chatgpt.com','chat.openai.com','perplexity.ai','claude.ai','gemini.google.com','copilot.microsoft.com','meta.ai','grok.com','deepseek.com','phind.com','you.com'];
const domainPattern=(domains:string[])=>'([a-z0-9-]+\\.)*('+domains.map(d=>d.replaceAll('.','\\.')).join('|')+')';
const paidMedium={filter:{fieldName:'sessionMedium',stringFilter:{matchType:'FULL_REGEXP',value:'(cpc|ppc|cpm|cpv|cpa|paid.*)',caseSensitive:false}}};
const sourcePattern=(value:string)=>({filter:{fieldName:'sessionSource',stringFilter:{matchType:'FULL_REGEXP',value,caseSensitive:false}}});
const aiReferral={andGroup:{expressions:[sourcePattern(domainPattern(aiDomains)),{notExpression:paidMedium}]}};
const chatGptAds={andGroup:{expressions:[sourcePattern('(chatgpt|openai|chatgpt_ads|'+domainPattern(['chatgpt.com','chat.openai.com'])+')'),paidMedium]}};
const trafficMetrics=['sessions','keyEvents'];
const enquiryMetrics=['eventCount'];
const ecommerceMetrics=[...trafficMetrics,'ecommercePurchases','purchaseRevenue'];
const enquiryEvent={filter:{fieldName:'eventName',stringFilter:{matchType:'EXACT',value:'generate_lead',caseSensitive:true}}};
const enquiryReports=(segment:typeof aiReferral|typeof chatGptAds)=>({andGroup:{expressions:[...segment.andGroup.expressions,enquiryEvent]}});
type GaRow={key:string;sessions:number;keyEvents:number;purchases?:number;purchaseRevenue?:number;enquiries?:number};
const withTotals=(row:GaRow|undefined)=>({
 sessions:row?.sessions??0,keyEvents:row?.keyEvents??0,
 purchases:row?.purchases??0,purchaseRevenue:row?.purchaseRevenue??0,
});
const bySessions=(a:GaRow,b:GaRow)=>b.sessions-a.sessions||a.key.localeCompare(b.key);

export async function analytics(env:AdsEnv,source:'aio'|'organic',start:string,end:string){
 const token=await googleAccessToken(env);
 async function report(dimensions:string[],dimensionFilter?:unknown,metrics=trafficMetrics){
  const includePurchases=metrics===ecommerceMetrics;
  const rows:GaRow[]=[];
  for(let i=0;i<20;i++){
   const d=await read<GaReport>('https://analyticsdata.googleapis.com/v1beta/properties/554299976:runReport',{
    method:'POST',headers:headers(token),body:JSON.stringify({dateRanges:[{startDate:start,endDate:end}],dimensions:dimensions.map(name=>({name})),metrics:metrics.map(name=>({name})),...(includePurchases?{currencyCode:'JPY'}:{}),...(dimensionFilter?{dimensionFilter}:{}),limit:10000,offset:rows.length,...(dimensions.length?{orderBys:dimensions.map(dimensionName=>({dimension:{dimensionName}}))}:{})})
   },'GA4');
   if(d.metadata?.timeZone!=='Asia/Tokyo')throw new ApiError(422,'analytics_timezone_mismatch','GA4のタイムゾーンがAsia/Tokyoと一致しません。');
   if(d.metadata.dataLossFromOtherRow||d.metadata.subjectToThresholding||d.metadata.samplingMetadatas?.length||d.metadata.dataTruncationReasons?.length)throw new ApiError(502,'analytics_incomplete','GA4のデータにしきい値・サンプリング等の制限があります。期間を変更して再取得してください。');
   if(d.metricHeaders?.map(h=>h.name).join(',')!==metrics.join(',')||(d.dimensionHeaders??[]).map(h=>h.name).join(',')!==dimensions.join(',')||(d.rows!==undefined&&!Array.isArray(d.rows)))throw new ApiError(502,'invalid_report');
   const page=d.rows??[];
   for(const r of page){
    if(r.metricValues?.length!==metrics.length||(r.dimensionValues??[]).length!==dimensions.length)throw new ApiError(502,'invalid_report');
    const [sessions,keyEvents,purchases,purchaseRevenue]=r.metricValues.map(m=>number(m.value));
    const key=r.dimensionValues?.[0]?.value??'';
    rows.push(metrics===enquiryMetrics?{key,sessions:0,keyEvents:0,enquiries:sessions}:{key,sessions,keyEvents,...(includePurchases?{purchases,purchaseRevenue}:{})});
   }
   const count=number(d.rowCount??0);
   if(rows.length===count)return rows;
   if(rows.length>count||!page.length)throw new ApiError(502,'invalid_pagination');
  }
  throw new ApiError(422,'too_many_analytics_rows','GA4データが多いため期間を短くしてください。');
 }
 if(source==='organic'){
  const rows=await report([],{filter:{fieldName:'sessionDefaultChannelGroup',stringFilter:{matchType:'EXACT',value:'Organic Search'}}});
  if(rows.length>1)throw new ApiError(502,'invalid_report');
  return {sessions:rows[0]?.sessions??0,conversions:rows[0]?.keyEvents??0,definition:'GA4 / Organic Search / キーイベント',timeZone:'Asia/Tokyo',propertyId:'554299976'};
 }
 const [all,summary,assistants,landingPages,paid,paidLandingPages,referralEnquiries,paidEnquiries]=await Promise.all([
  report([]),
  report([],aiReferral,ecommerceMetrics),
  report(['sessionSource'],aiReferral,ecommerceMetrics),
  report(['landingPage'],aiReferral,ecommerceMetrics),
  report([],chatGptAds,ecommerceMetrics),
  report(['landingPage'],chatGptAds,ecommerceMetrics),
  report(['landingPage'],enquiryReports(aiReferral),enquiryMetrics),
  report(['landingPage'],enquiryReports(chatGptAds),enquiryMetrics),
 ]);
 if([all,summary,paid].some(rows=>rows.length>1))throw new ApiError(502,'invalid_report');
 const combine=(totals:GaRow|undefined,traffic:GaRow[],enquiries:GaRow[])=>{
  const counts=new Map(enquiries.map(row=>[row.key,row.enquiries??0]));
  return {
   summary:{...withTotals(totals),enquiries:enquiries.reduce((sum,row)=>sum+(row.enquiries??0),0)},
   landingPages:traffic.map(row=>({...row,enquiries:counts.get(row.key)??0})).sort(bySessions),
  };
 };
 const referral=combine(summary[0],landingPages,referralEnquiries),total=all[0]?.sessions??0;
 return {
  ...referral,assistants:assistants.sort(bySessions),
  chatGptPaid:combine(paid[0],paidLandingPages,paidEnquiries),
  llmShareOfSessions:total?referral.summary.sessions/total:0,timeZone:'Asia/Tokyo',propertyId:'554299976',
 };
}
