/** QR codes for hotel links, as SVG (print) and PNG (screens, mail).
 *
 *  The matrix comes from qrcode-generator (pure JS, no canvas). The PNG is
 *  written here: an 8-bit greyscale image, one filter byte per row, zlib
 *  deflate through CompressionStream, which Workers and Node both provide.
 *  Nothing private goes into a code: only https://kamehame-japan.com/r/<token>. */
import qrcode from "qrcode-generator";

const ERROR_LEVEL = "M";

function matrix(text: string): boolean[][] {
  const qr = qrcode(0, ERROR_LEVEL);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const rows: boolean[][] = [];
  for (let r = 0; r < n; r++) { const row: boolean[] = []; for (let c = 0; c < n; c++) row.push(qr.isDark(r, c)); rows.push(row); }
  return rows;
}

/** An SVG with a quiet zone of four modules; `size` is the drawn width in px (viewBox scales). */
export function qrSvg(text: string, opts: { size?: number; margin?: number } = {}): string {
  const m = matrix(text), n = m.length, margin = opts.margin ?? 4, size = opts.size ?? 512;
  const total = n + margin * 2;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${c + margin} ${r + margin}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="#ffffff"/><path d="${d}" fill="#171a21"/></svg>`;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)], 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** A PNG of the code: `scale` px per module, `margin` modules of quiet zone. */
export async function qrPng(text: string, opts: { scale?: number; margin?: number } = {}): Promise<Uint8Array> {
  const m = matrix(text), n = m.length, scale = opts.scale ?? 10, margin = opts.margin ?? 4;
  const size = (n + margin * 2) * scale;
  const raw = new Uint8Array((size + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size + 1);
    raw[row] = 0; // filter: none
    const r = Math.floor(y / scale) - margin;
    for (let x = 0; x < size; x++) {
      const c = Math.floor(x / scale) - margin;
      const dark = r >= 0 && r < n && c >= 0 && c < n && m[r][c];
      raw[row + 1 + x] = dark ? 0x17 : 0xff;
    }
  }
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, size); v.setUint32(4, size);
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit greyscale, no interlace
  const parts = [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", await deflate(raw)), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}
