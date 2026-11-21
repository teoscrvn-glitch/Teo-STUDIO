# Deploy V56.14 (mobile-friendly)

1. Keep the currently deployed release as backup.
2. Extract this ZIP and copy its contents into the same repository paths (especially `cloudflare/worker.js`, `cloudflare/wrangler.toml`, and `frontend/`). Do not upload the ZIP itself as a Worker source file.
3. Keep existing Cloudflare Secrets and the existing D1 binding `DB` -> `teo-studio`. Do not delete/recreate D1.
4. Confirm ordinary vars in `cloudflare/wrangler.toml` match Production values before deploy. Never put secret values in GitHub.
5. Run `./scripts/check-build.sh`, then deploy using the existing Cloudflare pipeline.
6. Test with a small file / test account: login, reload page, open paid product, click Buy, accept terms, complete Turnstile, confirm purchase, and verify the returned download URL. Do not test by purchasing your own production listing if you cannot reverse it.
7. Verify account and tenant-admin sessions survive a reload and expire after seven idle days.

This ZIP has not been tested against live Production D1/SePay. Keep the previous release available for rollback.
