"use client";

/** The listing: a count, sort, grid/list toggle and in-place filters over the
 *  items the page already carries. Nothing is fetched; the state lives in the
 *  URL query so a filtered view can be shared, and the view choice in
 *  localStorage. Filters with a single option are not shown. */
import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, Rows3, SlidersHorizontal, X } from "lucide-react";
import type { ListingItem } from "@/lib/collections";
import { listingCopy } from "@/lib/listing-copy";
import type { Lang } from "@/lib/i18n";
import { ListingCard } from "@/components/site/listing-card";

type View = "grid" | "list";
type Sort = "recommended" | "price_asc" | "price_desc" | "duration" | "rating";
interface Filters { city: string[]; cat: string[]; dur: number[]; price: number[]; group: ("private" | "small")[]; booking: ("instant" | "request")[] }
const EMPTY: Filters = { city: [], cat: [], dur: [], price: [], group: [], booking: [] };
const VIEW_KEY = "kh-listing-view";

const durBand = (m: number | null) => (m === null ? -1 : m <= 60 ? 0 : m <= 120 ? 1 : m <= 240 ? 2 : 3);
const priceBand = (y: number | null) => (y === null ? -1 : y < 10000 ? 0 : y < 20000 ? 1 : y < 40000 ? 2 : 3);

