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
