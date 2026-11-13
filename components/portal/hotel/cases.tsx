"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, ClipboardList, Plus, Search, Users } from "lucide-react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Loading, Notice } from "../ui";
import { StatusBadge, caseTitle } from "../case-common";

interface Row { id: string; publicRef: string; partnerRef: string | null; kind: "experience" | "free"; experienceTitle: string; experienceTitleEn: string; preferredDate: string | null; guests: number | null; customerName: string; status: string; assignee: string | null; updatedAt: string; quoteVersion: number | null; totalJpy: number | null }
interface Data { rows: Row[]; manager: boolean; total: number }
const PAGE_SIZE = 20;

export function HotelCases() {
  const { hotel, lang } = usePortal();
  const K = t().cases, C = t().common, en = lang === "en";
  const [loaded, setLoaded] = useState<{ key: string; data: Data } | null>(null);
  const [err, setErr] = useState<{ key: string; text: string } | null>(null);
  const [all, setAll] = useState(false), [search, setSearch] = useState(""), [query, setQuery] = useState(""), [page, setPage] = useState(0), [retry, setRetry] = useState(0);
  const key = `${hotel?.id}|${all}|${query}|${page}|${retry}`;
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    api<Data>("GET", `hotel/cases?hotel=${hotel.id}${all ? "" : "&open=1"}&q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      .then((data) => { if (live) setLoaded({ key, data }); })
      .catch((e) => { if (live) setErr({ key, text: (e as { status?: number }).status === 403 ? K.noAccess : errorText(e) }); });
    return () => { live = false; };
  }, [hotel, all, query, page, key, K.noAccess]);
  const data = loaded?.key === key ? loaded.data : null;
  return <>
    <div className="pt-list-heading"><p className="pt-page-description">{en ? "Track booking requests, quotes and messages in one place." : "空き確認から見積もり・予約確定まで、案件ごとに進捗を確認できます。"}</p><Link className="pt-btn pt-btn-primary" href="/hotel/cases/new/"><Plus size={17} aria-hidden="true"/>{K.newCase}</Link></div>
    <div className="pt-case-toolbar"><div className="pt-segments"><button type="button" aria-pressed={!all} className={!all ? "on" : ""} onClick={() => { setAll(false); setPage(0); }}>{K.openOnly}</button><button type="button" aria-pressed={all} className={all ? "on" : ""} onClick={() => { setAll(true); setPage(0); }}>{en ? "All requests" : "すべての案件"}</button></div>
      <form className="pt-case-search" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); setPage(0); }}><label className="pt-search"><Search size={17} aria-hidden="true"/><input type="search" value={search} maxLength={60} onChange={(e) => setSearch(e.target.value)} aria-label={en ? "Customer name or reference" : "お客様名・管理番号で検索"} placeholder={en ? "Customer name or reference" : "お客様名・管理番号で検索"}/></label><Button type="submit" kind="secondary">{C.search}</Button>{query && <Button kind="link" onClick={() => { setQuery(""); setSearch(""); setPage(0); }}>{C.clear}</Button>}</form>
    </div>
    {err?.key === key ? <><Notice tone="bad">{err.text}</Notice><Button kind="secondary" onClick={() => setRetry((v) => v + 1)}>{en ? "Try again" : "再読み込み"}</Button></> : !data ? <Loading/> : <>
      <div className="pt-result-count"><span role="status">{C.items(data.total)}</span><span>{data.manager ? K.managerNote : K.agentNote}</span></div>
      {data.rows.length === 0 ? <div className="pt-card pt-empty-state"><ClipboardList size={30}/><h2>{query ? (en ? "No matching requests" : "条件に合う案件がありません") : all ? K.emptyAll : K.emptyOpen}</h2><p>{query ? (en ? "Try a different name or reference." : "お客様名や管理番号を変えてお試しください。") : K.intro}</p>{!query && <Link className="pt-btn pt-btn-primary" href="/hotel/cases/new/">{K.newCase}</Link>}</div> : <div className="pt-case-list">{data.rows.map((r) => <article className="pt-case-row" key={r.id}>
        <div className="pt-case-top"><span className="pt-case-reference">{r.publicRef}{r.partnerRef && <small> / {r.partnerRef}</small>}</span><StatusBadge status={r.status}/></div>
        <div className="pt-case-body"><div><h2><Link href={`/hotel/cases/${r.id}/`}>{caseTitle(r)}</Link></h2><p>{r.customerName}</p><div className="pt-case-facts"><span><CalendarDays size={14} aria-hidden="true"/>{r.preferredDate ?? C.undecided}</span><span><Users size={14} aria-hidden="true"/>{r.guests ?? "—"}</span></div></div><div className="pt-case-amount"><span>{en ? "Quote · incl. tax" : "見積もり（税込）"}</span><strong>{r.quoteVersion ? yen(r.totalJpy) : en ? "In preparation" : "準備中"}</strong>{r.quoteVersion && <small>{K.version(r.quoteVersion)}</small>}</div><Link className="pt-btn pt-btn-secondary" href={`/hotel/cases/${r.id}/`}>{C.detail}<ArrowRight size={16}/></Link></div>
        <div className="pt-case-next">{(K.next as Record<string, string>)[r.status]}</div><div className="pt-case-footer"><span>{en ? "Assigned to" : "担当"}: {r.assignee ?? "—"}</span><span>{C.updated}: {jst(r.updatedAt)}</span></div>
      </article>)}</div>}
      {data.total > PAGE_SIZE && <div className="pt-pagination"><span>{data.total ? `${page * PAGE_SIZE + 1}–${page * PAGE_SIZE + data.rows.length} / ${data.total}` : "0"}</span><Button kind="secondary" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>{en ? "Previous" : "前へ"}</Button><Button kind="secondary" disabled={(page + 1) * PAGE_SIZE >= data.total} onClick={() => setPage((v) => v + 1)}>{en ? "Next" : "次へ"}</Button></div>}
    </>}
  </>;
}
