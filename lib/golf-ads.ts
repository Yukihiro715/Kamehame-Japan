// Browser-side measurement for confirmed golf enquiries and Stripe return visits.
export const GOLF_ADS_CONSENT = "kh-openai-ads-consent";
const PIXEL = "QtWHhiduYZ38YLcbmMVyTB";
type Pixel = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global { interface Window { oaiq?: Pixel } }

export function golfPage() {
  return /\/golf(?:-|\/)|\/mt-fuji-golf-day(?:\/|$)/.test(location.pathname);
}

function permitted() {
  try { return location.hostname === "kamehame-japan.com" && localStorage.getItem(GOLF_ADS_CONSENT) === "granted"; }
  catch { return false; }
}

function pixel() {
  if (!permitted()) return;
  if (!window.oaiq) {
    const queue: unknown[][] = [];
    const stub: Pixel = (...args) => { queue.push(args); };
    stub.q = queue;
    window.oaiq = stub;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://bzrcdn.openai.com/sdk/oaiq.min.js";
    document.head.appendChild(script);
    stub("init", { pixelId: PIXEL });
  }
  return window.oaiq;
}

export function initGolfLanding() {
  if (golfPage()) pixel();
}

export function setGolfAdsConsent(choice: "granted" | "denied") {
  try { localStorage.setItem(GOLF_ADS_CONSENT, choice); } catch { return; }
  if (choice === "granted") initGolfLanding();
  else document.cookie = "__oppref=; Path=/; Max-Age=0; Secure; SameSite=Lax";
}

export async function measureGolf(event: string, data: Record<string, unknown>) {
  if (!permitted()) return;
  const lead = event === "bus_tour_enquiry" || (event === "enquiry_sent" && data.experience === "mt-fuji-golf-day");
  const paid = event === "purchase" && Array.isArray(data.items) &&
    data.items.some(item => /golf|ゴルフ|高爾夫/i.test(String(item?.item_name)));
  if (!lead && !paid) return;
  const id = lead ? data.enquiry_id : data.transaction_id;
  if (typeof id !== "string" || !id || (paid && !id.startsWith("cs_live_"))) return;
  // A checkout session ID is private. Use only an opaque, deterministic event ID.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(event + ":" + id));
  const eventId = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  const payload = lead ? { type: "customer_action" } : {
    type: "contents",
    ...(data.currency === "JPY" && typeof data.value === "number" ? { amount: data.value, currency: "JPY" } : {}),
  };
  pixel()?.("measure", lead ? "lead_created" : "order_created", payload, { event_id: eventId, opt_out: true });
}
