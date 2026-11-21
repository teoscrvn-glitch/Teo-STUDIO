# TeoStudio V56.16 — Account, Wallet & Tenant Suite

## Scope
- Refresh all frontend cache keys to V56.16 so updated account/buy scripts load instead of cached V56.14 assets.
- Route paid purchase buttons through one capture-phase wallet action handler. The purchase flow opens a confirmation modal, checks balance and Turnstile, then sends the idempotency key to the Worker.
- Continue the buyer account login flow with ID/email + password, email verification, 7-day idle session expiration, linked Studio SSO, email/password changes and account notifications.
- Tenant dashboard keeps owner-only statistics (site/file/outbound views, referrers, own file sales/conversion and month-by-month history) and manual per-Studio IP/email blocking. It does not expose global wallet top-ups or the master payout-approval queue.
- Direct Studio Admin links can reuse a valid signed-in buyer session; a legacy tenant ID/password login remains supported.
- Admin-created tenant emails are marked verified by the trusted admin creation route; customer-facing buyer account registration still requires email verification.
- Teo AI has explicit, whitelisted navigation actions for safe UI navigation. It never buys files, changes money/settings, deletes records, bans people or requests withdrawals automatically.
- Fix tenant sales statistics to use the requested rolling date range instead of accidentally only the first month of the range.

## Cloudflare compatibility / data safety
- D1 migration is additive (`CREATE TABLE IF NOT EXISTS` and safe `ALTER TABLE ADD COLUMN`); no tables/data are dropped.
- Keep the existing D1 binding `DB` and current database `teo-studio`.
- Keep these Worker secrets in Cloudflare, not in Git: `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, `OXMAIL_SMTP_PASS`.
- `wrangler.toml` keeps only normal public configuration values (`SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TURNSTILE_SITE_KEY`). Compare their values with the existing Production variables before deployment.

## Validation limits
Static syntax and regression checks pass when the build script passes. Live Cloudflare D1, SePay purchase debit/credit, SMTP deliverability and device-specific browser tests are not claimed unless explicitly listed in `TEST_REPORT_V56.16.md`.
