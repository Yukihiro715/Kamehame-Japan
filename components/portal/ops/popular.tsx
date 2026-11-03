"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText } from "../client";
import { Badge, Button, Card, Loading, Notice, Table } from "../ui";

interface Item { slug: string; title: string; titleEn: string; city: string }
interface Demand extends Item { reservations: number; enquiries: number; score: number }
interface Data { setting: { mode: "auto" | "manual"; slugs: string[] }; effective: Item[]; count: number; windowDays: number; demand: Demand[]; experiences: Item[]; defaults: Item[] }

/** The order of the "Popular right now" cards on the home page: automatic
 *  from demand, or a hand-picked list. */
export function OpsPopular() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<"auto" | "manual">("auto"), [slugs, setSlugs] = useState<string[]>([]), [saving, setSaving] = useState(false);
  const load = useCallback(() => api<Data>("GET", "ops/popular").then((d) => { setData(d); setMode(d.setting.mode); setSlugs(d.setting.slugs.length ? d.setting.slugs : d.effective.map((e) => e.slug)); }).catch((e) => setErr(errorText(e))), []);
  useEffect(() => { void load(); }, [load]);
  if (err && !data) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  const save = async () => {
    setErr(null); setMsg(null); setSaving(true);
    try { await api("POST", "ops/popular", { mode, slugs }); setMsg("保存しました。トップページには数分以内に反映されます。"); await load(); }
    catch (e) { setErr(errorText(e)); } finally { setSaving(false); }
  };
  const setAt = (i: number, slug: string) => setSlugs((xs) => { const next = [...xs]; next[i] = slug; return next.filter(Boolean); });
  const move = (i: number, d: -1 | 1) => setSlugs((xs) => { const j = i + d; if (j < 0 || j >= xs.length) return xs; const next = [...xs]; [next[i], next[j]] = [next[j], next[i]]; return next; });
  const label = (it: Item) => `${it.title}（${it.city}）`;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">トップページの「Popular right now」に出す体験と順番です。「自動」は直近 {data.windowDays} 日の需要（予約 1件 = 3点、乗合ゴルフの問い合わせ 1件 = 1点）の順、需要がまだない分は既定の順で埋めます。「手動」は下の順番どおりに表示します。表示は {data.count} 件、公開中の体験のみです。</p>

      <Card title="いまトップに表示中">
        <Table head={["順位", "体験", "都市"]} rows={data.effective.map((e, i) => [`No.${i + 1}`, e.title, e.city])} compact />
      </Card>

      <Card title={<span>直近 {data.windowDays} 日の需要 <Badge tone="info">自動ランキングの元データ</Badge></span>}>
        {data.demand.length === 0
          ? <p className="pt-small">この期間の予約・問い合わせはまだありません。自動モードでは既定の順（{data.defaults.map((d) => d.title).join("、")}）で表示します。</p>
          : <Table head={["順位", "体験", "予約", "乗合ゴルフ問い合わせ", "点数"]} rows={data.demand.map((d, i) => [i + 1, label(d), d.reservations, d.enquiries, d.score])} compact />}
      </Card>

      <Card title="表示の決め方">
        <div className="pt-row">
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 18 }}><input type="radio" name="mode" checked={mode === "auto"} onChange={() => setMode("auto")} /> 自動（需要順）</label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 18 }}><input type="radio" name="mode" checked={mode === "manual"} onChange={() => setMode("manual")} /> 手動（下の順番）</label>
        </div>
        {mode === "manual" && (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {Array.from({ length: Math.max(data.count, slugs.length) }, (_, i) => (
              <div className="pt-row" key={i}>
                <span className="pt-small" style={{ width: 44 }}>No.{i + 1}</span>
                <select value={slugs[i] ?? ""} onChange={(e) => setAt(i, e.target.value)}>
                  <option value="">（未選択）</option>
                  {data.experiences.map((e) => <option key={e.slug} value={e.slug} disabled={slugs.includes(e.slug) && slugs[i] !== e.slug}>{label(e)}</option>)}
                </select>
                <Button kind="secondary" onClick={() => move(i, -1)} disabled={i === 0 || !slugs[i]}>↑</Button>
                <Button kind="secondary" onClick={() => move(i, 1)} disabled={i >= slugs.length - 1 || !slugs[i]}>↓</Button>
              </div>
            ))}
            <p className="pt-small">未選択の枠は既定の順で埋まります。</p>
          </div>
        )}
        <div className="pt-row" style={{ marginTop: 12 }}><Button onClick={save} disabled={saving || (mode === "manual" && slugs.length === 0)}>保存</Button></div>
      </Card>
    </>
  );
}
