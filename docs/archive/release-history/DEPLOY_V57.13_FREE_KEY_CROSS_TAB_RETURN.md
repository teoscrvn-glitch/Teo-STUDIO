# Deploy V57.13

1. Upload the full `frontend/` directory to the same static hosting used by TeoStudio.
2. Deploy `cloudflare/worker.js` to the existing Worker (the Worker change in this release is a build-version bump; API routes and D1 schema remain compatible).
3. No new D1 table and no new Cloudflare Secret are required.
4. Hard-refresh `/tenant-admin.html` or close/reopen the Admin tab so the V57.13 JavaScript is loaded.
5. Start a fresh BumX or Link4M attempt. Old V57.12 return links should not be reused.
6. Test Link4M in the same browser profile where the Studio Admin is logged in. A new tab is supported; another browser/device without the same authenticated session is rejected.

Expected behavior:
- Link4M/BumX returns to `/free-key.html` and the page automatically asks Worker for a key.
- The result page shows a concise loading state first, then the one-time key and a five-minute countdown.
- Return query values are scrubbed from the address bar after capture.
- The tenant UI no longer shows API test output, HTTP/domain diagnostics, Secret names or callback implementation details.

The provider's captcha/redirect time is controlled by BumX/Link4M. V57.13 reduces TeoStudio result-page loading by using inline CSS and removing the large Admin stylesheets; it cannot speed up the provider's own page.

Provider callback limitation remains: without a signed provider callback, TeoStudio can verify a valid return state and authenticated session, not independently prove that an ad was watched.
