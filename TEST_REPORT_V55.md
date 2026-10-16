# TeoStudio V55 — Local Test Report

Date: 2026-10-15

## Checks performed

- `node --check cloudflare/worker.js` — passed.
- `node --check` on each `frontend/assets/js/*.js` file — passed.
- SQLite execution of the new V55 table/index migration definitions — passed (9 new tables, 10 indexes in the V55 migration block); additive columns `request_key`, `studio_name`, and `owner_user_id` were simulated as part of migration order. The monthly analytics SQL adds file sales and paid rental orders separately, while excluding top-ups from gross revenue.
- SQLite regression test of purchase-ledger SQL strategy — passed: sample 15,000đ tenant purchase debited buyer by 15,000đ, credited seller 14,250đ and platform 750đ; a repeated idempotency key did not generate another purchase/debit/credit.
- Source inspection verified public paid-product APIs suppress original download links and legacy public direct purchase creation endpoints are disabled.

## Not tested here

- Production Cloudflare Worker deployment or compatibility with the exact live repository commit.
- Live D1 schema/data, real concurrent requests across Cloudflare, real SePay webhook delivery/retries, QR scanning, payment matching, refunds, SMTP/email delivery, Turnstile widget behavior, AI provider API, Telegram delivery, or the complete mobile UI across devices.
- Cloudflare WAF/Rate Limiting rules. Worker in-memory throttles are only best-effort per isolate and do not replace edge rules.

## Rollout blockers/checklist

1. Back up production D1 before deploying.
2. Compare/merge V55 with the actual current GitHub main branch; this package is based on the supplied V54 ZIP, not a live export.
3. Ensure Worker runtime secrets/vars and D1 binding are preserved.
4. Deploy to staging if available; verify `/api/health` reports `v55-wallet-account-ai-builder`.
5. Test account registration/email reset, top-up with a small amount, one wallet purchase, duplicate request replay, seller ledger split, Telegram report, analytics monthly filter and builder permissions.
6. Verify a public request to a paid product cannot retrieve the original link, including by direct API access.
7. Only then roll out to production. Do not test with repeated live transfers; do not reset D1.
