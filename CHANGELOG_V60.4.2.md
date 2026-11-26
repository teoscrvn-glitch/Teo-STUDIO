# TeoStudio V60.4.2 — Admin startup resilience

- Added a 15-second timeout and actionable network/timeout errors to Admin master and tenant API request wrappers.
- Changed Admin master startup to load independent dashboard sections concurrently after authentication and health check, so a slow optional section does not block all remaining sections.
- Bumped frontend asset query versions to invalidate stale browser/CDN cache.
- No Worker routes, D1 schema, D1 bindings, secrets, or user data were changed.

## Validation
- `node --check frontend/assets/js/admin-v14.js`: PASS
- `node --check frontend/assets/js/tenant-admin-v604.js`: PASS
- Live Cloudflare Worker/D1 and browser interaction tests: NOT RUN.

## Important
This patch makes stalled API calls fail visibly instead of waiting forever; it does not by itself repair an underlying production Worker/D1 failure. If the timeout message appears, correlate its endpoint with Cloudflare Worker logs and the existing D1 binding.
