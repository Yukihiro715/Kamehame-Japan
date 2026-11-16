# KV write budget

The five-minute checkout health check remains unchanged. The publisher now reads
persisted state and writes immediately on a state/policy change, missing/invalid
state, or after a 15-minute heartbeat. Pages still reject publications older than
30 minutes, and the payment endpoint still checks the ledger independently.
KV read/write failures retain the existing fallback/retry behavior.

For continuously healthy cron execution and unchanged state, two Workers go from
576 readiness writes/day to 192 (384 fewer, about 67%). This adds approximately
576 reads/day; it is a **write** optimization, not a reduction in all operations.
State changes and readiness API calls can add writes.

The golf detail refresh still fetches fresh source data after the 14-day cache
expires. A complete translation from the previous snapshot is reused only when
features, schedule and notes match exactly. Changed or incomplete translations
are not reused. This reduces repeat translation writes, but does not eliminate
all expiry bursts: details beyond the fetch budget or a failed fetch may lose
that old snapshot translation. Schedule freshness and fetch budgets are unchanged.

## Rollout / verification

The quota alert alone does not identify the exhausted operation. Before deciding
that this fully resolves the incident, inspect KV Analytics by namespace and
operation for production and staging, check write errors, and compare a full UTC
day after deployment. Check cron heartbeat age and both readiness transitions.
No billing or Cloudflare configuration changes are included.

Deployment requires separate approval. Merge to main triggers production deploy;
staging uses its own branch and must receive the fix separately. Until both
Workers run the change, the two-Worker saving above does not apply. To roll back,
revert the code commit; there are no migrations or persisted schema changes.
