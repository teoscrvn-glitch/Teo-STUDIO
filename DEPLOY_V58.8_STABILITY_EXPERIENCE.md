# Deploy V58.8 — Stability & Experience

## Before deployment
1. Export/backup the current D1 database `teo-studio`.
2. Save the current production Worker version for rollback.
3. Confirm the current Dashboard Secrets/Variables and D1/Rate Limiter bindings. Do not delete or recreate them.
4. Check that `keep_vars = true` remains in `cloudflare/wrangler.toml`.

## Secrets and variables
- No new Secret is required by V58.8.
- Keep all existing Secrets, especially `ADMIN_KEY`, AI, Telegram, Turnstile, SePay, TheCaoSieuToc Partner ID/Key/Token, `CARD_DATA_ENCRYPTION_KEY`, and `NOTE_FLOW_SECRET` if present.
- Existing Variables and bindings are retained; deployment must target Worker `teo-studio`, Production.

## Deploy
1. Extract the ZIP while preserving its directory structure.
2. Open a terminal in the `cloudflare` directory.
3. Run `npx wrangler deploy --env production` only if your existing project uses a named production environment; otherwise follow the deployment command already used for this Worker (`npx wrangler deploy`). Do not invent a new environment name.
4. Review the Wrangler diff/output before confirming deployment. Do not remove Dashboard variables or bindings.
5. After deploy, open `https://teostudio.top/api/health` and confirm the version is `v58.8-stability-experience`.

## Smoke tests
- Sign in to a tenant account, edit a paid/both product, toggle “Cho phép Seller”, save, reload and confirm the checkbox remains enabled.
- On a Free Studio, attempt to enable Seller and confirm Worker returns `VIP_REQUIRED`; Free should still be able to share free products.
- From `/account`, click “Về Share”; verify the target URL includes the selected Studio slug and the Share page loads.
- Submit a support report from a Studio Share page; verify it appears in the tenant Admin “Báo lỗi” tab and linked tenant Telegram chat. Reply as tenant; verify buyer account notification/email.
- Re-send an already-used Telegram pairing code; confirm the bot responds that the Studio is already linked rather than repeatedly reporting invalid/expired.
- Verify AI is blocked when logged out; sign in and test wallet/orders/studios. Enable AI personalization only when desired, then verify purchases/top-ups context is used. Do not share password/OTP/Secret.
- Set an HTTPS audio/YouTube URL in main Admin or tenant settings; confirm the player only starts after a user click. TikTok links open TikTok, not a background player.
- Open Note Designer in a mobile browser and in desktop-site mode; verify editor and preview stack vertically and no horizontal clipping occurs.

## Rollback
- Re-deploy the previous Worker artifact and previous frontend assets together.
- Do not drop D1 columns/tables or delete Secrets. V58.8 migrations are additive.
- If a UI issue appears, rollback frontend+Worker together; keep D1 additive columns.

## Important limitations
- Automated checks are local/static simulations. They do not prove production Telegram delivery, real AI provider access, email delivery, D1 production migration success, payment success, or device-specific rendering.
- Note redesign and fully autonomous Agent execution are not included in V58.8.
