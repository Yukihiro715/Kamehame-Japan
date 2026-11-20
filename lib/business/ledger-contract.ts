export const LEDGER_TABS = {
  bookings: { name: '事業連携_案件', headers: ['案件ID','顧客名','体験','実施日','人数','売上','登録原価','原価状態','根拠','最終確認日','同期データJSON'], payloadColumn: 10 },
  masters: { name: '事業連携_卸値', headers: ['卸値ID','商品名','提供元','単価','単位','確度','適用条件','根拠','最終確認日','同期データJSON'], payloadColumn: 9 },
  reviews: { name: '事業連携_確認待ち', headers: ['確認ID','案件ID','項目','確認内容','根拠','状態','更新日時'] },
} as const;
export const LEDGER_RANGES = ["'事業連携_案件'!A1:K1001", "'事業連携_卸値'!A1:J1001", "'事業連携_確認待ち'!A1:G1001"];
export const LEDGER_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
export function ledgerSheetId(value:unknown):string {
  if(typeof value!=='string')return '';
  const text=value.trim();
  if(/^[A-Za-z0-9_-]{20,120}$/.test(text))return text;
  try {const u=new URL(text);return u.protocol==='https:'&&u.hostname==='docs.google.com'&&!u.username&&!u.password ? u.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]{20,120})(?:\/|$)/)?.[1]??'' : '';} catch {return '';}
}
