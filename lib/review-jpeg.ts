// A structural JPEG copy, not a decoder. Keep frame/tables/scans but drop
// source APP (EXIF/XMP/ICC/JFIF) and COM segments. For non-normal EXIF
// orientation, generate a fresh, one-field orientation segment, never copy it.
function exifOrientation(data: Uint8Array<ArrayBuffer>, start: number, end: number): number {
  if (end - start < 14 || String.fromCharCode(...data.subarray(start, start + 6)) !== "Exif\0\0") return 1;
  const tiff = start + 6;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const byteOrder = view.getUint16(tiff);
  if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) return 1;
  const le = byteOrder === 0x4949;
  if (view.getUint16(tiff + 2, le) !== 42) return 1;
  const ifd = tiff + view.getUint32(tiff + 4, le);
  if (ifd < tiff + 8 || ifd + 2 > end) return 1;
  const count = view.getUint16(ifd, le);
  if (ifd + 2 + 12 * count > end) return 1;
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (view.getUint16(entry, le) === 0x112 && view.getUint16(entry + 2, le) === 3 && view.getUint32(entry + 4, le) === 1) {
      const value = view.getUint16(entry + 8, le);
      return value >= 2 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

function orientationOnly(orientation: number) {
  // SOI, APP1 with a big-endian TIFF orientation tag, and no other fields.
  return Uint8Array.of(255,216, 255,225,0,34, 69,120,105,102,0,0,
    77,77,0,42,0,0,0,8, 0,1, 1,18,0,3,0,0,0,1,0,orientation,0,0, 0,0,0,0);
}

export function sanitizeReviewJpeg(bytes: ArrayBuffer): Uint8Array<ArrayBuffer> | null {
  const data = new Uint8Array(bytes);
  const view = new DataView(bytes);
  if (data.length < 4 || data[0] !== 255 || data[1] !== 216) return null;
  const parts: Uint8Array<ArrayBuffer>[] = [];
  let orientation = 1;
  let hasFrame = false;
  let hasScan = false;
  let pos = 2;
  while (pos < data.length) {
    const start = pos;
    if (data[pos++] !== 255) return null;
    while (data[pos] === 255) pos++; // JPEG fill bytes between markers
    const marker = data[pos++];
    if (marker === 217) {
      if (!hasFrame || !hasScan) return null;
      // Drop trailing payload after EOI.
      const lead = orientation === 1 ? Uint8Array.of(255,216) : orientationOnly(orientation);
      const end = Uint8Array.of(255,217);
      const out = new Uint8Array(lead.length + parts.reduce((n, p) => n + p.length, 0) + end.length);
      let at = 0;
      for (const part of [lead, ...parts, end]) { out.set(part, at); at += part.length; }
      return out;
    }
    if (pos + 2 > data.length) return null;
    const length = view.getUint16(pos);
    const next = pos + length;
    if (length < 2 || next > data.length) return null;
    if (marker >= 224 && marker <= 239 || marker === 254) {
      if (marker === 225 && orientation === 1) orientation = exifOrientation(data, pos + 2, next);
      pos = next;
      continue;
    }
    if (marker === 192 || marker === 193 || marker === 194) {
      if (hasFrame || length < 11) return null;
      const height = view.getUint16(pos + 3);
      const width = view.getUint16(pos + 5);
      const components = data[pos + 7];
      if (!height || !width || height * width > 48_000_000 || ![1, 3].includes(components) || 8 + 3 * components !== length) return null;
      hasFrame = true;
    } else if (marker === 218) {
      if (!hasFrame || length < 8) return null;
      hasScan = true;
    } else if (![196, 219, 221].includes(marker)) return null;

    pos = next;
    if (marker === 218) {
      // Keep entropy coding, including stuffed FF and restart bytes, until
      // the next real marker. This also handles multiple progressive scans.
      while (pos < data.length) {
        if (data[pos++] !== 255) continue;
        const markerStart = pos - 1;
        while (data[pos] === 255) pos++;
        const value = data[pos];
        if (value === 0 || value >= 208 && value <= 215) { pos++; continue; }
        pos = markerStart;
        break;
      }
      if (pos === data.length) return null;
    }
    parts.push(data.subarray(start, pos));
  }
  return null;
}
