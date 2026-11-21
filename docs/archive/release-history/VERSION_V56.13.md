# TeoStudio V56.13 — Tenant Dashboard Interactions Fix

## Fixed
- Fixed a JavaScript scope error: `updateProductModeFields()` was called outside `bind()` even though it was declared inside `bind()`. The uncaught `ReferenceError` stopped dashboard event registration, making tabs and buttons appear dead.
- Moved product-form initialization into the correct scope and removed the unsafe global call.
- Added `Promise.allSettled` for tenant products/comments/tags. One secondary API failure no longer automatically kicks a valid session back to the ID/password form; a visible dashboard warning identifies partial-load errors.
- Invalid/expired/locked tenant sessions are still sent back to the login gate.
- File/comment Visible/Hidden filters now keep their active state in sync. “Show more” and “Show less” buttons have larger touch targets and clearer styling.
- Fixed existing-file edit form field binding to use `form.elements.namedItem(...)`, avoiding collisions with native form/DOM properties.
- Updated frontend/Worker release fingerprints to `v56.13-tenant-dashboard-interactions`.
- Added the currently observed non-secret Production variables to `[vars]` in `cloudflare/wrangler.toml` so Wrangler config stays aligned: `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TURNSTILE_SITE_KEY`. Secret values remain outside the repository.

## Existing tenant features exposed by working controls
- Overview + statistics, File CRUD/hide/show, comment hide/show/delete, tag tree management, appearance/profile, password/security password, VIP wallet/payout/withdrawals, plus the paid-plan builder link.
- Global master-admin-only features (manage all tenants, global blocklist, master payout approvals) intentionally remain in the main admin, not each tenant dashboard.

## Verification limits
Local JS syntax, release fingerprint, config-preservation checks, and ZIP integrity are tested. Live Cloudflare Production, actual D1 authentication, SePay settlement, SMTP and real payout flows are not tested here. Keep V54 or the currently working deployment as a rollback point.
