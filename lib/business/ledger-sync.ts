import { ApiError } from '@/lib/portal/util';
import { type SqlDb } from '@/lib/referral/db';
import { sha256Hex } from '@/lib/portal/auth';
import { googleAccessToken, googleConfigured, type AdsEnv } from './ad-sources';
import { booking, master, saveRecord } from './storage';
import { LEDGER_RANGES, LEDGER_TABS, ledgerSheetId } from './ledger-contract';

type Kind='booking'|'master';
type Payload={id:string;[key:string]:unknown};
type Link={source_key:string;record_key:string;baseline_json:string;source_hash:string;conflicts_json:string;pending_json:string|null};
type Stored={payload:string;revision:number};
export type LedgerReview={id:string;bookingId:string;title:string;question:string;evidence:string;updatedAt:string};
type Summary={lastAttemptAt?:string;lastSuccessAt?:string;lastError?:string;reviews?:LedgerReview[];imported?:number;updated?:number;preserved?:number;conflicts?:number};
const canonical=(value:unknown):string=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const same=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
const schema=(kind:Kind)=>kind==='booking'?booking:master;

/** A three-way merge: a source change may replace only an unchanged baseline.
 * Cost arrays stay atomic; a single manual cost edit protects the whole array. */
export function mergeLedgerRecord(current:Payload,incoming:Payload,baseline:Payload|null) {
  const merged={...current},conflicts:string[]=[];
  const identities=new Set(['id','requestId','reservationId','externalRef','stripeSource']);
  for(const field of new Set([...Object.keys(current),...Object.keys(incoming)])) {
    if(field==='id'||same(current[field],incoming[field])||identities.has(field)&&incoming[field]===undefined)continue;
    if(baseline&&same(incoming[field],baseline[field]))continue;
    if(identities.has(field)&&current[field]){conflicts.push(field);continue;}
    if(baseline&&same(current[field],baseline[field]))merged[field]=incoming[field];
    else conflicts.push(field);
  }
  return {merged,conflicts,changed:!same(current,merged)};
}

export async function ledgerConfig(db:SqlDb) {
  const rows=await db.all<{key:string;value:string}>(`SELECT key,value FROM portal_settings WHERE key IN ('business_ledger_sheet_id','business_ledger_sync')`);
  const values=Object.fromEntries(rows.map(r=>[r.key,r.value]));
  return {sheetId:ledgerSheetId(values.business_ledger_sheet_id),enabled:values.business_ledger_sync==='true'};
}
const readSummary=async(db:SqlDb):Promise<Summary>=>JSON.parse((await db.first<{payload:string}>(`SELECT payload FROM business_ledger_sync_state WHERE id='ledger'`))?.payload??'{}');
export async function ledgerState(db:SqlDb,env:AdsEnv) {
  const config=await ledgerConfig(db),summary=await readSummary(db);
  const prefix='sheet:'+config.sheetId+':';
  const links=await db.all<Link & Stored>(`SELECT l.*,r.payload,r.revision FROM business_ledger_links l JOIN business_records r ON r.key=l.record_key WHERE l.conflicts_json!='[]' AND substr(l.source_key,1,?)=? ORDER BY l.last_seen_at DESC LIMIT 50`,[prefix.length,prefix]);
  return {...config,googleConfigured:googleConfigured(env),...summary,conflictRecords:links.map(l=>({sourceKey:l.source_key,hash:l.source_hash,recordKey:l.record_key,revision:l.revision,fields:JSON.parse(l.conflicts_json) as string[],current:JSON.parse(l.payload),proposed:JSON.parse(l.pending_json??l.baseline_json)}))};
}

