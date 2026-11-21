# Deploy V57.11 — Free key expiry

1. Deploy the contents of `cloudflare/worker.js` to the existing Cloudflare Worker.
2. Publish the `frontend/` static assets from this package.
3. Keep the current D1 binding and existing schema; this update is additive and requires no new table, column, or secret.
4. Keep the scheduled trigger `*/5 * * * *` enabled so expired key and attempt artifacts are cleaned up.
5. Verify `/api/health` reports `v57.11-free-key-five-minute-ttl` after deployment.
6. Test with a Free Studio: start a provider link, return within five minutes, issue one key, copy it, redeem it, then try the old return URL and the same key again. Both replays should be rejected.
7. Verify a link that is not used to issue a key expires after five minutes, and a key not redeemed within five minutes is rejected.

The local test suite does not replace a live test against the production Worker and D1 database. Never paste API secrets into screenshots or public logs.
