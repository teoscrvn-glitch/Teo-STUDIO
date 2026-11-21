# Deploy V58.2 — Top-up QR fix

1. Back up the Cloudflare D1 database.
2. Keep all existing Worker Secrets/Variables, including `SEPAY_API_KEY`, `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET`. Do not paste secrets into frontend files.
3. Deploy the complete `cloudflare/` Worker + Assets project using the existing production configuration. Do not change database bindings, domain routes, or secrets.
4. If frontend assets are hosted separately, upload the complete `frontend/` directory and confirm `/topup.html` references `assets/js/account.js?v=58.2`.
5. Open `https://teostudio.top/topup.html` in a fresh tab or hard-refresh.
6. Sign in with an email-verified test account. On the bank tab, check the guardian-consent confirmation where applicable, complete Turnstile, and submit an amount from 10,000đ to 5,000,000đ in 1,000đ increments.
7. Confirm a QR and unique transfer code appear. Do not send a real transfer during a UI smoke test. For payment verification, use SePay's supported test webhook or a small controlled transfer after checking the bank account and webhook configuration.
8. If the page reports payment configuration failure, inspect `/api/health` as Admin and verify the existing SePay configuration in Worker settings. If Turnstile remains pending, check the site key/secret pair, allowed hostname, browser content blockers, and Cloudflare Turnstile dashboard.

The patch does not create a QR unless the Worker successfully inserts a pending top-up order. The wallet remains unchanged until a valid SePay webhook confirms payment.
