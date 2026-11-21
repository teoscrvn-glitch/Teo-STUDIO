# Deploy TeoStudio V58.6 — Telegram fixes

1. Back up the current Worker and V58.5 ZIP before deployment.
2. Deploy this package to the existing `teo-studio` Worker using the existing `cloudflare/wrangler.toml`.
3. Keep `keep_vars = true`. Do not delete/recreate Cloudflare Secrets, Variables, D1 bindings, Rate Limit bindings or other resources. No new Secret or Variable is required.
4. Existing D1 data is preserved. On first relevant request the Worker creates two additive tables for used pairing codes and Telegram webhook update IDs.
5. After deploy, open one Tenant Admin → Settings → Telegram. Disconnect only if you intentionally want to change the linked chat. Generate a fresh code, open the official bot deep link and press Start. Do not manually resend an already-used code.
6. Confirm the Tenant Admin status becomes “Đã kết nối”. Press “Test thông báo” once and confirm the message names the correct Studio.
7. Send a low-risk test support report from a tenant page with the Cloudflare Turnstile challenge completed. Confirm the report appears in Admin → Support reports and the correct tenant bot receives the alert. If the report is saved but Telegram delivery fails, the API now returns separate delivery states.
8. In a staging/test environment, perform one low-value wallet purchase for a tenant file and verify the notification contains file, Studio, buyer account (masked), actual amount, Studio share, Seller commission, platform fee, order ID and Vietnam timestamp.
9. Test one buyer wallet top-up in staging and confirm the Admin bot receives the payment code, order ID, masked account, SePay transaction ID and Vietnam timestamp.
10. Check `/api/health` and confirm the Worker reports `v58.6-telegram-idempotency-notifications`.

## Rollback
Restore the V58.5 Worker/assets backup if needed. Do not drop `tenant_telegram_used_codes` or `tenant_telegram_updates`; the older Worker ignores these additive tables. Keep the D1 database and all existing Cloudflare configuration intact.
