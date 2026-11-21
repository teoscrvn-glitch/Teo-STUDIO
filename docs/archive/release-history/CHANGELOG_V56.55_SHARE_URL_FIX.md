# V56.55 — Canonical Share URL

- Standardized generated public tenant Share links to `/share?tenant=SLUG`.
- Added Worker path normalization so `/share` is handled by the existing `/share.html` handler and static asset.
- Kept `/tenant-admin.html?tenant=SLUG` unchanged for the tenant's private admin page.
- Legacy `/share.html?tenant=SLUG` remains supported.
- Not deployed to production. Test tenant Share page, admin link, and social preview after deployment.
