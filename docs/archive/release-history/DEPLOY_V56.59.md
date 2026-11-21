# Deploy V56.59

1. Back up the current Worker deployment and D1 database before deploying.
2. Deploy the Worker from `cloudflare/worker.js` with the existing `cloudflare/wrangler.toml`; keep all Production secrets and the D1 binding unchanged.
3. Test `https://teostudio.top/share?tenant=<slug>` in a private browser window. It should load without a 307 redirect loop.
4. Test a social preview crawler separately; verify OG title, description, and avatar image.
5. Sign in to a test tenant Admin and verify `/api/tenant/me`, file list, comments, and settings. New sessions store the tenant slug; existing session rows are not modified.
6. If any Admin API still returns `TENANT_REQUIRED`, capture the request URL and Worker response status; do not delete tenant or session records.
