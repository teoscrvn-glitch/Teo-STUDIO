# Deploy V56.8 from a phone

1. Keep the currently working ZIP and production deployment as rollback copies.
2. Upload this ZIP to a new GitHub branch or test repository; do not overwrite the known-good release until Preview checks pass.
3. In Cloudflare, create/use a Preview Worker and a separate test D1 database. Do not bind Preview to production D1.
4. Keep `cloudflare/wrangler.toml` database binding names aligned with the Preview D1; do not remove the production binding when deploying production later.
5. Run `sh scripts/check-build.sh` from the repository root (Termux requires Node.js).
6. Deploy to Preview and test: a legacy tenant login, a PBKDF2 tenant login, invalid password error, file hide/show, free download button, paid badge, and TikTok/YouTube cards.
7. Only after those pass, merge/deploy the same code to Production. Preserve all existing production secrets and the production D1 database.

This package does not configure SMTP or AI API keys and does not claim a live deployment.
