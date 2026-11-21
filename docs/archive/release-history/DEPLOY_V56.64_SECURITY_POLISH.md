# Deploy TeoStudio V56.64 — Security & Seller UI

## Before deploying

1. Export / back up the D1 database `teo-studio` and retain the currently deployed Worker version for rollback.
2. Compare the Cloudflare Dashboard's production Variables with `cloudflare/wrangler.toml`. If the Dashboard has additional non-secret Variables, preserve them in the configuration before deploying.
3. Keep the existing D1 binding and database ID unchanged.
4. Do not delete or recreate the Worker, D1 database, secrets, or any existing table. This release adds no destructive migration and does not change financial ledger rows.
5. Preserve all existing Cloudflare Secrets, including `ADMIN_KEY`, `AI_API_KEY`, `BUMX_API_KEY`, `LINK4M_API_KEY`, `OXMAIL_SMTP_PASS`, `SEPAY_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, and `TURNSTILE_SECRET`. Never put secret values in this ZIP or in `wrangler.toml`.

## Deploy

Run from the project root:

```bash
npx wrangler deploy --config cloudflare/wrangler.toml
```

The static assets are served from `frontend/` as configured by the existing Wrangler assets binding. The existing hourly Cron remains configured in `cloudflare/wrangler.toml`; it also cleans expired Seller attribution tokens.

## Post-deploy smoke test

1. Open `/api/health` and confirm `version` and `frontendVersion` are `v56.64-seller-security-polish`.
2. Open the main product detail page for a paid product with Seller enabled; the Seller CTA should appear. Repeat for one tenant product.
3. Sign in and open `/seller.html`; confirm catalog, pending/available balance and payout state load.
4. Generate a Seller link and confirm its query contains a 24-hex referral code. On opening it, the browser receives a 48-hex attribution token from the Worker.
5. Test a purchase in a staging database only. Verify owner / Seller / platform allocations match the existing 90/5/5 formula and that self-referral is ignored.
6. Check payout profile / withdrawal only after `seller_payouts` is intentionally enabled in a test environment.
7. Inspect mobile layout in a real browser and review Cloudflare Worker logs for 4xx/5xx spikes.

## Rollback

Re-deploy the previous Worker code and static asset version. V56.64 uses existing V56.63 Seller tables and makes no destructive data migrations; do not restore an old D1 snapshot over newer live financial history unless an incident-response plan explicitly requires it.

## Limits of this release

- Ads in this codebase remain manual report import + Admin confirmation + 80/20 ledger settlement. Provider SDK / signed postback integration is still pending provider documentation and credentials.
- The separate multi-link “Trang Note” builder is not in this patch.
- Purchased external file URLs can be shared by a buyer. Strong redistribution protection requires private object storage and authenticated short-lived download delivery.
- No production deployment or live D1 verification was performed while building this ZIP.
