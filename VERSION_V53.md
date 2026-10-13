# TeoStudio V53 — Rental + main catalog purchase workflows

Based on the provided `TeoStudio-V52-Security-Rental.zip`. This package is a source-code update only; it has not been deployed to Cloudflare and is not a live-production verification.

## Added or updated

- Public rental page now presents Free, VIP/paid, and contact-admin choices. Free signup and paid rental signup/renewal require an email code; requests also fail closed unless Turnstile is configured and verified by Worker.
- Free rental account flow creates an account with separate Admin and Share links. Admin access is gated by two server-verified bypass steps. Each verified step adds two days; no days are granted by a browser redirect alone. The external provider must implement the documented server verification contract.
- Rental VIP checkout remains 50,000 VND for 30 days and only activates/renews after a valid SePay webhook. A paid rental that expires switches to Free; Free Admin must complete its gate again. The public Share URL remains available for Free tenants.
- Master catalog supports `free`, `both` (free link + paid purchase), and `paid` sale modes. Main catalog paid orders create a 10-minute VietQR order; the original download URL is returned only after a paid order status is confirmed by a valid SePay webhook. Tenant Share paid orders are also short-lived.
- Master Admin includes Free/Paid tenant filtering, manual account creation, days-left/expiry and tenant management controls. Main admin analytics include daily/monthly paid orders/revenue and daily views for paid/mixed products. Tenant analytics include referral domains, orders/revenue and monthly rows.
- Free tenants are blocked server-side from paid/mixed file modes, wallet/payout/withdrawal APIs, and payment-order routes. Paid/Free restrictions are enforced in the Worker, not only in the UI.
- Expiry cleanup was changed to remove expired transient sessions/challenges/orders/deduplication entries; it no longer runs a scheduled delete of tenant product content. Archiving/deleting tenants through Master Admin remains a soft archive for audit/history.
- Cache-busting keys were bumped for updated frontend files.

## External settings needed

Preserve all existing Cloudflare D1 bindings and secrets. Add/check only the following in Worker settings; never commit secret values:

- `SEPAY_API_KEY`, `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER` for payments. `SEPAY_API_KEY` must match the SePay webhook configuration.
- `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` as a matching pair for `teostudio.top`. If missing, registration and checkout deliberately fail closed.
- `OXMAIL_SMTP_PASS` and appropriate `OXMAIL_SMTP_HOST`, `OXMAIL_SMTP_USER`, `EMAIL_FROM` for email verification.
- `FREE_BYPASS_TEMPLATE_1`, `FREE_BYPASS_TEMPLATE_2`, `FREE_BYPASS_VERIFY_URL`, and `FREE_BYPASS_API_KEY` for the Free 2-step bypass provider. Templates may use `{state}`, `{return_url}`, and `{step}`. The verify endpoint must accept a Bearer API key and return JSON with `success:true`, `completed:true`, and the exact submitted `state` only after server-side confirmation. A provider that cannot supply this guarantee must not be enabled.

## Safety and verification limits

- Locally verified: syntax of Worker JavaScript, all external frontend JavaScript files and inline scripts in HTML; static invariants for no `DROP TABLE`, fail-closed Turnstile verification, rental/bypass/main purchase endpoints, paid-only download release, and absence of tenant-content deletion in expiry cleanup.
- Not verified here: D1 migrations against the live database, real SMTP delivery, Turnstile live hostname, SePay real transfer/webhook, idempotency against live retries, provider-specific bypass contract, production custom-domain routing, or Cloudflare WAF/rate rules.
- This code's per-isolate rate limiting is not full DDoS mitigation. Enable Cloudflare WAF/managed rules/rate limits at the edge. No source change can guarantee absolute bypass or DDoS prevention.
- The Master Admin revenue panel tracks purchases from the main catalog. Tenant sales are tenant-ledger balances and are reported in their own Tenant Admin; a separate owner payout/withdrawal ledger for the main site is not created by this version.
- Before replacing production code, compare against the current GitHub default branch because this ZIP is not a fresh export of that branch. Keep the existing database ID/binding and make a D1 backup. Never upload the ZIP as if Cloudflare extracts it: extract and merge repository-root paths.