function readQuery(): { f: Filters; sort: Sort; view: View | null } {
  const q = new URLSearchParams(window.location.search);
  const list = (k: string) => (q.get(k) ?? "").split(",").filter(Boolean);
  const nums = (k: string) => list(k).map(Number).filter((n) => Number.isInteger(n));
  const sort = (q.get("sort") ?? "recommended") as Sort;
  const view = q.get("view") === "list" ? "list" : q.get("view") === "grid" ? "grid" : null;
  return { f: { city: list("city"), cat: list("cat"), dur: nums("dur"), price: nums("price"), group: list("group") as Filters["group"], booking: list("booking") as Filters["booking"] }, sort: ["recommended", "price_asc", "price_desc", "duration", "rating"].includes(sort) ? sort : "recommended", view };
}
function writeQuery(f: Filters, sort: Sort, view: View) {
  const q = new URLSearchParams();
  (Object.keys(f) as (keyof Filters)[]).forEach((k) => { if (f[k].length) q.set(k, f[k].join(",")); });
  if (sort !== "recommended") q.set("sort", sort);
  if (view !== "grid") q.set("view", view);
  const s = q.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${s ? `?${s}` : ""}`);
}

export function ListingGrid({ items, lang, eagerCount = 4 }: { items: ListingItem[]; lang: Lang; eagerCount?: number }) {
  const L = listingCopy(lang);
  const [f, setF] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<Sort>("recommended");
  const [view, setView] = useState<View>("grid");
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL and the stored view exist only after mount
  useEffect(() => {
    const q = readQuery();
    setF(q.f); setSort(q.sort);
    let stored: string | null = null;
    try { stored = localStorage.getItem(VIEW_KEY); } catch { stored = null; }
    setView(q.view ?? (stored === "list" ? "list" : "grid"));
  }, []);
  const update = (nf: Filters, ns = sort, nv = view) => { setF(nf); setSort(ns); setView(nv); writeQuery(nf, ns, nv); };
  const chooseView = (v: View) => { update(f, sort, v); try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ } };

  // Facets come from the items themselves, so a city page never offers other cities.
  const cities = useMemo(() => [...new Map(items.map((i) => [i.city, i.cityLabel])).entries()], [items]);
  const cats = useMemo(() => [...new Map(items.map((i) => [i.category, i.categoryLabel])).entries()], [items]);
  const durs = useMemo(() => ([0, 1, 2, 3] as const).filter((b) => items.some((i) => durBand(i.minutes) === b)), [items]);
  const prices = useMemo(() => ([0, 1, 2, 3] as const).filter((b) => items.some((i) => priceBand(i.priceYen) === b)), [items]);
  const groups = useMemo(() => [...new Set(items.map((i) => (i.isPrivate ? "private" : "small")))], [items]);
  const bookings = useMemo(() => [...new Set(items.map((i) => i.bookingType))], [items]);

  const shown = useMemo(() => {
    const keep = items.filter((i) =>
      (!f.city.length || f.city.includes(i.city)) && (!f.cat.length || f.cat.includes(i.category)) &&
      (!f.dur.length || f.dur.includes(durBand(i.minutes))) && (!f.price.length || f.price.includes(priceBand(i.priceYen))) &&
      (!f.group.length || f.group.includes(i.isPrivate ? "private" : "small")) && (!f.booking.length || f.booking.includes(i.bookingType)));
    const by = {
      recommended: () => 0,
      price_asc: (a: ListingItem, b: ListingItem) => (a.priceYen ?? 1e12) - (b.priceYen ?? 1e12),
      price_desc: (a: ListingItem, b: ListingItem) => (b.priceYen ?? -1) - (a.priceYen ?? -1),
      duration: (a: ListingItem, b: ListingItem) => (a.minutes ?? 1e9) - (b.minutes ?? 1e9),
      rating: (a: ListingItem, b: ListingItem) => (b.rating?.average ?? 0) - (a.rating?.average ?? 0) || (b.rating?.count ?? 0) - (a.rating?.count ?? 0),
    }[sort];
    return sort === "recommended" ? keep : [...keep].sort(by);
  }, [items, f, sort]);

  const active = Object.values(f).reduce((n, v) => n + v.length, 0);
  const toggle = <K extends keyof Filters>(k: K, v: Filters[K][number]) => {
    const cur = f[k] as unknown[];
    update({ ...f, [k]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Filters);
  };
  const Chip = <K extends keyof Filters>({ k, v, label }: { k: K; v: Filters[K][number]; label: string }) => (
    <button type="button" className={`lg-chip${(f[k] as unknown[]).includes(v) ? " on" : ""}`} aria-pressed={(f[k] as unknown[]).includes(v)} onClick={() => toggle(k, v)}>{label}</button>
  );
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="lg-group"><p className="lg-group-h">{title}</p><div className="lg-chips">{children}</div></div>;

  return (
    <div className="lg">
      <div className="lg-bar">
        <button type="button" className={`lg-btn${active ? " on" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}><SlidersHorizontal size={15} /> {L.filters}{active ? ` (${active})` : ""}</button>
        <label className="lg-sort"><span>{L.sort}</span>
          <select value={sort} onChange={(e) => update(f, e.target.value as Sort)}>
            <option value="recommended">{L.sortRecommended}</option><option value="price_asc">{L.sortPriceAsc}</option><option value="price_desc">{L.sortPriceDesc}</option><option value="duration">{L.sortDuration}</option><option value="rating">{L.sortRating}</option>
          </select>
        </label>
        <div className="lg-view" role="group">
          <button type="button" className={view === "grid" ? "on" : ""} aria-label={L.viewGrid} aria-pressed={view === "grid"} onClick={() => chooseView("grid")}><LayoutGrid size={16} /></button>
          <button type="button" className={view === "list" ? "on" : ""} aria-label={L.viewList} aria-pressed={view === "list"} onClick={() => chooseView("list")}><Rows3 size={16} /></button>
        </div>
      </div>
      <p className="lg-count" aria-live="polite">{L.found(shown.length)}</p>
      {open && (
        <div className="lg-panel" role="region" aria-label={L.filters}>
          <div className="lg-panel-h"><b>{L.filters}</b><button type="button" className="lg-close" aria-label="Close" onClick={() => setOpen(false)}><X size={18} /></button></div>
          {cities.length > 1 && <Group title={L.city}>{cities.map(([v, label]) => <Chip key={v} k="city" v={v} label={label} />)}</Group>}
          {cats.length > 1 && <Group title={L.interest}>{cats.map(([v, label]) => <Chip key={v} k="cat" v={v} label={label} />)}</Group>}
          {durs.length > 1 && <Group title={L.duration}>{durs.map((b) => <Chip key={b} k="dur" v={b} label={L.dur[b]} />)}</Group>}
          {prices.length > 1 && <Group title={L.price}>{prices.map((b) => <Chip key={b} k="price" v={b} label={L.priceBand[b]} />)}</Group>}
          {groups.length > 1 && <Group title={L.group}><Chip k="group" v="private" label={L.privateOnly} /><Chip k="group" v="small" label={L.smallGroup} /></Group>}
          {bookings.length > 1 && <Group title={L.booking}><Chip k="booking" v="instant" label={L.instant} /><Chip k="booking" v="request" label={L.onRequest} /></Group>}
          <div className="lg-panel-f">
            <button type="button" className="lg-link" onClick={() => update(EMPTY)} disabled={!active}>{L.clear}</button>
            <button type="button" className="lg-done" onClick={() => setOpen(false)}>{L.done} · {shown.length}</button>
          </div>
        </div>
      )}
      {shown.length === 0 ? <p className="lg-empty">{L.noMatch}</p> : (
        <div className={`lg-items lg-items-${view}`}>
          {shown.map((item, i) => <ListingCard key={item.href} item={item} lang={lang} view={view} eager={i < eagerCount} />)}
        </div>
      )}
    </div>
  );
}
