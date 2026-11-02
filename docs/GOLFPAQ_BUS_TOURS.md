# Shared Bus Golf Tours (GOLFPAQ) — how the page, the enquiry and the operations work

Staging only until the owner releases it. Production shows the page only when the Worker variable `GOLFPAQ_LIVE` is `true`; on staging (`KH_ENV=staging`) it is always on.

## Pages
- `/{lang}/golf-tours/`: the landing page for advertising. Hero, the two options (Shared Bus Tour → `/golf-bus/`, Custom Booking → `/tokyo/mt-fuji-golf-day/`), a comparison table (who it suits, dates, transport, courses, price, the day, how to book), a per-person cost example for custom booking with four golfers (fee only / with the private transfer, Tokyo and Mt. Fuji areas) and a "not sure?" pair of CTAs.
- `/{lang}/golf-bus/`: the shared-bus page. Hero (fairway + the operator's coach, a portrait composite on phones), a four-point "at a glance" strip, the calendar and the tour list, the enquiry form, then "How the tour works, in detail" as collapsible sections (meeting points in Shinjuku and Oimachi, the day step by step, how you play, what the price covers / what is extra, cancellation as published by the operator), steps, included / not included, Good to Know, FAQ. Course names are shown in English on the English pages (lib/golf-course-images.ts).
- The golf collection page and the custom golf page carry a small "Two ways" cross-link to both while the bus page is visible.
- Photos: the hero and the landing card use the operator's own coach photos (public/images/golf-bus/, from the operator's fleet page). Tour cards use one photo per course (public/images/golf-courses/, mapped with the English course name in lib/golf-course-images.ts); a course without a photo shows the KAMEHAME fallback. The partner's listing photos are never shown (they carry a text banner). Photo rights are handled by the owner outside the repository.

## What the visitor sees
- Languages: en, ja, es, fr, zh-tw; EN copy is the reference, JA is translated, the others fall back to EN.
- Calendar: a month grid of the published dates (green = seats available, grey = every tour that day sold out); tapping a day filters the list; golfers and departure filters stay.
- The golf collection page and the custom golf page carry a small "Two ways" cross-link only while the bus page is visible.
- Each card: course, date, photo (the partner's photo hotlinked with no referrer; a KAMEHAME photo when there is none), seats left or a SOLD OUT badge, departure area / time, lunch and through-play tags, the price as **one tax-inclusive total per person**, the enquiry button (disabled when sold out) and "No payment is required to enquire."
- Enquiry form: golfers (1–8, never more than the seats shown on that tour), one row per golfer (name, rental clubs +¥5,500 with right/left hand, rental shoes with size; shoe rental is requested from the course and paid there), a live summary with the total, email / phone / notes, the data-sharing consent, then a thank-you with the reference (`GP-XXXXXX`). The rows are kept as `golfers_json` (migration 0004) and listed in every mail and on the ops detail page.

## Pricing rules (要件)
- Customer price per person = partner price + ¥15,000, shown only as one tax-inclusive figure (e.g. partner ¥15,400 → "¥30,400 /person").
- Rental clubs: +¥5,500 per renter, added to the total immediately when ticked.
- The partner's price, the ¥15,000 and the margin never appear on public pages, in client-side data or in customer mail. They are in `bus_tour_enquiries`, in staff / partner mail and on `/ops/bus-tours/` only.
- No link to the partner's product pages anywhere public. The partner is not named to the customer; who sells the tour is stated in the purchase instructions.

## Data
- Source: the partner's public monthly listing pages and detail pages, read by the Worker's cron (`refreshGolfpaqSnapshot`) at most every 3 hours, stored in KV `READY_STATE` (`golfpaq:self-rounds:v3`, detail cache per tour for 14 days).
- Window: JST today through the last published calendar date. Cancelled (中止) tours are dropped; sold-out and closed ones are kept and shown as sold out.
- Sold-out rules (owner, 2026-11-02), applied on the server for the page and the enquiry API alike: a tour within 3 days of today is sold out whatever the partner shows; within 7 days it is sold out once only one seat is left; a partner-closed (完売 / 受付終了 / 満席) or zero-seat tour is sold out. Open tours show the seats left on the photo.
- If the snapshot is older than 6 hours (feed failing), the page shows the "temporarily unavailable" notice and the enquiry API answers 503. Nothing stale is shown as bookable.
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
| `GOLFPAQ_LIVE` | production var | `true` shows the page on production. Unset = hidden. |
| `GOLFPAQ_PARTNER_TO` | secret | The travel partner's hand-over address. Unset = partner mail "unconfigured", status stays `received`. |
| `CONTACT_TO`, `RESEND_API_KEY`, `SLACK_WEBHOOK_URL` | existing secrets | Staff mail, mail provider, Slack. |
| `NOTIFY_ALLOWLIST` | staging | Comma-separated addresses staging may mail; everything else is recorded as `blocked`. |
| `READY_STATE` (KV), `DB` (D1) | bindings | Snapshot and the ledger. |

## Open items before a production release
- Seller identity: the licensed travel company that sells the tour, its registration number and contact, for the purchase instructions and the legal line.
- Cancellation / refund terms aligned with the partner's rules, and the refund scope after payment (the page says only that a tour that cannot be secured after payment is refunded in full).
- The partner's hand-over address (`GOLFPAQ_PARTNER_TO`) and the agreed mail route for purchase instructions.
- Set `GOLFPAQ_LIVE=true` on production only after the above.
