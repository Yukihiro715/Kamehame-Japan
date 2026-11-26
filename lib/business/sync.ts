import { directAdsSources, googleAds, metaAds, googleConfigured, type AdsEnv } from './ad-sources';
import { searchConsole, analytics } from './google-search';
import type { SqlDb } from '@/lib/referral/db';
import { ApiError } from '@/lib/portal/util';
import { range, saveRecord } from './storage';
import { openAiAds } from './openai-ads';
export interface BusinessEnv extends AdsEnv {STRIPE_READ_KEY?:string; BUSINESS_METRICS_URL?:string; BUSINESS_METRICS_TOKEN?:string}
export function syncSources(env:BusinessEnv){return [...new Set([...directAdsSources(env),...(googleConfigured(env)?['seo','aio','organic']:[]),...(env.STRIPE_READ_KEY?['stripe']:[]),...(env.BUSINESS_METRICS_URL&&env.BUSINESS_METRICS_TOKEN?['google','meta','seo','aio','organic']:[])])];}
export async function sync(db:SqlDb,env:BusinessEnv,input:unknown,actor:string){
 const parsed=range.safeParse(input);if(!parsed.success)throw new ApiError(400,'bad_period','期間は181日以内で指定してください。');
 const {source,start,end}=parsed.data;
 if(!syncSources(env).includes(source))throw new ApiError(503,'source_unconfigured','この媒体の直接接続は未設定です。保存済みデータを保持しています。');
 let data:Record<string,unknown>;
 if(source==='stripe'){
  const from=Date.parse(start+'T00:00:00+09:00')/1000,to=Date.parse(end+'T23:59:59+09:00')/1000;
  const rows:Array<{id:string;source:string;created:number;currency:string;type:string;reporting_category:string;amount:number;fee:number;net:number}>=[];
  let after='';let more=true;
  for(let i=0;i<20&&more;i++){
   const params=new URLSearchParams({limit:'100','created[gte]':String(from),'created[lte]':String(to)});if(after)params.set('starting_after',after);
   const response=await fetch('https://api.stripe.com/v1/balance_transactions?'+params,{headers:{Authorization:'Bearer '+env.STRIPE_READ_KEY},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw new ApiError(502,'stripe_failed',response.status===403?'Stripeの残高取引を読み取る権限がありません。管理者が読み取りキーの権限を確認してください。':response.status===401?'Stripeの読み取りキーが無効または期限切れです。管理者による再設定が必要です。':`Stripeへの接続に失敗しました（HTTP ${response.status}）。時間をおいて再実行してください。`);
   const page=await response.json() as {data:typeof rows;has_more:boolean};rows.push(...page.data);more=page.has_more;after=page.data.at(-1)?.id??'';
   if(more&&!after)throw new ApiError(502,'stripe_pagination');
  }
  if(more)throw new ApiError(422,'too_many_payments','取引数が多いため、期間を短くしてください。');
  if(rows.some(r=>r.currency!=='jpy'))throw new ApiError(422,'currency_mismatch','JPY以外の取引が含まれるため集計を停止しました。');
  const test=new Set(['txn_3UJVqrDpZ5Y8WoJ24Bg2ced1','txn_1UJVrvDpZ5Y8WoJ2xBe98QfO']);let gross=0,refund=0,fees=0;const payments=[];
  for(const r of rows){if(['charge','payment'].includes(r.type)){if(!test.has(r.id)){gross+=r.amount;payments.push({id:r.id,source:r.source,amount:r.amount,fee:r.fee,date:new Date((r.created+9*3600)*1000).toISOString().slice(0,10)})}fees+=r.fee}else if(['refund','payment_refund'].includes(r.type)){if(!test.has(r.id))refund-=r.amount;fees+=r.fee}else if(['stripe_fee','stripe_fx_fee','tax_fee'].includes(r.type)||r.reporting_category==='fee')fees-=r.net;}
  data={gross,refund,net:gross-refund,fees,payments,currency:'JPY'};
 }else if(source==='google'&&directAdsSources(env).includes('google')) {data=await googleAds(env,start,end);
 }else if(source==='meta'&&directAdsSources(env).includes('meta')) {data=await metaAds(env,start,end);
 }else if(source==='openai_ads') {
  const report=await openAiAds(env,start,end);
  if(report.coverage!=='complete')return {ok:true,source,start,end,data:report,saved:false};
  data=report;
 }else if(source==='seo'&&googleConfigured(env)){data=await searchConsole(env,start,end);
 }else if((source==='aio'||source==='organic')&&googleConfigured(env)){data=await analytics(env,source,start,end);
 }else{
  // An operator-configured server bridge supplies the same normalized report contract.
  const url=new URL(env.BUSINESS_METRICS_URL!);if(url.protocol!=='https:')throw new ApiError(503,'source_unconfigured');
  const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+env.BUSINESS_METRICS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({source,start,end}),redirect:'manual',signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new ApiError(502,'source_failed','媒体の更新に失敗しました。保存済みデータを保持しています。');
  const report=await r.json() as {source:string;start:string;end:string;data:Record<string,unknown>};
  if(report.source!==source||report.start!==start||report.end!==end||!report.data)throw new ApiError(502,'invalid_report');data=report.data;
 }
 const id=source+':'+start+':'+end,updatedAt=new Date().toISOString();
 const old=await db.first<{revision:number}>(`SELECT revision FROM business_records WHERE key=?`,['snapshot:'+id]);
 await saveRecord(db,'snapshot',{id,source,start,end,data,updatedAt},old?.revision??0,actor);
 return {ok:true,source,start,end,data,updatedAt};
}
