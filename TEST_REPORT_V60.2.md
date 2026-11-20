# TeoStudio V60.2 — Product edit/save regression test report

## Result
- `sh scripts/check-build.sh`: PASS, 38/38 steps.
- `node --check cloudflare/worker.js`: PASS.
- `node --check frontend/assets/js/admin-v14.js`: PASS.
- `node --check frontend/assets/js/config.js`: PASS.
- `node scripts/test-v60.2-master-product-edit-save.mjs`: PASS.
- ZIP integrity: run after packaging.

## Reproduced cause and correction
A paid product in Master Admin uses the visible `downloadLink` field as the input labeled “Link gốc tải sau khi mua”. The edit form also repopulated a hidden `originalLink` field from the previous database row. The Worker previously selected `original_link || download_link`, so the stale hidden value won over the new URL typed by the Admin.

V60.2 changes the paid-mode canonical URL to `download_link || original_link`, saves that canonical URL into both `products.download_link` and `products.original_link`, sends the same canonical value from the Master Admin form, and verifies the freshly loaded product against the visible field. The New/Cancel actions also clear the form's edit ID so a prior edit cannot leak into the next create.

## Scope and limitation
The full local regression suite passed, including a regression assertion for a stale hidden URL versus a newly edited visible URL. This environment cannot write to the live Cloudflare D1 database or exercise the production Worker. Deploy the Worker and frontend together and verify with a test product on staging before production.
