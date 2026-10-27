# Test report — TeoStudio V56.32

## Passed locally
- `node --check cloudflare/worker.js`
- `node --check` for all `frontend/assets/js/*.js` files
- `sh scripts/check-build.sh` — PASS (8/8 static check sections)
- Local HTML reference scan: 10 HTML pages checked; no missing `assets/` files; all local CSS/JS references use `?v=56.32`. The three unversioned `assets/img/default-avatar.svg` references are intentionally images, not CSS/JS bundles.
- Static route-scope review: main sales endpoint requires `bp.scope='main'`; tenant sales endpoint requires `p.tenant_id` equal to the tenant's canonical ID plus `p.scope='tenant'` and `p.status='paid'`; frontend chooses tenant endpoint on `share.html?tenant=...`.
- Avatar converted to transparent WebP: 512×512, about 75 KB.
- ZIP integrity will be checked after packaging.

## Not tested here
- No deploy to the live Cloudflare Worker and no live D1 migration/query run.
- No real Android browser or keyboard interaction test; syntax/static checks cannot prove the flicker is fully fixed.
- No end-to-end image-capable model test. Multimodal chat depends on the currently configured AI provider/model supporting image input.
- The `TENANT_REQUIRED` error and other unspecified Admin Free problems are not marked as fixed; require a repeatable action/API response after this cache-busted build is running.
