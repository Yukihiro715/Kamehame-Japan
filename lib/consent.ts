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

export const CONSENT_KEY = "kh-consent";

/** EEA + UK + Switzerland, where consent is required before storage. */
const STRICT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
  "SK", "SI", "ES", "SE", "GB", "CH",
];

/** Runs in <head>, before the container. Kept as a string so it is inline. */
export const consentDefaultScript = `
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500,region:${JSON.stringify(STRICT_REGIONS)}});
gtag('consent','default',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted',functionality_storage:'granted',security_storage:'granted'});
gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);
window.clarity=window.clarity||function(){(window.clarity.q=window.clarity.q||[]).push(arguments)};
try{var c=localStorage.getItem(${JSON.stringify(CONSENT_KEY)});if(c==='granted'||c==='denied'){gtag('consent','update',{ad_storage:c,ad_user_data:c,ad_personalization:c,analytics_storage:c});clarity('consentv2',{ad_Storage:c,analytics_Storage:c})}}catch(e){}
`.trim();
