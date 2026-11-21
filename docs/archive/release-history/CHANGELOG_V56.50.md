# TeoStudio V56.50 — Preserve Production configuration + Link4M/BumX API settings

## Changes
- Based on the V56.49 source archive.
- Added the non-secret Worker variables `BUMX_API_URL=https://linkfree.click/s/link/shorten` and `LINK4M_API_URL=https://link4m.co/api-shorten/v2` to `cloudflare/wrangler.toml`.
- Preserved the currently observed non-secret Production values for AI provider/model, SePay bank/account, Telegram admin chat, Turnstile site key, D1 binding, and static asset binding.
- Updated the Worker build marker to `v56.50-provider-config-preserve`.
- API keys remain Cloudflare Secrets and are deliberately not copied into the ZIP or `wrangler.toml`.

## Existing Secrets to retain in Cloudflare Production
- `ADMIN_KEY`
- `AI_API_KEY`
- `BUMX_API_KEY`
- `LINK4M_API_KEY`
- `OXMAIL_SMTP_PASS`
- `SEPAY_API_KEY`
- `TELEGRAM_BOT_TOKEN` (and any configured webhook/tenant Telegram secrets)
- `TURNSTILE_SECRET`

Do not delete these Secrets during deployment. Cloudflare does not expose encrypted secret values to source code, so this archive preserves the secret names/configuration contract, not the secret values.

## Provider limitation
The Link4M and BumX endpoints are configured as environment variables. This release does not claim that their shortening endpoints implement the existing Free-bypass server-side verification contract. The current Free-bypass completion flow still requires `FREE_BYPASS_TEMPLATE_1`, `FREE_BYPASS_TEMPLATE_2`, `FREE_BYPASS_VERIFY_URL`, and `FREE_BYPASS_API_KEY`, where the verification endpoint must confirm the exact state server-side. A link-shortening API alone is not proof that a user completed a bypass.

## Validation
- `node --check cloudflare/worker.js`
- `node --check` for frontend JS files
- `sh scripts/check-build.sh`
- `node scripts/check-inline-js.mjs`
- `node scripts/check-local-refs.mjs`

These are local source checks only. Production Cloudflare, D1, provider API, Telegram, SePay and Turnstile behavior must still be checked after deployment.
