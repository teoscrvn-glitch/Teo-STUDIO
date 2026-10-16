# TeoStudio V56 — Deploy checklist for mobile

> **Important:** this is a prepared source archive. It has not been deployed to `teostudio.top`, and this package was created from the V54 ZIP in the conversation plus the V55 work package, not from a live export of the GitHub default branch. Compare/merge carefully.

## 0. Before deploying

1. Download this ZIP and keep a copy of the currently working production source.
2. Cloudflare Dashboard → D1 → `teo-studio`: export/backup or use the available recovery/Time Travel feature before any migration.
3. Keep the same D1 database ID and Worker binding `DB`. Do not delete/reset any tables.
4. Compare your GitHub `teoscrvn-glitch/Teo-STUDIO` branch to the archive. Build from a new commit; do not overwrite newer changes blindly.
5. Expect **wallet-only new file purchases** in V56. The old per-file QR creation API is disabled. Old order records remain in D1, but you should not test by paying old QR orders repeatedly.

## 1. Runtime Production variables/secrets

Go to **Workers & Pages → `teo-studio` → Settings → Variables and Secrets → Production**. Keep all existing values and set/check the following names exactly. Variables under Build settings are not a substitute for Runtime bindings.

### Required core
- `ADMIN_KEY` — Secret, keep existing value.
- `SEPAY_API_KEY` — Secret, keep existing value that matches SePay's configured API Key authentication.
- `SEPAY_BANK_CODE` — Variable, keep the bank code used by the current MB account.
- `SEPAY_ACCOUNT_NUMBER` — Variable, keep the existing receiving account number.
- `TURNSTILE_SITE_KEY` — Variable, matching the production Turnstile widget site key.
- `TURNSTILE_SECRET` — Secret, the matching secret key for that same widget.
- D1 binding `DB` → existing `teo-studio` database.

### Required for email registration and password reset
- `OXMAIL_SMTP_PASS` — Secret; mailbox password, not the email address.
- `OXMAIL_SMTP_HOST` — Variable, `mail.teostudio.top` by default.
- `OXMAIL_SMTP_PORT` — Variable, `465`.
- `OXMAIL_SMTP_USER` — Variable, `teostudio@teostudio.top` by default.
- `EMAIL_FROM` — Variable, `teostudio@teostudio.top` (if not set, Worker default is used).
- `EMAIL_ADMIN_TO` — Variable, admin notification recipient (optional; default used if unset).

If `OXMAIL_SMTP_PASS` is absent or invalid, email verification and password-reset flows will not work. Configure it in Cloudflare Runtime as a Secret, not in frontend code or `wrangler.toml`. Then test by using the admin email-test feature/endpoint and registering a test account.

### Optional AI provider
- `AI_API_URL` — Variable, an **HTTPS** endpoint compatible with OpenAI Chat Completions.
- `AI_API_KEY` — Secret.
- `AI_MODEL` — Variable, exact model identifier from the provider.

Without all three, the Teo AI bubble remains available in fallback mode for a few basic help responses, but it does not call a full remote AI model. A provider's free tier may have quotas or change; check the provider's current terms and rate limits. Never put the API key in HTML/JavaScript or a public repository.

### Optional Telegram error notification
- `TELEGRAM_BOT_TOKEN` — Secret from BotFather.
- `TELEGRAM_CHAT_ID` — Variable or Secret, the bot's destination chat/group ID. Add the bot to the group and grant it permission to send messages.

Without these settings, reports should still save to D1 but will not be delivered to Telegram. Test with a non-sensitive report.

## 2. Build and deploy

1. In GitHub, merge `cloudflare/` and `frontend/` into the repository root structure expected by the existing Cloudflare build. Do not create an extra nested folder around them.
2. Preserve `cloudflare/wrangler.toml`'s current database name/ID and `DB` binding. Check the Worker build output before production.
3. Deploy from a new commit using the existing Cloudflare build workflow.
4. Open `https://teostudio.top/api/health`; it should identify `v56-security-moderation-account-comments`. If the version stays old, you have not deployed this Worker build.
5. Hard-refresh or open a private tab. Updated pages use `v=56` asset query parameters to avoid stale cached JavaScript.

## 3. Regression tests (use staging first)

- Open homepage, detail page and download page. Detail/download must not call the old QR flow.
- Registration: email code arrives, verification succeeds, login works, reset code arrives, reset works. If email not configured, fix SMTP instead of bypassing verification.
- Wallet: logged-in and verified buyer creates a top-up QR. Credit the wallet only after SePay webhook matches a pending code and exact amount; compare bank ledger and D1. Avoid repeated real transfers.
- Buy file: require login, verified email, Turnstile, terms checkbox and final confirmation. Confirm buyer debit, 95% seller ledger and 5% commission, link delivered only to the authorized buyer, and duplicate request does not debit twice.
- Bypass attempts: call public paid-file API directly, alter a product/order ID, send an old per-file QR request, reuse a Turnstile token and send a cross-site write. Public APIs must not reveal a paid source link; invalid writes must fail.
- Comments: anonymous/unverified posts rejected; display name comes from account; CAPTCHA required; one valid image is saved hidden; image only appears publicly after moderation; flood 6 photos and verify limits.
- Admin security: add a test email and test IP to the D1 blocklist via Admin → “Chặn IP/email”. Email is denied account actions; IP gets generic 404. Verify an authorized admin can remove the test block. Never block your own current IP without a recovery path.
- Error reporting: send a test report and verify Admin list; if Telegram configured, verify alert arrives. Confirm IP is visible only in Admin/Telegram and email is masked in public surfaces.
- Statistics: choose current month and compare orders/ledger rows against D1/SePay. Top-ups must not be misreported as file revenue.
- AI: test both configured provider and fallback mode. The model must not be able to edit balances, mark an order paid, approve withdrawals or change permissions.

## 4. Edge-level controls (do separately)

Worker-local throttles are not global DDoS protection. In Cloudflare Zone `teostudio.top` → **Security → Security rules → Rate limiting rules**, start with monitored/managed-challenge limits for login, registration, password reset, comments, `/api/support/report`, wallet top-ups and purchases. Tune to observed legitimate traffic. Do not broadly challenge/block the SePay webhook without considering provider retries; it still requires valid API Key authentication in the Worker. Enable Managed WAF/Bot controls if available and test mobile, Turnstile and webhook flows after changes.

References:
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/
- https://www.anthropic.com/research/trustworthy-agents
- See `SECURITY_PLAYBOOK_TEOSTUDIO.md` for the reusable security knowledge and regression checklist.

## Rollback

If any core flow breaks, roll back the Worker/frontend to the preserved V54/V55 commit and keep the same D1 database. Do not run a reset script, drop tables or restore an old empty database over production. Check payment status with SePay/bank records before retrying any money movement.
