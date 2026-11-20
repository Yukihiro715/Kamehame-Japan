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
const aiFilter={filter:{fieldName:'sessionSource',stringFilter:{matchType:'FULL_REGEXP',value:'([a-z0-9-]+\\.)*('+aiDomains.map(d=>d.replaceAll('.','\\.')).join('|')+')',caseSensitive:false}}};

export async function analytics(env:AdsEnv,source:'aio'|'organic',start:string,end:string){
 const token=await googleAccessToken(env);
 async function report(dimensions:string[],dimensionFilter?:unknown){
  const rows:Array<{key:string;sessions:number;keyEvents:number}>=[];
  for(let i=0;i<20;i++){
   const d=await read<GaReport>('https://analyticsdata.googleapis.com/v1beta/properties/554299976:runReport',{
    method:'POST',headers:headers(token),body:JSON.stringify({dateRanges:[{startDate:start,endDate:end}],dimensions:dimensions.map(name=>({name})),metrics:[{name:'sessions'},{name:'keyEvents'}],...(dimensionFilter?{dimensionFilter}:{}),limit:10000,offset:rows.length,...(dimensions.length?{orderBys:dimensions.map(dimensionName=>({dimension:{dimensionName}}))}:{})})
   },'GA4');
   if(d.metadata?.timeZone!=='Asia/Tokyo')throw new ApiError(422,'analytics_timezone_mismatch','GA4のタイムゾーンがAsia/Tokyoと一致しません。');
   if(d.metadata.dataLossFromOtherRow||d.metadata.subjectToThresholding||d.metadata.samplingMetadatas?.length||d.metadata.dataTruncationReasons?.length)throw new ApiError(502,'analytics_incomplete','GA4のデータにしきい値・サンプリング等の制限があります。期間を変更して再取得してください。');
   if(d.metricHeaders?.map(h=>h.name).join(',')!=='sessions,keyEvents'||(d.dimensionHeaders??[]).map(h=>h.name).join(',')!==dimensions.join(',')||(d.rows!==undefined&&!Array.isArray(d.rows)))throw new ApiError(502,'invalid_report');
   const page=d.rows??[];
   for(const r of page){if(r.metricValues?.length!==2||(r.dimensionValues??[]).length!==dimensions.length)throw new ApiError(502,'invalid_report');rows.push({key:r.dimensionValues?.[0]?.value??'',sessions:number(r.metricValues[0].value),keyEvents:number(r.metricValues[1].value)});}
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
 const [all,summary,assistants,landingPages]=await Promise.all([report([]),report([],aiFilter),report(['sessionSource'],aiFilter),report(['landingPage'],aiFilter)]);
 if(all.length>1||summary.length>1)throw new ApiError(502,'invalid_report');
 const sessions=summary[0]?.sessions??0,total=all[0]?.sessions??0;
 return {summary:{sessions,keyEvents:summary[0]?.keyEvents??0},assistants,landingPages,llmShareOfSessions:total?sessions/total:0,timeZone:'Asia/Tokyo',propertyId:'554299976'};
}
