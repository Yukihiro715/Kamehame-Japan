/** Small shared pieces for the portal API: JSON answers, body parsing, periods, CSV. */
import { jstDate } from "@/lib/referral/db";

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(data, { status, headers: { "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...headers } });

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}
export const bad = (code: string, message?: string) => new ApiError(400, code, message);
export const forbidden = () => new ApiError(403, "forbidden");
export const notFound = () => new ApiError(404, "not_found");

export async function readJson(request: Request, max = 64000): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > max) throw new ApiError(413, "too_large");
  if (!text) return {};
  try { const v = JSON.parse(text); return v && typeof v === "object" ? v as Record<string, unknown> : {}; }
  catch { throw bad("bad_json"); }
}

export const str = (v: unknown, max = 200): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const int = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) ? v : typeof v === "string" && /^-?\d+$/.test(v.trim()) ? Number(v) : null);
export const isoDate = (v: unknown): string | null => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? v : null);

/** A JST calendar period [from, to] as UTC instants: from 00:00 JST to 24:00 JST. */
export function periodBounds(from: string, to: string) {
  const start = new Date(`${from}T00:00:00+09:00`).toISOString();
  const end = new Date(new Date(`${to}T00:00:00+09:00`).getTime() + 86400000).toISOString();
  return { start, end };
}

/** Preset periods in JST: this month, last month, this quarter, last quarter. */
export function presetPeriod(name: string, now = Date.now()): { from: string; to: string } | null {
  const today = jstDate(now);
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const month = (yy: number, mm: number) => ({ from: `${yy}-${pad(mm)}-01`, to: `${yy}-${pad(mm)}-${pad(lastDay(yy, mm))}` });
  const quarter = (yy: number, q: number) => ({ from: `${yy}-${pad((q - 1) * 3 + 1)}-01`, to: `${yy}-${pad(q * 3)}-${pad(lastDay(yy, q * 3))}` });
  const q = Math.floor((m - 1) / 3) + 1;
  switch (name) {
    case "this_month": return month(y, m);
    case "last_month": return m === 1 ? month(y - 1, 12) : month(y, m - 1);
    case "this_quarter": return quarter(y, q);
    case "last_quarter": return q === 1 ? quarter(y - 1, 4) : quarter(y, q - 1);
    default: return null;
  }
}

/** CSV with a UTF-8 BOM (Excel) and formula-injection guarding (要件 12). */
export function toCsv(header: string[], rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

export const RESERVATION_STATUS_JA: Record<string, string> = { provisional: "仮予約", arranging: "手配中", confirmed: "予約確定", completed: "実施済み", cancelled: "キャンセル", no_show: "未実施" };
export const PAYMENT_STATUS_JA: Record<string, string> = { unpaid: "未決済", partial: "一部決済", paid: "決済済み", partially_refunded: "一部返金", refunded: "全額返金", disputed: "支払紛争" };
export const ENTRY_STATUS_JA: Record<string, string> = { estimated: "見込", pending: "確認待ち", confirmed: "確定", voided: "取消", adjusted: "確定（調整あり）" };
export const HOLD_JA: Record<string, string> = {
  rate_missing: "料率未設定", payee_missing: "精算先未設定", performed_in_future: "実施日時が未来", amount_pending: "対象金額未確定",
  payment_incomplete: "決済未完了", dispute_open: "紛争中", refund_allocation: "返金配賦待ち",
};
export const MEDIUM_JA: Record<string, string> = { brochure: "パンフレット", room_tv: "客室TV", front: "フロント", web: "Web", other: "その他" };
