# V56.54 — Tenant Free/Buy mode fix

## Fix
- Removed the schema-initialization migration that rewrote every tenant product in `product_mode=both` into `paid` or `unlock`.
- The migration could overwrite the free bypass URL with the paid URL, clear `original_link`, and remove the free/buy choice on the tenant detail page.
- Existing creation and purchase authorization logic remains unchanged. In `both` mode, the detail endpoint exposes the free bypass destination while withholding the paid original link until payment is confirmed.

## Recovery note
Rows already rewritten by an earlier deployment cannot automatically recover their former bypass URL from the current row, because the old value was overwritten. Edit affected files in Tenant Admin and restore:
- Mode: `Vượt link / Mua` (`both`)
- Free `download_link`: free bypass URL
- Paid `original_link`: paid original download URL
- `price_vnd`: price >= 1000

## Validation
- Not deployed to production. Test with one non-critical file first.
