# Deploy V54 from Android — careful production checklist

> Package source is based on the V52 ZIP supplied for this repair; it is not an exported snapshot of current GitHub main. Compare any newer production changes first. Do not upload a ZIP as a file and expect Cloudflare to extract it.

1. Download and extract `TeoStudio-V54-Rental-Catalog.zip` on Android. It is arranged as repository-root contents: `cloudflare/`, `frontend/`, and the docs at the top level.
2. Open GitHub `teoscrvn-glitch/Teo-STUDIO`. The Worker Builds settings use root directory `cloudflare` and command `npx wrangler deploy`, so the target path is exactly `cloudflare/worker.js`, with `cloudflare/wrangler.toml` alongside it. Do not place an extra `teo_v43/` directory above `cloudflare/`.
3. Replace/merge matching files at the same repo paths. At minimum the Worker + `wrangler.toml`, frontend tenant/product/rental/admin files, CSS and docs. Keep user-specific pages/settings and any production-only changes after comparing. Do not upload `.zip` in place of extracting it.
4. Commit to a branch/commit and inspect the new Cloudflare build log. Confirm the commit hash being built is the new commit; never click “Retry build” on an older failing commit expecting new code to appear.
5. Confirm `/api/health` says `version: v54-rental-catalog-payout`; then check `/api/rental/config`. This only verifies deployment/config, not real payment settlement.
6. In Worker Settings → Variables and Secrets, preserve all existing secrets and existing D1 binding/database ID. Configure only missing payment values using the existing SePay receiving account: `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, and matching `SEPAY_API_KEY`. Never paste secret values into GitHub or chat. Do not change the receiving bank account as part of this deployment.
7. Confirm the public Turnstile site key and private secret are a matching pair and approved for `teostudio.top`. Keep `TURNSTILE_SECRET` as a Secret, not a public variable.
8. Test the SePay webhook “Gửi thử” after deployment. If it returns 401, check that SePay API Key equals `SEPAY_API_KEY` exactly and that the current deployed code is the one being tested. A green webhook toggle is not proof of payment end-to-end.
9. Test rental and a tenant file sale with a small real transaction only after the above checks. Confirm one paid order, one ledger credit and no second credit on webhook retry. Test withdrawal reserve/reject refund/paid state using a test tenant.
10. Verify the public product page does not return the paid link before webhook confirmation. Do not enable the Free bypass scheme until its provider callback/API can be verified server-side.

## V54 additions and remaining verification

- This source adds Free email signup and a two-step bypass flow, main-catalog product checkout, manual Free/Paid tenant creation, and additional statistics. These are source-code flows only; they are not live-payment verified.
- Configure `OXMAIL_SMTP_PASS` for email codes. Configure both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET`; the Worker fails closed when either is missing.
- Free bypass requires `FREE_BYPASS_TEMPLATE_1`, `FREE_BYPASS_TEMPLATE_2`, `FREE_BYPASS_VERIFY_URL`, and `FREE_BYPASS_API_KEY`. The provider verification URL must return JSON with `success:true`, `completed:true`, and the exact submitted `state` only after real server-side confirmation. If the provider does not support this contract, keep the bypass unconfigured.
- Local syntax checks do not verify real SePay settlement, email delivery, provider callbacks, production domain routing, current GitHub branch merge, edge WAF/rate limits, or D1 backup. Main-site owner withdrawals are not implemented as a separate ledger in this release.


## Runtime vs Builds settings — V54 correction

The Cloudflare Builds screen is not the runtime Worker environment. After the build, open Workers & Pages → `teo-studio` → Settings → Variables and Secrets and ensure runtime has `SEPAY_API_KEY` (Secret), `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET` (Secret). `SEPAY_ACCOUNT_NAME` is optional. Keep receiving-account values unchanged. See `V54_FIXES_AND_RUNTIME_SETUP.md`.

Deploy both `cloudflare/` and `frontend/` contents from the ZIP, since `wrangler.toml` binds the frontend assets from `../frontend`. Check `/api/health` for `v54-rental-catalog-payout` and the frontend HTML meta marker for the same version.
