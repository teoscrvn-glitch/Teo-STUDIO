# TeoStudio V56.3 — Stability & Runtime Diagnostics

## Purpose
V56.3 is a stabilization/configuration-diagnostics step based on the V56.2 archive. It is not a claim that production has already been deployed.

## Changes
- Uses `v56.3-stability-ai-config` as a build fingerprint from `/api/health` and the frontend meta tag.
- `/api/health` reports only non-secret booleans for D1, AI, SMTP, Telegram, Turnstile, and SePay.
- Admin-only `/api/admin/config-status` lists missing runtime variable *names* only; never returns secret values.
- Admin has a Runtime Check panel and explicit click-to-test actions for AI, SMTP email, and Telegram.
- AI requests now have a 15-second timeout; admin AI connectivity test has a 12-second timeout and never returns the provider response body or key.
- Frontend assets use `v=56.3` cache-busting so the browser can distinguish this build.
- Keeps V56.2's syntax correction at the monthly analytics response.

## Runtime configuration
- `DB`: existing D1 binding `teo-studio` (preserve the current database ID).
- `ADMIN_KEY`: Secret.
- `TURNSTILE_SITE_KEY`: Variable; `TURNSTILE_SECRET`: Secret. The two keys must belong to the same widget and allow `teostudio.top`.
- `OXMAIL_SMTP_PASS`: Secret. Code defaults: host `mail.teostudio.top`, port `465`, user `teostudio@teostudio.top`; optional `EMAIL_FROM` defaults to the user. Email test is available at Admin → Runtime Check.
- `AI_API_URL`: HTTPS endpoint compatible with OpenAI Chat Completions.
- `AI_API_KEY`: Secret.
- `AI_MODEL`: exact model ID accepted by the provider. Use Admin → Runtime Check → Test AI.
- `TELEGRAM_BOT_TOKEN`: Secret; `TELEGRAM_CHAT_ID`: Variable or Secret. Use Admin → Runtime Check → Test Telegram.
- `SEPAY_API_KEY`: Secret; `SEPAY_BANK_CODE` and `SEPAY_ACCOUNT_NUMBER`: use existing production values. Do not rotate/change them as part of this build.

## Safety notes
- Never commit secrets to the repository or frontend.
- The diagnostics panel reports presence/absence only; it does not reveal values.
- Do not deploy over production until a D1 backup is made and wallet, SePay, email, Turnstile, comments, downloads, and tenant flows pass on staging.
- This archive does not itself modify live Cloudflare settings, D1, DNS, provider accounts, or production.
