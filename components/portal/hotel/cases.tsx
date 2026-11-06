"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { t } from "../i18n";
import { usePortal } from "../shell";
import { Button, Card, Loading, Notice, Table } from "../ui";
import { StatusBadge, caseTitle } from "../case-common";

interface Row { id: string; publicRef: string; partnerRef: string | null; kind: "experience" | "free"; experienceTitle: string; experienceTitleEn: string; preferredDate: string | null; guests: number | null; customerName: string; status: string; assignee: string | null; updatedAt: string; quoteVersion: number | null; totalJpy: number | null }

/** The partner's cases: open ones first, everything on request. */
export function HotelCases() {
  const { hotel } = usePortal();
  const K = t().cases, C = t().common;
  const [rows, setRows] = useState<Row[] | null>(null), [err, setErr] = useState<string | null>(null), [manager, setManager] = useState(false), [all, setAll] = useState(false), [denied, setDenied] = useState(false);
  const load = useCallback(() => { if (!hotel) return; api<{ rows: Row[]; manager: boolean }>("GET", `hotel/cases?hotel=${hotel.id}${all ? "" : "&open=1"}`).then((d) => { setRows(d.rows); setManager(d.manager); setErr(null); }).catch((e) => { setRows([]); if ((e as { status?: number }).status === 403) setDenied(true); else setErr(errorText(e)); }); }, [hotel, all]);
  useEffect(() => { void load(); }, [load]);
  if (denied) return <Notice tone="warn">{K.noAccess}</Notice>;
  if (err) return <Notice tone="bad">{err}</Notice>;
  if (!rows) return <Loading />;
  return (
    <>
      <p className="pt-note-box">{K.intro} {manager ? K.managerNote : K.agentNote}</p>
      <Card title={K.title} actions={<span className="pt-row"><Button kind="secondary" small onClick={() => setAll((v) => !v)}>{all ? K.openOnly : K.showAll}</Button><Link className="pt-btn pt-btn-primary pt-btn-small" href="/hotel/cases/new/">{K.newCase}</Link></span>}>
        <Table head={K.head} rows={rows.map((r) => [
          <span key="r">{r.publicRef}{r.partnerRef ? <span className="pt-muted"> / {r.partnerRef}</span> : null}</span>, <StatusBadge key="s" status={r.status} />, caseTitle(r), r.preferredDate ?? C.undecided, r.guests ?? "—", r.customerName,
          r.quoteVersion ? `${K.version(r.quoteVersion)} ${yen(r.totalJpy)}` : "—", r.assignee ?? "—", jst(r.updatedAt), <Link key="a" href={`/hotel/cases/${r.id}/`}>{C.detail}</Link>,
        ])} empty={all ? K.emptyAll : K.emptyOpen} compact />
      </Card>
    </>
  );
}
