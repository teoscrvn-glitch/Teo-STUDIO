# Deploy V57.12 — Link4M destination key page

1. Deploy `cloudflare/worker.js` to the existing Cloudflare Worker.
2. Publish the entire `frontend/` directory; it includes the destination page `free-key.html` and its updated script.
3. Preserve the existing D1 binding and database. No new table or secret is required.
4. Existing Cloudflare variables/secrets must include `LINK4M_API_URL` and `LINK4M_API_KEY`, as well as `BUMX_API_URL` and `BUMX_API_KEY`. The `LINK4M_REWARDED_TRAFFIC_APPROVED` variable is no longer read by this code and can be removed if it was added solely for V57.11.
5. Verify the deployed Worker version is `v57.12-link4m-destination-key-page`.
6. In a Free Studio at the second step (after redeeming BumX), press **Vượt Link4M**. Worker should create a Link4M short URL targeted at `https://teostudio.top/free-key.html?...`.
7. Follow the Link4M short URL in the same browser tab/profile. On return, TeoStudio should automatically issue and display a key. Copy it and redeem it in the Admin within five minutes.
8. Verify replay: refresh/reopen the old destination URL; it must not issue another key. Redeeming the same key twice must fail. Verify another tenant/session cannot claim the state.

## Accuracy note
The return page proves only a valid return to the correct TeoStudio session/state. It does not prove ad completion because the provider has not supplied a verified callback/API for that event. Test with provider account and traffic policy; do not interpret a successful API shorten response as ad-view confirmation.

Local checks do not equal deployment or live testing against Cloudflare D1.
