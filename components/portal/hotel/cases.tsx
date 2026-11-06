"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { usePortal } from "../shell";
import { Button, Card, Loading, Notice, Table } from "../ui";
import { StatusBadge } from "../case-common";

interface Row { id: string; publicRef: string; partnerRef: string | null; experienceTitle: string; preferredDate: string | null; guests: number | null; customerName: string; status: string; statusJa: string; assignee: string | null; updatedAt: string; quoteVersion: number | null; totalJpy: number | null }

/** The partner's cases: open ones first, everything on request. */
export function HotelCases() {
  const { hotel } = usePortal();
  const [rows, setRows] = useState<Row[] | null>(null), [err, setErr] = useState<string | null>(null), [manager, setManager] = useState(false), [all, setAll] = useState(false);
  const load = useCallback(() => { if (!hotel) return; api<{ rows: Row[]; manager: boolean }>("GET", `hotel/cases?hotel=${hotel.id}${all ? "" : "&open=1"}`).then((d) => { setRows(d.rows); setManager(d.manager); setErr(null); }).catch((e) => { setRows([]); setErr(errorText(e)); }); }, [hotel, all]);
  useEffect(() => { void load(); }, [load]);
  if (err) return <Notice tone={err.includes("権限") ? "warn" : "bad"}>{err.includes("権限") ? "この拠点では予約取り次ぎが使えないか、取り次ぎの役割が割り当てられていません。KAMEHAME JAPAN にお問い合わせください。" : err}</Notice>;
  if (!rows) return <Loading />;
  return (
    <>
      <p className="pt-note-box">お客様のご希望を登録すると、KAMEHAME JAPAN が空き確認と見積もりを行い、お客様向けの見積もり・決済ページを用意します。案件から生まれた予約の紹介元は、Cookie に関係なく貴社の拠点に固定されます。{manager ? "拠点管理者のため、拠点の全案件が表示されます。" : "ご自身が登録または担当する案件が表示されます。"}</p>
      <Card title="取り次ぎ案件" actions={<span className="pt-row"><Button kind="secondary" small onClick={() => setAll((v) => !v)}>{all ? "進行中のみ" : "終了分も表示"}</Button><Link className="pt-btn pt-btn-primary pt-btn-small" href="/hotel/cases/new/">新しい案件を登録</Link></span>}>
        <Table head={["案件", "状態", "体験", "希望日", "人数", "お客様", "見積もり", "担当", "更新", ""]} rows={rows.map((r) => [
          <span key="r">{r.publicRef}{r.partnerRef ? <span className="pt-muted"> / {r.partnerRef}</span> : null}</span>, <StatusBadge key="s" status={r.status} label={r.statusJa} />, r.experienceTitle, r.preferredDate ?? "未定", r.guests ?? "—", r.customerName,
          r.quoteVersion ? `第${r.quoteVersion}版 ${yen(r.totalJpy)}` : "—", r.assignee ?? "—", jst(r.updatedAt), <Link key="a" href={`/hotel/cases/${r.id}/`}>詳細</Link>,
        ])} empty={all ? "案件はまだありません。" : "進行中の案件はありません。"} compact />
      </Card>
    </>
  );
}
