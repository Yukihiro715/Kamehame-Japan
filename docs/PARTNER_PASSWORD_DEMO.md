# Partner password sign-in and demo samples

Normal partners now use their individual email address and password. Operations still use email codes. Existing partner sessions remain valid until expiry; new partner sign-ins require password setup. On /hotel/login/, choose 初回設定・パスワードを忘れた方. The invitation email explains this same route. Password setup/reset emails use the existing Resend configuration; no bulk migration emails are sent.

Setup links expire after 30 minutes. Only token hashes are stored, links carry the token in the URL fragment, and the form removes the fragment after reading it. Passwords require 12–128 characters. A per-user random salt and PBKDF2-SHA256 (100,000 iterations, the Workers WebCrypto ceiling) protect the verifier; account and IP rate limits bound online attempts. Atomic reset batches prevent replay and concurrent consumption, invalidate other outstanding links, and revoke all partner sessions. Demo passwords cannot be reset through this flow.

Migration 0015 creates the password/token/limiter tables and activates the common 5% commission rate at deployment time. Existing reservation snapshots are preserved. Entity-specific rate overrides continue to take precedence, and experience eligibility is unchanged.

Demo data is generated only for the authenticated, isolated public demo principal: six referral reservations, three consultation cases with details and sample quotes, dashboard totals and settlement balance/profile. Samples use the current JST month and respond to date/status/reference/search filters. No sample bookings, payments or entries are written into production ledgers. All demo mutations remain blocked on the server.

Mobile fixes constrain date controls to their grid columns (including Safari native minimum sizing) and hide pagination when only one page or no results exist.

Validation: portal/auth, access, partner-rate, case, settlement and referral tests; production build; ESLint on changed production modules. Full TypeScript checking has a pre-existing missing Fetcher type in worker/index.ts. Live mobile/Safari visual verification remains a release follow-up.
