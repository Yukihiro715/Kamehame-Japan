"use client";

import { useEffect, useState } from "react";
import { api, errorText, jst, pct, yen } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, Table } from "../ui";

interface Policy { id: string; experience_slug: string; title: string; rate_bp: number; tax_rate_bp: number; unit_price_excl_tax_jpy: number | null; reference_avg_jpy: number | null; reference_note: string | null; referral_enabled: number; valid_from: string; version: number; created_by: string | null }
interface Data { experiences: { slug: string; title: string; price: string; priceUnit: string }[]; policies: Policy[] }

export function OpsPolicies() {
  const [d, setD] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [f, setF] = useState({ experienceSlug: "", ratePct: "5", taxRateBp: "1000", unitPriceExclTax: "", referenceAvg: "", referenceNote: "", enabled: true, validFrom: "" });
  const [now] = useState(() => Date.now());
  const load = () => api<Data>("GET", "ops/policies").then(setD).catch((e) => setErr(errorText(e)));
  useEffect(() => { void load(); }, []);
  if (!d) return err ? <Notice tone="bad">{err}</Notice> : <Loading />;
  const current = new Map<string, Policy>();
  for (const p of d.policies) if (!current.has(p.experience_slug) && Date.parse(p.valid_from) <= now) current.set(p.experience_slug, p);
  const save = async () => {
    setErr(null); setMsg(null);
    try {
      const rate = Math.round(Number(f.ratePct) * 100);
      await api("POST", "ops/policies", { experienceSlug: f.experienceSlug, rateBp: rate, taxRateBp: Number(f.taxRateBp), unitPriceExclTax: f.unitPriceExclTax ? Number(f.unitPriceExclTax) : undefined, referenceAvg: f.referenceAvg ? Number(f.referenceAvg) : undefined, referenceNote: f.referenceNote || undefined, enabled: f.enabled, validFrom: f.validFrom ? new Date(`${f.validFrom}T00:00:00+09:00`).toISOString() : undefined });
      setMsg("料率を登録しました。新規予約から適用され、既存予約は変わりません。");
      await load();
    } catch (e) { setErr(errorText(e)); }
  };
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title="体験ごとの紹介条件（現在有効なもの）">
        <p className="pt-note-box">料率は体験ごとに設定します。未設定の体験は「紹介対象外・設定待ち」で、5% などを仮に当てることはありません。改定は新しい版として登録し、適用開始日以降の新規予約から効きます。</p>
        <Table head={["体験", "サイト価格", "紹介", "料率", "税率", "税抜単価", "参考予約単価", "注記", "適用開始", "版"]} rows={d.experiences.map((x) => { const p = current.get(x.slug); return [x.title, `${x.price}（${x.priceUnit === "group" ? "1組" : "1名"}）`, p && p.referral_enabled ? <Badge key="b" tone="ok">対象</Badge> : <Badge key="b" tone="warn">対象外・設定待ち</Badge>, p ? pct(p.rate_bp) : "—", p ? pct(p.tax_rate_bp) : "—", p?.unit_price_excl_tax_jpy ? yen(p.unit_price_excl_tax_jpy) : "—", p?.reference_avg_jpy ? yen(p.reference_avg_jpy) : "—", p?.reference_note ?? "—", p ? jst(p.valid_from, false) : "—", p?.version ?? "—"]; })} />
      </Card>
      <Card title="料率を登録・改定する">
        <div className="pt-form">
          <Field label="体験"><select value={f.experienceSlug} onChange={(e) => setF({ ...f, experienceSlug: e.target.value })}><option value="">選ぶ</option>{d.experiences.map((x) => <option key={x.slug} value={x.slug}>{x.title}</option>)}</select></Field>
          <Field label="紹介料率（%）"><input inputMode="decimal" value={f.ratePct} onChange={(e) => setF({ ...f, ratePct: e.target.value })} /></Field>
          <Field label="消費税率（bp、10% = 1000）"><input inputMode="numeric" value={f.taxRateBp} onChange={(e) => setF({ ...f, taxRateBp: e.target.value })} /></Field>
          <Field label="税抜単価（任意）" hint="空なら税込価格から税率で算出した値を目安に使います。"><input inputMode="numeric" value={f.unitPriceExclTax} onChange={(e) => setF({ ...f, unitPriceExclTax: e.target.value })} /></Field>
          <Field label="参考予約単価（税込、任意）"><input inputMode="numeric" value={f.referenceAvg} onChange={(e) => setF({ ...f, referenceAvg: e.target.value })} /></Field>
          <Field label="参考単価の注記"><input value={f.referenceNote} onChange={(e) => setF({ ...f, referenceNote: e.target.value })} placeholder="例: 運営入力 2026-11。現地払いを含まない" /></Field>
          <Field label="適用開始日（JST、空なら今）"><input type="date" value={f.validFrom} onChange={(e) => setF({ ...f, validFrom: e.target.value })} /></Field>
          <label className="pt-field"><span className="pt-field-l">ホテル紹介を受け付ける</span><input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} style={{ width: "auto" }} /></label>
          <div className="pt-row"><Button disabled={!f.experienceSlug || !f.ratePct} onClick={() => void save()}>登録</Button></div>
        </div>
      </Card>
      <Card title="履歴">
        <Table head={["体験", "版", "料率", "紹介", "適用開始", "登録者"]} rows={d.policies.map((p) => [p.title, p.version, pct(p.rate_bp), p.referral_enabled ? "対象" : "停止", jst(p.valid_from), p.created_by ?? "—"])} empty="なし" compact />
      </Card>
    </>
  );
}
