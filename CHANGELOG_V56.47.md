# TeoStudio V56.47 — Comment CAPTCHA + tenant Telegram notifications

## Fixes
- The tenant Share comment form no longer always shows the misleading "verify and click again" alert after attempting to mount Turnstile. It checks whether a token was actually issued, keeps the user informed, and refreshes CAPTCHA if the server rejects/expiry is detected.
- Added tenant-scoped Telegram linking from the tenant Admin settings panel.
- Each tenant Admin can generate a 10-minute pairing link. Opening the bot and pressing Start binds that private Telegram chat to that tenant only.
- The Worker configures the Telegram webhook when a pairing link is requested, validates Telegram's webhook secret header, and consumes each pairing code once.
- Tenant-specific file-sale notices are sent to the linked tenant chat. Notices include studio, file, amount, timestamp and a masked buyer email/name where buyer identity exists.
- Existing global Telegram notifications remain intact.
- Kept OpenRouter variables and Cloudflare Secrets out of source code.

## Important
- This does not prove the live CAPTCHA credentials are correct. If the server still rejects a verified token, verify that `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` belong to the same Turnstile widget and that `teostudio.top` is an allowed hostname.
- Telegram tenant notifications require the existing `TELEGRAM_BOT_TOKEN`, a non-secret `TELEGRAM_BOT_USERNAME` variable, and a Secret `TELEGRAM_WEBHOOK_SECRET`.
- The webhook endpoint is `https://teostudio.top/api/telegram/webhook`.
- No production deployment or real Telegram/Turnstile transaction was performed in this build.
