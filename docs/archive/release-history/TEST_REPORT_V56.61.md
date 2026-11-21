# V56.63 test report

## Executed locally
- `sh scripts/check-build.sh`: pass (Worker/frontend syntax, AI guardrails and unified Tenant session regression checks).
- `node scripts/check-local-refs.mjs`: pass (15 HTML/CSS files).
- `node scripts/check-inline-js.mjs`: pass (4 inline scripts, 0 failures).
- `python scripts/test-wallet-ledger.py`: pass (purchase idempotency and wallet balance model).
- `python scripts/test-tenant-sales-isolation.py`: pass (same product ID across tenants does not leak rows).
- `python scripts/test-v56.63-monetization.py`: pass (95/5 and 90/5/5 split, final paid amount example, seven-day pending/refund reversal, withdrawal reserve/approve/reject/paid and idempotency, pending ads create no balance and confirmed ads credit 80/20 once).
- Compared the `handleSePayWebhook` function against the original V56.60 ZIP: byte-for-byte identical (29,115 characters).
- Static review confirmed new table/column migrations are additive; existing wallets and historic ledger rows are not updated by the schema migration.

## Not executed here
- Cloudflare Worker runtime integration or production deployment.
- Real Telegram Bot API request, because this environment does not have access to the user's Cloudflare Secrets or live bot.
- Production D1 migration, payment webhook replay, concurrent withdrawal race or tenant isolation against the live database.
- Real ad-network API integration. V56.63 stores provider metadata and supports manual report import/reconciliation; it does not fetch earnings directly from an ad network.

## Important operating constraints
- Payout feature is off by default.
- Ad monetization feature is off by default; pending reports never create spendable balance.
- Seller attribution lasts 30 days; commission becomes available after seven days. A refund adds compensating ledger rows and preserves the original order history.
- The current codebase has no wallet coupon/discount flow. Allocation uses the server-calculated amount stored as `buyer_purchases.amount_vnd`.
