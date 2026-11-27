# TeoStudio V60.6 — Performance & Purchase Flow Fix

## Scope
Frontend performance fixes for public pages, Master Admin, and Tenant Admin; correction of the unauthenticated purchase navigation and styling of account/assistant widgets injected on migrated detail pages.

## Findings and changes

### 1. Detail-page purchase/login bug
- `detail.html` and `product-detail-view.html` no longer load the legacy `style.css`, while `account.js` and `assistant.js` still inject their account launcher/modal and assistant bubble into `document.body`.
- Their legacy widget styles were therefore absent on these migrated pages. The account markup and Téo Linh avatar could render as ordinary page content after the footer.
- Added the widget styling to the shared `global-ui.css` layer and rebuilt `detail-foundation.css`; detail pages still load exactly 3 stylesheet files.
- `account.js` now redirects an unauthenticated buyer to `/account.html?auth=login&return=...`. If a saved token is stale/invalid, it clears the stale buyer session and performs the same redirect. The return path is same-origin path + query + hash. Valid authenticated buyers retain the existing purchase-confirmation and payment flow.

### 2. Main-thread / page-load work
- Replaced the broad animation scan in `performance-guard.js` (`querySelectorAll('*')` / per-element animation enumeration) with a selective observer for explicitly opted-in animation elements (`[data-live], .teo-sales-track`).
- Disabled the reveal observer work on Admin pages in `teo-experience.js` and `legal-ui.js`.
- Master Admin binds the Admin Key form immediately; validation of a stored token runs with a timeout in the background. Core product/settings/stat data loads first; secondary analytics, support reports, runtime configuration, monetization, and comments are staggered after the shell is usable.
- Tenant Admin loads the Studio identity and core product/comment/tag/note data first. Statistics, audit history, security blocks, notifications, support reports and wallet data are hydrated later without blocking initial shell render.
- Existing routes, buttons, and handlers were retained; API endpoint definitions and D1 schema/migrations were not changed.

### 3. Cache/build identity
- Bumped frontend cache keys and build identity to `v60.6-performance-purchase-fix` to prevent stale browser/CDN assets after deployment.
- `cloudflare/worker.js` differs from V60.5 only by the `BUILD_VERSION` string. No route/business logic changes were made.
- D1 migration files are byte-identical to V60.5.

## Verification results
- `scripts/check-feature-parity.mjs frontend`: PASS — required feature IDs/forms/handlers retained versus baseline.
- `scripts/test-v60.3-phase0-performance.mjs`: PASS.
- `scripts/sync-build-id.mjs --check`: PASS.
- `scripts/build-detail-foundation.mjs --check`: PASS — generated `detail-foundation.css` matches its source bundle.
- `scripts/check-build.sh`: PASS — 40/40 checks, including JavaScript syntax, static regressions, security checks and SQLite simulations.
- `frontend/detail.html`: exactly 3 stylesheet references.
- New widget rules in `global-ui.css`: 0 `!important`.
- Full inherited CSS strict lint: still reports 512 `!important` and 14 legacy purple/pink violations. Running the same linter on the V60.5 baseline gives the same totals (512 and 14); this patch did not increase those inherited counts. The full-tree strict lint is therefore not yet clean.
- Worker source comparison after normalizing `BUILD_VERSION`: identical. D1 migration file comparison: identical.

## Not verified in this environment
- A real interactive browser session could not be launched against the local test server: Chromium returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` when navigating to the local HTTP origin. Therefore no authentic before/after browser screenshots or end-to-end mobile taps are claimed.
- Live Cloudflare Worker/D1 latency, production account sessions, actual SePay/provider payment callbacks, and Telegram delivery were not tested. `check-build.sh` includes local syntax/static/SQLite simulations only.

## Deployment
- Deploy the complete V60.6 frontend asset set together so the HTML and cache keys stay aligned.
- Deploy the updated Worker build file together if the release process uses `BUILD_VERSION` for diagnostics/version reporting. No D1 migration or database reset is required.
- After deployment, test one unauthenticated purchase on `/detail?id=...`, one signed-in purchase preview, Master Admin login, and Tenant Admin login on a mobile device.
