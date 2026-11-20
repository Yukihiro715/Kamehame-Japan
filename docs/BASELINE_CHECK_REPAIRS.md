# Baseline check repairs

The baseline at `a051f13` inherited 20 failing tests, 24 lint errors and three
TypeScript errors from before the KV change. These were reproduced on unchanged
code; they did not mean 20 production features were broken.

## Causes and scope

- Nine tests stopped at removed OTP login (HTTP 410). Their operator fixtures now
  seed test passwords and use the real password-login/session API. Production
  authentication and authorization are unchanged.
- Nine expectations lagged approved publication/pricing changes or assumed
  development metadata in a production build. History: `121d443`, `0c97e4c`,
  `b77c084`, `807745b`. Tests now assert the current approved prices, visibility,
  and paused matcha booking. Preview privacy and wholesale-price checks remain.
- The sitemap lacked content-derived keys for approved English-fallback locales,
  causing their lastmod dates to drift on each build. Keys now match the catalog's
  explicit allowlist. Nonexistent translated routes are excluded from sitemap alternates. This does not publish any additional products/locales.
- A scrollbar utility used by MessageScroller was missing. It now reserves space
  for the scrollbar to prevent layout shifting.
- Listing filter components were defined inside render, causing remounts on
  updates. They now have stable component identities. Calendar prop synchronization
  is guarded; necessary URL/storage/DOM synchronization has narrow documented lint
  exceptions. Internal navigation uses Link.
- Host profiles are optional for consultation/clinic pages and already guarded by
  rendering code. The type now reflects that; no profile was fabricated. The Worker
  assets binding has an explicit minimal fetch interface.

No prices, publication approvals, payment flow, or auth security policy were
changed. Browser-interaction checks remain distinct from SSR/source tests; do not
claim manual focus/calendar/cookie-banner validation from the latter alone.

## Separate copy inconsistency

Previously approved venue maps/access guides publish Camellia destinations, while
some older prose still says addresses follow confirmation. This repair preserves
the existing approved map data and does not change the disclosure policy. The
contradictory prose needs a separate editorial decision. Artist names introduced
in `90de9eb` and verified destinations in `481265d`, `f4babd4`, `aebb4c1` are
distinguished from unapproved partner disclosure in privacy assertions.

## Final verification

- `npm test`: verified production build plus 325 tests: 324 pass, 0 fail,
  1 intentional package-mode skip.
- `npm run lint`: 0 errors; 88 existing advisory warnings remain across the
  repository (not just the edited UI files).
- `npx tsc --noEmit`: pass.
- `git diff --check`: pass.
- No browser-interaction test or production deployment was performed.
