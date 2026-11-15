export const MAX_SUPPLIER_FILES = 3;
export const MAX_SUPPLIER_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SUPPLIER_TOTAL_BYTES = 8 * 1024 * 1024;
export const SUPPLIER_FILE_ACCEPT = ".pdf,.xlsx,.xls,.png,.jpg,.jpeg,.webp";
export type SupplierAttachment = { filename: string; content: string };
const extensions = /\.(pdf|xlsx|xls|png|jpe?g|webp)$/i;
export function supplierFileError(files: { name: string; size: number }[]): string {
  if (files.length > MAX_SUPPLIER_FILES) return "添付は3ファイルまでです。";
  if (files.some(f => !extensions.test(f.name) || /[\x00-\x1f\x7f/\\]/.test(f.name) || f.name.length > 180)) return "PDF・Excel（xlsx／xls）・PNG・JPEG・WebPを選んでください。";
  if (files.some(f => !f.size || f.size > MAX_SUPPLIER_FILE_BYTES)) return "1ファイルは空でない5MB以下のファイルにしてください。";
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_SUPPLIER_TOTAL_BYTES) return "添付ファイルの合計は8MB以下にしてください。";
  return "";
}
/** Files are forwarded only to the fixed operations recipients; no public upload URLs. */
export function parseSupplierAttachments(raw: unknown): SupplierAttachment[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw) || raw.length > MAX_SUPPLIER_FILES) return null;
  const result: SupplierAttachment[] = [], sizes: { name: string; size: number }[] = [];
  for (const f of raw) {
    if (!f || typeof f !== "object" || typeof f.filename !== "string" || typeof f.content !== "string" || !f.content.length || f.content.length > Math.ceil(MAX_SUPPLIER_FILE_BYTES / 3) * 4 || f.content.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(f.content)) return null;
    const size = f.content.length / 4 * 3 - (f.content.endsWith("==") ? 2 : f.content.endsWith("=") ? 1 : 0);
    sizes.push({ name: f.filename, size });
    if (supplierFileError(sizes)) return null;
    let header: string;
    try { header = atob(f.content.slice(0, 64)); } catch { return null; }
    const ext = f.filename.split(".").pop()!.toLowerCase();
    const valid = ext === "pdf" ? header.startsWith("%PDF-") : ext === "xlsx" ? header.startsWith("PK\x03\x04") : ext === "xls" ? header.startsWith("\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1") : ext === "png" ? header.startsWith("\x89PNG\r\n\x1a\n") : ext === "webp" ? header.startsWith("RIFF") && header.slice(8, 12) === "WEBP" : header.startsWith("\xff\xd8\xff");
    if (!valid) return null;
    result.push({ filename: f.filename, content: f.content });
  }
  return result;
}
