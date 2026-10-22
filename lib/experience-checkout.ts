import { catalogFor } from "@/lib/catalog";
import { pricingFor, quote } from "@/lib/pricing";
import { GEIKO_CHECKOUT_PRICES } from "@/lib/geiko-checkout-prices";
import { isLang, type Lang } from "@/lib/i18n";
import { EXPERIENCE_POLICY_VERSION, EXPERIENCE_PRODUCTS, provisionalCopy } from "@/lib/provisional-booking";

export interface ExperienceCheckoutEnv {
  EXPERIENCE_CHECKOUT_ENABLED?: string;
  STRIPE_CHECKOUT_KEY?: string;
  STRIPE_READ_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_EXPERIENCE_WEBHOOK_SECRET?: string;
  GOLF_AUTOMATION_URL?: string;
  GOLF_AUTOMATION_TOKEN?: string;
}
export interface ExperienceOrder {
  requestId: string; slug: string; title: string; name: string; email: string; message: string; lang: Lang;
  date: string; time: string; guests: number; quantity: number; price: string; amount: number;
  city?: string; chargeUnit?: "group" | "guest"; plan?: string; interpreter?: string;
  policyVersion: string; consent: true;
}
const ORIGIN = "https://kamehame-japan.com";
const VERSION = "2026-08-26.dahlia";
export const experienceReference = (id: unknown): id is string => typeof id === "string" && /^KJ-E-[0-9a-f]{32}$/.test(id);
export function checkoutConfigurationChecks(env: ExperienceCheckoutEnv) {
  return {
    enabled: env.EXPERIENCE_CHECKOUT_ENABLED === "true",
    checkout_key: !!env.STRIPE_CHECKOUT_KEY?.startsWith("rk_live_"),
    read_key: !!env.STRIPE_READ_KEY,
    webhook_secret: !!(env.STRIPE_EXPERIENCE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET),
    ledger_token: !!env.GOLF_AUTOMATION_TOKEN,
    ledger_url: !!env.GOLF_AUTOMATION_URL?.startsWith("https://script.google.com/macros/s/"),
  };
}
export function checkoutConfigured(env: ExperienceCheckoutEnv) {
  return Object.values(checkoutConfigurationChecks(env)).every(Boolean);
}
export async function experienceLedger(env: ExperienceCheckoutEnv, action: string, payload: Record<string, unknown> = {}, timeoutMs = 25000) {
  if (!env.GOLF_AUTOMATION_TOKEN || !env.GOLF_AUTOMATION_URL?.startsWith("https://script.google.com/macros/s/")) throw Error("ledger_unconfigured");
  const r = await fetch(env.GOLF_AUTOMATION_URL, {
    method: "POST", headers: { "content-type": "application/json" }, redirect: "follow", signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({ ...payload, action, token: env.GOLF_AUTOMATION_TOKEN }),
  });
  const data = r.ok ? await r.json() as Record<string, unknown> : null;
  if (!data?.ok) throw Error("ledger_unavailable");
  return data;
}
export async function checkoutReady(env: ExperienceCheckoutEnv, timeoutMs = 25000) {
  if (!checkoutConfigured(env)) return false;
  try { const h = await experienceLedger(env, "experience_health", {}, timeoutMs); return h.version === EXPERIENCE_POLICY_VERSION && h.ready === true; }
  catch { return false; }
}

/** The page render's view of readiness. The ledger health check is a round
 *  trip to Google Apps Script (2–3 s), so pages must not pay for it on every
 *  request. Two layers: the answer is kept in this isolate's memory and in
 *  the data centre's Cache API (shared by every isolate there) for
 *  READY_TTL_MS, and refreshed in the background once stale
 *  (stale-while-revalidate). Only a data centre with no answer at all waits,
 *  and at most READY_TIMEOUT_MS. The checkout API itself still asks the
 *  ledger fresh before taking a payment (app/api/experience-checkout). */
