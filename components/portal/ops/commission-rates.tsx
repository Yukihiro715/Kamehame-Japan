"use client";
import { useState } from "react";
import { api, errorText, jst, pct } from "../client";
import { Button, Card, Field, Notice, Table } from "../ui";

export interface RateSetting { id: string; legal_entity_id: string | null; rate_bp: number | null; valid_from: string; created_by: string }
export interface RatePartner { id: string; name: string }
export function CommissionRates({ rates, partners, reload }: { rates: RateSetting[]; partners: RatePartner[]; reload: () => Promise<unknown> }) {
  const [partner, setPartner] = useState(""), [rate, setRate] = useState(""), [inherit, setInherit] = useState(false), [from, setFrom] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const current = (id: string | null) => rates.find(r => r.legal_entity_id === id && Date.parse(r.valid_from) <= now);
  const common = current(null);
  const label = (r: RateSetting | undefined) => r?.rate_bp == null ? "体験ごとの料率" : pct(r.rate_bp);
  const valid = /^\d+(\.\d{1,2})?$/.test(rate) && Number(rate) <= 100;
  const save = async () => {
    if (busy || (!inherit && !valid)) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      await api("POST", "ops/commission-rates", { legalEntityId: partner || null, rateBp: inherit ? null : Math.round(Number(rate) * 100), validFrom: from ? new Date(`${from}T00:00:00+09:00`).toISOString() : undefined });
      await reload(); setNow(Date.now()); setMessage("保存しました。適用開始以降の新規予約に適用します。既存予約の料率は変わりません。");
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  return <>
    <Card title="共通料率・パートナー別料率">
      <p className="pt-note-box">紹介対象の体験には共通料率を適用し、パートナー別料率がある場合はそちらを優先します。パートナーの全拠点で共通です。紹介対象外・設定待ちの体験は対象外のままです。</p>
      <p><strong>現在の共通料率：{label(common)}</strong></p>
      <Table head={["パートナー", "個別設定", "適用料率"]} rows={partners.map(p => { const r = current(p.id); return [p.name, r?.rate_bp == null ? "共通設定を使用" : pct(r.rate_bp), label(r?.rate_bp == null ? common : r)]; })} />
    </Card>
    <Card title="共通・個別の料率を変更">
      {error && <Notice tone="bad">{error}</Notice>}{message && <Notice tone="ok">{message}</Notice>}
      <div className="pt-form">
        <Field label="適用先"><select value={partner} onChange={e => { setPartner(e.target.value); setInherit(false); setRate(""); }}><option value="">すべてのパートナー（共通料率）</option>{partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="紹介料率（%）" hint="0〜100、小数点以下2桁まで。0%も設定できます。"><input inputMode="decimal" disabled={inherit} value={rate} onChange={e => setRate(e.target.value)} placeholder="例：5" /></Field>
        <label><input type="checkbox" style={{ width: "auto" }} checked={inherit} onChange={e => setInherit(e.target.checked)} /> {partner ? "個別設定を解除し、共通設定に戻す" : "共通設定を解除し、体験ごとの料率に戻す"}</label>
        <Field label="適用開始日（日本時間）" hint="空欄なら保存時から。日付指定は明日以降。"><input type="date" value={from} onChange={e => setFrom(e.target.value)} /></Field>
        <div><Button disabled={busy || (!inherit && !valid)} onClick={() => void save()}>{busy ? "保存中…" : "料率を保存"}</Button></div>
      </div>
    </Card>
    <Card title="共通・個別料率の履歴">
      <Table head={["適用先", "料率", "適用開始", "登録者"]} rows={rates.map(r => [r.legal_entity_id ? partners.find(p => p.id === r.legal_entity_id)?.name ?? r.legal_entity_id : "共通", r.rate_bp === null ? "設定を解除" : pct(r.rate_bp), jst(r.valid_from), r.created_by])} empty="まだ設定されていません" />
    </Card>
  </>;
}
