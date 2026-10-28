"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Button, Card, Field, Loading, Notice, Table } from "../ui";

interface Log { id: string; at: string; actor: string; action: string; target_type: string; target_id: string; reason: string | null; after_json: string | null }

export function OpsAudit() {
  const [rows, setRows] = useState<Log[] | null>(null), [err, setErr] = useState<string | null>(null), [q, setQ] = useState("");
  const load = () => api<{ rows: Log[] }>("GET", `ops/audit?limit=200${q ? `&q=${encodeURIComponent(q)}` : ""}`).then((d) => setRows(d.rows)).catch((e) => setErr(errorText(e)));
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <Notice tone="bad">{err}</Notice>;
  return (
    <Card title="操作履歴">
      <div className="pt-row"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="対象ID・担当者・操作名" style={{ flex: 1, minWidth: 220, padding: "6px 10px", border: "1px solid #d9d3c7", borderRadius: 8 }} /><Button kind="secondary" small onClick={() => void load()}>検索</Button></div>
      {!rows ? <Loading /> : <Table head={["日時", "担当", "操作", "対象", "理由", "内容"]} rows={rows.map((l) => [jst(l.at), l.actor, l.action, l.target_type === "reservation" ? <a key="a" href={`/ops/reservations/${l.target_id}/`}>{l.target_id.slice(0, 10)}…</a> : `${l.target_type} ${l.target_id.slice(0, 10)}…`, l.reason ?? "—", l.after_json ? <code key="j" className="pt-small">{l.after_json.slice(0, 120)}</code> : "—"])} compact />}
    </Card>
  );
}

export function OpsExport() {
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [basis, setBasis] = useState("created");
  return (
    <Card title="CSV出力">
      <p className="pt-note-box">紹介のある予約と紹介料の明細を、予約作成日または実施日で絞って CSV（UTF-8、Excel 対応）に出します。数式として解釈されうる値は無害化しています。</p>
      <div className="pt-form">
        <Field label="開始日"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="終了日"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="基準"><select value={basis} onChange={(e) => setBasis(e.target.value)}><option value="created">予約作成日</option><option value="performed">実施日（確定実績）</option></select></Field>
        <div className="pt-row">{from && to && from <= to ? <a className="pt-btn pt-btn-primary" href={`/api/portal/ops/export.csv?from=${from}&to=${to}&basis=${basis}`} download>ダウンロード</a> : <Button disabled>ダウンロード</Button>}</div>
      </div>
    </Card>
  );
}

export function OpsSettings() {
  const [s, setS] = useState<Record<string, string> | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { api<{ settings: Record<string, string> }>("GET", "ops/settings").then((d) => setS(d.settings)).catch((e) => setErr(errorText(e))); }, []);
  if (!s) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const save = async () => { setErr(null); setMsg(null); try { const r = await api<{ settings: Record<string, string> }>("POST", "ops/settings", { values: s }); setS(r.settings); setMsg("保存しました。"); } catch (e) { setErr(errorText(e)); } };
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title="運営設定">
        <p className="pt-note-box">要件書の「確定」事項（四半期精算、翌月末払い、最低振込額 3,000 円、手数料ホテル負担、紹介有効期間 30 日、仮予約時に帰属固定、料率未設定は対象外）はコードで固定しています。ここにあるのは運用上の補助設定です。</p>
        <div className="pt-form">
          <Field label="公開オリジン（QR・リンクのドメイン）" hint="空なら本番 https://kamehame-japan.com（検証環境では検証環境のURL）。"><input value={s.public_origin ?? ""} onChange={(e) => setS({ ...s, public_origin: e.target.value })} placeholder="https://kamehame-japan.com" /></Field>
          <Field label="精算に関する注記（ホテル画面に表示）"><input value={s.settlement_note ?? ""} onChange={(e) => setS({ ...s, settlement_note: e.target.value })} /></Field>
          <div className="pt-row"><Button onClick={() => void save()}>保存</Button></div>
        </div>
        <dl className="pt-kv">
          <dt>精算期間</dt><dd>暦四半期（1–3 / 4–6 / 7–9 / 10–12 月、JST）</dd>
          <dt>支払予定</dt><dd>締め月の翌月末（銀行休業日は前営業日）</dd>
          <dt>最低振込額</dt><dd>¥3,000（税込・確認済み・手数料控除前）、未満は繰越</dd>
          <dt>紹介有効期間</dt><dd>最後の有効な紹介アクセスから 30 日。仮予約作成時に固定</dd>
          <dt>訪問の定義</dt><dd>同一セッション 30 分以内の連続アクセスを 1 訪問</dd>
          <dt>丸め</dt><dd>紹介料は予約単位で四捨五入、税額は精算書単位・税率ごとに 1 回</dd>
        </dl>
      </Card>
    </>
  );
}
