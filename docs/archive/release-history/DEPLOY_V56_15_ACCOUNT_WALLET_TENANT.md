# Deploy V56.16 from Android / GitHub

1. Keep the current working commit as a backup. Do not delete the Worker, D1 database, or Secrets.
2. Extract this ZIP locally; do not upload the ZIP itself to GitHub as if Cloudflare would unpack it. Copy/merge the contained `cloudflare/` and `frontend/` folders to the repository root, preserving the same paths. Cloudflare Worker Builds should still use root directory `cloudflare` and `npx wrangler deploy`.
3. Inspect `cloudflare/wrangler.toml`. It binds `DB` to the same `teo-studio` database ID and keeps the public variables. If your current account number/site key changed, copy the current values from the Cloudflare Production screen into `[vars]` before deploying.
4. Do not place secret values into the ZIP/GitHub: preserve existing `ADMIN_KEY`, `SEPAY_API_KEY`, `TURNSTILE_SECRET`, and `OXMAIL_SMTP_PASS` inside Cloudflare Settings → Variables and Secrets. Keep `DB` binding unchanged.
5. Commit to a branch/commit, wait for the new Cloudflare Build to succeed, and confirm `/api/health` reports `v56.18-tenant-stats-polish-vn-email`. Do not retry an older commit expecting it to use new source.
6. Test in order: (a) buyer ID login and email verification; (b) open a Studio Admin link while buyer account is signed in; (c) tenant tabs File/Comments/Tags/Settings/Chặn IP-email; (d) test a Free direct download; (e) use a dedicated test product and a small wallet balance to run the wallet purchase flow.
7. For purchase testing, confirm it opens a modal, requires Turnstile and final confirmation, creates exactly one `buyer_purchases` row, deducts the buyer ledger once, credits seller net/commission once, and shows the download link in the success modal and Orders tab. Do not use a valuable live file until the test purchase works.
8. Check per-Studio views, referrers, and monthly sales for the tenant. Confirm tenant admin does not see global top-up totals or the master payout-approval queue.
9. Check account notifications and email messages for login from a new device, wallet top-up, purchase, password/email update and withdrawal status. The SMTP password remains a Cloudflare Secret.
10. Teo AI navigation actions only open whitelisted tabs. Purchases, bans, deletes, payout requests and settings saves remain explicit manual actions.

If any action fails, capture its visible API error / Cloudflare log before trying a second real purchase. Never retry after the balance changed until Orders and wallet history have been checked.
