# Admin Analytics Recovery Patch

Base archive: TeoStudio V60.3.2 Detail Admin UX.

## Changes
- Initialize the Card Exchange D1 schema before the Master Admin analytics endpoint reads card top-up tables. This removes an ordering dependency where the Admin dashboard could be the first request to touch `card_topups`.
- Add bounded fallback handling around summary, wallet-top-up, daily-purchase, view, and tenant-sales analytics queries. A missing optional/legacy reporting table or column no longer turns the entire analytics endpoint into a generic `SERVER_ERROR`; the affected section returns zero/empty data and the Worker logs a named diagnostic.
- Preserve all existing tables and records; no destructive migration or D1 reset is introduced.

## Validation
- Worker and frontend syntax checks passed as part of `scripts/check-build.sh`.
- Existing V60.3 build checks passed.
- `node scripts/test-admin-analytics-recovery.mjs` verifies schema initialization and fail-soft behavior.

## Important limitation
This is a code-side recovery patch, not proof against the live production D1 database. It does not identify which exact production query failed because the screenshot does not contain the Worker log or failing request response. After deploying, if a section still reports empty data, inspect Cloudflare Worker logs for `[admin-analytics]` entries and reconcile the corresponding D1 schema. No production data or secrets were accessed or changed.
