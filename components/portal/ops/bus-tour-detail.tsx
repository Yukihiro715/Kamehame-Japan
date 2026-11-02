"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorText, jst, yen } from "../client";
import { Badge, Button, Card, Field, Loading, Notice, ReasonAction, Table } from "../ui";

type Rec = Record<string, unknown>;
interface Enquiry extends Rec { id: string; reference: string; status: string; statusJa: string; next: string[]; internal_note: string | null; people: number; renters: number; source_yen: number; fee_yen: number; per_person_yen: number; tours_yen: number; rentals_yen: number; shoe_renters?: number; shoes_yen?: number; total_yen: number; marginYen: number; name: string; email: string; phone: string | null; hotel?: string | null; note: string | null; lang: string; golfers: { name: string; clubs: boolean; hand?: string; shoes: boolean; shoeSize?: string }[] }
interface Detail { enquiry: Enquiry; logs: Rec[]; draft: { subject: string; text: string } }

const s = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const STATUS_JA: Record<string, string> = { received: "受付", handed_over: "提携先へ引き継ぎ済み", guidance_sent: "購入案内送付済み", purchased: "購入済み", confirmed: "予約確定", cancelled: "キャンセル", unavailable: "手配不可" };
const MAIL: Record<string, string> = { sent: "送信済み", blocked: "ブロック（検証環境の許可リスト外）", failed: "送信失敗", unconfigured: "未設定" };
const NEEDS_REASON = new Set(["cancelled", "unavailable"]);

