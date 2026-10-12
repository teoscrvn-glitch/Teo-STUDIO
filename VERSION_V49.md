# Téo Studio V49

- Adds OxMail SMTP sending from Cloudflare Workers via `cloudflare:sockets` with implicit TLS on port 465.
- Adds authenticated admin email test endpoint `/api/admin/email/test`.
- Adds optional email to tenant creation, additive D1 `tenant_accounts.email`, welcome email, and admin/tenant withdrawal notifications.
- Existing D1 data is preserved.
- Password-reset OTP UI/flow is not enabled in this version.
