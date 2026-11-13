# Partner clarity and quarterly payments

- Link opens count all human referral arrivals. Estimated visitors group the same browser across each partner’s QR and URL links in fixed seven-day windows (details below).
- 代理予約・相談 is the booking-request workspace. 予約実績・紹介料 lists attributed bookings and commissions, including successful case-based reservations. Page descriptions explain the distinction.
- An active common/entity rate now applies to published catalog experiences with no individual policy. Display and reservation snapshots use the same fallback; policy_id is NULL, rate_setting_id retains the applicable version, and existing snapshots do not change. Explicitly disabled experience policies still disable referral commissions.
- Both the experience card and materials page support direct generation. QR image download and copy are available where the link is created. Demo uses GET-only fake example.invalid URLs; it never creates real attribution links.
- Quarterly rows distinguish issued scheduled transfers, actual paid transfers, carry-forward, disputes and unstated accrual estimates. Voided/draft statements are excluded from payment totals; unstated entries and adjustments appear as estimates, without a final transfer amount. Issued statements include historical payment profiles. Accrual estimates cover the selected site, while issued statements may combine sites in their settlement profile. Paid totals sum transfer amounts after fees, not gross commissions.
- Payment destinations can be replaced only by a user with billing roles on every currently associated site. Inputs are validated, encrypted with AES-256-GCM and profile-bound associated data, and saved atomically with a masked audit entry. Full numbers are returned only from the finance/admin ops endpoint. Demo edits are disabled.
- Deployment initializes PORTAL_BANK_KEY once using the existing Cloudflare deployment credentials. The script never logs the key and fails on unreadable secret lists. It retains existing keys. Do not delete or rotate this secret without a decrypt/re-encrypt migration; do not put it in git. Both staging and production receive separate keys.

Validation: relevant referral, authentication, rate, settlement, scoping and bank encryption tests; production build; changed-file ESLint. Live signed-in Safari visual checks are not covered by these tests.


## Visitor estimate (November 2026)

Partner dashboard visitor counts use a separate anonymous browser cookie (`kh_visitor`, HttpOnly, Secure, SameSite=Lax, seven-day lifetime refreshed on eligible arrivals). Each partner has a fixed seven-day window from that browser's first arrival. QR and URL links share the window; another partner has its own window. At seven days, a new window counts again even if the visitor returned during the previous window. Reports count distinct windows with an eligible event during the chosen reporting period, not distinct people across a whole month.

The label is 訪問人数（目安） / Estimated visitors. Device/browser changes and deleted cookies count separately; no IP, fingerprint or personal information is stored. The existing 30-day referral attribution and its session renewal behavior are unchanged. Bots, previews, inactive links and test clicks receive no visitor identifier. Migration 0017 leaves historical events without a visitor window: reports flag partial history and display a dash when no new-method events are available, rather than misreporting old sessions as people.
