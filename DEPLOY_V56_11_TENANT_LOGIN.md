# Deploy V56.11 — Tenant login guard (mobile)

1. Extract this ZIP; merge/replace repository files at the same paths (do not upload the ZIP as a source file).
2. The main changed files are `cloudflare/worker.js`, `frontend/tenant-admin.html`, and `frontend/assets/js/tenant-admin.js`.
3. Do not delete/recreate the Worker, D1 database, or Secrets. Keep the existing D1 binding `DB` and production database.
4. Deploy through the existing Cloudflare Worker Builds pipeline.
5. Confirm `/api/health` reports `v56.11-tenant-login-guard` (if the health endpoint exposes the build version).
6. Open the tenant Admin link, clear/reload the page once, and submit the tenant ID/password. The form should no longer silently reload if another dashboard UI binding fails; it should display the actual error.
7. If login still fails, capture the exact message shown under the form. Do not send passwords or secrets.

This patch deliberately does not alter D1 schemas, passwords, payment settings, SMTP secrets, or other Cloudflare runtime secrets.
