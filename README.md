# TeoStudio V56.13 — Tenant Dashboard Interactions Fix

This release fixes the tenant-admin JavaScript initialization error that left dashboard tabs and buttons unresponsive, improves recovery from a partial tenant-data API failure, and keeps existing non-secret Production variables in Wrangler config.

## Read first
- `VERSION_V56.13.md` — scope and known limits.
- `DEPLOY_V56_13_TENANT_DASHBOARD.md` — mobile/GitHub + Cloudflare deployment steps.
- `TEST_REPORT_V56.13.md` — local checks run and what was not tested live.

## Data and configuration
- Preserves the existing D1 database binding `DB` and database ID in `cloudflare/wrangler.toml`.
- Records only the observed non-secret Production variables in `[vars]`: `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, and `TURNSTILE_SITE_KEY`. Confirm they still match your Cloudflare Production values before deployment.
- Does not contain secret values. Keep `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, and `OXMAIL_SMTP_PASS` in Cloudflare Secret storage.

## Important
Local syntax/static checks pass, but this package has not been exercised against your live D1/Worker, bank transfer, or withdrawals. Use a backup/rollback point and verify a tenant dashboard with a test tenant before relying on it.
