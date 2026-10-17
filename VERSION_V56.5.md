# TeoStudio V56.5 — Manual IP Block Only

## What changed
- Persistent IP/email blocking remains admin-managed through `/api/admin/security/blocks` and the Admin security panel.
- Removed automatic escalation from request-rate strikes into a five-minute IP ban. Excessive request bursts can still receive HTTP 429, but do not create a ban or a blacklist entry.
- The global request guard checks only an exact IP match in the admin-managed `security_blocks` table; an empty list does not block anyone.
- Updated frontend cache keys and build fingerprint to `v56.5-manual-ip-block-only`.

## Important limitations
- This is a candidate based on the V56.4 source, not a verified production release.
- Prior reported production behavior (`ADMIN_REQUIRED` appearing on public pages) has not been conclusively diagnosed or fixed by this IP-ban patch. Do not deploy directly to production. Test on a Preview Worker with a separate D1 database first.
- Local checks cannot verify Cloudflare routing, D1 migrations, SePay settlement, SMTP, AI or Telegram integrations.

## Expected behavior
1. No IP is persistently blocked unless an admin adds it in the security panel.
2. Removing a manual IP entry allows that IP through after the short blocklist cache expires (up to about five seconds).
3. Burst rate limiting may return HTTP 429 briefly; it does not place the IP in the blocklist.