function providerFailure(body:unknown,status:number):ApiError {
  const text=JSON.stringify(body);
  if(text.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT'))return new ApiError(403,'ledger_scope_required','Google連携にスプレッドシートの読み取り権限を追加してください。');
  if(text.includes('SERVICE_DISABLED'))return new ApiError(403,'ledger_api_disabled','Google CloudでGoogle Sheets APIを有効にしてください。');
  return new ApiError(502,'ledger_read_failed',status===403?'連携したGoogleアカウントの台帳閲覧権限を確認してください。':'原価台帳を読み込めませんでした。以前の登録内容を保持しています。');
}
async function boundedJson(response:Response):Promise<unknown> {
  const reader=response.body?.getReader();if(!reader)throw new ApiError(502,'ledger_response_invalid');
  const chunks:Uint8Array[]=[];let bytes=0;
  try {while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2000000)throw new ApiError(422,'ledger_too_large','原価台帳の同期データが2MBを超えています。');chunks.push(value);}}
  finally {await reader.cancel().catch(()=>{});}
  const buffer=new Uint8Array(bytes);let offset=0;for(const c of chunks){buffer.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder().decode(buffer));}catch{throw new ApiError(502,'ledger_response_invalid','台帳の応答形式を確認してください。');}
}
export async function fetchLedger(env:AdsEnv,sheetId:string) {
  if(ledgerSheetId(sheetId)!==sheetId||!sheetId)throw new ApiError(400,'invalid_ledger_sheet');
  const params=new URLSearchParams({majorDimension:'ROWS',valueRenderOption:'UNFORMATTED_VALUE'});for(const range of LEDGER_RANGES)params.append('ranges',range);
  let response:Response;
  try {response=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+sheetId+'/values:batchGet?'+params,{headers:{Authorization:'Bearer '+await googleAccessToken(env)},redirect:'manual',signal:AbortSignal.timeout(20000)});}
  catch(e){if(e instanceof ApiError)throw e;throw new ApiError(502,'ledger_unreachable','原価台帳との通信に失敗しました。登録内容は保持しています。');}
  if(response.status>=300&&response.status<400)throw new ApiError(502,'ledger_redirect_blocked','予期しない転送があったため、台帳の読み取りを停止しました。');
  const raw=await boundedJson(response);
  if(!response.ok)throw providerFailure(raw,response.status);
  return parseLedger(raw,sheetId);
}
export function parseLedger(raw:unknown,sheetId:string) {
  const data=raw as {spreadsheetId?:unknown;valueRanges?:{values?:unknown[][]}[]};
  if(data?.spreadsheetId!==sheetId||!Array.isArray(data.valueRanges)||data.valueRanges.length!==3)throw new ApiError(502,'ledger_response_invalid');
  const definitions=[LEDGER_TABS.bookings,LEDGER_TABS.masters,LEDGER_TABS.reviews];
  const allRows=data.valueRanges.map((r,index)=>{
    const rows=r.values;
    if(!Array.isArray(rows)||!same(rows[0],definitions[index].headers))throw new ApiError(422,'ledger_headers_invalid','連携台帳の見出しが変更されています。同期を停止しました。');
    if(rows.length>=1001)throw new ApiError(422,'ledger_row_limit','連携台帳が同期上限に達しました。以前の登録内容は保持しています。');
    return rows.slice(1).filter(row=>row.some(v=>v!==''&&v!==null));
  });
  const parse=(index:0|1,kind:Kind)=>{
    const seen=new Set<string>(),def=definitions[index] as typeof LEDGER_TABS.bookings|typeof LEDGER_TABS.masters;
    return allRows[index].map((row)=>{
      let value:unknown;try{if(typeof row[def.payloadColumn]!=='string')throw Error();value=JSON.parse(row[def.payloadColumn] as string);}catch{throw new ApiError(422,'ledger_record_invalid','同期用データに不正な行があります。台帳の内容を確認してください。');}
      const parsed=schema(kind).safeParse(value);
      if(!parsed.success||row[0]!==parsed.data.id||seen.has(parsed.data.id))throw new ApiError(422,'ledger_record_invalid','案件ID・卸値IDと同期用データが一致しないか、重複しています。');
      seen.add(parsed.data.id);return parsed.data as Payload;
    });
  };
  const reviews:LedgerReview[]=[];
  for(const row of allRows[2]) {
    if(row.length>7||typeof row[0]!=='string'||typeof row[1]!=='string'||!['未確認','解決済','見送り'].includes(String(row[5]))||row.some(v=>typeof v!=='string'||v.length>2000))throw new ApiError(422,'ledger_review_invalid','確認待ち一覧の形式を確認してください。');
    if(row[5]==='未確認')reviews.push({id:row[0],bookingId:row[1],title:String(row[2]??''),question:String(row[3]??''),evidence:String(row[4]??''),updatedAt:String(row[6]??'')});
  }
  return {bookings:parse(0,'booking'),masters:parse(1,'master'),reviews:reviews.slice(0,100)};
}

