# Unified operations and business dashboard

The canonical entry is `https://kamehame-japan.com/ops/`. The existing Cloudflare deployment serves it; no new domain or ChatGPT sign-in is needed. The visual components and styles are ported from the previous business dashboard, with styles scoped to operations so the public site and partner portal retain their styling.

## Authentication and access

- Operations uses email + password, with an emailed, single-use, 30-minute setup/reset link. Passwords are 12–128 characters. Initial setup uses the existing operations membership and bootstrap-admin setting.
- Operations credentials and reset tokens are separate from partner credentials. Reset revokes operations sessions. Existing sessions remain valid until their existing expiry or a reset.
- The old request-code and verify endpoints return 410. Invitations describe password setup.
- Existing ops_admin and ops_finance roles can view and edit financial records. Only ops_admin can import historical data or refresh external reports. The existing booking role keeps its operations permissions.

## Data and cutover prerequisites

The owner authorized production release on 2026-11-16 with data migration and external report connections still pending. Release the UI and password authentication first; show an explicit migration-pending notice and a link to the previous dashboard when no financial records have been imported. The old dashboard remains the source of record until migration is verified.

1. Obtain a complete authenticated export from the previous dashboard's `/api/data` response. This is already merged with its original seed records. Database rows alone are insufficient. Keep customer details and costs out of this public Git repository.
2. Apply migrations 0022 and 0023 (the existing deployment workflow does this before deploying code).
3. In the new dashboard's administrator-only migration control, import `{bookings, masters, snapshots}`. Import inserts missing IDs only and is repeatable; it never overwrites edits. Each successful record is audited. If a request fails partway, repeat the same file.
4. Compare record counts, individual costs, totals for identical date ranges and snapshot timestamps. Source timestamps are preserved. Then stop writes to the old dashboard and direct staff to `/ops/`.
5. Run a real first-time password setup and login; verify finance vs booking permissions and the mobile layout.

## External reports

The old site's ChatGPT connector binding cannot be copied into the independent Cloudflare Worker. Copying the UI does not preserve that connection.

- Stripe refresh uses the existing `STRIPE_READ_KEY` server secret and balance-transactions permission. Verify that it belongs to the KAMEHAME Stripe account before cutover. It does not fall back to a wider checkout key.
- Google Ads, Meta, Search Console and GA4 require a separately authenticated server integration. Optional `BUSINESS_METRICS_URL` (HTTPS) and `BUSINESS_METRICS_TOKEN` configure a server bridge. No such service or credential is provisioned by this change.
- The bridge receives `{source,start,end}` and must return the same fields plus normalized `data` matching the legacy snapshot contract. It must authorize the fixed KAMEHAME accounts and check completeness/pagination before returning success.
- Only configured sources are refreshed. Unconfigured sources show stored data with an explicit notice; unavailable values are never replaced by zero. Reports are cached by exact source and date range.
- Product counts come from the deployed catalog, not GitHub HEAD or a historical baseline.

## Verification

Portal tests cover password setup/bootstrap, portal separation, replay/expiry, reset revocation, retired OTP endpoints, CSRF, role restrictions, record validation, optimistic concurrent updates and repeatable import. The production build passes. The repository currently has unrelated TypeScript errors in two catalog entries (missing master) and the pre-existing Worker Fetcher type; the changed files introduce no additional type errors.
