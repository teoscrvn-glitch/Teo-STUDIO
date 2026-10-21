# Test Report — v56.20-sales-marquee-detail-ai-fix

## Local checks completed
- PASS: `node --check cloudflare/worker.js`.
- PASS: JavaScript syntax checks for every file under `frontend/assets/js/`.
- PASS: `sh scripts/check-build.sh` (all 8 static/build checks).
- PASS: main sales query is filtered to `scope='main'` and confirmed `paid` orders.
- PASS: tenant sales query is filtered by the resolved tenant ID plus `scope='tenant'` and confirmed `paid` orders.
- PASS: catalog and tenant Share page order is products → comments → sales feed → channel cards.
- PASS: main, Share and file-detail document paths bypass the navigation burst guard; other HTML navigation throttling returns a readable HTML page.
- PASS: source version/cache fingerprint is `v56.20-sales-marquee-detail-ai-fix`.

## Not verified by this ZIP-only test
- Production D1 rows and actual tenant/main separation with live transactions.
- Successful Gemini API response with the user's live Secret; HTTP 400 responses now include a short provider diagnostic when available.
- Live navigation/rate-limiting behavior on the production domain.
- Mobile rendering, social-platform unfurl cache, SePay/wallet purchase and other production integrations.

No production deployment is performed by this package. Existing production secrets and D1 data are not included or changed.
