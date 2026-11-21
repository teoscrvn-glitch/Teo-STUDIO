# Test Report — TeoStudio V56.4

## Passed locally
- `node --check cloudflare/worker.js`.
- `node --check` for every `frontend/assets/js/*.js`.
- Inline JavaScript in HTML checked separately where executable.
- Wrangler TOML parsed with Python `tomllib`.
- Static checks confirm `run_worker_first = true`, the new build version, and canonical-host code paths.
- ZIP structure verified: `cloudflare/worker.js` and `frontend/index.html` are rooted directly in the archive.

## Not verified from this environment
- `wrangler deploy --dry-run` / actual Cloudflare deployment.
- Runtime secrets and Variables, D1 live access, production host routing.
- Real Turnstile token acceptance, email delivery, AI provider responses, Telegram alerts, SePay webhook and financial transactions.

## Acceptance checklist after deploy
1. Open `https://teostudio.top/api/health` and confirm the V56.4 fingerprint.
2. Opening a normal page on `*.workers.dev` redirects to the canonical domain.
3. Turnstile appears and validates on the canonical domain.
4. Admin login works with the current `ADMIN_KEY`.
5. Admin runtime diagnostics show D1/Turnstile/SePay configured and show any missing AI/email/Telegram variables without exposing secret values.
6. Test AI, email, and Telegram only after configuring provider credentials.
7. Test low-value top-up/webhook and wallet purchase with the existing D1 backed up; do not create duplicate payments while an order is pending.
