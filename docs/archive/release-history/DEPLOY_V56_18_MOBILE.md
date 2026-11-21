# Deploy TeoStudio V56.18 from mobile

1. Keep the current Production Worker and D1 database as-is; do not create a new database and do not delete secrets.
2. Upload/replace the release files in the existing `Teo-STUDIO` repository while preserving the current folder structure (`cloudflare/worker.js`, `cloudflare/wrangler.toml`, `frontend/`).
3. In Cloudflare Worker Builds, keep the existing project, root directory, build command, deploy command, D1 binding `DB`, and all Production variables/secrets unchanged.
4. Run `./scripts/check-build.sh` in an environment with Node.js before deployment.
5. Deploy to Preview first if available. Check `/api/health`, tenant Admin login, dashboard stats, file/comment/tag actions, settings, wallet history and withdrawal request. Then test purchase with a small test item and confirm the buyer balance and seller wallet ledger each change exactly once.
6. Promote to Production only after the checks above pass. After deployment, open the site in a private tab or refresh site data to avoid stale cached frontend files.

Do not paste secret values into GitHub or chat. This release does not need new secrets or database migrations.
