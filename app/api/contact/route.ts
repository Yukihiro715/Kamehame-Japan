import { CONTACT_EMAIL, TRADE_EMAIL, type Enquiry } from "@/lib/contact";
import { acknowledgement, followUp, threadSubject } from "@/lib/mail-copy";
import { catalogFor } from "@/lib/catalog";
import { isLang } from "@/lib/i18n";
import { notifySlack, slackMessage } from "@/lib/slack";
import { GOLF_OWN_CLUBS_DISCOUNT_JPY, GOLF_PRICE_VERSION, golfPackagePrice, golfTotalWithOwnClubs, isArrangement, isGolfArea, isGolfGolfers, ownClubsCount, type GolfCourseMode } from "@/lib/golf-prices";
import { yen } from "@/lib/pricing";
import { golfPriceNoteJa, notificationBody } from "@/lib/notification";
import { translateForTeam, type TranslatedField } from "@/lib/translate";
import { automationConfigured, submitGolfAutomation } from "@/lib/golf-automation";
import { ledgerRecord, postToLedger } from "@/lib/ledger";

// The cloudflare:* modules exist only inside the Worker runtime. They are
// imported lazily so the Node preview server (`vinext start`) and the test
// runner can still load this route; outside the Worker, delivery reports
// itself as unconfigured and the page falls back to the plain address.
async function bindings() {
  try {
    const [{ env }, { EmailMessage }] = await Promise.all([
      import("cloudflare:workers"),
      import("cloudflare:email"),
    ]);
    return { env, EmailMessage };
  } catch {
    return null;
  }
}

// Delivery. Two routes, tried in this order:
//   1. Resend, when the RESEND_API_KEY secret exists — sends the internal
//      notification to CONTACT_TO and an acknowledgement to the visitor.
//   2. The Cloudflare send_email binding — internal notification only, and
//      only to a destination verified in Email Routing. Kept as the fallback
//      so a Resend outage or an unverified domain never loses an enquiry.
// The From addresses must be on our own domain.
const FROM = "enquiries@kamehame-japan.com";
const REPLY = "hello@kamehame-japan.com";

/** The experience's Japanese title, for the team's Slack alert. */
function jaTitle(e: Enquiry): string | undefined {
  if (!e.experience) return undefined;
  return catalogFor("ja").experiences.find((x) => x.slug === e.experience)?.title;
}

/** The experience's title in the visitor's language, for the acknowledgement. */
function titleFor(e: Enquiry): string | undefined {
  if (!e.experience || !isLang(e.lang)) return undefined;
  return catalogFor(e.lang).experiences.find((x) => x.slug === e.experience)?.title;
}

type Translations = Partial<Record<TranslatedField, string>>;

/** How long after the acknowledgement the personal follow-up goes out. */
const FOLLOW_UP_MINUTES = 15;

const RESEND = "https://api.resend.com";
const headersFor = (key: string) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

type ScheduledFollowUp = { id: string; scheduledAt: string };

/** Keep the exact provider ID and send time with the internal notification,
 *  so staff can cancel this follow-up after sending their own reply. */
async function scheduleFollowUp(key: string, e: Enquiry, subject: string, text: string): Promise<ScheduledFollowUp | null> {
  const scheduledAt = new Date(Date.now() + FOLLOW_UP_MINUTES * 60_000).toISOString();
  try {
    const res = await fetch(`${RESEND}/emails`, {
      method: "POST",
      headers: headersFor(key),
      body: JSON.stringify({
        from: `Yukihiro, KAMEHAME JAPAN <${REPLY}>`,
        to: [e.email],
        reply_to: REPLY,
        subject,
        text,
        scheduled_at: scheduledAt,
        tags: [{ name: "kind", value: "follow-up" }],
      }),
    });
    if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const { id } = (await res.json()) as { id?: string };
    return id ? { id, scheduledAt } : null;
  } catch (err) {
    console.error("contact: follow-up scheduling failed", err);
    return null;
  }
}

