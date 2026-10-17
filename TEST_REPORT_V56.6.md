# V56.6 — Admin Route Guard Fix

## Root cause found in V56.5 source
The Worker applied `isAdmin()` as a global guard immediately before the static asset fallback. Any request that did not match an earlier API route—including public HTML pages such as `/share.html`, tenant pages, and the homepage—could receive `{"ok":false,"error":"ADMIN_REQUIRED"}` instead of the static asset.

## Fix
The guard is now scoped to `/api/admin/` requests only. Static frontend assets are served by the existing ASSETS fallback without requiring an admin session. Explicit authentication checks in the protected admin API handlers remain in place.

## Validation
- `node --check cloudflare/worker.js`: PASS
- `scripts/check-build.sh`: PASS (static checks only)
- ZIP integrity: checked after packaging
- Not verified: live Cloudflare deployment, D1 behavior, payment/webhook, and real browser end-to-end tests.

## Deployment caution
Test on a Preview Worker first. Keep V54 as a rollback source. Do not change the D1 binding or secrets during this fix.
