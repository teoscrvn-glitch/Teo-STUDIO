# TeoStudio V56.3 — Stability & Runtime Diagnostics

This archive is a source package based on V56.2, prepared to help stabilize the Cloudflare Worker and diagnose runtime configuration. It has not been deployed to production from this environment.

## Start here
1. Read `DEPLOY_V56_3_MOBILE.md`.
2. Compare the archive against your current GitHub repo before copying files.
3. Back up the current D1 database and repository. Never reset or recreate the production database.
4. Run `node --check cloudflare/worker.js` and inspect `git diff` before committing.
5. After successful deploy, verify `/api/health` reports `v56.3-stability-ai-config` and use Admin → Runtime Check to test configured services.

## Relevant docs
- `VERSION_V56_3.md` — this release's changes and variable names.
- `TEST_REPORT_V56_3.md` — what was checked and what still requires real accounts.
- `SECURITY_PLAYBOOK_TEOSTUDIO.md` — reusable security review checklist.

## Secret handling
Never commit `AI_API_KEY`, `OXMAIL_SMTP_PASS`, `TELEGRAM_BOT_TOKEN`, `ADMIN_KEY`, or `SEPAY_API_KEY`, and never paste their values into a chat or screenshot.
