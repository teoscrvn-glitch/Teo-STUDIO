# V56.56 — Tenant Share Open Graph preview fix

- Keeps the clean `/share?tenant=SLUG` URL and legacy `/share.html?tenant=SLUG`.
- Adds server-rendered Open Graph/Twitter metadata for social crawler requests to tenant Share pages.
- Uses the tenant's configured site name and description.
- Adds a public image endpoint that serves the tenant's configured avatar for social previews, including stored data-URI avatars.
- Metadata is generated only for recognized social crawlers; regular browser requests retain the existing Share experience.
- Not deployed to production. After deploy, refresh the preview cache in the target messaging platform and test at least one tenant.
