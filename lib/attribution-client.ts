import { acceptedExplicitly } from './consent';
import { ATTRIBUTION_KEY, captureTouch, sanitizeAttribution, type Attribution } from './attribution';
let consumedReferrer = false;
let lastTouchSignature = '';
/** Honor existing explicit consent. Rejected/unknown consent never sends identifiers. */
export function readAttribution(): Attribution | undefined {
  if(typeof window==='undefined')return;
  if(!acceptedExplicitly()){try{localStorage.removeItem(ATTRIBUTION_KEY)}catch{}return;}
  const current=captureTouch(location.href,consumedReferrer ? '' : document.referrer);
  const signature=JSON.stringify({...current,at:0,referrer:''});
  let old:Attribution|undefined;
  try{old=sanitizeAttribution(JSON.parse(localStorage.getItem(ATTRIBUTION_KEY)||'null'));}catch{}
  const hasSource=!!(current.utm_source||current.gclid||current.gbraid||current.wbraid||current.fbclid||current.referrer);
  // Do not replace acquisition with direct internal navigation or the same landing touch.
  const changed=signature!==lastTouchSignature;
  consumedReferrer=true;
  lastTouchSignature=signature;
  const value:Attribution=old?{...old,last:hasSource&&changed?current:old.last}:{version:1,first:current,last:current};
  try{localStorage.setItem(ATTRIBUTION_KEY,JSON.stringify(value));}catch{}
  return value;
}

/** Read GA identifiers through Google's supported getter, only after opt-in.
 * Never delay a booking indefinitely when GTM is blocked. Do not read GA cookies.
 * Re-check consent after the callbacks: revocation must win a pending read. */
export async function collectAttribution(): Promise<Attribution | undefined> {
  const value = readAttribution();
  if (!value) return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return value;
  const get = (field: string) => new Promise<unknown>((resolve) => {
    const timer = setTimeout(() => resolve(undefined), 300);
    try { gtag('get', 'G-5PQXBXVZWE', field, (v: unknown) => { clearTimeout(timer); resolve(v); }); }
    catch { clearTimeout(timer); resolve(undefined); }
  });
  const [clientId, sessionId] = await Promise.all([get('client_id'), get('session_id')]);
  if (!acceptedExplicitly()) return;
  return sanitizeAttribution({...value, ga: {clientId, sessionId: sessionId == null ? undefined : String(sessionId)}});
}
