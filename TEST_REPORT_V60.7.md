# TeoStudio V60.7 — Test Report

## Result
- `scripts/check-build.sh`: PASS, all 40 stages completed.
- `scripts/check-feature-parity.mjs frontend`: PASS — no required IDs, forms, fields or handlers lost versus the saved baseline.
- `scripts/sync-build-id.mjs --check`: PASS.
- `scripts/build-detail-foundation.mjs --check`: PASS.
- `scripts/check-local-refs.mjs frontend`: PASS — 60 HTML/CSS files checked.
- `scripts/check-inline-js.mjs frontend`: PASS — 7 inline scripts, 0 failures.
- All frontend JS and Worker syntax checks passed as part of the build suite.
- Detail pages remain within the 3-stylesheet budget.

## Selective merge decisions
- Adopted Claude's idempotent `modalize()` change.
- Kept V60.6's performance guard because it is selective and explicitly skips Admin; Claude's replacement drops the Admin skip and scans a wider selector set repeatedly.
- Kept V60.6's purchase flow, including stale-session cleanup and same-origin return to the dedicated login page.
- Added unlayered, scoped widget fallback styles into `global-ui.css`, then rebuilt `detail-foundation.css`. This addresses the injected account modal and Téo AI bubble without adding another stylesheet to migrated detail pages.
- Retained `account-modal.css` as a lazy fallback asset for pages without the known widget stylesheets.
- Rejected Claude's wholesale HTML overlay because it downgraded asset cache versions and reverted Tenant Admin's patch query from 608 to 606.

## Existing CSS debt
The repository-wide design linter still reports 512 `!important` and 14 legacy purple/pink color occurrences. These counts match the V60.6 baseline; V60.7 did not increase them. The V60.7 additions themselves introduce no `!important` rules.

## Backend/data safety
- No D1 migration files changed.
- No API route or payment business logic was intentionally changed.
- Worker changes are limited to the `BUILD_VERSION` string.
- No production Worker/D1, live payment callbacks, or physical mobile browser session were available for end-to-end verification.
