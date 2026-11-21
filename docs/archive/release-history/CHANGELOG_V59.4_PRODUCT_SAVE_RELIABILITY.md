# V59.4 — Product Save Reliability Fix

## Scope
- Tenant Admin: product edits now refresh only the product collection after a successful save, instead of rerunning the entire dashboard loader (stats, audit, wallet, comments, tags and notifications). An unrelated dashboard endpoint can no longer turn a successful save into a misleading failure.
- Tenant Admin: after PUT/POST, the client checks the API acknowledgement and re-fetches the product list, then verifies title, direct link and original link before showing success.
- Tenant Admin: error messages safely handle Error objects, API payloads and unexpected thrown values; no more `alert(undefined)`.
- Main Admin: product save refreshes product data first, verifies persisted title and effective download link, and refreshes analytics separately so a statistics refresh failure does not misreport the product save.
- Cache-busting versions updated to 59.4 for the affected scripts.

## Validation
- Node.js syntax check passed for `tenant-admin.js` and `admin-v14.js`.
- ZIP integrity checked after packaging.
- Production D1/Cloudflare deployment and real account save flows still require staging/production verification.
