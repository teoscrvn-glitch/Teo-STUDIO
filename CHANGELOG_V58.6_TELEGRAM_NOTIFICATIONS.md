# TeoStudio V58.6 — Telegram linking, support delivery & transaction notices

## Fixes
1. Tenant Telegram pairing now stores consumed pairing-code hashes. Re-sending a code already used by the same active chat returns an idempotent “already linked” response instead of a false expired/invalid-code warning.
2. Telegram webhook `update_id` values are deduplicated in D1, preventing Telegram delivery retries from processing one incoming message repeatedly.
3. Pairing success is sent only after the tenant/chat link and consumed-code record have been written.
4. Tenant Telegram send results now include a safe provider error reason when Telegram rejects a message or times out.
5. Support reports remain saved in D1 even if Telegram notification delivery fails. The API response now distinguishes Admin and tenant notification delivery, so “report saved” is not confused with “Telegram delivered”. Tenant reports include Studio, report ID, category, page, masked account, Vietnam timestamp and description.

## Notification format
- Buyer wallet top-up (Admin bot): credited amount, payment code, top-up order ID, masked email/login ID, SePay transaction ID and Vietnam date/time.
- Wallet file purchase (Admin bot + matching Tenant bot): main/tenant scope, Studio name, order ID, file title, masked buyer account, actual paid amount, owner amount, Seller commission, platform fee and Vietnam date/time.
- Legacy direct SePay tenant file orders: file, Studio, buyer, actual amount, Studio credit, referral commission, explicit 0đ platform fee for this legacy flow, bank transaction ID and Vietnam date/time.

## Accounting/privacy notes
- Buyer emails remain masked in tenant-facing Telegram messages.
- Buyer wallet top-ups are global TeoStudio wallet events and are sent to the Admin bot. They are not broadcast to arbitrary tenant bots because the current top-up order has no tenant attribution.
- The legacy direct SePay tenant-order flow does not create a Seller-program commission or platform fee; its referral commission is labeled separately and is not mislabeled as Seller earnings.
- No Secrets, Variables, D1 bindings, Rate Limit bindings or existing tables are removed. Two additive D1 tables are created automatically: `tenant_telegram_used_codes` and `tenant_telegram_updates`.
