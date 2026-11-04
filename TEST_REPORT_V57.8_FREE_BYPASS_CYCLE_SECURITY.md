# V57.8 local test report

Date: 2026-11-05

## Result
- `bash scripts/check-build.sh`: PASS, 19/19 steps.
- `node --check cloudflare/worker.js`: PASS.
- All JavaScript under `frontend/assets/js`: PASS syntax checks (included in build script).
- `scripts/test-v57.8-free-bypass-cycles.py`: PASS.

## Targeted SQL simulation
The test executes the same tenant-account UPDATE SQL used by the Worker with a local SQLite database and verifies:
1. First completed BumX + Link4M cycle: +7 days.
2. Second completed pair in the rolling 24-hour window: another +7 days.
3. Third pair before the oldest pair reaches 24 hours: update rejected; expiry unchanged.
4. Once the oldest pair reaches 24 hours: one quota slot reopens and a new completed pair is accepted.

## Security assertions
- The attempt is associated with the authenticated session hash, tenant ID, state hash and a per-tab proof hash.
- Issuing the key requires the same tenant/session and a matching per-tab proof; a copied return URL opened in a different tab/browser is rejected.
- Attempt state is claimed once; key is one-use, bound to tenant/session and expires after five minutes.
- Successful key issuance clears the browser tab proof and removes state/proof from the visible URL.

## Not tested here
No live Cloudflare deployment, production D1 migration, provider-account configuration, real BumX/Link4M ad completion, or physical Android browser interaction was run. The existing shortener API integration does not expose a signed completion callback in the current project code, so this build does not claim independent provider-side proof that an ad was viewed. The tab/session checks prevent a copied URL from being used in another tab/session; they are not a substitute for a signed provider callback.
