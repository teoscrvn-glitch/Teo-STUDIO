# TeoStudio V56.21 — Detail redirect-loop fix

## Root-cause hypothesis
Cloudflare Worker Observability for `GET /detail?id=...` shows HTTP 307, while the browser reports `ERR_TOO_MANY_REDIRECTS`. V56.20 internally fetched `/detail.html` from the Assets binding while serving `/detail`. Because the asset name shares the `/detail` route stem, the Assets HTML handling/canonicalization may redirect back to the Worker route, creating a loop.

## Change
- Added `frontend/product-detail-view.html` as a uniquely named copy of the public product detail page.
- Changed both the crawler metadata branch and human detail branch to fetch `/product-detail-view.html` internally instead of `/detail.html`.
- Kept the public share URL `/detail?id=...` unchanged.
- Updated worker/frontend version markers and frontend cache-busting to V56.21.

## Safety
- No D1 schema or data migrations.
- No payment, SePay, auth, or secrets changes.
- No production deployment performed.

## Verification
- `node --check cloudflare/worker.js` passed.
- `node --check frontend/assets/js/main.js` passed.
- ZIP integrity check passed after packaging.
- Production behavior still requires deployment and a fresh request test; the 307 Location header was not visible in the supplied screenshots, so the cause is a strong hypothesis rather than a confirmed edge trace.
