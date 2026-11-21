# Test report — V56.7

- `node --check cloudflare/worker.js`: PASS
- `node --check frontend/assets/js/tenant-admin.js`: PASS
- Release archive integrity (`unzip -t`): run after packaging.
- Confirmed the observed PBKDF2 derive call no longer requests more than 100,000 iterations.
- Confirmed tenant login handler recognizes the legacy plaintext `password_hash` case for migration and presents visible error messages if login/dashboard loading fails.

Not tested: live Cloudflare deployment, live D1 schema/data, OxMail delivery, Turnstile, SePay, and real old-tenant accounts. These require Preview/live environment checks.
