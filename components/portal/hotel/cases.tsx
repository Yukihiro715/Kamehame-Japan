"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { PortalDialog } from "../help";
import { HotelCaseDetail } from "./case-detail";
import { localDemoCases, type LocalDemoCase } from "./demo-cases";
import Link from "next/link";
import { api, errorText, yen } from "../client";
import { label, t } from "../i18n";
import { usePortal } from "../shell";
import { partnerAccess } from "../partner-access";
import { Button, Loading, Notice } from "../ui";
import type { HotelReservationRow } from "@/lib/portal/metrics";

type Case = {
  id: string;
  experienceSlug?: string;
  publicRef: string;
  partnerRef: string | null;
  customerName: string;
  customerGroup?: string | null;
  customerContact?: string;
  hotelRef?: string;
  experienceTitle: string;
  experienceTitleEn: string;
  preferredDate: string | null;
  status: string;
  paymentStatus?: string;
  updatedAt: string;
  assignee: string | null;
  totalJpy: number | null;
};
type Tab = "all" | "open" | "paid";
type Item = {
  group: string;
  slug?: string;
  caseId?: string;
  sample?: LocalDemoCase;
  customer: string;
  ref: string;
  title: string;
  day: string | null;
  status: string;
  paid: boolean;
  open: boolean;
  href: string;
  source: string;
  updated: string;
  payment: string;
  amount: number | null;
  commission: number | null;
  assignee?: string | null;
  partnerRef?: string | null;
};

async function pages<T>(path: string) {
  const rows: T[] = [];
  while (true) {
    const page = await api<{ rows: T[]; total: number }>(
      "GET",
      path + "&limit=100&offset=" + rows.length,
    );
    rows.push(...page.rows);
    if (!page.rows.length || rows.length >= page.total) return rows;
  }
}

