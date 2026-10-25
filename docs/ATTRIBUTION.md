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

Applies to /api/contact (golf and general enquiries). The separate provisional
experience checkout is not changed. Existing Google Sheets schemas are preserved.
