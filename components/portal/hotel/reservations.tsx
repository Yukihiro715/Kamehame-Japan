"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, SlidersHorizontal } from "lucide-react";
import type { HotelReservationRow as Row, ReservationList, ReservationSort } from "@/lib/portal/metrics";
import { api, errorText, jst, pct, yen } from "../client";
import { label, t } from "../i18n";
import { InfoHelp, PortalDialog, TermLabel, helpText, type HelpTerm } from "../help";
import { usePortal } from "../shell";
import { Badge, Button, Card, Loading, Notice } from "../ui";

const tone = (s: string | null) => s === "confirmed" || s === "adjusted" || s === "completed" ? "ok" : s === "pending" || s === "arranging" ? "warn" : s === "voided" || s === "cancelled" || s === "no_show" ? "bad" : "neutral";
const EMPTY = { q: "", from: "", to: "", experienceFrom: "", experienceTo: "", status: "", ref: "", experience: "" };
type Filters = typeof EMPTY;
const SORTS: ReservationSort[] = ["created", "date", "amount", "rate", "commission", "status", "entry"];
const query = () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
const initialFilters = () => Object.fromEntries(Object.keys(EMPTY).map(k => [k, query().get(k) ?? ""])) as Filters;

export function HotelReservations() {
  const { hotel, lang } = usePortal(), en = lang === "en";
  const R = t().reservations, S = t().status, C = t().common;
  const [f, setF] = useState(initialFilters), [applied, setApplied] = useState(initialFilters);
  const [sort, setSort] = useState<ReservationSort>(() => SORTS.includes(query().get("sort") as ReservationSort) ? query().get("sort") as ReservationSort : "created");
  const [direction, setDirection] = useState<"asc" | "desc">(() => query().get("direction") === "asc" ? "asc" : "desc");
  const [page, setPage] = useState(0), [retry, setRetry] = useState(0), [filtersOpen, setFiltersOpen] = useState(false), [selected, setSelected] = useState<Row | null>(null);
  const [loaded, setLoaded] = useState<{ key: string; value: ReservationList } | null>(null), [err, setErr] = useState<{ key: string; text: string } | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const key = `${hotel?.id ?? ""}|${JSON.stringify(applied)}|${sort}|${direction}|${page}|${retry}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    const qs = new URLSearchParams(Object.entries(applied).filter(([,v]) => v));
    qs.set("hotel",hotel.id); qs.set("limit","25"); qs.set("offset",String(page*25)); qs.set("sort",sort); qs.set("direction",direction);
    api<ReservationList>("GET",`hotel/reservations?${qs}`).then(value => { if(live) { if(page>0 && value.total<=page*25) setPage(Math.max(0,Math.ceil(value.total/25)-1)); setLoaded({key,value}); setErr(null); } }).catch(e => { if(live) setErr({key,text:errorText(e)}); });
    return () => { live = false; };
  }, [hotel, applied, sort, direction, key, page]);
  const data = loaded?.key === key ? loaded.value : null;
  const syncUrl = (filters: Filters, sortBy = sort, order = direction) => {
    const qs = new URLSearchParams(Object.entries(filters).filter(([,v]) => v));
    qs.set("sort",sortBy); qs.set("direction",order);
    window.history.replaceState(window.history.state,"",`${window.location.pathname}?${qs}`);
  };
  const apply = (filters: Filters) => {
    if ((filters.from && filters.to && filters.from > filters.to) || (filters.experienceFrom && filters.experienceTo && filters.experienceFrom > filters.experienceTo)) { setValidation(en ? "The end date must be on or after the start date." : "終了日は開始日以降を指定してください。"); setFiltersOpen(true); return; }
    setValidation(null); setApplied({...filters}); setPage(0); syncUrl(filters);
  };
  const changeSort = (next: ReservationSort, order: "asc" | "desc" = next === sort && direction === "desc" ? "asc" : "desc") => { setSort(next); setDirection(order); setPage(0); syncUrl(applied,next,order); };
  const sortNames: Record<ReservationSort,string> = { created: en?"Booking date":"予約日", date: en?"Experience date":"体験日", amount: en?"Booking amount":"予約金額", rate: en?"Rate":"料率", commission: en?"Commission":"紹介料", status: en?"Booking status":"予約状況", entry: en?"Settlement status":"精算状態" };
  const amountLabel = en?"Booking amount (tax incl.)":"予約金額（税込）";
  const filterCount = Object.values(applied).filter(Boolean).length;
  const activeLabels = [applied.q && `${en?"Search":"検索"}: ${applied.q}`, applied.status && label(S.reservation,applied.status), (applied.from||applied.to) && `${en?"Booked":"予約日"}: ${applied.from||"…"} – ${applied.to||"…"}`, (applied.experienceFrom||applied.experienceTo) && `${en?"Experience":"体験日"}: ${applied.experienceFrom||"…"} – ${applied.experienceTo||"…"}`, applied.ref, applied.experience].filter(Boolean);
  const header = (name: string, sortBy?: ReservationSort, term?: HelpTerm, numeric = false) => <th scope="col" className={numeric?"num":undefined} aria-sort={sortBy && sort===sortBy ? direction==="asc"?"ascending":"descending" : sortBy?"none":undefined}><span className="pt-list-heading-cell">{sortBy?<button type="button" className="pt-sort-button" onClick={()=>changeSort(sortBy)}>{name}{sort===sortBy?(direction==="asc"?<ArrowUp size={14}/>:<ArrowDown size={14}/>):<ArrowUpDown size={14}/>}</button>:name}{term&&<InfoHelp label={name}><p>{helpText(term,en)}</p></InfoHelp>}</span></th>;
  return <Card className="pt-reservations-card">
    <form onSubmit={e=>{e.preventDefault();apply(f);}} className="pt-list-filters">
      <div className="pt-list-toolbar">
        <label className="pt-list-search"><Search size={17} aria-hidden="true"/><input type="search" aria-label={en?"Search experience or reference":"体験名・予約番号で検索"} placeholder={en?"Experience or reference":"体験名・予約番号で検索"} maxLength={100} value={f.q} onChange={e=>setF({...f,q:e.target.value})}/></label>
        <select aria-label={R.status} value={f.status} onChange={e=>{const next={...f,status:e.target.value};setF(next);apply(next);}}><option value="">{en?"All statuses":"すべての予約状況"}</option>{Object.entries(S.reservation).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
        <Button type="submit" small>{C.search}</Button>
        <button type="button" className="pt-btn pt-btn-secondary pt-btn-small" aria-expanded={filtersOpen} aria-controls="reservation-date-filters" onClick={()=>setFiltersOpen(v=>!v)}><SlidersHorizontal size={15}/>{en?"Dates & filters":"期間・絞り込み"}{filterCount>0&&<span className="pt-filter-count">{filterCount}</span>}</button>
      </div>
      {filtersOpen&&<div id="reservation-date-filters" className="pt-list-date-filters">{([['from','to',en?'Booking date':'予約日'],['experienceFrom','experienceTo',en?'Experience date':'体験日']] as const).map(([from,to,name])=><fieldset key={from}><legend>{name}</legend><div><label><span className="pt-visually-hidden">{en?`${name} from`:`${name}（から）`}</span><input type="date" value={f[from]} onChange={e=>setF({...f,[from]:e.target.value})}/></label><span aria-hidden="true">–</span><label><span className="pt-visually-hidden">{en?`${name} to`:`${name}（まで）`}</span><input type="date" value={f[to]} onChange={e=>setF({...f,[to]:e.target.value})}/></label></div></fieldset>)}<Button type="submit" small>{en?"Apply dates":"期間を適用"}</Button></div>}
      {validation&&<Notice tone="bad">{validation}</Notice>}
    </form>
    {activeLabels.length>0&&<div className="pt-list-active-filters">{activeLabels.map((v,i)=><span key={i}>{v}</span>)}<Button kind="link" small onClick={()=>{setF(EMPTY);apply(EMPTY);}}>{C.clear}</Button></div>}
    {err?.key===key?<><Notice tone="bad">{err.text}</Notice><Button kind="secondary" onClick={()=>setRetry(v=>v+1)}>{C.retry}</Button></>:!data?<Loading/>:<>
      <div className="pt-list-summary" aria-live="polite"><strong>{C.items(data.total)}</strong><span><TermLabel label={en?"Commission total (tax excl.)":"紹介料合計（税抜）"} term="commissionTotal" en={en}/><b>{yen(data.summary.estimatedNet+data.summary.pendingNet+data.summary.confirmedNet)}</b></span><small>{en?"Estimates":"見込み"} {yen(data.summary.estimatedNet)} · {en?"Pending":"確認待ち"} {yen(data.summary.pendingNet)} · {en?"Confirmed":"確定"} {yen(data.summary.confirmedNet)}</small></div>
      <div className="pt-list-meta"><span>{en?"Totals cover all matching bookings, across all pages.":"合計は絞り込み結果の全件が対象です。"}{data.summary.unknownCount>0&&` ${en?"Commission not calculated":"紹介料未計算"}: ${data.summary.unknownCount}${en?" bookings":"件"}`}</span><label>{en?"Sort":"並べ替え"}<select value={`${sort}:${direction}`} onChange={e=>{const [next,order]=e.target.value.split(':');changeSort(next as ReservationSort,order as "asc"|"desc");}}>{SORTS.flatMap(k=>["desc","asc"].map(order=><option key={`${k}:${order}`} value={`${k}:${order}`}>{sortNames[k]} · {order==="desc"?(en?"descending":"降順"):(en?"ascending":"昇順")}</option>))}</select></label></div>
      <p className="pt-small pt-muted pt-table-instruction">{en?"Select a row for details. Swipe horizontally for more columns.":"行をタップすると詳細が開きます。左右にスクロールして各項目を確認できます。"}</p>
      <div className="pt-reservation-grid" role="region" aria-label={R.title} tabIndex={0}>
        <table className="pt-table pt-reservation-sheet"><caption className="pt-visually-hidden">{R.title}</caption><thead><tr>{header(en?"Experience":"体験")}{header(en?"Experience date":"体験日","date")}{header(en?"Reference":"予約番号")}{header(R.head[5],"status","bookingStatus")}{header(amountLabel,"amount","bookingAmount",true)}{header(R.head[8],"rate","rate",true)}{header(R.head[9],"commission","commission",true)}{header(R.head[11],"entry","entry")}</tr></thead>
          <tbody>{data.rows.map(r=><tr key={r.hotelRef} onClick={e=>{if((e.target as HTMLElement).closest('button,a')||window.getSelection()?.toString())return;setSelected(r);}}><th scope="row"><button type="button" className="pt-reservation-name" aria-label={`${en?"View booking":"予約詳細"} ${r.hotelRef}: ${r.experience}`} aria-haspopup="dialog" onClick={()=>setSelected(r)}><span>{r.experience}</span><small>{en?"Details":"詳細を表示"}</small></button></th><td>{r.experienceDate??C.undecided}</td><td><code>{r.hotelRef}</code></td><td><Badge tone={tone(r.status)}>{label(S.reservation,r.status)}</Badge></td><td className="num">{yen(r.bookingGross)}</td><td className="num">{pct(r.rateBp)}</td><td className="num pt-commission-cell">{yen(r.commissionNet)}</td><td><Badge tone={tone(r.entryStatus)}>{label(S.entry,r.entryStatus)}</Badge>{r.holdCodes.length>0&&<small className="pt-row-hold">{en?"Review needed":"要確認"}</small>}</td></tr>)}{data.rows.length===0&&<tr><td colSpan={8} className="pt-empty">{C.empty}{filterCount>0&&<div><Button kind="link" onClick={()=>{setF(EMPTY);apply(EMPTY);}}>{C.clear}</Button></div>}</td></tr>}</tbody>
        </table>
      </div>
      <div className="pt-list-footer"><span className="pt-small pt-muted">{en?"Guest personal information is not shown.":"お客様の個人情報は表示しません。"}</span>{data.total>25&&<div className="pt-pagination"><span>{page*25+1}–{page*25+data.rows.length} / {data.total}</span><Button kind="secondary" small disabled={page===0} onClick={()=>setPage(v=>v-1)}>{en?"Previous":"前へ"}</Button><Button kind="secondary" small disabled={(page+1)*25>=data.total} onClick={()=>setPage(v=>v+1)}>{en?"Next":"次へ"}</Button></div>}</div>
    </>}
    {selected&&<PortalDialog title={`${en?"Booking details":"予約詳細"} · ${selected.hotelRef}`} className="pt-record-dialog" onClose={()=>setSelected(null)}><h3 className="pt-record-experience">{selected.experience}</h3><dl className="pt-record-fields">{[
      [R.head[1],jst(selected.createdAt,false)], [R.head[3],selected.experienceDate??C.undecided], [R.head[4],selected.guests??"—"], [R.head[5],<Badge key="status" tone={tone(selected.status)}>{label(S.reservation,selected.status)}</Badge>,"bookingStatus"], [R.head[6],label(S.payment,selected.paymentStatus),"payment"], [amountLabel,yen(selected.bookingGross),"bookingAmount"], [R.head[7],yen(selected.baseNet),"base"], [R.head[8],pct(selected.rateBp),"rate"], [R.head[9],yen(selected.commissionNet),"commission"], [R.head[10],yen(selected.commissionGrossRef),"tax"], [R.head[11],label(S.entry,selected.entryStatus),"entry"], [en?"Performed on":"実施確認日",selected.performedOn??"—"],
    ].map(([name,value,term],i)=><div key={i}><dt>{term?<TermLabel label={String(name)} term={term as HelpTerm} en={en}/>:name}</dt><dd>{value}</dd></div>)}</dl>{selected.holdCodes.length>0&&<p className="pt-record-note">{selected.holdCodes.map(h=>label(S.hold,h)).join(' / ')}</p>}<p className="pt-record-note">{R.note}</p></PortalDialog>}
  </Card>;
}
