# Deploy V56.16 from Android — careful checklist

## Before touching production
1. Keep the currently working commit/ZIP as rollback.
2. Do not delete/recreate Worker `teo-studio`, D1 database `teo-studio`, binding `DB`, payment data or any Secrets.
3. Take a D1 backup/export before changing production.
4. Open the ZIP locally and extract its **contents**. Do not upload the ZIP file itself to Cloudflare expecting Cloudflare to unpack it.

## Update GitHub correctly
1. Open repository `teoscrvn-glitch/Teo-STUDIO`.
2. Merge/replace the matching root paths from this ZIP: `cloudflare/`, `frontend/`, `scripts/`, `README.md`, and the V56.16 docs. Keep files in their existing paths; do not add an extra parent folder.
3. Confirm Worker Builds is still configured with root directory `cloudflare` and build/deploy command `npx wrangler deploy`.
4. Commit, then open Cloudflare → Workers & Pages → `teo-studio` → Deployments and verify the newest deployment uses the new commit hash. Do not retry an old build hoping it will pick up a later commit.
5. Check `https://teostudio.top/api/health`; expected version is `v56.16-account-wallet-tenant-suite`.

## Preserve configuration
- `cloudflare/wrangler.toml` retains the observed D1 binding and non-secret vars `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TURNSTILE_SITE_KEY`. Compare these values to your current Production Variables before commit; edit them if your current values differ.
- Keep `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, and `OXMAIL_SMTP_PASS` as Cloudflare Secrets. AI/Telegram credentials, if configured, also remain secrets/variables in Cloudflare as appropriate.
- Do not put secret values into GitHub or this ZIP. Do not press Delete beside any secret or D1 binding during deploy.
- Wrangler may show a warning to sync runtime variables/config. Review the values rather than blindly deleting/recreating variables. Cloudflare stores secret values independently; confirm secret names remain present after deployment.

## Test in this order
1. Open the buyer account, confirm ID/email/verified state and wallet balance.
2. Open a 15,000đ test product while balance is 10,000đ. Expected: a modal explains current balance and the 5,000đ shortfall, with a top-up button; no purchase is sent and no money is deducted.
3. After a confirmed top-up provides enough balance, test a test product: accept the purchase terms, complete Turnstile, confirm the purchase. Verify one order, exactly one buyer debit, appropriate seller credit/commission for tenant files, returned download link, and email/in-app notifications. Do not tap retry if the balance changed; inspect Orders first.
4. Test tenant Admin using the account owner's “Mở Admin” link, then check overview, files, comments, tags, manual IP/email blocklist, notifications, theme settings and (VIP only) own wallet/withdrawals.
5. Test manual tenant ID/password login for an old tenant account. Test explicit logout, browser reload and idle expiry logic (the actual seven-day timeout cannot be proven with a quick manual test).
6. In main Admin runtime check, run Email Test only after confirming OxMail settings. AI is expected to show “needs configuration” until valid `AI_API_URL`, secret `AI_API_KEY`, and `AI_MODEL` are entered.

## Rollback
If any essential flow fails, restore the previous verified code commit in GitHub and let the same Worker build deploy it. Do not roll back by deleting D1 or clearing wallet ledgers. Existing secrets and D1 binding should remain unchanged.