async function existingRecord(db:SqlDb,kind:Kind,incoming:Payload) {
  const exact=await db.first<Stored & {key:string}>(`SELECT key,payload,revision FROM business_records WHERE key=?`,[kind+':'+incoming.id]);
  if(exact||kind!=='booking')return exact;
  const clauses:string[]=[],params:unknown[]=[];
  for(const field of ['requestId','reservationId','externalRef','stripeSource'])if(typeof incoming[field]==='string'&&incoming[field]){clauses.push(`json_extract(payload,'$.${field}')=?`);params.push(incoming[field]);}
  if(!clauses.length)return null;
  const matches=await db.all<Stored & {key:string}>(`SELECT key,payload,revision FROM business_records WHERE kind='booking' AND (${clauses.join(' OR ')}) LIMIT 2`,params);
  if(matches.length>1)throw new ApiError(409,'ledger_identity_conflict','同じ予約IDが複数の案件に登録されています。統合を確認してください。');
  const found=matches[0];if(found){const old=JSON.parse(found.payload);if(['requestId','reservationId','externalRef'].some(field=>old[field]&&incoming[field]&&old[field]!==incoming[field]))throw new ApiError(409,'ledger_identity_conflict','申込ID・予約番号の対応が一致しません。台帳の紐付けを確認してください。');}
  return found??null;
}
export async function syncLedgerRecord(db:SqlDb,sheetId:string,kind:Kind,input:Payload,at:string) {
  const parsed=schema(kind).parse(input) as Payload;
  const sourceKey='sheet:'+sheetId+':'+kind+':'+parsed.id;
  const existing=await existingRecord(db,kind,parsed);
  const incoming:Payload={...parsed,id:existing?String(JSON.parse(existing.payload).id):parsed.id};
  const key=kind+':'+incoming.id,hash=await sha256Hex(canonical(incoming));
  const link=await db.first<Link>(`SELECT * FROM business_ledger_links WHERE source_key=?`,[sourceKey]);
  let conflicts:string[]=[],result:'imported'|'updated'|'preserved'='preserved';
  if(!existing){await saveRecord(db,kind,incoming,0,'ledger-sync');result='imported';}
  else if(link?.source_hash===hash)return {result,conflict:JSON.parse(link.conflicts_json).length>0};
  else {
    const current=JSON.parse(existing.payload) as Payload;
    const merge=mergeLedgerRecord(current,incoming,link?JSON.parse(link.baseline_json):null);conflicts=[...new Set([...merge.conflicts,...(link?JSON.parse(link.conflicts_json) as string[]:[]).filter(field=>!same(current[field],incoming[field]))])];
    if(merge.changed){await saveRecord(db,kind,merge.merged,existing.revision,'ledger-sync');result='updated';}
  }
  await db.run(`INSERT INTO business_ledger_links (source_key,record_key,baseline_json,source_hash,conflicts_json,pending_json,last_seen_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(source_key) DO UPDATE SET record_key=excluded.record_key,baseline_json=excluded.baseline_json,source_hash=excluded.source_hash,conflicts_json=excluded.conflicts_json,pending_json=excluded.pending_json,last_seen_at=excluded.last_seen_at`,[sourceKey,key,JSON.stringify(incoming),hash,JSON.stringify(conflicts),conflicts.length?JSON.stringify(incoming):null,at]);
  return {result,conflict:conflicts.length>0};
}
export async function syncLedger(db:SqlDb,env:AdsEnv) {
  const config=await ledgerConfig(db);
  if(!config.enabled||!config.sheetId)return {ok:true,skipped:true};
  if(!googleConfigured(env))throw new ApiError(503,'ledger_google_unconfigured','Google連携を設定してください。');
  const at=new Date().toISOString(),lease=crypto.randomUUID(),until=new Date(Date.now()+120000).toISOString();
  const claim=await db.run(`UPDATE business_ledger_sync_state SET lease_token=?,lease_until=? WHERE id='ledger' AND (lease_until IS NULL OR lease_until<?)`,[lease,until,at]);
  if(!claim.changes)return {ok:true,busy:true};
  const old=await readSummary(db);
  try {
    const data=await fetchLedger(env,config.sheetId);let imported=0,updated=0,preserved=0,conflicts=0;
    let renewAt=Date.now()+30000;
    for(const [kind,records] of [['booking',data.bookings],['master',data.masters]] as const)for(const record of records){
      if(Date.now()>=renewAt){
        const now=new Date().toISOString();
        const renewed=await db.run(`UPDATE business_ledger_sync_state SET lease_until=? WHERE id='ledger' AND lease_token=? AND lease_until>=?`,[new Date(Date.now()+120000).toISOString(),lease,now]);
        if(!renewed.changes)throw new ApiError(409,'ledger_sync_interrupted','別の同期が開始されました。次回の同期で続きを確認します。');
        renewAt=Date.now()+30000;
      }
      const r=await syncLedgerRecord(db,config.sheetId,kind,record,at);if(r.result==='imported')imported++;else if(r.result==='updated')updated++;else preserved++;if(r.conflict)conflicts++;
    }
    const summary:Summary={lastAttemptAt:at,lastSuccessAt:at,lastError:'',reviews:data.reviews,imported,updated,preserved,conflicts};
    await db.run(`UPDATE business_ledger_sync_state SET payload=? WHERE id='ledger' AND lease_token=?`,[JSON.stringify(summary),lease]);
    return {ok:true,...summary};
  } catch(e) {
    const failure=e instanceof ApiError?e:new ApiError(502,'ledger_sync_failed','原価の同期に失敗しました。登録済みの内容は保持しています。');
    await db.run(`UPDATE business_ledger_sync_state SET payload=? WHERE id='ledger' AND lease_token=?`,[JSON.stringify({...old,lastAttemptAt:at,lastError:failure.message}),lease]);throw failure;
  } finally {await db.run(`UPDATE business_ledger_sync_state SET lease_token=NULL,lease_until=NULL WHERE id='ledger' AND lease_token=?`,[lease]);}
}

