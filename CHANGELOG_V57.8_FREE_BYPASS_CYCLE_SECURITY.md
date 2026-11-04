# TeoStudio V57.8 — Free bypass cycle quota and tab/session binding

## Free reward cycle
- A cycle is `BumX -> return to the original tab -> issue/redeem one-time BumX key -> Link4M -> return to the original tab -> issue/redeem one-time Link4M key`.
- Only a successful Link4M key redemption completes a cycle and adds 7 days.
- Added time is cumulative: `max(current expiry, now) + 7 days`.
- A Free tenant can complete at most two cycles in any rolling 24-hour window. The oldest completed cycle releases one slot exactly 24 hours after its completion. There is no 24-hour delay between BumX and Link4M in the same cycle.
- A logged-in Free tenant can start another cycle from the in-Admin reward panel even while the current Free time is still active.

## Copy/direct-link hardening
- Each attempt is bound to a tenant, authenticated session hash, one-use state hash, and a random per-tab proof hash.
- The proof is held in `sessionStorage` in the tab that starts the short-link flow. It is sent to the Worker only as a hash in the attempt record; the short return URL carries the proof for validation.
- A copied return URL opened in a different tab/browser will not pass the tab-proof check. A different authenticated session or tenant also fails the server-side checks.
- Successful key issue removes the tab proof and removes `state`/`proof` from the visible URL using `history.replaceState`.
- Keys remain one-use, session-bound, and expire after five minutes. Each attempt can issue at most one key.

## Provider verification limitation
- BumX/Link4M integration in this build uses the documented URL-shortening API response to create the outbound short URL. The available configuration/API evidence does not establish a signed server-to-server callback proving that a user completed or viewed an ad.
- Therefore V57.8 strengthens copied-link, cross-tab, cross-session, state replay, and key replay resistance, but does **not** independently prove ad completion. Do not describe the return-to-site check as verified ad completion unless a provider-signed callback/postback or authenticated status API is added.

## Changed files
- `cloudflare/worker.js`: additive D1 columns, cycle quota, cumulative expiry, state/session/tenant/tab proof validation.
- `frontend/assets/js/tenant-admin.js`: active Free reward panel, 2-cycle quota UI, tab proof creation.
- `frontend/assets/js/free-key.js` and `frontend/free-key.html`: tab proof check, direct-link disabled state, one-time key UX.
- `frontend/assets/js/account.js`, `frontend/assets/js/rental-master.js`, related HTML cache references: Free plan copy corrected to 7-day cycle logic.
- `scripts/test-v57.8-free-bypass-cycles.py` and `scripts/check-build.sh`: cycle/quota and SQL simulation coverage.