const READY_TTL_MS = 5 * 60_000;
const READY_TIMEOUT_MS = 6_000;
const READY_CACHE_URL = "https://kamehame-japan.com/__cache/experience-checkout-ready";
type ReadyEntry = { value: boolean; at: number };
let readyCache: (ReadyEntry & { refreshing?: Promise<boolean> }) | null = null;
export function resetCheckoutReadyCache() { readyCache = null; }
const sharedCache = () => (globalThis as { caches?: { default?: { match(u: string): Promise<Response | undefined>; put(u: string, r: Response): Promise<void> } } }).caches?.default;
async function readShared(): Promise<ReadyEntry | null> {
  try {
    const r = await sharedCache()?.match(READY_CACHE_URL);
    if (!r) return null;
    const j = await r.json() as { ready?: unknown; at?: unknown };
    return typeof j.at === "number" ? { value: j.ready === true, at: j.at } : null;
  } catch { return null; }
}
async function writeShared(entry: ReadyEntry) {
  try {
    await sharedCache()?.put(READY_CACHE_URL, new Response(JSON.stringify({ ready: entry.value, at: entry.at }), {
      headers: { "content-type": "application/json", "cache-control": `max-age=${Math.round(READY_TTL_MS / 1000)}` },
    }));
  } catch { /* the in-memory layer still applies */ }
}
export async function checkoutReadyCached(env: ExperienceCheckoutEnv, now = Date.now()): Promise<boolean> {
  const fresh = (e: ReadyEntry | null) => !!e && now - e.at < READY_TTL_MS;
  const mem = readyCache;
  if (mem && fresh(mem)) return mem.value;
  if (!mem?.refreshing) {
    const shared = await readShared();
    if (shared && fresh(shared)) { readyCache = shared; return shared.value; }
    if (shared && !mem) readyCache = shared; // a stale shared answer still beats waiting
  }
  const refresh = checkoutReady(env, READY_TIMEOUT_MS).then(async (value) => {
    const entry = { value, at: Date.now() };
    readyCache = entry;
    await writeShared(entry);
    return value;
  });
  const stale = readyCache;
  if (stale) {
    // Serve the last answer now; one refresh at a time replaces it when it lands.
    if (!stale.refreshing) stale.refreshing = refresh.finally(() => { if (readyCache === stale) stale.refreshing = undefined; });
    return stale.value;
  }
  return refresh;
}
export async function experienceCheckoutEnabled() {
  try { const { env } = await import("cloudflare:workers"); return await checkoutReadyCached(env); }
  catch { return false; }
}

/** Only dates/party/contact are customer input. Prices, quantity, mode and URLs are server-owned. */
export function parseExperienceOrder(body: Record<string, unknown>, now = Date.now()): ExperienceOrder | null {
  const slug = typeof body.experience === "string" ? body.experience : "";
  const product = EXPERIENCE_PRODUCTS[slug];
  const x = product && catalogFor("en").experiences.find(x => x.slug === slug && x.status === "live");
  if (!x || !product || !isLang(String(body.lang)) || body.consent !== true || body.standard !== true || body.website) return null;
  if (product.adultOnly && body.adultOnly !== true) return null;
  if (product.groupPricing && body.adultOnly !== true) return null;
  if (body.addOns !== undefined && (!Array.isArray(body.addOns) || body.addOns.length)) return null;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!name || name.length > 120 || /[\r\n\x00-\x1f]/.test(name) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length > 4000) return null;
  if (typeof body.request_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id)) return null;
  const guests = Number(body.guests), date = String(body.date ?? ""), time = String(body.time ?? "");
  if (!Number.isInteger(guests) || guests < product.min || guests > product.max) return null;
  const d = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== date) return null;
  const a = x.availability;
  const cutoff = (a?.cutoffTime ?? "17:00").split(":").map(Number);
  const today = new Date(now + 9 * 3600000);
  today.setUTCDate(today.getUTCDate() + (a?.cutoffDays ?? 3) + (today.getUTCHours()*60 + today.getUTCMinutes() >= cutoff[0]*60 + cutoff[1] ? 1 : 0));
  if (date < today.toISOString().slice(0,10) || d.getTime() > now + 366*86400000) return null;
  const times = a?.dates ? a.dates.find(v => v.date === date)?.times ?? [] : a?.startTimes ?? ["10:00"];
  if (!times.includes(time)) return null;
  if (a?.closed?.some(w => w.from <= w.to ? date.slice(5) >= w.from && date.slice(5) <= w.to : date.slice(5) >= w.from || date.slice(5) <= w.to)) return null;
  if (product.adultOnly && [0,6].includes(d.getUTCDay())) return null;
  const quantity = product.groupPricing ? 1 : Math.max(product.minCharge, guests);
  let price = product.price, amount = product.amount * quantity, title = x.title;
  let plan: string | undefined, interpreter: string | undefined;
  if (product.groupPricing) {
    plan = typeof body.plan === "string" ? body.plan : "";
    const view = pricingFor(x, "en");
    if (!view.plans?.some(p => p.id === plan) || !["en", "es", "fr", "none"].includes(String(body.interpreter))) return null;
    interpreter = String(body.interpreter);
    const q = quote(view, plan, guests, date);
    const selected = q && GEIKO_CHECKOUT_PRICES[`${q.peak ? "peak" : "regular"}_${plan}_${guests}`];
    if (!selected || selected.amount !== q?.total) return null;
    price = selected.price; amount = selected.amount;
    title += ` — ${view.plans.find(p => p.id === plan)!.label} (${guests} guests)`;
  } else if (body.plan || (Array.isArray(body.addOns) && body.addOns.length)) return null;
  return { requestId: body.request_id.toLowerCase(), slug, title, name, email, message, lang: body.lang as Lang,
    city: x.city, chargeUnit: product.groupPricing ? "group" : "guest", ...(plan ? { plan, interpreter } : {}),
    date, time, guests, quantity, price, amount, policyVersion: EXPERIENCE_POLICY_VERSION, consent: true };
}

