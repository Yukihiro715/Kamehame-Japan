# Higashiyama private tea: provisional checkout

Enable only `kyoto-higashiyama-private-tea-ceremony`, 1–5 guests aged 4+.
Keep the catalog's existing tax-inclusive prices:

| Season | Solo | 2–5 guests (per guest) |
| --- | ---: | ---: |
| Regular | JPY 25,000 | JPY 16,500 |
| Peak | JPY 27,500 | JPY 19,000 |

Peak dates: March 1–April 30, October 1–November 30, December 28–January 3.
The server computes the rate from the catalog and verifies it against the selected
Stripe price; client-supplied totals/prices are ignored. The existing 24-hour
cutoff applies to the requested start time in Japan time.

Kimono/add-on selections use the existing quote route, without charging a
base-only total. The normal checkout requires eligibility, standard-plan and
provisional-booking consent. Existing localized provisional/refund copy replaces
the old booking FAQ and flow when checkout is enabled.

## Live configuration

The four one-time, active JPY inclusive-tax prices in
`lib/private-tea-checkout-prices.ts` were registered in the KAMEHAME JAPAN live
Stripe account after approval to release. Both the page and checkout API fail
closed if any price ID is missing. The displayed catalog totals must match the
server-selected price and quantity before creating a checkout session.

Publish through this repository's existing Cloudflare deploy workflow. Confirm
the deployed page and readiness before reporting release. Customer payment is
still provisional and does not confirm host availability.

Existing Apps Script accepts the stored order price/quantity and needs no code
change for this product. Its existing signed-webhook processing, paid-pending
ledger updates, customer acknowledgement and internal arrangement notification
are reused. Payment does not confirm host availability. No external messages
are sent by tests; queue behavior is exercised with a mocked Apps Script runtime.

Validation: 30 checkout/readiness/diagnostic tests and production build passed.
