# Test Report — TeoStudio V57.1

## Automated checks to run on release source

- `node --check cloudflare/worker.js`
- `node --check` every `frontend/assets/js/*.js`
- Extract and syntax-check inline JavaScript from HTML.
- Static assertions for version fingerprint, `run_worker_first`, config diagnostic/test routes, sales-feed, account/assistant/builder files.
- Scan source for common accidental credential/private-key literals.
- Python SQLite smoke test for wallet ledger/idempotency and opt-in sales-feed query semantics.

## What these checks do not establish

- They do not prove Wrangler deploys successfully against Cloudflare or that Production uses this source.
- They do not read your live Runtime variables or prove D1 schema/data compatibility.
- They do not send email, validate a live Turnstile token, call the configured AI provider, send Telegram messages, or receive a SePay callback.
- They do not substitute for end-to-end testing on a real phone/browser.

## Required acceptance checks after deploy

1. `/api/health` reports `v57.1-unified-release-candidate` and `config.d1=true`.
2. `payment.missing` is empty; `config.turnstileConfigured=true`; `/api/support/config` returns the public site key.
3. Normal pages opened on `*.workers.dev` redirect to `https://teostudio.top`; API writes on preview hosts fail closed.
4. Register → receive email code → verify → login → reset password.
5. Top-up QR → actual incoming SePay webhook → exactly one positive ledger entry.
6. Purchase with terms/second confirmation → exactly one debit, 95/5 tenant split where applicable, and only buyer gets the link in response/account history.
7. Old product QR endpoints stay disabled for new direct purchases; old orders are not deleted. Test a legacy pending order only if one exists.
8. Builder save/load works on a test studio, with server validation of block types/URLs.
9. Comment post requires verified account + Turnstile; image waits for moderation; IP/email block test using a test account/IP and then unblocking.
10. AI test, email test, Telegram test; report tickets appear in Admin and Telegram only if configured.
11. Recent sales feed is hidden when there are no opt-in purchases; only opted-in buyer display names, masked email, title and amount appear. Turn opt-in off and verify future feed entries no longer include that buyer.
12. Verify no full secret, Admin Key, raw buyer email or original paid download link appears in public API responses.
13. In buyer profile, keep `publicSalesOptIn` off and confirm neither `/api/public/sales-feed` nor `/api/public-tenant/:slug/recent-sales` displays that buyer; enable consent only in a test account and confirm both endpoints then show a masked email.
