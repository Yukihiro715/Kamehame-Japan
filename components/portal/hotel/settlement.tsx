"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, yen } from "../client";
import { usePortal } from "../shell";
import { Badge, Button, Card, Field, Loading, Notice, Stat, Table } from "../ui";
import { periodLabel } from "../statement-sheet";
interface Quarter {period:string;status:"paid"|"scheduled"|"accruing"|"carried"|"disputed";gross:number;transfer:number|null;carried:number;payDate:string|null;paidAt:string|null;statementId:string|null}
interface Data { quarters:Quarter[]; profile:{id:string;name:string;bank_details_masked:string|null;payee_name?:string|null;min_payout_jpy:number}|null;billing:boolean }
const EMPTY_BANK = {bank:"",branch:"",type:"ordinary",number:"",holder:""};
export function HotelSettlement() {
  const { hotel, me, lang } = usePortal(), en = lang === "en";
  const [data,setData] = useState<Data|null>(null), [err,setErr] = useState<string|null>(null), [msg,setMsg] = useState<string|null>(null);
  const [edit,setEdit] = useState(false), [busy,setBusy] = useState(false), [bank,setBank] = useState(EMPTY_BANK);
  const load = useCallback(() => hotel ? api<Data>("GET",`hotel/settlement?hotel=${hotel.id}`).then(d=>{setData(d);setErr(null);}).catch(e=>setErr(errorText(e))) : Promise.resolve(),[hotel]);
  useEffect(() => { void load(); },[load]);
  const save = async () => {
    if (!data?.profile || busy) return;
    setBusy(true);setErr(null);setMsg(null);
    try { await api("POST","hotel/bank",{profileId:data.profile.id,...bank}); setBank(EMPTY_BANK);setEdit(false);await load();setMsg(en ? "Payment destination saved." : "支払い先を更新しました。"); }
    catch(e) { setErr(errorText(e)); } finally {setBusy(false);}
  };
  if (!data) return err ? <Notice tone="bad">{err}</Notice> : <Loading/>;
  const statuses = {paid:en?"Paid":"支払い済み",scheduled:en?"Scheduled":"支払い予定",accruing:en?"Accruing (estimate)":"集計中（概算）",carried:en?"Carried forward":"次期へ繰越",disputed:en?"Under review":"確認中"};
  const paid = data.quarters.filter(r=>r.status==="paid").reduce((n,r)=>n+(r.transfer??0),0), scheduled = data.quarters.filter(r=>r.status==="scheduled").reduce((n,r)=>n+(r.transfer??0),0);
  return <>
    {err && <Notice tone="bad">{err}</Notice>}{msg && <Notice tone="ok">{msg}</Notice>}
    <Card title={en?"Commission payments":"紹介料のお支払い"}>
      <div className="pt-grid"><Stat label={en?"Total transferred":"支払い済み合計（振込額）"} value={yen(paid)} note={en?"All quarters · after transfer fees":"全四半期の合計・振込手数料控除後"}/><Stat label={en?"Scheduled transfers":"支払い予定合計（確定分）"} value={yen(scheduled)} note={en?"Issued statements only":"発行済み精算書の振込予定額"}/></div>
      <p className="pt-note-box">{en ? "Payments are grouped by calendar quarter and scheduled for the following month-end. Accruing rows show completed experiences not yet on an issued statement; the transfer amount is not final. Below the minimum, the balance carries forward." : "1〜3月・4〜6月・7〜9月・10〜12月ごとに精算し、翌月末に振り込みます。「集計中」は実施確認済みで精算書の発行前の紹介料です。振込額は未確定で、最低振込額に満たない場合は次期へ繰り越します。"} {en?"Minimum transfer: ":"最低振込額："}{yen(data.profile?.min_payout_jpy??3000)}</p>
    </Card>
    <Card title={en?"Quarterly payment history & schedule":"四半期別のお支払い予定・履歴"}>
      <Table head={en?["Quarter","Status","Commission incl. tax","Transfer","Carry forward","Scheduled date","Paid date","Statement"]:["対象四半期","状態","紹介料（税込）","振込額","次期繰越","支払い予定日","支払い日","明細"]} rows={data.quarters.map(r=>[periodLabel(r.period),<Badge key="s" tone={r.status==="paid"?"ok":r.status==="disputed"?"bad":"warn"}>{statuses[r.status]}</Badge>,yen(r.gross),r.transfer===null?(en?"Not final":"未確定"):yen(r.transfer),yen(r.carried),r.payDate??"—",r.paidAt??"—",r.statementId?<a key="link" href={`/hotel/settlement/${r.statementId}/`}>{en?"View":"精算書"}</a>:me.demo?(en?"Sample":"サンプル"):"—"])} empty={en?"No commission payments yet.":"紹介料のお支払い実績はまだありません。"} compact/>
      <p className="pt-small pt-muted">{en?"Accruals cover this site; issued statements may combine sites sharing the same payment destination. Transfer amounts include carry-over and deduct bank fees. A past estimated date is subject to settlement processing.":"集計中の行はこの拠点の実績です。精算書は同じ支払い先の複数拠点をまとめる場合があります。振込額は前期繰越・振込手数料を反映した金額です。予定日を過ぎた集計中の金額は精算処理後に確定します。"}</p>
    </Card>
    <Card title={en?"Payment destination":"精算・支払い先"}>
      {data.profile?<><dl className="pt-kv"><dt>{en?"Payment group":"精算設定"}</dt><dd>{data.profile.name}</dd><dt>{en?"Bank account":"振込先口座"}</dt><dd>{data.profile.bank_details_masked??(en?"Not registered":"未登録")}</dd><dt>{en?"Account holder":"口座名義"}</dt><dd>{data.profile.payee_name??"—"}</dd></dl>
      {(data.billing||me.demo)&&!edit&&<Button kind="secondary" onClick={()=>{setEdit(true);setMsg(null);}}>{en?"Edit payment destination":"支払い先を変更"}</Button>}
      {edit&&<form onSubmit={e=>{e.preventDefault();void save();}}><p className="pt-note-box">{en?"Enter the complete replacement account. Existing account numbers are masked for privacy. This updates the shared payment destination for the whole payment group.":"変更後の口座情報を入力してください。登録済み口座番号の全桁は表示しません。同じ精算設定を使う全拠点の支払い先が変更されます。"}</p>
        {me.demo&&<Notice tone="info">{en?"Sample form. Changes cannot be saved in the demo.":"入力画面のサンプルです。デモでは保存できません。"}</Notice>}
        <div className="pt-form">{([["bank",en?"Bank":"銀行名"],["branch",en?"Branch":"支店名"],["holder",en?"Account holder":"口座名義（カナ）"]] as const).map(([key,label])=><Field key={key} label={label}><input required maxLength={key==="holder"?120:100} value={bank[key]} onChange={e=>setBank({...bank,[key]:e.target.value})}/></Field>)}
        <Field label={en?"Account type":"口座種別"}><select value={bank.type} onChange={e=>setBank({...bank,type:e.target.value})}><option value="ordinary">{en?"Ordinary":"普通"}</option><option value="current">{en?"Current":"当座"}</option></select></Field>
        <Field label={en?"Account number (7 digits)":"口座番号（7桁）"}><input inputMode="numeric" autoComplete="off" required pattern="[0-9]{7}" maxLength={7} value={bank.number} onChange={e=>setBank({...bank,number:e.target.value})}/></Field></div>
        <div className="pt-row"><Button type="submit" disabled={busy||me.demo}>{en?"Save changes":"変更を保存"}</Button><Button kind="link" onClick={()=>{setEdit(false);setBank(EMPTY_BANK);}}>{en?"Cancel":"キャンセル"}</Button></div></form>}
      {!data.billing&&!me.demo&&<p className="pt-small pt-muted">{en?"Only billing contacts for all sites in this payment group can edit the account.":"支払い先は、この精算設定に含まれる全拠点の請求担当者が変更できます。"}</p>}</>:<p>{en?"Contact the operator to create a payment group.":"支払い先の精算設定が未作成です。運営に作成をご依頼ください。"}</p>}
    </Card>
  </>;
}
