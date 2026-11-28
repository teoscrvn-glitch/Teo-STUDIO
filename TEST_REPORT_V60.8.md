# V60.8 Test Report

- `bash scripts/check-build.sh`: PASS, 40/40 stages.
- `node --check frontend/assets/js/admin-rankings-embed.js`: PASS.
- `node --check frontend/assets/js/rankings.js`: PASS.
- `node scripts/build-detail-foundation.mjs --check`: PASS.
- `node scripts/sync-build-id.mjs --check`: PASS.
- ZIP integrity checked after packaging.

Navigation behavior is statically verified from the implementation: Admin links to `/rankings.html` are intercepted; a hash history entry is pushed; the leaderboard is mounted in an overlay iframe; closing/back removes the overlay while retaining the parent pathname and query string. The tenant slug is passed to the embedded ranking URL when available.

Not verified in a live browser: actual pointer/touch behavior, Cloudflare production routing, authenticated Tenant Admin session and mobile browser viewport rendering. No D1 migration or live Worker deployment was performed.
