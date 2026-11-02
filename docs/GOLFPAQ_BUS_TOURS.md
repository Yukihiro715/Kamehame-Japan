# Shared Bus Golf Tours (GOLFPAQ) — how the page, the enquiry and the operations work

Released to production on 2026-11-02 (owner's approval). Production shows the pages because the deploy workflow passes `GOLFPAQ_LIVE=true` to `wrangler deploy`; remove that flag to hide them again without touching the code. On staging (`KH_ENV=staging`) they are always on.

## Pages
- `/{lang}/golf-tours/`: the landing page for advertising. The hero holds the two options side by side on every screen size, Custom Booking first and marked "Recommended for groups" with who it suits and a per-person price line, the Shared Bus Tour second with the lowest open price from the feed; then a comparison table (who it suits, dates, transport, courses, price, the day, how to book), a per-person cost example for custom booking with four golfers (fee only / with the private transfer, Tokyo and Mt. Fuji areas) and a "not sure?" pair of CTAs.
- `/{lang}/golf-bus/`: the shared-bus page. Hero (fairway + the operator's coach, a portrait composite on phones), a four-point "at a glance" strip, the calendar and the tour list, the enquiry form, then "How the tour works, in detail" as collapsible sections (meeting points in Shinjuku and Oimachi, the day step by step, how you play, what the price covers / what is extra, cancellation as published by the operator), steps, included / not included, Good to Know, FAQ. Course names are shown in the page's language: the `golf_courses` table (migration 0005, edited at `/ops/golf-courses/`, no deploy needed) first, then the code map in lib/golf-course-images.ts, then the partner's Japanese name. The ops page lists every course on the current schedule and flags the ones without an English name.
- The golf collection page carries a small "Two ways" cross-link to both while the bus page is visible (the custom golf page does not).
- Photos: the hero and the landing card use the operator's own coach photos (public/images/golf-bus/, from the operator's fleet page). Tour cards use one photo per course (public/images/golf-courses/, mapped with the English course name in lib/golf-course-images.ts); a course without a photo shows the KAMEHAME fallback. The partner's listing photos are never shown (they carry a text banner). Photo rights are handled by the owner outside the repository.

## What the visitor sees
- Languages: en, ja, es, fr, zh-tw; EN copy is the reference, JA is translated, the others fall back to EN.
- Details sheet per card: the confirmed facts (date, departure point and time, play style, lunch, cart, seats, price), then the partner's course description, day schedule and conditions in the page's language. On non-Japanese pages that text appears once the cron has translated it; until then the sheet says the English description is being prepared.
- Calendar: a month grid of the published dates (green = seats available, grey = every tour that day sold out); tapping a day filters the list; golfers and departure filters stay.
- The golf collection page and the custom golf page carry a small "Two ways" cross-link only while the bus page is visible.
- Each card: course, date, photo (the partner's photo hotlinked with no referrer; a KAMEHAME photo when there is none), seats left or a SOLD OUT badge, departure area / time, a lunch tag (lunch included, a voucher included, no lunch break on a through-play tour, otherwise "available at the clubhouse, pay on the day": lunch is never shown as simply "not included"), the price as **one tax-inclusive total per person**, the enquiry button (disabled when sold out) and "No payment is required to enquire."
- Enquiry form: golfers (1–8, never more than the seats shown on that tour), one row per golfer (name, rental clubs +¥5,500 with right/left hand, rental shoes +¥2,200 with size; both rentals are added to the total, migration 0006 keeps the shoe count and amount), a live summary with the total, email / phone / notes, the data-sharing consent, then a thank-you with the reference (`GP-XXXXXX`). The rows are kept as `golfers_json` (migration 0004) and listed in every mail and on the ops detail page.

## Pricing rules (要件)
- Customer price per person = partner price + ¥15,000, shown only as one tax-inclusive figure (e.g. partner ¥15,400 → "¥30,400 /person").
- Rental clubs: +¥5,500 per renter, added to the total immediately when ticked.
- The partner's price, the ¥15,000 and the margin never appear on public pages, in client-side data or in customer mail. They are in `bus_tour_enquiries`, in staff / partner mail and on `/ops/bus-tours/` only.
- No link to the partner's product pages anywhere public. The partner is not named to the customer; who sells the tour is stated in the purchase instructions.

## Data
- Source: the partner's public monthly listing pages and detail pages, read by the Worker's cron (`refreshGolfpaqSnapshot`) at most every 3 hours, stored in KV `READY_STATE` (`golfpaq:self-rounds:v3`, detail cache per tour for 14 days).
- Window: JST the day after tomorrow through the last published calendar date (owner, 2026-11-03: today and tomorrow are not shown). Cancelled (中止) tours are dropped; sold-out and closed ones are kept and shown as sold out.
- Sold-out rules (owner, 2026-11-02), applied on the server for the page and the enquiry API alike: a tour within 3 days of today is sold out whatever the partner shows; within 7 days it is sold out once only one seat is left; a partner-closed (完売 / 受付終了 / 満席) or zero-seat tour is sold out. Open tours show the seats left on the photo.
- If the snapshot is older than 6 hours (feed failing), the page shows the "temporarily unavailable" notice and the enquiry API answers 503. Nothing stale is shown as bookable.
- English for the partner's text: the cron (every 5 minutes, only while the pages are on) sends up to 8 tours' details per tick to Workers AI (`lib/golfpaq-translate.ts`, llama-3.3-70b) and keeps the result with the cached detail in KV, so each text is translated once (about 3 calls per tour; a few hundred calls in all for a full schedule). Partner names, phone numbers, addresses and links are stripped before and after. Courses that neither the code map nor the ops table names get an English name the same way, stored in KV (`golfpaq:course-names:v1`) and flagged "自動翻訳（要確認）" on `/ops/golf-courses/` until someone saves a name.
- Tests: `tests/golfpaq.test.mjs` (parsing, projection, pricing, window, refresh) and `tests/golfpaq-enquiry.test.mjs` (guards, ledger row, mail contents, allowlist) against saved fixtures in `tests/fixtures/golfpaq/`.

## Enquiry flow (no payment on the site)
1. The browser posts to `/api/golfpaq/enquiry` (same origin, JSON, honeypot, UUID request id for idempotency).
2. The server re-reads the fresh snapshot, rejects tours that are gone or have fewer seats (409), prices the enquiry itself and inserts a `bus_tour_enquiries` row (migration `0003_bus_tours.sql`).
3. Mail, via Resend: customer acknowledgement (totals only, "not yet confirmed, no payment taken"), staff notification to `CONTACT_TO` (with the breakdown), partner hand-over to `GOLFPAQ_PARTNER_TO` (with the breakdown). Slack gets a short line.
4. Status starts at `received`, becomes `handed_over` when the partner mail is sent; operations move it on from `/ops/bus-tours/`.

Initial operation: KAMEHAME phones the partner to hold the seats; the partner (or operations on the partner's approved route) sends the purchase instructions; the customer pays the seller directly; operations mark `purchased` then `confirmed`.

## Operations portal
`/ops/bus-tours/` (any ops role to view; `ops_admin` / `ops_booking` to change): list with status filters and search, detail with the internal breakdown, status buttons (received → handed_over → guidance_sent → purchased → confirmed; cancelled / unavailable need a reason), re-send of the partner hand-over, a copyable purchase-guidance draft (totals only, seller particulars as placeholders), internal note, audit log.

## Environment (Worker secrets / variables; never in the repo)
| Name | Where | Meaning |
|---|---|---|
| `GOLFPAQ_LIVE` | production var, set by .github/workflows/deploy.yml | `true` shows the pages on production. Remove the flag from the deploy step to hide them. |
| `GOLFPAQ_PARTNER_TO` | secret | The travel partner's hand-over address. Unset = partner mail "unconfigured", status stays `received`. |
| `CONTACT_TO`, `RESEND_API_KEY`, `SLACK_WEBHOOK_URL` | existing secrets | Staff mail, mail provider, Slack. |
| `NOTIFY_ALLOWLIST` | staging | Comma-separated addresses staging may mail; everything else is recorded as `blocked`. |
| `READY_STATE` (KV), `DB` (D1) | bindings | Snapshot and the ledger. |

## Open items before a production release
- Seller identity: the licensed travel company that sells the tour, its registration number and contact, for the purchase instructions and the legal line.
- Cancellation / refund terms aligned with the partner's rules, and the refund scope after payment (the page says only that a tour that cannot be secured after payment is refunded in full).
- The partner's hand-over address (`GOLFPAQ_PARTNER_TO`) and the agreed mail route for purchase instructions.
