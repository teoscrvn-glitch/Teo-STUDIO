# Téo Studio V49 — OxMail integration

This build adds an SMTP sender for Cloudflare Workers, an admin-only test endpoint, optional tenant email capture, a welcome email, and withdrawal-request/status notifications. Existing D1 data is preserved; migrations are additive.

## Worker secrets / variables

Set these in Cloudflare Dashboard → Workers & Pages → teo-studio → Settings → Variables and Secrets:

- Secret `OXMAIL_SMTP_PASS`: mailbox password for `teostudio@teostudio.top` (never commit this value).
- Variable `OXMAIL_SMTP_HOST`: `mail.teostudio.top` (default).
- Variable `OXMAIL_SMTP_PORT`: `465` (implicit TLS; this build requires 465).
- Variable `OXMAIL_SMTP_USER`: `teostudio@teostudio.top` (default).
- Variable `EMAIL_FROM`: `teostudio@teostudio.top` (default).
- Variable `EMAIL_ADMIN_TO`: `teostudio@teostudio.top` (default destination for admin notices).

Do not add credentials to frontend files or wrangler.toml. Add `OXMAIL_SMTP_PASS` as a Secret, not a plain variable.

## Test

After deploying the Worker and setting the secret, sign into Admin and POST `/api/admin/email/test` with the existing Admin Bearer token and JSON body `{}`. Expected response: `{ "ok": true, ... }`. If the response is `EMAIL_SEND_FAILED`, use its sanitized SMTP error detail to troubleshoot.

## Tenant emails

The Master Admin tenant-creation form now has an optional email field. If supplied, it is stored in the additive `tenant_accounts.email` column and used for a welcome email and withdrawal status notifications. Existing tenants are unaffected and do not have an email until edited in a future admin UI change. Password-reset OTP is not yet exposed in this build because existing tenant accounts have no verified email flow; do not claim OTP reset is active.

## Deployment safety

1. Save the current deployed Worker source as a rollback copy.
2. Add the secret and variables above.
3. Deploy the V49 Worker and frontend assets.
4. Sign in to Admin and run the test endpoint.
5. Create a test tenant with an email you control, then confirm the welcome email.
6. Test a withdrawal only in a safe/staging setup before relying on notifications in production.
