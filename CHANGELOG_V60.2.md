# TeoStudio V60.2 — Master product edit/save regression fix

## Root cause
For Master Admin products in `sale_mode='paid'`, the visible form field is `downloadLink` (labeled “Link gốc tải sau khi mua”). When editing a legacy row, the hidden `originalLink` field was also populated from the old database value. The Worker selected `original_link || download_link`, so the stale hidden value overrode the newly edited visible value. This caused Save to retain the old URL even though the form contained the new one.

## Fix
- In the Worker, a paid product now uses the submitted visible `download_link` as the canonical source of truth, falling back to `original_link` only for older clients that omit the primary value.
- The canonical paid URL is written to both `products.download_link` and `products.original_link` so the detail page and purchase-delivery/history paths cannot read a stale alternate URL.
- Master Admin sends the visible field as `original_link` for paid mode too, and verifies against the visible field's value.
- Clear `dataset.editingId` when starting a new form or cancelling, preventing stale edit IDs from contaminating later create operations.
- Bump Worker and Master Admin cache version to V60.2.

## Validation
- `node --check cloudflare/worker.js`
- `node --check frontend/assets/js/admin-v14.js`
- `node scripts/test-v60.2-master-product-edit-save.mjs`
- ZIP integrity test after packaging.

Live Cloudflare D1 writes are not available in this local environment. Deploy Worker and Admin frontend together, then edit a test paid product and verify both the Admin list and a test purchase's delivery URL.
