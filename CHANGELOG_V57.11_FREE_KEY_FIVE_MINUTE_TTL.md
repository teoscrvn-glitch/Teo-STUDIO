# TeoStudio V57.11 — Free key 5-minute link and key expiry

## Changes
- Free bypass return-link state now expires five minutes after the Worker creates the attempt.
- The generated return URL includes the server expiry timestamp for a visible client-side countdown. The database remains authoritative; changing the query-string timestamp cannot extend the server-side expiry.
- When a key is issued, the state is atomically changed from `pending` to `key_issued`, and the attempt expiry is aligned to the key expiry.
- Each issued key remains valid for five minutes from issue time and can be redeemed once only.
- After the return state is consumed or expires, the page removes `state`, `proof`, and `exp` from the visible URL. An expired return link disables the create-key action.
- Copying a key hides its plaintext from the page but keeps the five-minute countdown running.
- Existing tenant, session, tab-proof, provider order, rolling reward quota, and rate-limit checks are preserved.
- Existing scheduled cleanup removes expired key rows and expired attempt records. Redemption is rejected immediately at the server expiry timestamp even before the cleanup cron runs.

## Important boundaries
- A successful short-link API response still proves only that a short URL was created, not that an ad was completed.
- This release does not add or claim provider-side ad-completion verification.
- Link4M rewarded traffic remains disabled unless its required explicit approval is configured.

## Validation
- `scripts/test-v57.11-free-key-five-minute-ttl.py` checks version references, server-side TTL enforcement, single-use state/key rules, UI countdown behavior, and an in-memory SQLite SQL simulation.
- `scripts/check-build.sh` runs syntax and regression checks. Passing local checks does not mean a live Cloudflare deployment or production D1 has been tested.
