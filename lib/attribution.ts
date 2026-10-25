/** First and latest non-direct touch. Client hints, never proof of an ad charge. */
export const ATTRIBUTION_KEY = 'kh-attribution-v1';
export const ATTRIBUTION_TTL = 30 * 86400000;
const fields = ['utm_source','utm_medium','utm_campaign','utm_id','utm_content','utm_term','gclid','gbraid','wbraid','fbclid','campaign_id','adset_id','ad_id'] as const;
export type Touch = Partial<Record<typeof fields[number], string>> & { landing: string; referrer: string; at: number };
export type Attribution = { version: 1; first: Touch; last: Touch };
const clean = (v: unknown, n = 200) => typeof v === 'string' ? v.replace(/[\r\n\x00-\x1f]/g, '').slice(0,n) : '';
function urlOnly(v: unknown, originOnly = false): string {
  try { const u = new URL(String(v)); return /^https?:$/.test(u.protocol) ? u.origin + (originOnly ? '' : u.pathname) : ''; } catch { return ''; }
}
export function sanitizeAttribution(v: unknown, now = Date.now()): Attribution | undefined {
  if (!v || typeof v !== 'object') return;
  const a = v as Attribution;
  if (a.version !== 1) return;
  function touch(t: Touch): Touch | undefined {
    if (!t || !Number.isFinite(t.at) || t.at > now + 60000 || now-t.at > ATTRIBUTION_TTL) return;
    const out: Touch = {at:t.at,landing:urlOnly(t.landing),referrer:urlOnly(t.referrer,true)};
    if (!out.landing) return;
    for (const key of fields) { const s=clean(t[key], /clid|braid/.test(key)?500:200); if(s) out[key]=s; }
    return out;
  }
  const first=touch(a.first),last=touch(a.last);
  return first && last && first.at <= last.at ? {version:1,first,last} : undefined;
}
export function captureTouch(href: string, referrer: string, at = Date.now()): Touch {
  const u=new URL(href);const t:Touch={landing:urlOnly(href),referrer:urlOnly(referrer,true),at};
  if(t.referrer===u.origin)t.referrer='';
  for(const k of fields){const s=clean(u.searchParams.get(k),/clid|braid/.test(k)?500:200);if(s)t[k]=s;}
  return t;
}
export function channel(t: Touch): string {
  const s=(t.utm_source||'').toLowerCase(),m=(t.utm_medium||'').toLowerCase();
  if(t.gclid||t.gbraid||t.wbraid) return 'google / paid';
  if(/^(meta|facebook|fb|instagram|ig)([-_].*)?$/.test(s)) return /paid|cpc|cpm/.test(m)?'meta / paid_social':'meta / unspecified';
  if(s==='google')return 'google / '+(m||'unspecified');
  if(s)return s+' / '+(m||'unspecified');
  if(t.fbclid)return 'meta / unspecified'; // fbclid alone also occurs on organic links.
  if(t.referrer)return new URL(t.referrer).hostname+' / referral';
  return 'unknown / direct';
}
export function attributionNote(a?: Attribution): string {
  if(!a)return '流入情報: 未取得（同意なし・旧データ等。広告なしを意味しない）';
  return `流入情報（ブラウザ申告）: 初回=${channel(a.first)}; 最終非直接=${channel(a.last)}\n流入原本: ${JSON.stringify(a)}`;
}
