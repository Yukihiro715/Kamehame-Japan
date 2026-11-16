# Private cost ledger integration

This is an optional, disabled-by-default input to `/ops/`. It does not grant a
scheduled agent access to Gmail, Slack or the production database. Those source
connections and the private spreadsheet writer must be authorized and verified
separately. No customer data, evidence URLs, spreadsheet IDs or credentials belong
in this public repository.

## Configure the reader

1. Apply migration `0027_business_ledger_sync.sql` before deploying the reader.
   The production workflow already applies pending D1 migrations before deploy.
2. Enable **Google Sheets API** in the existing Google OAuth client's project.
   Reauthorize its existing credentials with all existing scopes plus
   `https://www.googleapis.com/auth/spreadsheets.readonly`. Retain `adwords`,
   `webmasters.readonly` and `analytics.readonly`; replacing those permissions
   would interrupt the existing reports. Store the resulting refresh token in
   the existing Worker secret. Do not paste credentials into source or a task.
3. Give that Google account read access to the intended private spreadsheet.
   Do not enable link-public sharing. Create the three tabs with the exact
   headers from `lib/business/ledger-contract.ts`.
4. As an operations administrator, open **設定 → 原価台帳との連携**, enter the
   private spreadsheet URL, enable sync and select **保存して今すぐ同期**.
5. Verify the imported cases, masters, last-success time and confirmation queue.
   Verify a second run makes no duplicate records. Only then enable a separately
   authorized source-writing automation and verify its write/readback path.

The existing five-minute Worker cron and the administrator's manual sync use the
same reader. A leased lock prevents overlapping jobs. Failures keep prior data
and the last successful timestamp. Disabling sync stops subsequent scheduled
reads; it does not delete previously imported records.

## Spreadsheet contract

| Tab | Range | Purpose |
| --- | --- | --- |
| 事業連携_案件 | A1:K1001 | Booking summaries and a validated booking JSON in K |
| 事業連携_卸値 | A1:J1001 | Supplier-price summaries and a validated master JSON in J |
| 事業連携_確認待ち | A1:G1001 | Bounded, explicit questions with source links |

Keep headers unchanged. The final JSON columns can be hidden, but must contain
the full current `booking`/`master` schema from `lib/business/storage.ts`. Visible
summary columns are for review: a writer must update them and the JSON together.
Changing a summary cell alone does not change the imported financial record.
Use literal text cell values for names and evidence, never untrusted formulas.
Keep unrelated sheets, formulas, manual inputs and permissions unchanged.

The reader fetches only these fixed ranges from the Google Sheets API, rejects
redirects, rejects responses over 2 MB and validates all rows before processing
any record. Each data tab supports at most 999 records; a populated last boundary
row stops import instead of silently truncating it. Duplicate IDs, inconsistent
IDs, invalid JSON, changed headers and invalid review states stop the read.
The review states are `未確認`, `解決済`, `見送り`. Up to 100 pending source questions
and 50 local conflict records are shown at a time.

## Preserve operations edits

Each source row is tracked by spreadsheet, record kind and source ID. Exact
request IDs, reservation IDs, external references or canonical Stripe IDs can
link an existing stored case. Ambiguous or conflicting identities are rejected;
names and amounts are never used as identity matches.

On first encounter, a new record is inserted; an existing record is preserved
and differing fields are queued for review. Later reads compare the source,
current record and previous source baseline. A source change can automatically
replace only a field that still equals its baseline. Cost arrays are atomic, so
one manual cost edit protects the entire breakdown. Missing source rows never
delete local records. Native reservations continue using the existing booking
projection and its identity deduplication.

Finance users can review differences under **案件・原価管理**. Each approval is
guarded by the exact source hash and record revision shown to the user, audited,
and committed atomically. A changed quote or concurrent operator edit requires
a fresh review. Selecting the current input keeps it authoritative until a
subsequent source change. Only administrators can configure or manually run sync;
normal session, first-password-change, CSRF and role checks remain in force.

## Source-writing automation contract

Creating a task is a separate rollout step, not part of this code deployment.
Its instructions should require all of the following:

- Read only authorized KAMEHAME Gmail/Slack conversations since the last verified
  checkpoint, with a short overlap and stable message/thread IDs for deduplication.
- Match a booking by explicit request, reservation or verified payment identity.
  Do not guess from a similar name or amount. Preserve manually entered costs.
- Record supplier, amount, quantity, tax/fee conditions, certainty and evidence.
  A quote is an estimate until accepted. A customer refund, supplier payment,
  guide advance, deposit hold and expense are separate facts; do not double count.
- Put ambiguous identities, missing final quotes and cancellation costs into
  `事業連携_確認待ち` instead of manufacturing a zero or confirmed amount.
- Write only the authorized integration tabs. Keep visible summaries and hidden
  JSON consistent, validate against the schema and read back the changed rows.
  Advance the checkpoint only after successful write/readback.
- Do not send email/Slack messages, change advertising, create payments, alter
  access permissions, or write directly to D1. Notify the owner only about
  material changes or decisions required. Never embed credentials in the task.

Verify the source reader, spreadsheet writer and Worker reader independently.
A browser session or interactive connector read alone does not prove that an
unattended task can write or that the Worker token has the Sheets scope.

## Verification

`node --test tests/business-ledger.test.mjs` exercises real migrations and SQLite
queries, including merges, identity checks, stale approvals, source validation,
bounded provider responses, preserved data after failure and API access rules.
`node --test tests/business*.test.mjs tests/portal-api.test.mjs` checks the adjacent
financial and portal behavior. Production build and a private authenticated
end-to-end sync are separate checks; a deployed reader alone is not an active
Gmail/Slack integration.
