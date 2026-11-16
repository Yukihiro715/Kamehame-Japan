import { ApiError } from '@/lib/portal/util';
import { metaConversions, metricNumber } from './metrics.mjs';

export interface AdsEnv {
 GOOGLE_ADS_CLIENT_ID?:string; GOOGLE_ADS_CLIENT_SECRET?:string; GOOGLE_ADS_REFRESH_TOKEN?:string;
 GOOGLE_ADS_LOGIN_CUSTOMER_ID?:string;
 META_ADS_ACCESS_TOKEN?:string;
}
export function directAdsSources(e:AdsEnv) {
 return [...(googleConfigured(e)?['google']:[]),...(e.META_ADS_ACCESS_TOKEN?['meta']:[])];
}
export async function read<T>(url:string,init:RequestInit,source:string):Promise<T> {
 let r:Response;
 // Workers supports manual/follow only. Never forward credentials to redirects.
 try {r=await fetch(url,{...init,redirect:'manual',signal:AbortSignal.timeout(20000)});} catch(e) {
  if(e instanceof Error && (e.name==='TimeoutError'||e.name==='AbortError'))throw new ApiError(504,'source_timeout',`${source}の応答が20秒以内に返りませんでした。時間をおいて再実行してください。`);
  throw new ApiError(502,'source_unreachable',`${source}への通信に失敗しました。管理者に通信設定の確認を依頼してください。`);
 }
 if(r.status>=300&&r.status<400)throw new ApiError(502,'source_redirect_blocked',`${source}から予期しない転送が返されたため、認証情報を送信せず停止しました。`);
 if(!r.ok)throw new ApiError(502,'source_access_failed',`${source}の認証・読み取り権限を確認してください（HTTP ${r.status}）。`);
 const d=await r.json() as T & {error?:unknown};if(!d || typeof d!=="object" || d.error)throw new ApiError(502,'source_access_failed',`${source}の認証・読み取り権限を確認してください。`);return d;
}
const n=(v:unknown)=>{const value=metricNumber(v);if(value===null)throw new ApiError(502,'invalid_report','媒体から数値を取得できませんでした。');return value;};
function account(currency:string,zone:string){if(currency!=='JPY'||zone!=='Asia/Tokyo')throw new ApiError(422,'account_settings_mismatch','広告アカウントの通貨・タイムゾーンがJPY / Asia/Tokyoと一致しません。');}
export function googleConfigured(e:AdsEnv){return !!(e.GOOGLE_ADS_CLIENT_ID&&e.GOOGLE_ADS_CLIENT_SECRET&&e.GOOGLE_ADS_REFRESH_TOKEN);}
export async function googleAccessToken(e:AdsEnv){
 const token=await read<{access_token?:string}>('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'refresh_token',client_id:e.GOOGLE_ADS_CLIENT_ID!,client_secret:e.GOOGLE_ADS_CLIENT_SECRET!,refresh_token:e.GOOGLE_ADS_REFRESH_TOKEN!})},'Google認証');
 if(typeof token.access_token!=='string'||!token.access_token)throw new ApiError(502,'google_auth_failed');
 return token.access_token;
}
export async function googleAds(e:AdsEnv,start:string,end:string) {
 const headers:Record<string,string>={Authorization:'Bearer '+await googleAccessToken(e),'Content-Type':'application/json'};
 if(e.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {if(!/^\d{10}$/.test(e.GOOGLE_ADS_LOGIN_CUSTOMER_ID))throw new ApiError(503,'invalid_manager_id');headers['login-customer-id']=e.GOOGLE_ADS_LOGIN_CUSTOMER_ID;}
 const query=async(query:string,pageToken?:string)=>read<{results?:Array<{customer?:{id:string;currencyCode:string;timeZone:string};campaign?:{id:string;name:string};metrics?:{costMicros?:string;clicks?:string;impressions?:string;conversions?:number}}>;nextPageToken?:string}>('https://googleads.googleapis.com/v26/customers/1700154296/googleAds:search',{method:'POST',headers,body:JSON.stringify({query,...(pageToken?{pageToken}:{})})},'Google広告');
 const info=await query('SELECT customer.id, customer.currency_code, customer.time_zone FROM customer');
 const c=info.results?.[0]?.customer;if(!c||String(c.id)!=='1700154296')throw new ApiError(502,'wrong_account');account(c.currencyCode,c.timeZone);
 const rows=[];let next:string|undefined;
 for(let i=0;i<20;i++){
  const page=await query(`SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}'`,next);
  if(page.results!==undefined&&!Array.isArray(page.results))throw new ApiError(502,'invalid_report');
  for(const r of page.results??[]) {if(!r.campaign?.id||!r.metrics)throw new ApiError(502,'invalid_report');rows.push({id:String(r.campaign.id),name:r.campaign.name,spend:n(r.metrics.costMicros??0)/1e6,clicks:n(r.metrics.clicks??0),impressions:n(r.metrics.impressions??0),conversions:metricNumber(r.metrics.conversions??0)});}
  next=page.nextPageToken;if(!next)return {rows,currency:'JPY'};
 }
 throw new ApiError(422,'too_many_campaigns','広告データが多いため期間を短くしてください。');
}
export async function metaAds(e:AdsEnv,start:string,end:string) {
 const headers={Authorization:'Bearer '+e.META_ADS_ACCESS_TOKEN};
 const base='https://graph.facebook.com/v27.0/act_1089610383773886';
 const c=await read<{id:string;currency:string;timezone_name:string}>(base+'?fields=id,currency,timezone_name',{headers},'Meta広告');
 if(c.id!=='act_1089610383773886')throw new ApiError(502,'wrong_account');account(c.currency,c.timezone_name);
 const rows=[];let after:string|undefined;
 for(let i=0;i<20;i++) {
  const params=new URLSearchParams({level:'campaign',fields:'campaign_id,campaign_name,spend,clicks,impressions,actions',time_range:JSON.stringify({since:start,until:end}),limit:'100'});if(after)params.set('after',after);
  const page=await read<{data:Array<{campaign_id:string;campaign_name:string;spend:string;clicks:string;impressions:string;actions?:Array<{action_type:string;value:string}>}>;paging?:{next?:string;cursors?:{after?:string}}}>(base+'/insights?'+params,{headers},'Meta広告');
  if(!Array.isArray(page.data))throw new ApiError(502,'invalid_report');
  for(const r of page.data)rows.push({id:r.campaign_id,name:r.campaign_name,spend:n(r.spend),clicks:n(r.clicks),impressions:n(r.impressions),conversions:metaConversions(r,'lead',[]),purchases:metaConversions(r,'purchase',[])});
  if(!page.paging?.next)return {rows,currency:'JPY',cvDefinition:'問い合わせ（lead）/ 購入（purchase）',cvAvailable:true};
  const cursor=page.paging?.cursors?.after;if(typeof cursor!=='string'||!cursor||cursor===after)throw new ApiError(502,'invalid_pagination');after=cursor;
 }
 throw new ApiError(422,'too_many_campaigns','広告データが多いため期間を短くしてください。');
}
