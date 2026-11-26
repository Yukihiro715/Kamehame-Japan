import { ApiError } from '@/lib/portal/util';
import { metaConversions, metricNumber } from './metrics.mjs';

export interface AdsEnv {
 GOOGLE_ADS_CLIENT_ID?:string; GOOGLE_ADS_CLIENT_SECRET?:string; GOOGLE_ADS_REFRESH_TOKEN?:string;
 GOOGLE_ADS_LOGIN_CUSTOMER_ID?:string;
 META_ADS_ACCESS_TOKEN?:string;
 OPENAI_ADS_API_KEY?:string;
}
export function directAdsSources(e:AdsEnv) {
 return [...(googleConfigured(e)?['google']:[]),...(e.META_ADS_ACCESS_TOKEN?['meta']:[]),...(e.OPENAI_ADS_API_KEY?['openai_ads']:[])];
}
type ProviderError = (body:unknown)=>ApiError|undefined;
export async function read<T>(url:string,init:RequestInit,source:string,providerError?:ProviderError):Promise<T> {
 let r:Response;
 // Workers supports manual/follow only. Never forward credentials to redirects.
 try {r=await fetch(url,{...init,redirect:'manual',signal:AbortSignal.timeout(20000)});} catch(e) {
  if(e instanceof Error && (e.name==='TimeoutError'||e.name==='AbortError'))throw new ApiError(504,'source_timeout',`${source}の応答が20秒以内に返りませんでした。時間をおいて再実行してください。`);
  throw new ApiError(502,'source_unreachable',`${source}への通信に失敗しました。管理者に通信設定の確認を依頼してください。`);
 }
 if(r.status>=300&&r.status<400)throw new ApiError(502,'source_redirect_blocked',`${source}から予期しない転送が返されたため、認証情報を送信せず停止しました。`);
 if(!r.ok) {
  let body:unknown;
  if(providerError)try{body=await r.json();}catch{/* Non-JSON failures keep the generic HTTP error. */}
  throw providerError?.(body)??new ApiError(502,'source_access_failed',`${source}の認証・読み取り権限を確認してください（HTTP ${r.status}）。`);
 }
 const d=await r.json() as T & {error?:unknown};if(!d || typeof d!=="object" || d.error)throw providerError?.(d)??new ApiError(502,'source_access_failed',`${source}の認証・読み取り権限を確認してください。`);return d;
}
// Only known provider codes may leave the server. Messages, metadata, and IDs in
// Google's raw error response can contain credentials or private account details.
const googleAdsDiagnostics:Record<string,{code:string;message:string}>={
 CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION:{code:'google_ads_production_access_required',message:'Google Cloudの「KAMEHAME Dashboard」→「Google Ads APIの概要」で、アクセスレベルをTestからExplorer以上に変更してください。'},
 USER_PERMISSION_DENIED:{code:'google_ads_account_access_denied',message:'認証したGoogleアカウントの広告アカウント170-015-4296への閲覧権限を確認してください。管理アカウント経由の場合はGOOGLE_ADS_LOGIN_CUSTOMER_IDの設定も確認してください。'},
 ACCESS_TOKEN_SCOPE_INSUFFICIENT:{code:'google_ads_scope_required',message:'Google広告のOAuth権限（adwords）が不足しています。Google広告の権限を含めて再認可し、Refresh tokenを更新してください。'},
 SERVICE_DISABLED:{code:'google_ads_api_disabled',message:'OAuthクライアントを作成したGoogle Cloudプロジェクトで、Google Ads APIを有効にしてください。'},
};
function record(value:unknown):Record<string,unknown>|undefined{return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:undefined;}
function googleAdsError(body:unknown):ApiError|undefined {
 const details=record(record(body)?.error)?.details;
 if(!Array.isArray(details))return;
 const codes=new Set<string>();
 for(const detail of details) {
  const d=record(detail);if(!d)continue;
  // google.rpc.ErrorInfo (scope/API failures).
  if(d['@type']==='type.googleapis.com/google.rpc.ErrorInfo'&&typeof d.reason==='string')codes.add(d.reason);
  // Versioned GoogleAdsFailure (production/account authorization failures).
  if(typeof d['@type']!=='string'||!/^type\.googleapis\.com\/google\.ads\.googleads\.v\d+\.errors\.GoogleAdsFailure$/.test(d['@type'])||!Array.isArray(d.errors))continue;
  for(const error of d.errors) {
   const code=record(record(error)?.errorCode);
   if(code)for(const value of Object.values(code))if(typeof value==='string')codes.add(value);
  }
 }
 for(const [reason,diagnostic] of Object.entries(googleAdsDiagnostics))if(codes.has(reason))return new ApiError(502,diagnostic.code,`${diagnostic.message}（${reason}）`);
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
 const query=async(query:string,pageToken?:string)=>read<{results?:Array<{customer?:{id:string;currencyCode:string;timeZone:string};campaign?:{id:string;name:string};metrics?:{costMicros?:string;clicks?:string;impressions?:string;conversions?:number}}>;nextPageToken?:string}>('https://googleads.googleapis.com/v26/customers/1700154296/googleAds:search',{method:'POST',headers,body:JSON.stringify({query,...(pageToken?{pageToken}:{})})},'Google広告',googleAdsError);
 const customerQuery='SELECT customer.id, customer.currency_code, customer.time_zone FROM customer';
 const info=await query(customerQuery).catch(async(error:unknown)=>{
  if(e.GOOGLE_ADS_LOGIN_CUSTOMER_ID||!(error instanceof ApiError)||error.code!=='google_ads_account_access_denied')throw error;
  // Verified KAMEHAME manager (Prosent). Retry only this account's read through
  // that manager; direct access remains preferred and explicit config wins.
  headers['login-customer-id']='5258159341';
  try{return await query(customerQuery);}catch(managerError) {
   if(managerError instanceof ApiError&&managerError.code==='google_ads_account_access_denied')throw new ApiError(502,'google_ads_account_access_denied','管理アカウント経由でも閲覧が許可されませんでした。トークン取得時のGoogleアカウントに、広告アカウント170-015-4296または管理アカウントへの閲覧権限があるか確認してください。（USER_PERMISSION_DENIED）');
   throw managerError;
  }
 });
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
