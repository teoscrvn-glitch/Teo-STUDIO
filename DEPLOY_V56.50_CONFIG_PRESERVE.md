# Deploy TeoStudio V56.50 — preserve variables and secrets

1. Back up the current source and D1 database before deploying.
2. Deploy the `cloudflare/` and `frontend/` directories from this archive, keeping the Worker build root and asset paths consistent with the current Cloudflare setup.
3. Keep the existing D1 binding `DB` and database ID, and the `ASSETS` binding. Do not create a new database.
4. In Cloudflare Worker → Settings → Variables and Secrets → **Production**, retain all existing Secret entries and their values. Do not delete/recreate secrets just because their values display as “Value encrypted”.
5. Non-secret vars retained in `cloudflare/wrangler.toml`: `AI_API_URL`, `AI_MODEL`, `BUMX_API_URL`, `LINK4M_API_URL`, `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE`, `TELEGRAM_CHAT_ID`, `TURNSTILE_SITE_KEY`.
6. Secrets must stay in Cloudflare and must not be committed to Git or put into this ZIP. Confirm the dashboard still has `ADMIN_KEY`, `AI_API_KEY`, `BUMX_API_KEY`, `LINK4M_API_KEY`, `OXMAIL_SMTP_PASS`, `SEPAY_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TURNSTILE_SECRET`, plus any other secrets currently used by your Worker.
7. The new Link4M/BumX URLs are configured for server-side use, but the existing two-step Free-bypass verification still needs a provider endpoint that securely confirms completion. Do not fill `FREE_BYPASS_VERIFY_URL` with a regular shorten URL.
8. After deploy, check `/api/health`, sign in to admin, test AI, Telegram notification, SePay configuration and both provider APIs in a controlled test.

This archive does not contain production secret values and does not deploy itself. Review the Cloudflare Build settings before deployment to avoid accidentally replacing dashboard-only variables.
