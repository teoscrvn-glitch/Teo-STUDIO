# TeoStudio V57.1 — Unified release candidate

This is a consolidated release candidate based on V56.4 plus diagnostics, optional public sales display with buyer opt-in, and local static-reference checks. It is not yet a verified production release.

## Additional fixes in V57.1
- Added `frontend/earn.html` to stop the existing “Điểm” header link from opening a missing page. It explains that a separate rewards-points program is not enabled and links to the account/wallet.
- Fixed the legacy tenant `/api/public-tenant/:slug/recent-sales` API to return orders only for buyers who explicitly enabled `publicSalesOptIn`, matching the new main sales-feed endpoint.
- Added a checker for missing static local HTML/CSS asset references.
- Bumped the runtime/frontend fingerprint to `v57.1-unified-release-candidate` and cache-busting query strings to `v=57.1`.
- Runtime `/api/health` checks the D1 binding using `SELECT 1` and reports missing configuration by name only.

## Existing consolidated areas
Shared buyer accounts, email verification/reset, wallet top-up and purchase ledger, tenant rental/upgrade, builder, detailed statistics, reports, blocklist and moderation, Teo AI fallback/API integration, Telegram notifications, Turnstile and SePay configuration diagnostics.

## Limitations
Local tests do not prove production secrets, current D1 data/schema, SMTP, AI, Telegram, Turnstile tokens or SePay webhooks work. Perform the documented staging acceptance checks before switching production.
