# TeoStudio V56.39 — AI, tutorial video, preview and security fixes

## Changes
- AI request sends a bounded, role-filtered history from the currently selected local chat. Recent messages are preserved first; common password/token/OTP/bank-account-label values and API-key/Bearer patterns are redacted before the provider call.
- AI context is scoped: tenant pages only attach that tenant's public name/tags/tutorial links and the buyer's purchases for the current tenant; main-site context includes only main-catalogue purchase history plus the current buyer's own studio list. Tenant-private data is not copied into another tenant's context.
- Added admin UI and server validation for persistent YouTube URLs on main tags and tenant tags. The registration tutorial uses a global admin setting and remains absent until configured. Empty tag/video settings stay empty.
- Added official YouTube no-cookie embeds with lazy loading, allowed their origin in CSP, and applied the CSP to static pages and the main detail shell.
- Bug-report images are client-compressed and server-validated by MIME signatures, type and size, saved to additive D1 columns, omitted from AI context, and served to Admin only after authentication.
- Retained main-versus-tenant recent-sales SQL boundaries and crawler-specific Open Graph title/image routes for tenant detail links.
- Normalized local frontend asset references for clean routes; bundled the supplied Téo Linh avatar and updated the icon/favicon crop. Deployment guide explains Cloudflare edge protection configuration.

## Migration and operational notes
- No DROP, RESET or destructive database migration was added. Existing D1 gains nullable `support_reports.image_data`, `image_type` and `image_size` columns through the existing additive schema helper.
- No secrets, production bindings or account-level Cloudflare settings were changed. YouTube registration URL remains blank until the Admin supplies one.

## Checks performed in this environment
- `node --check cloudflare/worker.js`
- `node --check` for all frontend JavaScript files
- `sh scripts/check-build.sh`, including AI helper behavior tests
- `node scripts/check-inline-js.mjs`
- `node scripts/check-local-refs.mjs`
- `python scripts/test-wallet-ledger.py`

These are source/static and local-model checks. They do **not** prove live D1 migrations, the configured AI provider, mobile visual behavior, social-crawler metadata at production, payment webhooks or Cloudflare production deployment. Those still require staged/live verification.


### Preview asset-path fix
- Changed static asset references in frontend HTML from root-absolute `/assets/...` to document-relative `assets/...`. This allows Acode Preview to load CSS and static images from the frontend folder while preserving root resolution on clean hosted routes such as `/` and `/detail`.