export function OpsBusTourDetail({ id }: { id: string }) {
  const [d, setD] = useState<Detail | null>(null), [err, setErr] = useState<string | null>(null), [msg, setMsg] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null), [copied, setCopied] = useState(false);
  const load = useCallback(() => api<Detail>("GET", `ops/bus-tours/${id}`).then(setD).catch((e) => setErr(errorText(e))), [id]);
  useEffect(() => { void load(); }, [load]);
  const act = async (action: string, body: Rec, ok = "保存しました。") => {
    setErr(null); setMsg(null);
    try { const r = await api<Detail>("POST", `ops/bus-tours/${id}/${action}`, body); setD(r); setMsg(ok); }
    catch (e) { setErr(errorText(e)); throw e; }
  };
  if (err && !d) return <Notice tone="bad">{err}</Notice>;
  if (!d) return <Loading />;
  const e = d.enquiry;
  const noteValue = note ?? e.internal_note ?? "";
  const copyDraft = async () => {
    try { await navigator.clipboard.writeText(`${d.draft.subject}\n\n${d.draft.text}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setErr("コピーできませんでした。下のテキストを選択してコピーしてください。"); }
  };
  return (
    <>
      {err && <Notice tone="bad">{err}</Notice>}
      {msg && <Notice tone="ok">{msg}</Notice>}
      <Card title={`問い合わせ ${e.reference}`} actions={<Badge tone={["purchased", "confirmed"].includes(e.status) ? "ok" : ["cancelled", "unavailable"].includes(e.status) ? "bad" : "info"}>{e.statusJa}</Badge>}>
        <dl className="pt-kv">
          <dt>ツアー</dt><dd>{s(e.course)}（ID {s(e.tour_id)}）</dd>
          <dt>開催日 / 出発</dt><dd>{s(e.tour_date)} / {s(e.pickup)}{e.departure_time ? `（${String(e.departure_time)}発）` : ""}</dd>
          <dt>人数 / レンタル</dt><dd>{e.people}名 / クラブ {e.renters ? `${e.renters}名` : "なし"} · シューズ {e.shoe_renters ? `${e.shoe_renters}名` : "なし"}</dd>
          <dt>受付日時</dt><dd>{jst(String(e.created_at))}</dd>
          <dt>表示残席 / データ更新</dt><dd>{s(e.seats_shown)} / {e.snapshot_updated_at ? jst(String(e.snapshot_updated_at)) : "—"}</dd>
          <dt>お客様</dt><dd>{e.name} · {e.email} · {s(e.phone)} · 言語 {e.lang}</dd>
          <dt>宿泊ホテル</dt><dd>{s(e.hotel)}</dd>
          <dt>備考（お客様記入）</dt><dd>{s(e.note)}</dd>
          <dt>メール</dt><dd>顧客 {MAIL[String(e.customer_mail)] ?? "—"} / 社内 {MAIL[String(e.staff_mail)] ?? "—"} / 提携先 {MAIL[String(e.partner_mail)] ?? "—"}</dd>
        </dl>
      </Card>

      {e.golfers.length > 0 && (
        <Card title="参加者">
          <Table head={["#", "お名前", "クラブ", "利き手", "シューズ", "サイズ"]} rows={e.golfers.map((g, i) => [i + 1, g.name || "—", g.clubs ? "レンタル" : "持参", g.clubs ? (g.hand === "left" ? "左" : "右") : "—", g.shoes ? "レンタル（¥2,200）" : "—", g.shoeSize ?? "—"])} compact />
          <p className="pt-small">レンタルシューズは1人 ¥2,200 でお客様総額に加算済みです。サイズを含め、提携先への引き継ぎメールにも同じ内容を載せています。</p>
        </Card>
      )}
      <Card title="料金（社内内訳・非公開）">
        <p className="pt-note-box">お客様が見ているのは「ツアー料金 {yen(e.per_person_yen)} /人（税込）」「レンタルクラブ ¥5,500 /人」「レンタルシューズ ¥2,200 /人」「合計 {yen(e.total_yen)}」だけです。仕入価格・上乗せ分・粗利は公開ページ・お客様向けメールには出しません。</p>
        <Table head={["項目", "単価", "数量", "金額"]} rows={[
          ["GOLFPAQ価格（仕入）", yen(e.source_yen), `${e.people}名`, yen(e.source_yen * e.people)],
          ["KAMEHAME上乗せ分", yen(e.fee_yen), `${e.people}名`, yen(e.marginYen)],
          ["お客様表示ツアー料金", yen(e.per_person_yen), `${e.people}名`, yen(e.tours_yen)],
          ["レンタルクラブ", "¥5,500", `${e.renters}名`, yen(e.rentals_yen)],
          ["レンタルシューズ", "¥2,200", `${e.shoe_renters ?? 0}名`, yen(e.shoes_yen ?? 0)],
          [<b key="t">お客様総額（税込）</b>, "", "", <b key="v">{yen(e.total_yen)}</b>],
        ]} compact />
      </Card>

      <Card title="状態の更新">
        <p className="pt-small">受付 → 提携先へ引き継ぎ → 購入案内送付 → 購入 → 予約確定。提携先からの購入案内を確認したら「購入案内送付済み」、お客様の購入が済んだら「購入済み」、座席が確保されたら「予約確定」にします。キャンセル・手配不可は理由が必要です。</p>
        <div className="pt-row">
          {e.next.map((n) => NEEDS_REASON.has(n)
            ? <ReasonAction key={n} label={STATUS_JA[n]} kind="danger" onConfirm={(reason) => act("status", { status: n, reason })} />
            : <Button key={n} onClick={() => act("status", { status: n }).catch(() => undefined)}>{STATUS_JA[n]}にする</Button>)}
          {e.next.length === 0 && <span className="pt-small">この問い合わせは終了しています。</span>}
        </div>
        <div className="pt-row" style={{ marginTop: 12 }}>
          <Button kind="secondary" onClick={() => act("resend-partner", {}, "提携先へ引き継ぎメールを送りました。").catch(() => undefined)}>提携先へ引き継ぎメールを再送</Button>
        </div>
      </Card>

      <Card title="購入案内の下書き（お客様向け・総額のみ）">
        <p className="pt-small">提携旅行会社が送る購入案内のたたき台です。販売会社名・旅行業登録番号・購入方法・予約成立条件・キャンセル規定は角括弧の箇所を確定内容に差し替えてください。仕入価格や上乗せ分は含まれていません。</p>
        <div className="pt-row"><Button kind="secondary" onClick={copyDraft}>{copied ? "コピーしました" : "下書きをコピー"}</Button></div>
        <pre className="pt-pre">{d.draft.subject}{"\n\n"}{d.draft.text}</pre>
      </Card>

      <Card title="社内メモ">
        <Field label="メモ（お客様には見えません）"><textarea rows={5} value={noteValue} onChange={(ev) => setNote(ev.target.value)} /></Field>
        <div className="pt-row"><Button onClick={() => act("note", { note: noteValue }).then(() => setNote(null)).catch(() => undefined)}>メモを保存</Button></div>
      </Card>

      <Card title="操作履歴">
        <Table head={["日時", "操作者", "操作", "理由", "内容"]} rows={d.logs.map((l) => [jst(String(l.at)), s(l.actor), s(l.action), s(l.reason), <code key="j">{s(l.after_json)}</code>])} empty="まだ操作はありません。" compact />
      </Card>
    </>
  );
}
