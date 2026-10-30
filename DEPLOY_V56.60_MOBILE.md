# Deploy V56.60 — Mobile / Cloudflare

1. Back up the current Worker deployment and export/backup the D1 database before deploying.
2. Deploy `cloudflare/worker.js` and the `frontend/` assets from this ZIP as one Worker + Assets build.
3. Keep the existing Production D1 binding `DB` pointing to `teo-studio`.
4. Keep every existing Production Secret and Variable unchanged. Do not paste secret values into `wrangler.toml` or this document.
5. After deployment, test in a private/incognito browser:
   - `/share?tenant=<slug>` loads without redirect loops.
   - `/tenant-admin.html?tenant=<slug>` accepts the correct tenant credentials.
   - `/api/tenant/me`, file list, tags, comments and settings load.
   - If the Studio has `owner_user_id` or a verified matching buyer email, tenant login also authenticates Share comments and AI with the same session.
   - Switch from Studio A to Studio B and verify the old tenant token is not reused for B.
   - Log out and verify both sides of a shared session are revoked.
   - Ask tenant AI for the Studio's current statistics and verify it only reports that tenant's data.
   - Submit a test support report only if desired; it still requires Turnstile.
6. Test Zalo/Messenger/Telegram preview separately. Confirm title, description and avatar for the tenant slug.
7. If `TENANT_REQUIRED` remains, capture the exact API URL, HTTP status, response JSON error code and tenant slug. Do not delete tenant/session rows.

## Important limitations
- This ZIP does not run migrations that delete or rewrite tenant data.
- It does not deploy itself; Production changes only after you deploy it.
- Browser + real D1 tests are required. Static test success is not proof of Production correctness.
- Natural-language AI create/edit/delete actions are not enabled in this release. They must be added through an explicit allowlist, confirmation UI and audit log before activation.
