# Test Report — V58.8 Stability & Experience

## Result
- `scripts/check-build.sh`: PASS, 26 stages.
- Worker syntax: PASS.
- Frontend JavaScript syntax: PASS (all files under `frontend/assets/js`).
- Existing regression scripts: PASS for AI guardrails, unified tenant sessions, Seller security, card exchange security/rates, wallet ledger, MD5 signatures, Free bypass, identity/IP rate limits, legal/privacy, Note/Key Vault and Merchant/Ads/Agent integrations.
- New V58.8 static regression script: PASS.
- D1/SQLite smoke tests included in prior suite and the new support report schema test: PASS locally.
- ZIP integrity: checked separately with `unzip -t`.

## New V58.8 assertions
- Seller checkbox reads from actual form controls.
- Free tenants cannot enable Seller through API; Seller requires a paid/both mode.
- Tenant support reports are scoped to the authenticated `tenant_id`; tenant replies notify buyers and linked tenant Telegram.
- AI chat/Agent require authentication; account context (purchases, top-ups, wallet ledger, activity) is gated by explicit personalization consent.
- Account back-to-Share selects an owned Studio slug instead of linking to bare `/share`.
- Repeated Telegram link codes are handled idempotently.
- Background music uses HTTPS, both main and tenant settings, and user-initiated playback.
- Note editor stacks at 1100px and respects reduced motion.
- Wrangler preserves Dashboard variables and existing bindings.

## Not covered
No live test was performed against Cloudflare Production, real Telegram bots, email delivery, AI provider, TheCaoSieuToc, SePay, D1 production data, phone browser screenshots or real payments. Local/static test success is not a guarantee that every runtime issue is fixed.
