# TeoStudio V60.7 — Selective Claude Merge & Widget Stability

## Release base
V60.6 full project ZIP is the canonical baseline (575 files). Claude V60.5a was used as a patch source, not as a replacement release.

## Integrated from Claude
- Added the standalone account modal stylesheet.
- Adopted the idempotent `modalize()` class toggle in `teo-file-admin-upgrade.js` to prevent redundant class mutations observed by its MutationObserver.

## Kept from V60.6 intentionally
- V60.6 `performance-guard.js`: selective `[data-live], .teo-sales-track` observation and Admin exclusion. Claude's replacement scans a wider selector list at multiple intervals and drops the Admin exclusion, so it was not merged.
- V60.6 `account.js` purchase flow: absent/stale buyer sessions go to the dedicated login page with a same-origin return path. Claude's inline-modal branch was not adopted.
- V60.6 Admin staged hydration, immediate Admin Key event binding, Worker/API behavior and all existing feature handlers.

## Additional hardening
- Added `detail-widgets.css`, an unlayered and narrowly scoped fallback for the injected account modal and Téo AI launcher on migrated detail pages. The avatar is constrained to a 48–50px circular control.
- Added a lazy account-modal CSS fallback for pages without a known account/widget stylesheet.

## Backend/data safety
No Worker routes, D1 schema, migrations, account data, payment endpoints, secrets or Admin Key were intentionally changed. Only `BUILD_VERSION` and frontend build metadata/cache keys are updated to V60.7.

## Verification limits
Static tests and syntax checks are run in this build. Production Worker/D1 latency, real payment callbacks and physical mobile-browser interaction require deployment testing.
