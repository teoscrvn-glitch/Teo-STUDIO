# Deploy V56.36 — Logo website

1. Back up the currently deployed source and keep the existing D1 database.
2. Upload/deploy the full `frontend/` Static Assets directory and `cloudflare/worker.js` from this package.
3. Keep the existing Cloudflare Secrets, variables, D1 binding and database ID. Do not reset D1.
4. Open `https://teostudio.top/api/health`; expect version `v56.36-teostudio-brand-logo`.
5. Refresh the site with cache cleared. Check header emblem, favicon, browser tab icon, and social preview.
6. If an old logo remains, clear browser cache and re-check that the deployed `/assets/img/teostudio-icon.png` and `/assets/img/og-preview.png` match this package.

This change is branding only; it does not claim to fix pending AI, tenant sales isolation, or tenant detail preview issues.
