# Deploy V56.18 from Android

1. Download and extract this ZIP. Copy/merge the contents into the matching repository paths (do not upload the ZIP as a Worker).
2. Keep the current Cloudflare D1 `DB` binding and database ID `teo-studio`; keep all existing secrets in Cloudflare. Do not put secret values in GitHub.
3. Commit the changed files and confirm Cloudflare builds that exact commit.
4. Check `https://teostudio.top/api/health` reports `v56.18-tenant-stats-polish-vn-email`.
5. Test buyer account launcher on the main site, tenant Share and tenant detail; confirm it is hidden only inside `/tenant-admin.html`.
6. Verify purchase from main and tenant Share with test data first; verify insufficient balance is non-mutating, then verify one successful purchase has one debit, one purchase record, and correct seller/platform ledger entries.
7. Check new-device email shows Vietnam time (UTC+7), understandable device/browser, account and IP. Test SMTP using admin's email-test button.
8. Keep V56.16 ZIP as rollback. Local syntax checks do not prove live payment, D1 migration, SMTP or Turnstile operation.
