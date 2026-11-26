# TeoStudio V60.4.1 — Admin Login Hang Fix

## Fix
- Removed the duplicate inline Admin login handler. The Admin page now has one login implementation owned by `admin-v14.js`.
- Added a 12-second abort timeout to the Admin login API request so a stalled Worker/API cannot leave the form waiting indefinitely.
- Added explicit, user-visible diagnostics for network failure, timeout, missing login route (404), and Worker/server errors (5xx).
- Preserved the existing `ADMIN_KEY` validation and `admin_sessions` token flow; no credentials, D1 data, or session schema were changed.
- Bumped the Admin bundle cache key to `60.4.1` to avoid serving the previous cached login script.

## Deployment
Deploy the complete package's frontend and Worker together. If login still fails, read the exact error shown under the button. `ADMIN_KEY` must match the Cloudflare Worker secret; do not paste it into chat or screenshots.
