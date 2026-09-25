// Google Tag Manager container. Everything else (GA4, Ads conversions,
// Search Console verification) is configured inside GTM, not in this repo —
// so tags can change without a deploy.
export const GTM_ID = "GTM-57CCF3MQ";

interface DataLayerEvent { event: string; [key: string]: unknown }

declare global {
  interface Window { dataLayer?: DataLayerEvent[] }
}

/** A unique id for one conversion (Google Ads de-duplicates on it). */
export const eventId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Push an event for GTM. Safe before the container loads (the snippet
 *  creates the array) and a no-op during server rendering. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}
