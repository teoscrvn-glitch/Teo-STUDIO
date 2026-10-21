# TeoStudio V56.25 — Detail White Screen Fix

- Bumped Worker build version to `v56.25-detail-white-screen-fix`.
- Detail page now renders an explicit Vietnamese error state if the product ID is missing, the product API fails, or the API returns no product, rather than silently returning a blank page.
- Updated detail page asset references to absolute `/assets/...` URLs and bumped cache query versions to `56.25` to avoid path resolution and stale-cache issues on the clean `/detail?id=...` route.
- Preserved the existing AI diagnostics and Telegram ID alias changes from V56.24.

Validation: `node --check` passed for `cloudflare/worker.js` and `frontend/assets/js/main.js`. Not live-tested against production D1/Cloudflare.
