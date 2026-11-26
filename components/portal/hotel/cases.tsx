"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, errorText, yen } from "../client";
import { label, t } from "../i18n";
import { usePortal } from "../shell";
import { partnerAccess } from "../partner-access";
import { Button, Loading, Notice } from "../ui";
import type { HotelReservationRow } from "@/lib/portal/metrics";

type Case = {
  id: string;
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
  const [err, setErr] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!hotel) return;
    let live = true;
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
  }, [hotel, access.cases, retry]);
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
      <div className="pt-list-heading">
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
        {access.cases && (
          <Link className="pt-btn pt-btn-primary" href="/partner/cases/new/">
            {t().cases.newCase}
          </Link>
        )}
      </div>
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
          {rows.map((r) => (
            <article className="pt-case-row" key={r.href}>
              <small>
                {r.source} · {r.ref} {r.partnerRef} · {r.day ?? "—"}{" "}
                {r.assignee}
              </small>
              <h3>
                <Link href={r.href}>{r.title}</Link>
              </h3>
              <p>
                {r.status} · {r.payment}
              </p>
              <span>
                {en ? "Amount" : "金額"} {yen(r.amount)} ·{" "}
                {en ? "Commission (excl. tax)" : "コミッション（税抜）"}{" "}
                {yen(r.commission)}
              </span>
            </article>
          ))}
        </section>
      ))}
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
