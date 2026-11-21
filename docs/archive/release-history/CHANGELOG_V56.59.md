# V56.59 — Share redirect and tenant session fix

- Removed the Worker rewrite from `/share` to `/share.html`. Cloudflare Assets clean-URL handling now receives `/share` directly, avoiding the `/share` → `/share.html` → `/share` redirect cycle.
- Updated social-crawler Share handling to use the clean `/share` asset path while retaining tenant Open Graph metadata.
- New tenant Admin sessions now store the stable tenant slug as `tenant_sessions.tenant_id`; existing sessions that store legacy IDs remain resolvable by the existing compatibility lookup.
- No D1 rows are deleted or reset.

Validation: JavaScript syntax check only. Production login, Share navigation, D1 compatibility, and social preview behavior still require deployment smoke tests.
