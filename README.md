# TeoStudio V56.4 — Canonical Host & Runtime Fix

This source package is based on V56.3 and addresses the preview-host failures shown after deployment. It has passed local JavaScript syntax/static checks; it has **not** been deployed to production from this environment.

## What changed
- `cloudflare/wrangler.toml` sets `assets.run_worker_first = true`. Without this, Cloudflare defaults to asset-first for static files, so an HTML page can bypass the Worker middleware even when the code has a canonical redirect. This caused the `workers.dev` preview page to remain open while API writes were rejected by the canonical-origin check.
- Worker redirects browser page navigations from `*.workers.dev` and `www.teostudio.top` to `https://teostudio.top`. Non-GET API calls on those non-canonical hosts return an explicit `CANONICAL_HOST_REQUIRED` error instead of silently weakening CORS.
- Admin login and Teo AI show clearer messages when a preview host is used.
- Frontend/cache version updated to `v56.4-canonical-runtime-fix`.

## Start here
1. Read `DEPLOY_V56_4_MOBILE.md`.
2. Back up the repo and D1. Preserve the existing database ID, `DB` binding and secrets.
3. Merge this package into the existing repo, run `./scripts/check-build.sh`, inspect `git diff`, then commit/push.
4. After successful deploy, test only on `https://teostudio.top`, not the `*.workers.dev` alias. Open `https://teostudio.top/api/health` and verify the version.
5. Use Admin → Runtime Check to see which services still need configuration and test them.

## Services requiring real credentials
- Turnstile: `TURNSTILE_SITE_KEY` variable + `TURNSTILE_SECRET` secret in **Runtime Production**, hostname allowlist includes `teostudio.top`.
- AI: `AI_API_URL` (HTTPS compatible Chat Completions endpoint), `AI_API_KEY` secret, `AI_MODEL`.
- Email: `OXMAIL_SMTP_PASS` secret and valid SMTP settings.
- Telegram: `TELEGRAM_BOT_TOKEN` secret and `TELEGRAM_CHAT_ID` variable.
These cannot be provisioned automatically by a ZIP.

## Security
Do not commit or share `AI_API_KEY`, `OXMAIL_SMTP_PASS`, `TELEGRAM_BOT_TOKEN`, `ADMIN_KEY`, or `SEPAY_API_KEY`. Keep CORS restricted to the canonical domain. Do not use worker.dev as a production site.
