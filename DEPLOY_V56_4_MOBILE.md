# Deploy TeoStudio V56.4 on Android / Termux

## Before copying files
1. Back up the current repo and D1 database. Do not delete `.git`, recreate D1, change the database ID, or remove existing secrets.
2. Download and extract this ZIP. `cloudflare/` and `frontend/` are at the archive root.
3. Merge/overwrite the matching files into your existing `Teo-STUDIO` repo. Make sure `cloudflare/wrangler.toml` contains `run_worker_first = true` and `cloudflare/worker.js` contains `v56.4-canonical-runtime-fix`.

## Validate locally
From the repo root in Termux: `
```sh
cd ~/Teo-STUDIO
./scripts/check-build.sh
git status --short
git diff --stat
```

`git diff --stat` must show changes. If it is empty, the files were not copied into the repo being pushed or the wrong folder is open.

## Commit and deploy
```sh
git add cloudflare frontend scripts
git add README.md VERSION_V56_4.md DEPLOY_V56_4_MOBILE.md
git commit -m "V56.4 canonical host and runtime fix"
git push origin main
```

Wait for Cloudflare Build to succeed and confirm it built the new commit SHA. Do not push/deploy until local checks pass.

## Production smoke test
Use **https://teostudio.top**. Opening a page on the `*.workers.dev` alias should now redirect to the canonical domain. Then open `https://teostudio.top/api/health`; it must return `version: v56.4-canonical-runtime-fix`.

Check the API's boolean `config` fields and Admin → Runtime Check. If `turnstileConfigured` is false, add `TURNSTILE_SITE_KEY` (Variable) and `TURNSTILE_SECRET` (Secret) to the Worker's **Runtime → Production** settings; adding them to Build variables alone is insufficient. Ensure the Turnstile widget allowed hostnames include `teostudio.top`.

Real AI responses need `AI_API_URL`, `AI_API_KEY` (Secret), and `AI_MODEL`. Email verify/reset need `OXMAIL_SMTP_PASS` (Secret) and correct mailbox settings. Telegram needs `TELEGRAM_BOT_TOKEN` (Secret) and `TELEGRAM_CHAT_ID`. Test each service from the Admin runtime page after deployment.

If Admin still fails, check that the `ADMIN_KEY` Secret remains present and that the browser is at `https://teostudio.top/admin.html`. Do not paste any secret into chat.
