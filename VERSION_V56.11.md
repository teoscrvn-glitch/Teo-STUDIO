# V56.11 — Tenant Login Guard

- Bind the tenant login and security-login submit handlers before initializing the rest of the admin dashboard.
- A dashboard UI binding exception can no longer silently leave the login form using native form submission/reload.
- Dashboard binding failures are logged and displayed so the next test exposes the real failing selector/error.
- Bump tenant-admin asset cache keys to prevent serving the older V56.9 JavaScript.
- Worker/HTML fingerprint: `v56.11-tenant-login-guard`.

## Validation scope
- JavaScript syntax and ZIP integrity checked locally.
- Not tested against production D1 or Cloudflare runtime. This is a targeted diagnostic/fail-safe patch, not a claim that every tenant login case is confirmed fixed.
