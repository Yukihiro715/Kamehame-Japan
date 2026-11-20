"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyCoursePricing, type CoursePricing } from "@/lib/golf-course-pricing";
import { api, errorText, jst } from "../client";
import { Badge, Button, Card, Loading, Notice } from "../ui";

interface Row { pricing: CoursePricing | null; name: string; tours: number; name_en: string | null; name_ja?: string | null; name_es?: string | null; name_fr?: string | null; name_zh_tw?: string | null; area: string | null; note?: string | null; updated_at?: string; updated_by?: string | null; missingEn: boolean; autoEn: boolean; inSchedule: boolean; seed: { en: string; area: string } | null }
interface Data { courses: Row[]; updatedAt: string | null }
const AREAS = ["Chiba", "Ibaraki", "Tochigi", "Saitama", "Gunma", "Kanagawa", "Tokyo", "Shizuoka", "Yamanashi"];

/** The partner's course names with the names shown per language. Rows missing
 *  an English name come first: on the English pages they fall back to the
 *  Japanese name until someone fills them in. */
export function OpsGolfCourses() {
  const [data, setData] = useState<Data | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, Partial<Row>>>({});
  const load = useCallback(() => api<Data>("GET", "ops/golf-courses").then((d) => { setData(d); setEdit({}); }).catch((e) => setErr(errorText(e))), []);
  useEffect(() => { void load(); }, [load]);
  if (err && !data) return <Notice tone="bad">{err}</Notice>;
  if (!data) return <Loading />;
  const val = (r: Row, k: keyof Row) => (edit[r.name]?.[k] ?? r[k] ?? "") as string;
  const set = (r: Row, k: keyof Row, v: string) => setEdit((e) => ({ ...e, [r.name]: { ...e[r.name], [k]: v } }));
  const pricing=(r:Row)=>edit[r.name]?.pricing??r.pricing??emptyCoursePricing;
  const setPrice=(r:Row,k:keyof CoursePricing,v:string|number|null)=>setEdit(e=>({...e,[r.name]:{...e[r.name],pricing:{...pricing(r),[k]:v}}}));
  const save = async (r: Row) => {
    setErr(null); setMsg(null);
    try {
      await api("POST", "ops/golf-courses", { name: r.name, name_en: val(r, "name_en"), name_ja: val(r, "name_ja"), name_es: val(r, "name_es"), name_fr: val(r, "name_fr"), name_zh_tw: val(r, "name_zh_tw"), area: val(r, "area"), note: val(r, "note"), pricing: pricing(r) });
      setMsg(`${r.name} を保存しました。`); await load();
    } catch (e) { setErr(errorText(e)); }
  };
  const missing = data.courses.filter((c) => c.missingEn).length;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">ゴルフ場の表示名と、料金・人数割増・レンタルの確認用一覧です。料金は1人あたりの参考額で、日付・プランの条件を併記しています。未確認は空欄です。予約ごとの仕入原価は「案件・原価管理」で管理します。日程更新：{data.updatedAt ? jst(data.updatedAt) : "—"}</p>
      {missing > 0 && <Notice tone="warn">英語名が未設定のコースが {missing} 件あります。</Notice>}
      {data.courses.map((r) => (
        <Card key={r.name} title={<span>{r.name} {r.inSchedule ? <Badge tone="info">掲載中 {r.tours}本</Badge> : <Badge>日程なし</Badge>} {r.missingEn && <Badge tone="warn">英語名なし</Badge>} {r.autoEn && <Badge tone="warn">英語名は自動翻訳（要確認）</Badge>}</span>}>
          <div className="pt-row">{pricing(r).goraUrl&&<a className="pt-btn" href={pricing(r).goraUrl} target="_blank" rel="noreferrer">楽天GORAで料金・日程を確認 ↗</a>}{pricing(r).source&&<a className="pt-btn" href={pricing(r).source} target="_blank" rel="noreferrer">公式料金・根拠 ↗</a>}<span className="pt-small">確認日：{pricing(r).checkedOn||"未確認"}</span></div>
          <div className="pt-grid-3">{([['weekday','平日プレー料金'],['weekend','土日祝プレー料金'],['twoWeekday','平日2サム割増'],['twoWeekend','土日祝2サム割増'],['threeWeekday','平日3サム割増'],['threeWeekend','土日祝3サム割増'],['clubs','クラブレンタル（1セット）'],['shoes','シューズレンタル']] as const).map(([key,label])=><label className="pt-field" key={key}><span className="pt-field-l">{label}（円）</span><input type="number" min="0" step="1" value={pricing(r)[key]??''} placeholder="未確認・日付別" onChange={e=>setPrice(r,key,e.target.value===''?null:Number(e.target.value))}/></label>)}</div>
          <label className="pt-field"><span className="pt-field-l">料金の適用条件・プラン・税込区分</span><textarea rows={4} value={pricing(r).conditions} onChange={e=>setPrice(r,'conditions',e.target.value)}/></label>
          <div className="pt-grid-3"><label className="pt-field"><span className="pt-field-l">楽天GORAの施設URL</span><input type="url" value={pricing(r).goraUrl} onChange={e=>setPrice(r,'goraUrl',e.target.value)}/></label><label className="pt-field"><span className="pt-field-l">料金の根拠URL</span><input type="url" value={pricing(r).source} onChange={e=>setPrice(r,'source',e.target.value)}/></label><label className="pt-field"><span className="pt-field-l">確認日</span><input type="date" value={pricing(r).checkedOn} onChange={e=>setPrice(r,'checkedOn',e.target.value)}/></label></div>
          <details><summary>表示名・翻訳を編集</summary>
          <div className="pt-grid-3">
            <label className="pt-field"><span className="pt-field-l">英語名（English）</span><input value={val(r, "name_en")} onChange={(e) => set(r, "name_en", e.target.value)} placeholder={r.seed?.en ?? ""} /></label>
            <label className="pt-field"><span className="pt-field-l">日本語表示名（空なら取得名）</span><input value={val(r, "name_ja")} onChange={(e) => set(r, "name_ja", e.target.value)} placeholder={r.name} /></label>
            <label className="pt-field"><span className="pt-field-l">都道府県（英語）</span><input list="kh-areas" value={val(r, "area")} onChange={(e) => set(r, "area", e.target.value)} placeholder={r.seed?.area ?? "Chiba"} /></label>
            <label className="pt-field"><span className="pt-field-l">Español</span><input value={val(r, "name_es")} onChange={(e) => set(r, "name_es", e.target.value)} /></label>
            <label className="pt-field"><span className="pt-field-l">Français</span><input value={val(r, "name_fr")} onChange={(e) => set(r, "name_fr", e.target.value)} /></label>
            <label className="pt-field"><span className="pt-field-l">繁體中文</span><input value={val(r, "name_zh_tw")} onChange={(e) => set(r, "name_zh_tw", e.target.value)} /></label>
          </div>
          </details><label className="pt-field"><span className="pt-field-l">メモ（社内）</span><input value={val(r, "note")} onChange={(e) => set(r, "note", e.target.value)} /></label>
          <div className="pt-row"><Button onClick={() => save(r)} disabled={!edit[r.name]}>保存</Button>{r.updated_at && <span className="pt-small">最終更新 {jst(r.updated_at)} {r.updated_by ?? ""}</span>}</div>
        </Card>
      ))}
      <datalist id="kh-areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
    </>
  );
}
