# Test Report V56.3

## Local checks included
- Worker JavaScript syntax checked with Node.
- All external frontend JavaScript files checked with Node.
- HTML inline scripts extracted and syntax checked where applicable.
- Static checks that the build fingerprint, admin config status endpoint, and test handlers are present.
- ZIP structure checked so `cloudflare/worker.js` is at the archive root rather than hidden under `v56fix/`.

## Not verified locally
- Cloudflare Wrangler production deployment.
- Runtime secrets/variables or live D1 connectivity.
- Real OxMail delivery, AI provider credentials/quotas, Telegram delivery, Turnstile live hostname, or SePay live payment/webhook.
- Full end-to-end flow on a real mobile browser.

## Deploy acceptance checklist
1. `/api/health` returns `version: v56.3-stability-ai-config`.
2. Admin → Runtime Check lists expected services as ready.
3. Test AI, email, and Telegram buttons succeed if those providers are configured.
4. Register a test account and receive/verify email.
5. Verify Turnstile, create a small top-up, check bank receipt and D1 ledger, then make a low-value wallet purchase and verify 95/5 accounting.
6. Verify paid download permission, comments moderation, manual IP/email block, and tenant access.
