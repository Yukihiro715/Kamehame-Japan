"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Clock3, Search } from "lucide-react";
import { api, errorText, pct, yen } from "../client";
import { label, t } from "../i18n";
import { TermLabel } from "../help";
import { usePortal } from "../shell";
import { partnerAccess } from "../partner-access";
import { Badge, Button, CopyLink, Loading, Notice } from "../ui";

interface Term { bookingMode: "instant" | "request" | "quote"; slug: string; title: string; titleEn: string; tagline: string; city: string; area: string; areaEn: string; duration: string; durationEn: string; group: string; groupEn: string; img: string; basePrice: string; priceUnit: "person" | "group"; priceNote?: string; referable: boolean; rateBp: number | null; referenceAvgJpy: number | null; referenceNote: string | null; commissionExampleNet: number | null; policyFrom: string | null }

export function HotelExperiences() {
  const { hotel, me, lang } = usePortal();
  const X = t().experiences, S = t().status, en = lang === "en", access = partnerAccess(hotel, me.memberships);
  const [rows, setRows] = useState<Term[] | null>(null), [err, setErr] = useState<string | null>(null), [relay, setRelay] = useState(false);
  const [search, setSearch] = useState(""), [city, setCity] = useState(""), [mode, setMode] = useState(""), [referable, setReferable] = useState(false);
  const [links, setLinks] = useState<Record<string, { qr: string; qrId: string; url: string }>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({}), [errors, setErrors] = useState<Record<string, string>>({}), [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    api<{ experiences: Term[]; relay: boolean }>("GET", `hotel/experiences?hotel=${hotel.id}`).then((d) => { if (live) { setRows(d.experiences); setRelay(d.relay); setErr(null); } }).catch((e) => { if (live) setErr(errorText(e)); });
    return () => { live = false; };
  }, [hotel, retry]);
  const getLink = async (slug: string) => {
    if (!hotel || pending[slug]) return;
    setPending((p) => ({ ...p, [slug]: true })); setErrors((p) => ({ ...p, [slug]: "" }));
    try {
      const r = await api<{ qr: { id: string; url: string }; url: { id: string; url: string } }>(me.demo ? "GET" : "POST", me.demo ? `hotel/demo-material?hotel=${hotel.id}&experience=${encodeURIComponent(slug)}` : "hotel/materials", me.demo ? undefined : { hotel: hotel.id, experience: slug });
      setLinks((l) => ({ ...l, [slug]: { qr: r.qr.url, qrId: r.qr.id, url: r.url.url } }));
    } catch (e) { setErrors((p) => ({ ...p, [slug]: errorText(e) })); }
    finally { setPending((p) => ({ ...p, [slug]: false })); }
  };
  if (err) return <><Notice tone="bad">{err}</Notice><Button kind="secondary" onClick={() => setRetry((v) => v + 1)}>{en ? "Try again" : "再読み込み"}</Button></>;
  if (!rows) return <Loading />;
  const areas = [...new Set(rows.map((x) => x.city))].sort();
  const query = search.trim().toLocaleLowerCase();
  const filtered = rows.filter((x) => (!query || [x.title, x.titleEn, x.area, x.areaEn, x.city].join(" ").toLocaleLowerCase().includes(query)) && (!city || x.city === city) && (!mode || x.bookingMode === mode) && (!referable || x.referable));
  const clear = () => { setSearch(""); setCity(""); setMode(""); setReferable(false); };
  return <>
    <p className="pt-page-description">{en ? "Find the right experience for your guests. Check the price and referral terms, then share or send a booking request." : "お客様に合う体験を探して、紹介・予約へ。料金と紹介条件をまとめて確認できます。"}</p>
    <div className="pt-catalog-tools">
      <label className="pt-search"><Search size={18} aria-hidden="true"/><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={en ? "Search experiences or areas" : "体験名・エリアで検索"} aria-label={en ? "Search experiences or areas" : "体験名・エリアで検索"}/></label>
      <select value={city} onChange={(e) => setCity(e.target.value)} aria-label={en ? "Area" : "エリア"}><option value="">{en ? "All areas" : "すべてのエリア"}</option>{areas.map((a) => <option key={a} value={a}>{en ? rows.find((x) => x.city === a)?.areaEn ?? a : rows.find((x) => x.city === a)?.area ?? a}</option>)}</select>
      <select value={mode} onChange={(e) => setMode(e.target.value)} aria-label={en ? "Booking type" : "予約方法"}><option value="">{en ? "All booking types" : "すべての予約方法"}</option>{Object.entries(S.bookingModeTag).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <label className="pt-check"><input type="checkbox" checked={referable} onChange={(e) => setReferable(e.target.checked)}/>{en ? "Commission available" : "紹介料対象のみ"}</label>
    </div>
    <div className="pt-result-count"><span role="status">{t().common.items(filtered.length)}</span>{(search || city || mode || referable) && <Button kind="link" small onClick={clear}>{t().common.clear}</Button>}</div>
    {filtered.length === 0 ? <div className="pt-card pt-empty-state"><Search size={28}/><h2>{en ? "No matching experiences" : "条件に合う体験がありません"}</h2><p>{en ? "Try another name, area or booking type." : "キーワードやエリア、予約方法を変えてお試しください。"}</p><Button kind="secondary" onClick={clear}>{t().common.clear}</Button></div> : <div className="pt-catalog-grid">{filtered.map((x) => <article className="pt-experience-card" key={x.slug}>
      <div className="pt-experience-image"><img src={x.img} alt="" loading="lazy"/><span><Badge tone={x.referable ? "ok" : "warn"}>{x.referable ? X.referable : X.notReferable}</Badge></span></div>
      <div className="pt-experience-body">
        <span className="pt-experience-area"><MapPin size={14} aria-hidden="true"/>{en ? x.areaEn : x.area}</span>
        <h2>{en ? x.titleEn : x.title}</h2>
        <p className="pt-experience-meta"><Clock3 size={14} aria-hidden="true"/>{en ? x.durationEn : x.duration}<span>·</span>{en ? x.groupEn : x.group}</p>
        <div className="pt-experience-price"><small>{X.basePrice}</small><strong>{x.basePrice}</strong><span>{x.priceUnit === "group" ? X.perGroup : X.perPerson}</span></div>
        <div className="pt-referral-terms"><div><TermLabel label={X.rate} term="rate" en={en}/><b>{x.referable ? pct(x.rateBp) : "—"}</b></div><div><span>{X.example}</span><b>{x.commissionExampleNet !== null ? yen(x.commissionExampleNet) : "—"}</b></div></div>
        <details className="pt-price-details"><summary>{en ? "Price and referral details" : "料金・紹介料の補足"}</summary>{x.priceNote && !en && <p>{x.priceNote}</p>}<p>{X.refAvg}: {x.referenceAvgJpy ? yen(x.referenceAvgJpy) : "—"}{x.referenceNote && !en ? `（${x.referenceNote}）` : ""}</p><p>{X.note}</p></details>
        <div className="pt-experience-actions"><Badge tone="neutral">{label(S.bookingModeTag, x.bookingMode)}</Badge>{relay && <Link className="pt-btn pt-btn-primary" href={`/partner/cases/new/?experience=${encodeURIComponent(x.slug)}`}>{label(S.bookingMode, x.bookingMode)}</Link>}{access.refer && !links[x.slug] && <Button kind="secondary" disabled={pending[x.slug]} onClick={() => void getLink(x.slug)}>{pending[x.slug] ? t().common.loading : X.getLink}</Button>}</div>
        {errors[x.slug] && <Notice tone="bad">{errors[x.slug]}</Notice>}
        {access.refer && links[x.slug] && <div className="pt-generated-link"><a href={links[x.slug].url} target="_blank" rel="noreferrer">{links[x.slug].url}</a><CopyLink url={links[x.slug].url}/><img className="pt-qr" src={`/api/portal/hotel/qr?link=${links[x.slug].qrId}`} alt={en ? "Referral QR code" : "紹介用QRコード"}/><a className="pt-btn pt-btn-secondary" href={`/api/portal/hotel/qr?link=${links[x.slug].qrId}&format=png`} download>{en ? "Download QR" : "QR画像を保存"}</a></div>}
      </div>
    </article>)}</div>}
  </>;
}
