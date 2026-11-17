'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, errorText, jst } from '../client';
import { Button, Card, Field, Loading, Notice } from '../ui';
import { usePortal } from '../shell';
import { yen } from '@/lib/business/model';
import { LEDGER_SCOPE } from '@/lib/business/ledger-contract';

type Payload={id:string;name?:string;[key:string]:unknown};
type Conflict={sourceKey:string;hash:string;recordKey:string;revision:number;fields:string[];current:Payload;proposed:Payload};
type Review={id:string;bookingId:string;title:string;question:string;evidence:string;updatedAt:string};
type State={sheetId:string;enabled:boolean;googleConfigured:boolean;lastAttemptAt?:string;lastSuccessAt?:string;lastError?:string;imported?:number;updated?:number;preserved?:number;conflictRecords:Conflict[];reviews?:Review[]};
const useLedger=()=>{
  const [state,setState]=useState<State|null>(null),[error,setError]=useState('');
  const load=useCallback(async()=>{try{setState(await api<State>('GET','ops/business/ledger-state'));setError('');}catch(e){setError(errorText(e));}},[]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- load is an asynchronous API fetch; state updates follow the response
  useEffect(()=>{void load()},[load]);
  return {state,error,setError,load};
};
export function LedgerSettings(){
  const {me}=usePortal();
  return me.roles?.includes('ops_admin')?<Settings/>:null;
}
function Settings(){
  const {state,error,setError,load}=useLedger();
  const [sheet,setSheet]=useState(''),[enabled,setEnabled]=useState(false),[edited,setEdited]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const save=async(sync:boolean)=>{setBusy(true);setError('');setMessage('');try{
    await api('POST','ops/settings',{values:{business_ledger_sheet_id:edited?sheet:state?.sheetId??'',business_ledger_sync:(edited?enabled:state?.enabled)?'true':'false'}});
    if(sync){const r=await api<{busy?:boolean;skipped?:boolean;imported?:number;updated?:number;preserved?:number}>('POST','ops/business/ledger-sync',{});setMessage(r.busy?'同期はすでに実行中です。':r.skipped?'同期を有効にして台帳を指定してください。':`同期しました。追加 ${r.imported??0} 件、更新 ${r.updated??0} 件、登録済み ${r.preserved??0} 件。`);}else setMessage('連携設定を保存しました。');
    setEdited(false);await load();
  }catch(e){await load();setError(errorText(e));}finally{setBusy(false)}};
  return <Card title="原価台帳との連携">
    <p>メール・Slackで確認した案件と卸値を、非公開の顧客対応台帳から取り込みます。有効にすると約5分ごとに同期します。</p>
    {error&&<Notice tone="bad">{error}</Notice>}{message&&<Notice tone="ok">{message}</Notice>}
    {!state?<Loading/>:<>
      <div className="pt-form ops-settings-form">
        <Field label="顧客対応台帳のURL" hint="連携するGoogleアカウントから閲覧できる、非公開の台帳を指定してください。"><input type="text" value={edited?sheet:state.sheetId?`https://docs.google.com/spreadsheets/d/${state.sheetId}/edit`:''} onChange={e=>{if(!edited)setEnabled(state.enabled);setEdited(true);setSheet(e.target.value)}} placeholder="https://docs.google.com/spreadsheets/d/…/edit"/></Field>
        <label className="pt-row"><input type="checkbox" checked={edited?enabled:state.enabled} onChange={e=>{if(!edited)setSheet(state.sheetId);setEdited(true);setEnabled(e.target.checked)}}/> 原価台帳の自動同期を有効にする</label>
        <div className="pt-row pt-form-full"><Button disabled={busy} onClick={()=>void save(false)}>連携設定を保存</Button><Button disabled={busy||!state.googleConfigured} onClick={()=>void save(true)}>{busy?'確認中…':'保存して今すぐ同期'}</Button></div>
      </div>
      <p className="pt-small">最終同期：{state.lastSuccessAt?jst(state.lastSuccessAt):'未実行'}{state.lastError?` ／ ${state.lastError}`:''}</p>
      <Notice>管理画面で編集した金額は保護します。台帳と食い違う項目は「案件・原価管理」の確認待ちに表示され、選択して反映できます。</Notice>
      <details><summary>Google連携の読み取り権限を確認する</summary><p>Google CloudでGoogle Sheets APIを有効にし、既存の広告・検索の権限に次の読み取り権限を追加して再認可してください。台帳を一般公開する必要はありません。</p><code className="pt-small">{LEDGER_SCOPE}</code><p>再認可では既存の adwords・webmasters.readonly・analytics.readonly も残し、更新したRefresh tokenを既存のGoogle連携に設定してください。</p></details>
    </>}
  </Card>;
}
const fieldLabels:Record<string,string>={costs:'原価内訳',received:'売上',sales:'販売価格',fee:'決済手数料',paymentDate:'入金日',date:'実施日',people:'人数',status:'予約状況',note:'メモ',complete:'原価確認',price:'卸単価',supplier:'提供元',source:'根拠',autoCost:'自動入力の条件',stripeSource:'決済の照合先',requestId:'申込の照合先',externalRef:'予約番号',reservationId:'予約の照合先',name:'名称',product:'体験名'};
function valueText(value:unknown,field:string):string{
  if(value===undefined||value===null||value==='')return '未確認';
  if(field==='costs'&&Array.isArray(value))return value.map((c:{label:string;unit:number|null;qty:number;status:string})=>`${c.label}：${c.unit===null?'未確認':yen(c.unit*c.qty)}${c.status==='confirmed'?'':'（未確定）'}`).join('\n')||'原価なし';
  if(['received','sales','fee','price'].includes(field)&&typeof value==='number')return yen(value);
  if(typeof value==='boolean')return value?'確認済み':'確認が必要';
  return typeof value==='object'?JSON.stringify(value):String(value);
}
export function LedgerReviewPanel({onUpdated}:{onUpdated:()=>Promise<void>}){
  const {state,error,setError,load}=useLedger();const [busy,setBusy]=useState('');
  const decide=async(c:Conflict,action:'keep'|'apply')=>{setBusy(c.sourceKey);setError('');try{await api('POST','ops/business/ledger-review',{sourceKey:c.sourceKey,hash:c.hash,revision:c.revision,action});await onUpdated();await load();}catch(e){setError(errorText(e));}finally{setBusy('')}};
  if(!state?.conflictRecords.length&&!state?.reviews?.length)return error?<div className="notice error">{error}</div>:null;
  return <section className="panel ledger-review-panel"><div className="panel-head"><div><h2>原価連携の確認待ち</h2><p>手入力との違いと、原典の確認が必要な費用です。</p></div></div>{error&&<div className="notice error">{error}</div>}
    {state.conflictRecords.map(c=><details key={c.sourceKey}><summary>{c.current.name??c.current.id}：{c.fields.map(f=>fieldLabels[f]??f).join('・')}</summary><div className="table-scroll"><table><thead><tr><th>項目</th><th>現在の入力</th><th>台帳の確認値</th></tr></thead><tbody>{c.fields.map(f=><tr key={f}><th>{fieldLabels[f]??f}</th><td style={{whiteSpace:'pre-wrap'}}>{valueText(c.current[f],f)}</td><td style={{whiteSpace:'pre-wrap'}}>{valueText(c.proposed[f],f)}</td></tr>)}</tbody></table></div><div className="pt-row"><button className="secondary" disabled={!!busy} onClick={()=>void decide(c,'keep')}>現在の入力を保持</button><button className="primary" disabled={!!busy} onClick={()=>void decide(c,'apply')}>台帳の確認値を反映</button></div></details>)}
    {state.reviews?.map(r=><div className="ledger-source-review" key={r.id}><strong>{r.title}</strong><p>{r.question}</p>{/^https:\/\//.test(r.evidence)&&<a href={r.evidence} target="_blank" rel="noreferrer">根拠を確認 ↗</a>}</div>)}
    {state.sheetId&&<p><a href={`https://docs.google.com/spreadsheets/d/${state.sheetId}/edit`} target="_blank" rel="noreferrer">原価連携台帳を開く ↗</a></p>}
  </section>;
}
