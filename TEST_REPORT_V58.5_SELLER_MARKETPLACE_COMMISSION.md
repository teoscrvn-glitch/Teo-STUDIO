# Test report — V58.5 Seller Marketplace & Commission

## Passed
- Worker and all 31 frontend JavaScript files pass `node --check`.
- New V58.5 Seller marketplace regression suite: 19 assertions passed.
- Existing V58.4 integration suite: 27 checks passed.
- Existing Seller/Ads regression suite: 30 checks passed.
- Existing V58.69 analytics/bypass regression suite passed.
- Existing Note/Key Vault regression suite: 17 feature assertions, SQLite smoke tests, and syntax checks passed.
- Commission accounting invariant checked at 0%, 5%, 12.5%, and 50%: platform fee + Seller commission + owner share equals the sale amount and owner share is non-negative.
- SQLite smoke test confirms old product rows receive the additive 5% default.

## Not verified in this environment
- Cloudflare Production D1 migration execution.
- Live user login, live catalog data, and production UI rendering on mobile devices.
- Real wallet purchase, Seller attribution, refund, and payout on Production.

Production validation is required before enabling Seller broadly.
