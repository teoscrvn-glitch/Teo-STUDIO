# Deploy V56.47 — Mobile / Cloudflare

## 1. Update files
Back up the live site first. Deploy the frontend and `cloudflare/worker.js` together. Keep the D1 binding and existing production secrets.

## 2. Fix comment CAPTCHA
In Cloudflare Worker → Settings → Variables and Secrets:
- `TURNSTILE_SITE_KEY` must be the public site key for the same Turnstile widget as the secret.
- `TURNSTILE_SECRET` must be the secret for that exact widget.
- The widget must allow `teostudio.top` (and `www.teostudio.top` if used).

After deployment, log in with a verified buyer account, solve CAPTCHA, then submit a comment. If it still fails, inspect Worker logs for `/api/public-tenant/{slug}/comments` and `/api/comments`. Do not share the secret.

## 3. Tenant-specific Telegram notices
Keep existing `TELEGRAM_BOT_TOKEN` as a Cloudflare Secret. Add:
- Variable `TELEGRAM_BOT_USERNAME` = bot username without `@`
- Secret `TELEGRAM_WEBHOOK_SECRET` = a strong random string (use only letters/numbers/underscore/hyphen, 32+ chars)

No Telegram token or secret belongs in this ZIP or Git.

Then open each tenant Admin → Settings → Telegram của Studio → **Kết nối bot Telegram**. The Worker calls Telegram `setWebhook`, returns a one-time pairing link valid for 10 minutes, and the tenant owner presses Start in the bot. After that, file-sale notices are routed to that tenant's private Telegram chat. The master/global Telegram chat continues receiving its existing notices.

Webhook endpoint: `https://teostudio.top/api/telegram/webhook`

## 4. Verify
- Check that comments post only when a valid, unexpired CAPTCHA token and verified buyer session are present.
- Buy a test item in a tenant and confirm the notification reaches only that tenant's linked chat, in addition to existing global notifications.
- Test a second tenant to ensure chat links remain isolated.
- Confirm AI model stays `openrouter/free` and existing Telegram bot token remains a Cloudflare Secret.
