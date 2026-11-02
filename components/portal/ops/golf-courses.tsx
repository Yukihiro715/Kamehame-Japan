"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst } from "../client";
import { Badge, Button, Card, Loading, Notice } from "../ui";

interface Row { name: string; tours: number; name_en: string | null; name_ja?: string | null; name_es?: string | null; name_fr?: string | null; name_zh_tw?: string | null; area: string | null; note?: string | null; updated_at?: string; updated_by?: string | null; missingEn: boolean; inSchedule: boolean; seed: { en: string; area: string } | null }
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
  const save = async (r: Row) => {
    setErr(null); setMsg(null);
    try {
      await api("POST", "ops/golf-courses", { name: r.name, name_en: val(r, "name_en"), name_ja: val(r, "name_ja"), name_es: val(r, "name_es"), name_fr: val(r, "name_fr"), name_zh_tw: val(r, "name_zh_tw"), area: val(r, "area"), note: val(r, "note") });
      setMsg(`${r.name} を保存しました。`); await load();
    } catch (e) { setErr(errorText(e)); }
  };
  const missing = data.courses.filter((c) => c.missingEn).length;
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <p className="pt-note-box">提携先の日程に出てくるゴルフ場名（日本語）と、サイトで表示する名前です。英語名が空のコースは英語ページでも日本語のまま表示されます。保存するとすぐ反映されます（配備不要）。日程データ更新: {data.updatedAt ? jst(data.updatedAt) : "—"}</p>
      {missing > 0 && <Notice tone="warn">英語名が未設定のコースが {missing} 件あります。</Notice>}
      {data.courses.map((r) => (
        <Card key={r.name} title={<span>{r.name} {r.inSchedule ? <Badge tone="info">掲載中 {r.tours}本</Badge> : <Badge>日程なし</Badge>} {r.missingEn && <Badge tone="warn">英語名なし</Badge>}</span>}>
          <div className="pt-grid-3">
            <label className="pt-field"><span className="pt-field-l">英語名（English）</span><input value={val(r, "name_en")} onChange={(e) => set(r, "name_en", e.target.value)} placeholder={r.seed?.en ?? ""} /></label>
            <label className="pt-field"><span className="pt-field-l">日本語表示名（空なら取得名）</span><input value={val(r, "name_ja")} onChange={(e) => set(r, "name_ja", e.target.value)} placeholder={r.name} /></label>
            <label className="pt-field"><span className="pt-field-l">都道府県（英語）</span><input list="kh-areas" value={val(r, "area")} onChange={(e) => set(r, "area", e.target.value)} placeholder={r.seed?.area ?? "Chiba"} /></label>
            <label className="pt-field"><span className="pt-field-l">Español</span><input value={val(r, "name_es")} onChange={(e) => set(r, "name_es", e.target.value)} /></label>
            <label className="pt-field"><span className="pt-field-l">Français</span><input value={val(r, "name_fr")} onChange={(e) => set(r, "name_fr", e.target.value)} /></label>
            <label className="pt-field"><span className="pt-field-l">繁體中文</span><input value={val(r, "name_zh_tw")} onChange={(e) => set(r, "name_zh_tw", e.target.value)} /></label>
          </div>
          <label className="pt-field"><span className="pt-field-l">メモ（社内）</span><input value={val(r, "note")} onChange={(e) => set(r, "note", e.target.value)} /></label>
          <div className="pt-row"><Button onClick={() => save(r)} disabled={!edit[r.name]}>保存</Button>{r.updated_at && <span className="pt-small">最終更新 {jst(r.updated_at)} {r.updated_by ?? ""}</span>}</div>
        </Card>
      ))}
      <datalist id="kh-areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist>
    </>
  );
}
