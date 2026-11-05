# Test report — V57.11 Free key 5-minute TTL

Date: 2026-11-05

## Local results
- `node --check cloudflare/worker.js`: PASS
- `node --check frontend/assets/js/free-key.js`: PASS
- `bash scripts/check-build.sh`: PASS (22/22 stages)
- New V57.11 test: PASS, including 11 static assertions and an in-memory SQLite transaction/expiry simulation.

## Covered behavior
- Return-link attempt expires 5 minutes after the Worker creates it.
- The visible return page countdown is based on the Worker-provided expiry value; the server-side D1 timestamp remains authoritative.
- The return state changes from `pending` to `key_issued` once. Key-row insertion and state claim use one D1 batch.
- The issued key gets a separate 5-minute window and can be redeemed only once.
- The page removes the old state/proof/expiry parameters after issue or expiry. After copy, it hides the key but keeps the countdown active.

## Not tested in this environment
- No live Cloudflare Worker deployment was performed.
- No production D1 database or real BumX/Link4M advertiser journey was exercised.
- No physical Android browser UI test was performed.
- This flow does not independently verify ad completion; the shortener API response is not an ad-completion callback.
