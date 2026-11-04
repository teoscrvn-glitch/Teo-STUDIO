# Deploy TeoStudio V57.8 — Free bypass cycle + tab/session hardening

## What changes
- One complete reward cycle is BumX then Link4M. No 24-hour wait between the two providers.
- Only redeeming the Link4M key completes the cycle and adds 7 days.
- Time is cumulative: the new expiry is the later of the current expiry or now, plus 7 days.
- Maximum two completed cycles in any rolling 24 hours. After two, the oldest cycle frees a slot at its 24-hour mark.
- A tenant whose Free time is still active can start another cycle from the reward panel inside Tenant Admin.
- Return key URLs are bound to the exact tenant, authenticated session and browser tab that initiated the attempt. A copied URL opened in a different tab/browser is rejected.

## Deploy steps
1. Keep the existing Cloudflare Worker Secrets, Variables, D1 database and bindings. Do **not** delete or recreate the production D1 database.
2. Deploy both the Worker and the complete `frontend` assets from this release. Do not upload only `worker.js`.
3. In the `cloudflare` directory, run:
   ```sh
   npx wrangler deploy
   ```
4. Open `/api/health` and verify `version` is `v57.8-free-bypass-cycle-security`.
5. Hard-refresh `/tenant-admin.html?tenant=YOUR_TENANT_ID` in the same browser. Start the short-link flow from the Admin page and allow it to return to the **same tab**. Opening the return URL in a new tab is intentionally rejected by the per-tab proof check.

## Required provider configuration
- BumX: `BUMX_API_KEY`, `BUMX_API_URL`.
- Link4M: `LINK4M_API_KEY`, `LINK4M_API_URL`.
- Keep `LINK4M_REWARDED_TRAFFIC_APPROVED=1` only if Link4M has explicitly approved rewarded/incentivized traffic in writing. If not, Link4M remains disabled.

## Verification checklist after deployment
1. Start BumX from a Free tenant. A random return URL should include the tenant, state and per-tab proof.
2. Open that return URL in a different browser tab or another browser profile. It should reject key creation.
3. Complete the short-link flow in the original tab. The key should be issuable once, be bound to that authenticated session/tenant, and expire after five minutes.
4. Redeem the BumX key. Progress should become `1/2`, with Link4M immediately available (subject to provider configuration/approval).
5. Redeem the Link4M key. Exactly 7 days should be added to the existing Free expiry.
6. Repeat the full BumX + Link4M cycle while the Free rental is still active. It should add another 7 days.
7. After two completed cycles in the rolling 24-hour window, a third BumX start should be rejected until the oldest completed cycle reaches 24 hours.

## Important security limitation
The configured URL-shortening APIs do not, in the currently available integration evidence, provide a signed callback/postback proving that the user completed or viewed an advertisement. V57.8 prevents a copied URL from being used from another tab/session and prevents state/key replay, but it cannot independently verify ad completion by the provider. A provider-signed callback or authenticated completion-status endpoint is required for that stronger guarantee.

## Local checks run for this release
- `bash scripts/check-build.sh` — PASS (19/19 script steps).
- Worker and frontend JavaScript syntax checks — PASS as part of the build script.
- SQLite simulation of the Worker cycle update SQL — PASS: cycle 1 adds 7 days, cycle 2 adds another 7 days, cycle 3 is blocked inside the rolling 24-hour window, and one slot reopens when the oldest cycle reaches 24 hours.
- These are local static/simulation checks only. Live Cloudflare deployment, production D1 migration, provider account behavior, and actual phone/browser UI have not been exercised from this environment.
