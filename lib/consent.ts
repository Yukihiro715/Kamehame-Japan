// Google Consent Mode v2.
//
// Nothing that can identify a visitor is stored until they say yes. The
// default below runs before the GTM container, so tags load in "denied"
// mode (cookieless pings) and only switch on after a choice.
//
// The strict default is scoped to the EEA, the UK and Switzerland by
// region, which Google resolves from the request IP — so a visitor there
// is protected whether or not the banner managed to detect them. Outside
// those countries analytics runs by default, and the footer's "Cookie
// settings" link still lets anyone turn it off.
//
// Microsoft Clarity (loaded by GTM, gated on analytics_storage) does not read
// Consent Mode, so the same choice is queued for it through its own
// consentv2 call; the stub keeps the call until the Clarity script arrives.
// The Meta Pixel also ignores Consent Mode: GTM gates it on ad_storage, and
// fbq('consent', …) reaches it when it is already running.

export const CONSENT_KEY = "kh-consent";

/** EEA + UK + Switzerland, where consent is required before storage. */
const STRICT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
  "SK", "SI", "ES", "SE", "GB", "CH",
];

/** True only when the visitor clicked Accept (not the regional default).
 *  The hashed email for ad matching needs this: outside the EEA measurement
 *  runs by default, but matching an email against Google or Meta accounts is
 *  a transfer that Japanese law expects the person to agree to first. */
export function acceptedExplicitly(): boolean {
  try { return localStorage.getItem(CONSENT_KEY) === "granted"; } catch { return false; }
}

/** Runs in <head>, before the container. Kept as a string so it is inline.
 *  First it moves a Stripe checkout id out of /booked/ URLs into
 *  sessionStorage, so no tag, pixel or referrer ever carries it. It also
 *  re-applies the stored choice when a page comes back from the back/forward
 *  cache or the choice changes in another tab. */
export const consentDefaultScript = `
try{var kq=new URLSearchParams(location.search),ks=kq.get('session_id');if(ks&&location.pathname.split('/')[2]==='booked'){sessionStorage.setItem('kh-checkout-session',ks);kq.delete('session_id');var kr=kq.toString();history.replaceState(history.state,'',location.pathname+(kr?'?'+kr:'')+location.hash)}}catch(e){}
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500,region:${JSON.stringify(STRICT_REGIONS)}});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted',functionality_storage:'granted',security_storage:'granted'});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
try{var c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(c==='granted'||c==='denied'){gtag('consent','update',{ad_storage:c,ad_user_data:c,ad_personalization:c,analytics_storage:c});clarity('consentv2',{ad_Storage:c,analytics_Storage:c})}}catch(e){}
function khConsent(s){if(s!=='granted'&&s!=='denied')return;gtag('consent','update',{ad_storage:s,ad_user_data:s,ad_personalization:s,analytics_storage:s});clarity('consentv2',{ad_Storage:s,analytics_Storage:s});if(typeof window.fbq==='function')fbq('consent',s==='granted'?'grant':'revoke')}
addEventListener('pageshow',function(e){if(!e.persisted)return;try{khConsent(localStorage.getItem(${JSON.stringify(CONSENT_KEY)}))}catch(x){}});
addEventListener('storage',function(e){if(e.key===${JSON.stringify(CONSENT_KEY)})khConsent(e.newValue)});
`.trim();
