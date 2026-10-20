# TeoStudio V56.18 — Tenant statistics polish

Based on V56.17. This is a conservative frontend/dashboard patch and does not require D1 migrations or new Cloudflare secrets.

## Changes
- Tenant dashboard sales summary now includes today's paid order count and today's gross revenue alongside the existing 30-day order/revenue, conversion rate, seller wallet credit and platform commission figures.
- Date grouping uses the existing Vietnam-local date helper (`Asia/Ho_Chi_Minh`).
- Cache fingerprints are bumped to V56.18 so mobile browsers request the updated assets.
- Existing tenant controls remain in place: files, comments, tags, studio-scoped IP/email blocks, notifications, settings/builder, wallet and withdrawal requests.
- Main-admin-only functions remain excluded from tenant admin: tenant creation/management, platform-wide top-up statistics and withdrawal approval queue.
- Existing buyer wallet purchase flow is not modified in this patch.

## Configuration
No changes to `wrangler.toml`, D1 binding, Cloudflare runtime variables or secrets are required. Keep existing Production configuration and D1 data.

## Verification boundary
`./scripts/check-build.sh` verifies Worker and frontend JavaScript syntax plus static release checks. It does not run a live browser, D1, SMTP, Turnstile, SePay webhook, real wallet transaction or seller payout test. Do not treat those as verified from this local test alone.