export function HotelCases() {
  const { hotel, me, lang } = usePortal(),
    en = lang === "en",
    access = partnerAccess(hotel, me.memberships);
  const [tab, setTab] = useState<Tab>("all"),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0);
  const [data, setData] = useState<{
    cases: Case[];
    reservations: HotelReservationRow[];
  } | null>(null);
  const [catalog, setCatalog] = useState<
    Record<string, { img: string; city: string }>
  >({});
  const [demoRows, setDemoRows] = useState<LocalDemoCase[]>([]);
  const [selected, setSelected] = useState<Item | null>(null);
  const [demoId, setDemoId] = useState("");
  const [err, setErr] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!hotel) return;
    let live = true;
    if (me.demo) {
      setDemoRows(localDemoCases());
      setDemoId(new URLSearchParams(window.location.search).get("demo") ?? "");
    }
    api<{ experiences: { slug: string; img: string; city: string }[] }>(
      "GET",
      "hotel/experiences?hotel=" + hotel.id,
    )
      .then((r) => {
        if (live)
          setCatalog(Object.fromEntries(r.experiences.map((x) => [x.slug, x])));
      })
      .catch(() => {
        if (live) setCatalog({});
      });
    Promise.all([
      access.cases
        ? pages<Case>("hotel/cases?hotel=" + hotel.id)
        : Promise.resolve([]),
      pages<HotelReservationRow>("hotel/reservations?hotel=" + hotel.id),
    ])
      .then(([cases, reservations]) => {
        if (live) {
          setData({ cases, reservations });
          setErr("");
        }
      })
      .catch((e) => {
        if (live) setErr(errorText(e));
      });
    return () => {
      live = false;
    };
  }, [hotel, access.cases, me.demo, retry]);
  if (err)
    return (
      <>
        <Notice tone="bad">{err}</Notice>
        <Button onClick={() => setRetry(retry + 1)}>{t().common.retry}</Button>
      </>
    );
  if (!data) return <Loading />;
  const resByRef = new Map(data.reservations.map((r) => [r.hotelRef, r]));
  const items: Item[] = data.cases.map((c) => {
    const r = c.hotelRef ? resByRef.get(c.hotelRef) : undefined;
    if (r) resByRef.delete(r.hotelRef);
    const payment = r?.paymentStatus ?? c.paymentStatus ?? "unpaid";
    return {
      group:
        c.customerGroup ??
        (c.customerContact
          ? JSON.stringify([
              c.customerName.trim().toLowerCase(),
              c.customerContact,
            ])
          : c.id),
      slug: c.experienceSlug,
      caseId: c.id,
      customer: c.customerName,
      ref: c.publicRef,
      title: en ? c.experienceTitleEn : c.experienceTitle,
      day: r?.experienceDate ?? c.preferredDate,
      status: label(t().status.kase, c.status),
      payment: label(t().status.payment, payment),
      paid: ["paid", "partially_refunded"].includes(payment),
      open: [
        "received",
        "checking",
        "proposed",
        "awaiting_customer",
        "awaiting_payment",
        "paid",
      ].includes(c.status),
      href: "/partner/cases/" + c.id + "/",
      source: en ? "Partner request" : "代理手配",
      updated: c.updatedAt,
      amount: c.totalJpy,
      commission: r?.commissionNet ?? null,
      assignee: c.assignee,
      partnerRef: c.partnerRef,
    };
  });
  for (const r of resByRef.values())
    items.push({
      group: r.hotelRef,
      slug: r.experienceSlug,
      customer: r.hotelRef,
      ref: r.hotelRef,
      title: r.experience,
      day: r.experienceDate,
      status: label(t().status.reservation, r.status),
      payment: label(t().status.payment, r.paymentStatus),
      paid: ["paid", "partially_refunded"].includes(r.paymentStatus),
      open: ["provisional", "arranging"].includes(r.status),
      href: "/partner/reservations/?ref=" + encodeURIComponent(r.hotelRef),
      source: en ? "Referral booking" : "紹介予約",
      updated: r.createdAt,
      amount: r.bookingGross,
      commission: r.commissionNet,
    });
  for (const sample of demoRows)
    items.push({
      group: sample.id,
      customer: sample.customerName,
      ref: sample.publicRef,
      title: en ? sample.experienceTitleEn : sample.experienceTitle,
      day: sample.preferredDate,
      status: label(t().status.kase, "received"),
      payment: label(t().status.payment, "unpaid"),
      paid: false,
      open: true,
      href: "#" + sample.id,
      source: en ? "Demo case" : "デモ案件",
      updated: sample.updatedAt,
      amount: null,
      commission: null,
      slug: sample.experienceSlug,
      sample,
    });
  const detail = selected ?? items.find((item) => item.sample?.id === demoId);
  function hideDetail() {
    setSelected(null);
    setDemoId("");
    if (new URLSearchParams(window.location.search).has("demo"))
      window.history.replaceState(null, "", window.location.pathname);
  }
  const groups = new Map<string, Item[]>();
  for (const item of items.sort((a, b) => b.updated.localeCompare(a.updated))) {
    if ((tab === "open" && !item.open) || (tab === "paid" && !item.paid))
      continue;
    if (
      ![item.customer, item.ref, item.partnerRef, item.title, item.assignee]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase())
    )
      continue;
    const rows = groups.get(item.group) ?? [];
    rows.push(item);
    groups.set(item.group, rows);
  }
  const names = {
    all: en ? "All cases" : "全件一覧",
    open: en ? "In progress" : "調整中案件",
    paid: en ? "Paid" : "決済済み案件",
  };
  return (
    <>
      <label className="pt-search pt-case-searchbox">
        <Search aria-hidden="true" size={18} />
        <input
          type="search"
          aria-label={en ? "Search cases" : "案件を検索"}
          placeholder={
            en
              ? "Guest, reference or experience"
              : "お客様名・番号・体験名で検索"
          }
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </label>
      <div className="pt-segments">
        {(["all", "open", "paid"] as const).map((k) => (
          <button
            key={k}
            aria-pressed={tab === k}
            className={tab === k ? "on" : ""}
            onClick={() => {
              setTab(k);
              setPage(0);
            }}
          >
            {names[k]}
          </button>
        ))}
      </div>
      {[...groups.values()].slice(page * 20, page * 20 + 20).map((rows) => (
        <section className="pt-card" key={rows[0].group}>
          <h2>{rows[0].customer}</h2>
          {access.cases && rows[0].href.startsWith("/partner/cases/") && (
            <Link
              href={
                "/partner/experiences/?previousCase=" +
                encodeURIComponent(rows[0].href.split("/")[3])
              }
            >
              {en
                ? "Add an experience for this guest"
                : "このお客様に体験を追加"}
            </Link>
          )}
          {rows.map((r) => {
            const product =
              r.slug === "golf-bus"
                ? { img: "/images/golf-bus/hero-wide.webp", city: "" }
                : r.slug
                  ? catalog[r.slug]
                  : null;
            const productUrl = product
              ? `/${en ? "en" : "ja"}/${product.city ? product.city + "/" : ""}${encodeURIComponent(r.slug!)}/`
              : null;
            return (
              <article className="pt-case-tile" key={r.href}>
                <button
                  type="button"
                  className="pt-case-tile-main"
                  onClick={() => {
                    setDemoId("");
                    setSelected(r);
                  }}
                >
                  {product?.img && (
                    <img
                      src={product.img}
                      alt=""
                      width={76}
                      height={58}
                      loading="lazy"
                    />
                  )}
                  <span>
                    <small>
                      {r.source} · {r.ref} {r.partnerRef}
                    </small>
                    <strong>{r.title}</strong>
                    <small>
                      {r.day ?? "—"} {r.assignee}
                    </small>
                  </span>
                  <span className="pt-case-tile-state">
                    <b>{r.status}</b>
                    <small>{r.payment}</small>
                  </span>
                  <span className="pt-case-tile-amount">
                    <strong>{yen(r.amount)}</strong>
                    {r.commission !== null && (
                      <small>
                        {en ? "Commission" : "コミッション"} {yen(r.commission)}
                      </small>
                    )}
                  </span>
                </button>
                {productUrl && (
                  <a
                    className="pt-inline-link"
                    href={productUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {en ? "View experience" : "体験ページを見る"} ↗
                  </a>
                )}
              </article>
            );
          })}
        </section>
      ))}
      {detail && (
        <PortalDialog
          className="pt-case-modal pt-case-details"
          closeInFooter={false}
          title={detail.title}
          subtitle={detail.ref}
          onClose={hideDetail}
        >
          {detail.caseId ? (
            <HotelCaseDetail id={detail.caseId} inModal />
          ) : (
            <div className="pt-card">
              <p>
                {detail.customer} · {detail.day || "—"}
                {detail.sample?.timePref ? " " + detail.sample.timePref : ""}
              </p>
              <p>
                {detail.status} · {detail.payment}
              </p>
              <p>
                {en ? "Amount" : "金額"} {yen(detail.amount)}
              </p>
              {detail.sample ? (
                <Notice>
                  {en
                    ? "Demo case registered in this tab."
                    : "このタブ内にデモ案件を登録しました。"}
                </Notice>
              ) : (
                <Link href={detail.href}>
                  {en ? "Full booking record" : "予約明細を確認する"}
                </Link>
              )}
            </div>
          )}
        </PortalDialog>
      )}
      {!groups.size && <p>{t().common.empty}</p>}
      {groups.size > 20 && (
        <div className="pt-pagination">
          <Button disabled={!page} onClick={() => setPage(page - 1)}>
            {en ? "Previous" : "前へ"}
          </Button>
          <Button
            disabled={(page + 1) * 20 >= groups.size}
            onClick={() => setPage(page + 1)}
          >
            {en ? "Next" : "次へ"}
          </Button>
        </div>
      )}
      <Link href="/partner/reservations/">
        {en ? "Booking and commission details" : "予約・コミッション明細"}
      </Link>
    </>
  );
}
