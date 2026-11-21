# TeoStudio V56.4 — Canonical Host & Runtime Fix

## Root cause addressed
V56.3 had canonical-host redirection in the Worker, but Cloudflare Workers Static Assets default to asset-first routing (`run_worker_first = false`). Thus, a page URL matching a static file could be served without running the Worker redirect. On `*.workers.dev`, the browser then called APIs with the preview origin; write requests were rejected by the allowed-origin check, resulting in Turnstile config, AI, and Admin errors.

## Changes
- Set `assets.run_worker_first = true` so the Worker runs before static assets. Cloudflare documents this setting as the way to invoke the Worker script before returning static assets.
- Redirect page GET/HEAD requests on `*.workers.dev` and `www.teostudio.top` to `https://teostudio.top`.
- Return HTTP 421 `CANONICAL_HOST_REQUIRED` for API calls made directly on non-canonical hosts; do not relax CORS or permit preview-host login.
- Preserve the SePay webhook path for compatibility; keep the configured live endpoint at `https://teostudio.top/api/webhook/sepay`.
- Improve Admin login and AI UI messages for host/API failures.
- Update frontend cache-busting and version fingerprint to `v56.4-canonical-runtime-fix`.

## Runtime services still require setup
- `TURNSTILE_SITE_KEY` (Variable) and `TURNSTILE_SECRET` (Secret) in Runtime Production; widget allowlist has `teostudio.top`.
- `AI_API_URL`, `AI_API_KEY` (Secret), `AI_MODEL` to enable actual model replies. Without these, Teo AI uses its documented fallback responses.
- `OXMAIL_SMTP_PASS` (Secret) plus valid SMTP mailbox settings for registration/verification/reset emails.
- `TELEGRAM_BOT_TOKEN` (Secret) + `TELEGRAM_CHAT_ID` for Telegram notifications.
- Preserve `DB`, `ADMIN_KEY`, `SEPAY_API_KEY`, `SEPAY_BANK_CODE`, and `SEPAY_ACCOUNT_NUMBER`.

## Verification limits
Local syntax/static checks do not prove live Worker deployment, D1 connectivity, SePay webhook processing, SMTP delivery, Turnstile hostname acceptance, or AI provider connectivity.
