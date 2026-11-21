# V56.13 deployment on Android / GitHub + Cloudflare Workers Builds

This ZIP is arranged with `cloudflare/`, `frontend/`, `scripts/` at the archive root. In the `teoscrvn-glitch/Teo-STUDIO` repository, replace matching files at those exact paths; do not upload the ZIP as if Cloudflare would extract it. The Worker Build root is `cloudflare` and command `npx wrangler deploy`, with static assets in `../frontend`.

## Before deploy
1. Keep the current deployment/release ID as rollback reference. Do not delete the Worker, D1, tenant records, or Secret values.
2. Check the repository diff before committing. This release includes the existing D1 binding/database ID and the observed non-secret variables in `cloudflare/wrangler.toml`.
3. Keep secret values only in Cloudflare's Production Secret store: `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, `OXMAIL_SMTP_PASS`. Do not place their values in GitHub.
4. Ensure the `[vars]` values in `cloudflare/wrangler.toml` match the current account. The included values were read from the user's latest screenshot: `SEPAY_ACCOUNT_NUMBER=0979498243`, `SEPAY_BANK_CODE=MB`, `TURNSTILE_SITE_KEY=0x4AAAAAAFM6DoL2w6HDogkC`. If these have changed, adjust before deploying.

## Deploy and check
1. Commit the changes, then confirm Cloudflare builds the new commit (do not retry an old commit).
2. Check `https://teostudio.top/api/health` for version `v56.13-tenant-dashboard-interactions`.
3. Hard refresh/open a new browser tab to `https://teostudio.top/tenant-admin.html?tenant=YOUR_TENANT_SLUG`.
4. Test: click Overview / Content / Wallet & Withdrawals / Settings; click File / Comments / Tags; open Add File and Cancel; switch Visible / Hidden lists; if over 9 records, test Show more then Show less. Test comment moderation, tag creation, settings save and logout only using a safe test tenant.
5. If a specific data API fails, the dashboard should stay open and show a warning. Check Cloudflare Observability logs before doing destructive changes.

This static validation cannot guarantee the live D1 login, payout/profile or SePay flows until tested on the deployed Worker.
