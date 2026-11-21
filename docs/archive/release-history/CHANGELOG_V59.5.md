# TeoStudio V59.5 — Product Edit/Save Reliability

## Scope
Fixes the product edit/save flow in both Master Admin (`/admin`) and Tenant Admin (`/tenant-admin`).

## Changes
- Persist the edited product ID in the form dataset when opening an existing product, and clear it only when starting a new product or after verified success.
- Prefer the explicit editing ID over an empty/stale hidden form value, preventing an edit from accidentally becoming a create request.
- Master Admin now fetches the product list directly after the PUT/POST response, verifies the returned title, canonical link, and sale mode, and keeps the form open if verification fails.
- Master Admin validates the required link fields before sending and toggles the paid/free original-link requirement correctly.
- Tenant Admin uses the same explicit editing ID when constructing the update URL and clears it only after server read-back verification succeeds.
- Bumped frontend cache keys to `v=59.5`.

## Validation
- `node --check frontend/assets/js/admin-v14.js`
- `node --check frontend/assets/js/tenant-admin.js`
- ZIP integrity checked after packaging.

## Important
This package has not been deployed to Cloudflare and has not been exercised against the live D1 database. After deployment, test one product edit in `/admin` and one in `/tenant-admin`, then reload each page and confirm the new title/link remain.
