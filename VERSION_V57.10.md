# TeoStudio V57.10 — Link4M API diagnostics

V57.10 adds a safe, tenant-authenticated diagnostic for the configured BumX and Link4M URL-shortening APIs. It does not enable Link4M rewarded traffic.

## Changes
- The Tenant Admin Free gate and Settings panel can run a real server-side shortlink API probe using `BUMX_API_KEY` / `LINK4M_API_KEY` and configured URLs.
- Link4M shortlink creation can be tested even while the separate rewarded-traffic approval flag is off. This exception is diagnostic-only. The normal Free reward flow still requires the approval flag.
- Diagnostic results expose provider, HTTP status, provider `status`, and returned short-domain only. The full temporary short URL and API secret are not returned.
- Provider error messages are sanitized to redact secrets and URL query strings.
- A diagnostic probe creates a temporary short URL but does not open it, create a bypass attempt, issue a one-time key, verify an ad completion, or award Free days.
- Frontend cache tokens and Worker `BUILD_VERSION` were bumped to `v57.10-link4m-api-diagnostic`.

## Important distinction
`status: success` from the documented Link4M `api-shorten/v2` endpoint indicates that a short URL was created. It is not evidence that a visitor completed the ad flow. No provider-signed completion callback or per-attempt status endpoint was present in the supplied API materials or verified during this release.

The production reward flow remains disabled unless Link4M has explicitly approved incentivized traffic in writing. The current Link4M public rules prohibit incentivized traffic except by special permission and specify that the publisher account holder must be at least 18. An eligible adult should be the account holder/operator.

## Deploy
1. Keep existing Production secrets and the existing D1 database. No migration or new secret is required for this diagnostic.
2. Deploy `cloudflare/worker.js` and the complete `frontend` folder from this release.
3. Hard-refresh `/tenant-admin.html?tenant=YOUR_STUDIO` (the page cache version is `v57.10`).
4. In the Free gate, press **Test API BumX + Link4M (tạo link thử)**; alternatively use Settings → **Test API tạo link rút gọn**.
5. Read the per-provider result. `API tạo link OK` confirms only that the configured shortener endpoint accepted a create-link request. It does not verify a completed view.

## Local validation
- `node --check cloudflare/worker.js` — PASS.
- `node --check frontend/assets/js/tenant-admin.js` — PASS.
- `bash scripts/check-build.sh` — PASS (21/21 groups, including 13 new V57.10 static checks).
- The actual Cloudflare Secrets and provider account are not accessible in this local build environment, so no real request to Link4M/BumX has been made yet. Pressing the diagnostic button after deployment performs that request from the Worker.
