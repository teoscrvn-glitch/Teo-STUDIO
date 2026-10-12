# Deploy V52 from Android — careful production checklist

> Package source came from the V51 ZIP available in this conversation; it is not an exported snapshot of current GitHub main. Compare any newer production changes first. Do not upload a ZIP as a file and expect Cloudflare to extract it.

1. Download and extract `TeoStudio-V52-Security-Rental.zip` on Android. It is arranged as repository-root contents: `cloudflare/`, `frontend/`, and the docs at the top level.
2. Open GitHub `teoscrvn-glitch/Teo-STUDIO`. The Worker Builds settings use root directory `cloudflare` and command `npx wrangler deploy`, so the target path is exactly `cloudflare/worker.js`, with `cloudflare/wrangler.toml` alongside it. Do not place an extra `teo_v43/` directory above `cloudflare/`.
3. Replace/merge matching files at the same repo paths. At minimum the Worker + `wrangler.toml`, frontend tenant/product/rental/admin files, CSS and docs. Keep user-specific pages/settings and any production-only changes after comparing. Do not upload `.zip` in place of extracting it.
4. Commit to a branch/commit and inspect the new Cloudflare build log. Confirm the commit hash being built is the new commit; never click “Retry build” on an older failing commit expecting new code to appear.
5. Confirm `/api/health` says `version: v52-security-rental`; then check `/api/rental/config`. This only verifies deployment/config, not real payment settlement.
6. In Worker Settings → Variables and Secrets, preserve all existing secrets and existing D1 binding/database ID. Configure only missing payment values using the existing SePay receiving account: `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, and matching `SEPAY_API_KEY`. Never paste secret values into GitHub or chat. Do not change the receiving bank account as part of this deployment.
7. Confirm the public Turnstile site key and private secret are a matching pair and approved for `teostudio.top`. Keep `TURNSTILE_SECRET` as a Secret, not a public variable.
8. Test the SePay webhook “Gửi thử” after deployment. If it returns 401, check that SePay API Key equals `SEPAY_API_KEY` exactly and that the current deployed code is the one being tested. A green webhook toggle is not proof of payment end-to-end.
9. Test rental and a tenant file sale with a small real transaction only after the above checks. Confirm one paid order, one ledger credit and no second credit on webhook retry. Test withdrawal reserve/reject refund/paid state using a test tenant.
10. Verify the public product page does not return the paid link before webhook confirmation. Do not enable the Free bypass scheme until its provider callback/API can be verified server-side.

## Known incomplete items

- Free 4-day tenancy after 2 link-bypass steps is kept disabled until a link-provider API/callback is supplied. Browser redirects alone are forgeable.
- Main catalog (not tenant Share pages) purchase checkout is not implemented in this ZIP.
- Live SePay transaction, Worker custom-domain routing, current GitHub branch merge, edge WAF/rate-limits and D1 backup are not verified by local syntax checks.