async function cancelScheduled(key: string, id: string): Promise<void> {
  try {
    await fetch(`${RESEND}/emails/${id}/cancel`, { method: "POST", headers: headersFor(key) });
  } catch (err) {
    console.error("contact: could not cancel follow-up", err);
  }
}

/** The team's copy and the acknowledgement in one batch call (Resend rejects
 *  the whole batch if the domain is not verified, which the caller treats as
 *  "try the fallback"), with the personal follow-up scheduled first so the
 *  team's copy can say whether it is on its way. */
async function sendViaResend(key: string, to: string[], e: Enquiry, ja: Translations): Promise<{ followUpScheduled: boolean }> {
  const title = titleFor(e);
  const ack = acknowledgement(e, title);
  const safeName = e.name.replace(/[<>"\r\n]/g, "");
  const jaName = jaTitle(e);
  const later = e.kind === "guest" ? followUp(e, title) : null;
  const scheduled = later ? await scheduleFollowUp(key, e, later.subject, later.text) : null;
  const res = await fetch(`${RESEND}/emails/batch`, {
    method: "POST",
    headers: headersFor(key),
    body: JSON.stringify([
      {
        from: `KAMEHAME JAPAN Site <${FROM}>`,
        to,
        reply_to: `${safeName} <${e.email}>`,
        subject: threadSubject(e, title),
        text: notificationBody(e, jaName, { ack, ja, followUp: later ? { text: later.text, scheduled: !!scheduled, delayMinutes: FOLLOW_UP_MINUTES, emailId: scheduled?.id, scheduledAt: scheduled?.scheduledAt } : null }),
        tags: [{ name: "kind", value: e.kind }],
      },
      {
        from: `KAMEHAME JAPAN <${REPLY}>`,
        to: [e.email],
        reply_to: REPLY,
        subject: ack.subject,
        text: ack.text,
        tags: [{ name: "kind", value: "ack" }],
      },
    ]),
  });
  if (!res.ok) {
    // No acknowledgement went out, so the follow-up must not go out either.
    if (scheduled) await cancelScheduled(key, scheduled.id);
    throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return { followUpScheduled: !!scheduled };
}

const MAX = {
  name: 120, email: 200, company: 160, country: 80, dates: 120, party: 60, message: 4000, experience: 80, plan: 160, addons: 300, estimate: 160, interpreter: 40,
  area: 120, course: 160, courseUrl: 200, level: 200, rental: 400, clubs: 200, pickup: 300, whatsapp: 60,
};

function clean(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[\r\n]+/g, " ").trim().slice(0, max) : "";
}

function parse(body: Record<string, unknown>): Enquiry | null {
  const kind = body.kind === "trade" ? "trade" : "guest";
  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  // The message keeps its line breaks; everything else is single-line.
  const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX.message) : "";
  const area = clean(body.area, MAX.area) || undefined;
  // The golf request carries its substance in its own fields; its notes are optional.
  if (!name || !email || (!message && !area)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const party = clean(body.party, MAX.party) || undefined;

  // The golf page: the choice is validated against the price master and the
  // reference price is read from it here — what the browser sends is the
  // area, the party size and the course mode, never an amount.
  let golf: Pick<Enquiry, "areaId" | "courseMode" | "estimate" | "priceNote"> = {};
  if (area || body.area_id !== undefined) {
    const areaId = body.area_id;
    const golfers = Number(party);
    if (body.course_mode !== "specific" && body.course_mode !== "recommended") return null;
    const mode: GolfCourseMode = body.course_mode;
    if (!isGolfArea(areaId) || !isGolfGolfers(golfers)) return null;
    const price = golfPackagePrice(areaId, golfers, mode);
    // Golfers bringing their own clubs pay ¥5,000 less each; the keys are validated below, the count is read here.
    const own = /^(required|own|unsure)(:(right|left|unsure))?(,(required|own|unsure)(:(right|left|unsure))?){0,3}$/.test(String(body.rental_keys ?? "")) ? ownClubsCount(String(body.rental_keys), golfers) : 0;
    const estimateTotal = price ? golfTotalWithOwnClubs(price.groupTotal, own) : null;
    golf = {
      areaId, courseMode: mode,
      estimate: estimateTotal !== null ? yen(estimateTotal) : undefined,
      priceNote: golfPriceNoteJa(areaId, golfers, price, GOLF_PRICE_VERSION) + (price && own > 0 && !isArrangement() ? ` クラブ持参${own}名: −${yen(GOLF_OWN_CLUBS_DISCOUNT_JPY * own)} → 割引後 ${yen(estimateTotal!)}。` : ""),
    };
  }
  return {
    requestId: typeof body.request_id === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(body.request_id) ? body.request_id : crypto.randomUUID(),
    pickupRegion: ["tokyo", "saitama", "chiba", "other"].includes(String(body.pickup_region)) ? body.pickup_region as Enquiry["pickupRegion"] : undefined,
    caddie: ["none", "required", "unsure"].includes(String(body.caddie)) ? body.caddie as Enquiry["caddie"] : undefined,
    assistant: ["none", "required", "unsure"].includes(String(body.assistant)) ? body.assistant as Enquiry["assistant"] : undefined,
    addonIds: Array.isArray(body.addon_ids) ? body.addon_ids.filter((x): x is string => typeof x === "string").slice(0, 10) : undefined,
    kind, name, email, message,
    company: clean(body.company, MAX.company) || undefined,
    country: clean(body.country, MAX.country) || undefined,
    dates: clean(body.dates, MAX.dates) || undefined,
    party,
    plan: clean(body.plan, MAX.plan) || undefined,
    addons: clean(body.addons, MAX.addons) || undefined,
    // Other pages send their on-page estimate; the golf page's comes from the master above.
    estimate: golf.areaId ? golf.estimate : clean(body.estimate, MAX.estimate) || undefined,
    interpreter: clean(body.interpreter, MAX.interpreter) || undefined,
    area,
    areaId: golf.areaId,
    courseMode: golf.courseMode,
    // A named course: the package quotes it individually; the booking service takes it as a preference at the same fee.
    course: golf.courseMode === "specific" || isArrangement() ? clean(body.course, MAX.course) || undefined : undefined,
    courseUrl: golf.courseMode === "specific" || isArrangement() ? clean(body.course_url, MAX.courseUrl) || undefined : undefined,
    level: clean(body.level, MAX.level) || undefined,
    rental: clean(body.rental, MAX.rental) || undefined,
    clubs: clean(body.clubs, MAX.clubs) || undefined,
    pickup: clean(body.pickup, MAX.pickup) || undefined,
    whatsapp: clean(body.whatsapp, MAX.whatsapp) || undefined,
    priceNote: golf.priceNote,
    levelKey: golf.areaId ? clean(body.level_key, 20) || undefined : undefined,
    handicap: golf.areaId ? clean(body.handicap, 60) || undefined : undefined,
    rentalKeys: golf.areaId && /^(required|own|unsure)(:(right|left|unsure))?(,(required|own|unsure)(:(right|left|unsure))?){0,3}$/.test(String(body.rental_keys ?? "")) ? String(body.rental_keys) : undefined,
    shoes: golf.areaId ? clean(body.shoes, 240) || undefined : undefined,
    shoeKeys: golf.areaId && /^(own|unsure|\d{2}(\.5)?)(,(own|unsure|\d{2}(\.5)?)){0,3}$/.test(String(body.shoe_keys ?? "")) ? String(body.shoe_keys) : undefined,
    lang: clean(body.lang, 5) || "en",
    experience: clean(body.experience, MAX.experience) || undefined,
    website: clean(body.website, 200) || undefined,
  };
}

/** Plain-text email. Headers are folded onto one line each; the body is
 *  whatever the visitor wrote, quoted as-is. */
function raw(e: Enquiry, to: string, ja: Translations): string {
  const subject = threadSubject(e, titleFor(e));
  const lines = notificationBody(e, jaTitle(e), { ack: null, followUp: null, ja }).split("\n");
  // RFC 5322: CRLF line endings, blank line between headers and body.
  // Cloudflare rejects a message without Message-ID and Date outright.
  return [
    `Message-ID: <${crypto.randomUUID()}@kamehame-japan.com>`,
    `Date: ${new Date().toUTCString()}`,
    `From: KAMEHAME JAPAN <${FROM}>`,
    `To: ${to}`,
    `Reply-To: ${e.name.replace(/[<>"]/g, "")} <${e.email}>`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    ...lines,
  ].join("\r\n");
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const enquiry = parse(body);
  if (!enquiry) return Response.json({ ok: false, error: "invalid" }, { status: 400 });

  // A filled honeypot is a bot. Answer as if it worked so it moves on.
  if (enquiry.website) return Response.json({ ok: true });

  const fallback = enquiry.kind === "trade" ? TRADE_EMAIL : CONTACT_EMAIL;
  const cf = await bindings();
  const to = cf?.env.CONTACT_TO;
  const resendKey = cf?.env.RESEND_API_KEY;

  if (!cf || !to || (!resendKey && !cf.env.EMAIL)) {
    // Not configured yet. Say so plainly rather than pretending; the page
    // then shows the address so the visitor can still reach us.
    console.error("contact: CONTACT_TO secret, or both RESEND_API_KEY and the send_email binding, missing");
    return Response.json({ ok: false, error: "unconfigured", fallback }, { status: 503 });
  }

  // What the visitor typed, in Japanese for the team (best effort, see lib/translate.ts).
  const ja = await translateForTeam(cf.env.AI, enquiry);

  // The team's Slack alert, in Japanese, with the full record attached.
  const record = notificationBody(enquiry, jaTitle(enquiry), { ack: null, followUp: null, ja }).split("\n").filter((l) => !l.startsWith("自動返信") && !l.startsWith("フォローアップ")).join("\n");
  const alert = (delivered: boolean) => notifySlack(cf.env.SLACK_WEBHOOK_URL, slackMessage(enquiry, jaTitle(enquiry), delivered, record));
  // The team copy goes to the mailbox and to the archive address, if any.
  const recipients = [...new Set([to, cf.env.ARCHIVE_TO].filter((a): a is string => !!a && a.includes("@")))];

  // The booking ledger gets a row once delivery is settled (see lib/ledger.ts).
  const ledger = (ackSent: boolean, followUpScheduled: boolean) =>
    postToLedger(cf.env.LEDGER_WEBHOOK_URL, ledgerRecord(enquiry, ja, { ackSent, followUpScheduled }));

  if (enquiry.kind === "guest" && enquiry.experience === "mt-fuji-golf-day" && automationConfigured(cf.env)) {
    try {
      const result = await submitGolfAutomation(cf.env, enquiry, titleFor(enquiry), record,
        ledgerRecord(enquiry, ja, { ackSent: false, followUpScheduled: false }));
      await alert(!!result.ackSent);
      return Response.json({ ok: true, reference: result.id });
    } catch {
      // The queue may have accepted the request before a network timeout. The
      // same request ID safely retries; NEVER fall back to a second sender.
      console.error("contact: golf automation unavailable; retry with same request ID");
      await alert(false);
      return Response.json({ ok: false, error: "automation_unavailable", fallback }, { status: 503 });
    }
  }

  if (resendKey) {
    try {
      const { followUpScheduled } = await sendViaResend(resendKey, recipients, enquiry, ja);
      await Promise.all([alert(true), ledger(true, followUpScheduled)]);
      return Response.json({ ok: true });
    } catch (err) {
      console.error("contact: resend failed, trying send_email", err);
    }
  }
  if (cf.env.EMAIL) {
    try {
      await cf.env.EMAIL.send(new cf.EmailMessage(FROM, to, raw(enquiry, to, ja)));
      await Promise.all([alert(true), ledger(false, false)]);
      return Response.json({ ok: true });
    } catch (err) {
      console.error("contact: send_email failed", err);
    }
  }
  await alert(false);
  return Response.json({ ok: false, error: "send_failed", fallback }, { status: 502 });
}
