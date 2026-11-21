# Test report — V57.12 Link4M destination/result page

## Result

`sh scripts/check-build.sh` completed successfully. The release pipeline reported all 23 stages passed.

Additional checks completed:
- `node --check` for the Cloudflare Worker and edited JavaScript assets.
- Inline JavaScript check: 7 embedded scripts checked, 0 failures.
- Local HTML/CSS reference check: 27 files checked, no missing local references.
- Dedicated SQLite simulation for the 5-minute return-state window, separate 5-minute key window, single-use state and single-use key.
- Browser-mocked return-page test: a valid return automatically calls `/api/rental/free/bypass/issue`, sends the tenant session + state + browser proof, renders the generated key, clears the proof, and removes the sensitive return parameters from the address bar.
- ZIP integrity check: `unzip -t` passed.

## Scope of verification

These are local/static and simulated checks. The package was not deployed to the production Cloudflare Worker, and no live request was made to BumX/Link4M or the production D1 database. The real-world redirect behavior, account traffic eligibility and live key redemption still need a test after deployment.

## Key limitation

The provider shortener API used here does not provide an independently verified ad-completion callback. TeoStudio grants a key only after a valid return to the original tenant session, state and browser proof. That confirms the return flow, not the ad view itself.