/** User approval is an optimistic, atomic write guarded by record revision and
 * the exact source hash displayed in the review. It cannot clear a newer quote. */
export async function resolveLedgerReview(db:SqlDb,input:{sourceKey:unknown;hash:unknown;revision:unknown;action:unknown},actor:string) {
  if(!input||typeof input!=='object'||typeof input.sourceKey!=='string'||input.sourceKey.length>500||typeof input.hash!=='string'||!Number.isSafeInteger(input.revision)||!['keep','apply'].includes(String(input.action)))throw new ApiError(400,'invalid_ledger_review');
  const link=await db.first<Link>(`SELECT * FROM business_ledger_links WHERE source_key=?`,[input.sourceKey]);
  if(!link||link.source_hash!==input.hash||!link.pending_json)throw new ApiError(409,'ledger_review_changed','台帳の内容が更新されました。再読み込みしてください。');
  const record=await db.first<Stored>(`SELECT payload,revision FROM business_records WHERE key=?`,[link.record_key]);
  if(!record||record.revision!==input.revision)throw new ApiError(409,'conflict','案件が更新されました。再読み込みしてください。');
  const current=JSON.parse(record.payload),proposed=JSON.parse(link.pending_json),merged={...current};
  const fields=JSON.parse(link.conflicts_json) as string[];
  if(input.action==='apply')for(const field of fields)if(field!=='id')merged[field]=proposed[field];
  const kind=link.record_key.startsWith('booking:')?'booking':'master',payload=JSON.stringify(schema(kind).parse(merged)),auditId=crypto.randomUUID(),at=new Date().toISOString();
  const guard=`EXISTS(SELECT 1 FROM business_ledger_links WHERE source_key=? AND source_hash=? AND pending_json IS NOT NULL)`;
  await db.batch([
    {sql:`UPDATE business_records SET payload=?,revision=revision+1,updated_at=?,updated_by=? WHERE key=? AND revision=? AND ${guard}`,params:[payload,at,actor,link.record_key,input.revision,input.sourceKey,input.hash]},
    {sql:`INSERT INTO business_audit SELECT ?,?,?,?,?,?,? WHERE changes()>0`,params:[auditId,link.record_key,input.action==='apply'?'台帳の確認値を反映':'手入力を保持',record.payload,payload,at,actor]},
    {sql:`UPDATE business_ledger_links SET conflicts_json='[]',pending_json=NULL WHERE source_key=? AND source_hash=? AND EXISTS(SELECT 1 FROM business_audit WHERE id=?)`,params:[input.sourceKey,input.hash,auditId]},
  ]);
  if(!await db.first(`SELECT id FROM business_audit WHERE id=?`,[auditId]))throw new ApiError(409,'conflict','案件または台帳が更新されました。再読み込みしてください。');
  return {ok:true};
}
