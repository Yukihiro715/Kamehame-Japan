"use client";

/** The browser side of the portal API: same-origin JSON calls with the
 *  portal header (lib/portal/api.ts checks it), plus small formatters. */

export class PortalError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}

export async function api<T = Record<string, unknown>>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/portal/${path}`, {
    method, credentials: "same-origin",
    headers: { "x-kh-portal": "1", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new PortalError(res.status, String(data.error ?? "error"), typeof data.message === "string" ? data.message : undefined);
  return data as T;
}

export const yen = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `¥${n.toLocaleString("ja-JP")}`);
export const pct = (bp: number | null | undefined) => (bp === null || bp === undefined ? "—" : `${(bp / 100).toLocaleString("ja-JP", { maximumFractionDigits: 2 })}%`);
export const jst = (iso: string | null | undefined, withTime = true) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}) });
};
export const ERROR_JA: Record<string, string> = {
  unauthenticated: "サインインしてください。", forbidden: "この操作の権限がありません。", not_found: "見つかりません。", ledger_unavailable: "台帳データベースに接続できません。",
  invalid: "コードが違います。", expired: "コードの有効期限が切れました。もう一度コードを送ってください。", locked: "試行回数の上限です。もう一度コードを送ってください。",
  reason_required: "理由を入力してください。", bad_rate: "料率が正しくありません。", unknown_experience: "体験が見つかりません。", bad_url: "URLは https:// から始めてください。",
  already_settled: "精算済みの紹介料です。差分台帳で処理します。", allocation_total_mismatch: "配賦の合計が返金額と一致しません。", over_refund: "明細の金額を超えています。",
  hotels_not_in_entity: "同じ契約法人の施設だけをまとめられます。", bad_role: "役割が正しくありません。", invalid_email: "メールアドレスが正しくありません。", fields_required: "必須項目が未入力です。",
};
export const errorText = (e: unknown) => (e instanceof PortalError ? ERROR_JA[e.code] ?? e.message ?? e.code : e instanceof Error ? e.message : "エラーが発生しました。");
