# Deploy TeoStudio V56.3 on mobile (Termux + GitHub + Cloudflare)

## Before replacing anything
1. Export/backup the existing D1 database.
2. Keep a copy of the current GitHub repo/production ZIP.
3. Do not delete/recreate D1. Keep binding `DB`, database ID, and existing production secrets.

## Replace the correct source files
This ZIP has `cloudflare/worker.js` and `frontend/` directly at the archive root (no `v56fix/` wrapper). Merge these files into the matching repo paths. Avoid replacing `cloudflare/wrangler.toml` unless you have compared the database ID and assets path.

From the repository root, run:

```bash
git status --short
node --check cloudflare/worker.js
git diff --stat
git diff -- cloudflare/worker.js
```

The diff must show V56.3 changes. If `git diff` is empty, you're either in the wrong repo/path or have not overwritten the file.

If the repo's Cloudflare build root is `cloudflare`, run Wrangler from that directory and check the configured build command. If Cloudflare builds from the repository root, use the existing production build settings; do not make a blind root-directory change.

Then commit and push:

```bash
git add cloudflare/worker.js frontend
git commit -m "V56.3 stabilize runtime config diagnostics"
git push origin main
```

Wait for Cloudflare to build the pushed commit. Verify the commit/hash in Build History. If it still fails, capture the whole first error block including file and line.

## After successful deploy
Open `https://teostudio.top/api/health`. It should identify `v56.3-stability-ai-config`. Then sign into Admin and use Runtime Check. Configure only missing variables shown there. Never paste secret values into chat or commit them.

## Required Production variables
- Existing `ADMIN_KEY`, `SEPAY_API_KEY`, `SEPAY_BANK_CODE`, `SEPAY_ACCOUNT_NUMBER`.
- Existing matching `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET`.
- `OXMAIL_SMTP_PASS` secret for email verification/reset; default SMTP host/user/port are in `VERSION_V56_3.md`.
- `AI_API_URL`, `AI_API_KEY` secret, `AI_MODEL` for real AI replies.
- `TELEGRAM_BOT_TOKEN` secret + `TELEGRAM_CHAT_ID` for Telegram notifications.
