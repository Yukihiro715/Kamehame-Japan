"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Stat, Table } from "../ui";
import { STATEMENT_STATUS_JA, periodJa } from "../statement-sheet";

interface Row { id: string; profile_id: string; profile_name: string; entity_name: string; period: string; version: number; status: string; net_jpy: number; gross_jpy: number; carried_in_jpy: number; transfer_jpy: number; carried_out_jpy: number; pay_date_jst: string | null; issued_at: string | null }
interface Data { today: string; suggestedPeriod: string; statements: Row[]; profiles: number; unstated: { count: number; netJpy: number }; openDisputes: number }

/** The quarter close and every statement, newest first. */
export function OpsSettlement() {
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [period, setPeriod] = useState("");
  const load = useCallback(() => api<Data>("GET", "ops/settlement").then((x) => { setD(x); setPeriod((p) => p || x.suggestedPeriod); }).catch((e) => setErr(errorText(e))), []);
  useEffect(() => { void load(); }, [load]);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(null); setMsg(null); try { await fn(); setMsg(ok); await load(); } catch (e) { setErr(errorText(e)); } };
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">四半期（1–3月、4–6月、7–9月、10–12月）が終わったら「締め」を実行すると、精算先ごとに下書きの支払通知書ができます。締めは何度実行しても下書きを作り直すだけで、発行済みの通知書には触れません。内容を確認して「発行」すると、パートナーの請求担当者に通知メールが届き、異議申立ての期限（既定 14 日）が始まります。期限内に確認も異議もなければ自動で確認済みになります。</p>
      <div className="pt-grid">
        <Stat label="未収載の確定紹介料" value={yen(d.unstated.netJpy)} note={`${d.unstated.count} 件（次の締めで通知書に載ります）`} tone="accent" />
        <Stat label="未解決の異議" value={d.openDisputes} tone={d.openDisputes ? "warn" : undefined} />
        <Stat label="精算先" value={d.profiles} />
      </div>
      <Card title="四半期を締める">
        <div className="pt-form">
          <Field label="対象四半期（例 2026-Q3）" hint={`今日は ${d.today}。直近に終わった四半期は ${d.suggestedPeriod} です。`}><input value={period} onChange={(e) => setPeriod(e.target.value)} pattern="\d{4}-Q[1-4]" /></Field>
          <div className="pt-row"><Button disabled={!/^\d{4}-Q[1-4]$/.test(period)} onClick={() => run(async () => { const r = await api<{ statements: unknown[]; skipped: string[] }>("POST", "ops/settlement/close", { period }); setMsg(`${period} を締めました: 下書き ${r.statements.length} 件${r.skipped.length ? `、発行済みのため対象外 ${r.skipped.length} 件` : ""}`); }, "締めました。")}>締めを実行</Button></div>
        </div>
      </Card>
      <Card title="支払通知書">
        <Table head={["期間", "版", "契約先", "精算設定", "状態", "税抜", "税込", "繰越（前期）", "振込額", "次回繰越", "振込予定日", "発行", ""]} rows={d.statements.map((s) => {
          const st = STATEMENT_STATUS_JA[s.status] ?? [s.status, "neutral" as const];
          return [periodJa(s.period), s.version, s.entity_name, s.profile_name, <Badge key="s" tone={st[1]}>{st[0]}</Badge>, yen(s.net_jpy), yen(s.gross_jpy), yen(s.carried_in_jpy), yen(s.transfer_jpy), yen(s.carried_out_jpy), s.pay_date_jst ?? "—", jst(s.issued_at, false), <a key="a" href={`/ops/settlement/${s.id}/`}>詳細</a>];
        })} empty="通知書はまだありません。四半期が終わったら締めを実行してください。" compact />
      </Card>
    </>
  );
}