export function checkoutParameters(order: ExperienceOrder, reference: string, createdAt: number) {
  const c = provisionalCopy(order.lang);
  return new URLSearchParams({
    mode: "payment", "line_items[0][price]": order.price, "line_items[0][quantity]": String(order.quantity),
    customer_email: order.email, client_reference_id: reference,
    success_url: `${ORIGIN}/${order.lang}/booked/?stay=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${ORIGIN}/${order.lang}/${order.city ?? "tokyo"}/${order.slug}/?checkout=cancelled#request-form`,
    expires_at: String(Math.floor(createdAt/1000) + 3600),
    "metadata[booking_flow]": "experience_provisional", "metadata[booking_reference]": reference,
    "metadata[experience_slug]": order.slug, "metadata[policy_version]": order.policyVersion,
    "metadata[plan]": order.plan ?? "", "metadata[guests]": String(order.guests),
    "metadata[city]": order.city ?? "tokyo", "metadata[interpreter]": order.interpreter ?? "",
    "payment_intent_data[metadata][booking_reference]": reference,
    "payment_intent_data[metadata][booking_flow]": "experience_provisional",
    "custom_text[submit][message]": `${c.note} ${c.refund}`,
    "adaptive_pricing[enabled]": "false",
    integration_identifier: "kamehame_provisional_qmtzvlpa",
  });
}

export async function openExperienceCheckout(env: ExperienceCheckoutEnv, order: ExperienceOrder) {
  const c = provisionalCopy(order.lang);
  const row = await experienceLedger(env, "experience_create", { order, receipt: { subject: c.paid, text: `${c.pending}\n\n${c.refund}` } });
  const reference = row.id;
  if (!experienceReference(reference) || typeof row.createdAt !== "number") throw Error("invalid_ledger_response");
  if (row.status === "paid_pending") return { ok: false, error: "already_paid" };
  // Do not recreate an uncertain/old session under a new idempotency key.
  if (Date.now() - row.createdAt > 25*60000) return { ok: false, error: "expired_request" };
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST", signal: AbortSignal.timeout(20000),
    headers: { authorization: `Bearer ${env.STRIPE_CHECKOUT_KEY}`, "content-type": "application/x-www-form-urlencoded",
      "Stripe-Version": VERSION, "Idempotency-Key": `experience-${reference}` },
    body: checkoutParameters(order, reference, row.createdAt),
  });
  if (!r.ok) throw Error("checkout_unavailable");
  const s = await r.json() as { id: string; url: string | null; status: string; livemode: boolean; amount_total: number; currency: string };
  if (s.status !== "open" || !s.url) return { ok: false, error: "already_submitted" };
  const url = new URL(s.url);
  if (!s.livemode || s.amount_total !== order.amount || s.currency !== "jpy" || url.protocol !== "https:" || !["checkout.stripe.com","book.stripe.com"].includes(url.hostname)) throw Error("checkout_mismatch");
  // Persist the session before handing the payment URL to the visitor.
  await experienceLedger(env, "experience_session", { id: reference, sessionId: s.id });
  return { ok: true, url: s.url, reference };
}

export async function handleExperienceEvent(env: ExperienceCheckoutEnv, event: { id: string; type: string; data: { object: { id: string; client_reference_id: string } } }) {
  const session = event.data.object;
  if (!env.STRIPE_READ_KEY || !/^cs_live_[A-Za-z0-9]+$/.test(session.id)) throw Error("session_unavailable");
  // Fetch line items, not a browser-supplied total. Metadata is populated by our server.
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}?expand[]=line_items`, {
    headers: { authorization: `Bearer ${env.STRIPE_READ_KEY}`, "Stripe-Version": VERSION }, signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error("session_unavailable");
  const s = await r.json();
  if (s.client_reference_id !== session.client_reference_id || s.metadata?.booking_flow !== "experience_provisional" || s.livemode !== true) throw Error("session_mismatch");
  await experienceLedger(env, "experience_event", { eventId: event.id, eventType: event.type, session: {
    id: s.id, reference: s.client_reference_id, paymentStatus: s.payment_status, status: s.status,
    amount: s.amount_total, subtotal: s.amount_subtotal, currency: s.currency, livemode: s.livemode,
    flow: s.metadata.booking_flow, policyVersion: s.metadata.policy_version, slug: s.metadata.experience_slug,
    items: s.line_items?.data?.map((li: { quantity: number; price: { id: string } }) => ({ price: li.price?.id, quantity: li.quantity })),
    moreItems: s.line_items?.has_more,
  } });
}
