# V59.2 — Admin UI & Multi-link QR

## Admin visual redesign
- Added a custom visual system for the primary Admin and tenant Admin.
- Reworked desktop sidebar, mobile navigation, cards, metrics, forms, tables, tenant tabs, and responsive layouts.
- Added reduced-motion support and kept existing panel/navigation behavior intact.

## Tenant file QR
- Added per-file QR dialog in Tenant Admin.
- QR types: purchase/detail page, bypass URL, and direct/original download URL when present.
- Each type has its own preview, copy, open, and QR image actions.
- QR payload contains only the public destination URL; no session token or private data.

## Not included
- No advertising provider credentials/API integration.
- No external key vendor integration.
- No real Follow/Join verification API.
- QR image generation uses the existing QR Server public endpoint; the destination URL is sent to that provider to render the image.

## Validation
- JavaScript syntax checks run for all frontend JS files.
- HTML structure parsed for Admin and Tenant Admin.
- ZIP integrity checked after packaging.
- Production D1 and live payment flows are not tested in this local build.
