# Unified operations and business dashboard

The canonical entry is `https://kamehame-japan.com/ops/`. The existing Cloudflare deployment serves it; no new domain or ChatGPT sign-in is needed. The visual components and styles are ported from the previous business dashboard, with styles scoped to operations so the public site and partner portal retain their styling.

## Authentication and access

- Operations uses email + password. The fixed master is `yukihiro_ito@prosent.co.jp`; only this account can provision/reissue operations accounts or revoke operations memberships. The master cannot be disabled/revoked through member management.
- Provisioning returns a cryptographically random temporary password once to the master, valid for 72 hours; the master shares it securely. No plaintext is stored or emailed. Reissue invalidates existing operations sessions/reset tokens. Temporary users can only view their sign-in state, change their password, or sign out. Every business API is blocked until they choose a different 12–128-character password; successful change revokes sessions and requires a fresh login.
- Public reset requests only email eligible existing members (plus the fixed master bootstrap). Unknown email addresses receive the same generic acknowledgement without creating an account. Reset links remain single-use and valid for 30 minutes.
- Operations credentials and reset tokens are separate from partner credentials. Reset revokes operations sessions. Existing sessions remain valid until their existing expiry or a reset.
- The old request-code and verify endpoints return 410. Invitations describe password setup.
- Existing ops_admin and ops_finance roles can view and edit financial records. Only ops_admin can import historical data or refresh external reports. The existing booking role keeps its operations permissions.

## Data and cutover prerequisites

The owner authorized production release on 2026-11-16 with data migration and external report connections still pending. Release the UI and password authentication first; The owner subsequently requested removal of the migration-pending banner; it has been removed. This does not imply that historical records have been migrated. The old dashboard remains the source of record until migration is verified.

1. Obtain a complete authenticated export from the previous dashboard's `/api/data` response. This is already merged with its original seed records. Database rows alone are insufficient. Keep customer details and costs out of this public Git repository.
2. Apply migrations 0022–0024 (the existing deployment workflow does this before deploying code).
3. Through the authenticated administrator API `POST /api/portal/ops/business/import` (same-origin and `x-kh-portal: 1` required), import `{bookings, masters, snapshots}`. Import inserts missing IDs only and is repeatable; it never overwrites edits. Each successful record is audited. If a request fails partway, repeat the same file.
4. Compare record counts, individual costs, totals for identical date ranges and snapshot timestamps. Source timestamps are preserved. Then stop writes to the old dashboard and direct staff to `/ops/`.
5. Run a real first-time password setup and login; verify finance vs booking permissions and the mobile layout.

## External reports

The old site's ChatGPT connector binding cannot be copied into the independent Cloudflare Worker. Copying the UI does not preserve that connection.

- Stripe refresh uses the existing `STRIPE_READ_KEY` server secret and balance-transactions permission. Verify that it belongs to the KAMEHAME Stripe account before cutover. It does not fall back to a wider checkout key.
- Google Ads and Meta now have native, server-only read adapters for the verified KAMEHAME accounts (1700154296 and act_1089610383773886). They validate JPY / Asia/Tokyo, exhaust pagination, and retain cached data on failures. Google uses API v26; Meta v27.0. Configure Worker secrets `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN` (and `GOOGLE_ADS_LOGIN_CUSTOMER_ID` if using a manager), and `META_ADS_ACCESS_TOKEN` with read access. Never put credentials in source or browser code. Having access through a ChatGPT connector does not provision these secrets.
- Search Console and GA4 use the same three Google OAuth secrets above, with `adwords`, `webmasters.readonly`, and `analytics.readonly` scopes. They read only the verified `sc-domain:kamehame-japan.com` property and GA4 property `554299976`. Search Console totals and date rows use property aggregation and include fresh data; the returned incomplete-date boundary is retained. GA4 uses sessions and keyEvents, validates Asia/Tokyo, consumes pagination, and rejects incomplete/sampled/thresholded responses. Organic Search is a session-channel filter across all search engines; AI is an exact domain allowlist on sessionSource, with separate totals and breakdowns. Google AI Overview/Mode remains in organic search. No GA4 revenue is added to Stripe.
- Google Ads developer tokens were sunset on 2026-09-09. Only the three OAuth secrets are required; production account access (Explorer or above) must be enabled on their Google Cloud project. A manager login ID is optional when the authorized user can access the client directly. Docs: https://developers.google.com/google-ads/api/docs/api-policy/developer-token
- Optional `BUSINESS_METRICS_URL` (HTTPS) and `BUSINESS_METRICS_TOKEN` configure a server bridge. No such service or credential is provisioned by this change.
- The bridge receives `{source,start,end}` and must return the same fields plus normalized `data` matching the legacy snapshot contract. It must authorize the fixed KAMEHAME accounts and check completeness/pagination before returning success.
- Only configured sources are refreshed. Unconfigured sources show stored data with an explicit notice; unavailable values are never replaced by zero. Reports are cached by exact source and date range.
- Product counts come from the deployed catalog, not GitHub HEAD or a historical baseline.

## Verification

Portal tests cover password setup/bootstrap, portal separation, replay/expiry, reset revocation, retired OTP endpoints, CSRF, role restrictions, record validation, optimistic concurrent updates and repeatable import. The production build passes. The repository currently has unrelated TypeScript errors in two catalog entries (missing master) and the pre-existing Worker Fetcher type; the changed files introduce no additional type errors.

## Mobile form standard

All mobile/coarse-pointer inputs, selects and textareas use a shared minimum 16px font in `app/globals.css`, including unauthenticated pages and future forms. Do not override it with smaller font sizes or visual scaling. Never disable user zoom (`user-scalable=no` / restrictive maximum-scale). For each future form, verify focus at a 390px viewport, keyboard visibility, horizontal overflow, and pinch zoom in iOS Safari. Namespace dashboard styles (for example `business-eyebrow`) so public-site decorations cannot leak into operations.

## Remaining production connection step

The native adapters are ready, but live credentials and an actual refresh must be verified in Cloudflare before calling a source connected. The UI explicitly distinguishes 未接続, 未取得, 更新失敗 and 取得済. Stripe HTTP 401 and 403 now have separate actionable messages. The current agent browser is not authenticated to Cloudflare, so server secret configuration requires the owner's sign-in. Existing checkout keys are never used as a fallback for reporting.
