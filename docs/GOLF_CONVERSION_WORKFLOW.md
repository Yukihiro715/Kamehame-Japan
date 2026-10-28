# Golf enquiry workflow — 2026-10-28

For new enquiries. Preserve existing individual agreements. No automatic follow-up restart or customer messages are authorised by this implementation.

## First human reply

Use `golfFirstReplyTemplate` in `lib/golf-first-reply.ts` for a reviewed English draft for 1–4 golfers. Recommend one direction that fits the request. Ask at most three unanswered questions; do not repeat information in the form. For larger groups, use an individual fee quote. Never imply a held tee time without supplier confirmation.

Priority questions: total budget per golfer with currency and transport scope; accommodation (we estimate travel time); any essential requirement. Separate preferences from requirements. Club flex can be “no preference”; accept international shoe sizes and verify with the club rather than promising an exact conversion.

## Before payment

Use information already available to give one indicative direction and a realistic whole-day cost range and journey time. Show group total AND per-person total, separating our fee, club charges, rentals/extras and transport. Label estimates, availability checks and confirmed arrangements distinctly. Do not present private transport as included in our booking fee; retain the current direct-contract provider flow.

This preliminary discussion is not a paid, qualifying course proposal. Do not deduct a research fee solely because a preliminary estimate was sent. Agree essential requirements, total budget scope and the existing full refund terms in writing before payment. Detailed research begins after agreement and payment. Full terms stay in the payment invitation and website Cancellation section; the shorter receipt links there. Existing individual terms prevail.

## Proposal and payment

Present one recommendation and, only if useful, one fallback. Include accommodation-to-course travel duration, expected arrival time (allowing for check-in), tee-time status, itemised costs, rental availability and the customer's outstanding decision. Confirm on-day support and language availability individually; do not promise a standalone English-speaking assistant. Answer rain/closure rules directly rather than substituting a weather forecast. Check dress code; suggest advance shopping only if relevant.

Once requirements and terms are agreed, send the existing reviewed booking-fee payment invitation. Pay now / pay at club / transport paid separately must be explicit. Do not use false scarcity or an invented booking hold.

## Manual follow-up

Ask what is blocking the decision: budget, travel time, arrangements, group agreement or changed dates. Add a useful alternative or answer instead of repeating a list of packages. Do not infer non-response means rejection. Keep automatic follow-up disabled until the owner separately chooses the timing and operation.

## Measurement

Record request, first human reply, indicative proposal, customer agreement, payment-link sent, payment received and confirmed booking timestamps against the same enquiry ID. Separate enquiry-to-payment from link-to-payment. Review by party size, lead time, area and total budget; track handling minutes and loss reasons. This document specifies the reporting workflow; it does not claim these additional ledger stages are automatically instrumented.

### Draft command

Run `node scripts/prepare-golf-first-reply.mjs input.json output-directory` with `{ "enquiry": <existing enquiry>, "review": { "recommendation": "<one reviewed recommendation>", "missingQuestions": ["<only unanswered questions, max three>"] } }`. The output is a text draft, not a sent email. No customer data should be committed to this repository.

2026-10-28 form refinement: budget and currency stay side by side on mobile. No journey-limit or standalone assistant selector. Standard club rental is shown as approximately ¥5,000 (varies by club), distinct from chosen-model rental at the price master rate.
