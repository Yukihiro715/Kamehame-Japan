# Inquiry attribution

The contact forms preserve the first and latest non-direct touch for 30 days,
only after explicit analytics/advertising consent. Rejection removes the record.
Allowed fields: utm_source, utm_medium, utm_campaign, utm_id, utm_content, utm_term,
gclid, gbraid, wbraid, fbclid, campaign_id, adset_id, ad_id. Landing URLs omit
queries/fragments; referrers retain only the origin. No arbitrary query parameters
are copied. Server-side validation applies length, URL and age limits.

The contact API returns its request_id. The form's generate_lead payload uses
that same value as enquiry_id. Internal notification mail includes 申込ID and
流入記録; ledger payloads include requestId and attribution and append them to
message so the existing ledger adapter preserves them with the case ID.
The email-to-ledger workflow should retain these fields with the original Gmail
IDs in its confirmation notes. Do not overwrite manually recorded case states.
This change does not enable another ledger writer or alter automation settings.

Use explicit Meta UTMs (utm_source=meta&utm_medium=paid_social and a stable
campaign ID). fbclid alone is not evidence of a paid ad. Google click IDs imply
paid Google traffic; unknown or absent data must not be labelled organic.

These are browser-supplied attribution hints, not proof of ad billing. A missing
record can mean no consent, old traffic, blocked storage or tracking loss.
Historical GA4 minute-level joins are estimates; never overwrite them as exact.
GTM must forward enquiry_id for GA4 export/reporting; creating this event field
in the site does not register a GA4 custom dimension. Do not add customer names,
email addresses or free-text requirements to GA4. Future payment reconciliation
must join the case/inquiry ID to confirmed payments and refunds separately;
Stripe referrals must not be interpreted as the acquisition channel.

Originally applied to /api/contact. The expansion below covers provisional
experience checkout and shared-bus enquiries; Google Sheets schemas stay unchanged.

## 2026-11-14: booking and payment continuity

The explicit consent banner now appears for all new visitors. The previous
EU-only display meant most visitors never saw an Accept control, while booking
attribution required that explicit choice. This change does not broaden consent
or infer it from a visit. Reject/unknown still sends no attribution identifiers.

All contact, golf, shared-bus and provisional experience forms send the same
sanitized attribution snapshot. After opt-in, Google's bounded `gtag get` API
adds the GA client/session IDs where available (300ms timeout; no GA cookies
parsed). Neither names nor emails are added to GA events by this change.
Stripe return referrers do not overwrite the latest acquisition touch.

Migration `0021_marketing_attribution.sql` adds a nullable JSON snapshot to the
D1 reservation and shared-bus enquiry rows. It is fixed on first insert with the
request ID, and retained after payment/refund. Repeated submissions do not
replace it. Existing records remain unrecorded, not organic/no-ad. The ops-only
reservation detail shows the snapshot; hotel/partner DTOs and their commission
attribution are independent. Bus staff notifications include it; customer and
partner emails do not. Provisional experience data is kept in D1; the existing
Apps Script business-order payload remains unchanged so metadata changes cannot
break payment retries. The existing Apps Script notifications therefore do not
show the new fields; use the ops record for those bookings.

Provisional Checkout sets `request_id` on both Session and PaymentIntent metadata.
The verified Stripe webhook joins payments by reservation_id/booking reference,
or by the original request UUID in metadata.request_id/client_reference_id.
For manually issued or reusable payment links, append the original request UUID
as `client_reference_id` (or set metadata.request_id on a customer-specific
Checkout Session). Never put a customer's fixed attribution on a reusable link.
Without a matching ID the payment remains unmatched; no email/time-based guess.
Do not rewrite already-issued links or charge customers during rollout.

GTM still owns GA configuration. `begin_checkout` and `bus_tour_enquiry` now
include enquiry_id; GTM needs to forward that existing event parameter if it
is to be queried in GA4. Register enquiry_id / booking_reference as event custom
dimensions if needed, or export to BigQuery for ID joins. High-cardinality IDs
should not be used as broad dashboard grouping dimensions. These external GA/GTM
settings and BigQuery export are not changed by deploying this code.

Deployment: run the D1 migration before deploying the Worker (the existing main
GitHub workflow already does this). Validate with fixtures/mocked Stripe only;
no real checkout, charge, mail or historical-attribution backfill is required.
