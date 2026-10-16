# TeoStudio V56 — Security & moderation package

**Source package only; not deployed to production.** Built from the V54 ZIP and the V55 work package available in this conversation, not from a live export of GitHub main or Cloudflare production. Compare/merge before deploy.

## Release documents
- `VERSION_V56.md` — scope and known limits.
- `TEST_REPORT_V56.md` — checks and non-tested items.
- `DEPLOY_V56_MOBILE.md` — runtime secrets, deployment and mobile regression tests.
- `SECURITY_PLAYBOOK_TEOSTUDIO.md` — reusable security/AI review guidance and source links.
- Previous V45–V55 setup docs are retained for migration context.

## V56 changes
1. Fixed old detail/download pages that used stale JS URLs and called undefined inline initialization functions.
2. New file purchases use the shared-account wallet flow; the old per-file QR creation endpoint is intentionally disabled. Existing order records remain in D1.
3. Comments require an account and verified email, derive the display name from the profile, require server-verified Turnstile and apply D1-backed spam limits. Uploaded images remain hidden pending moderation.
4. Admin has a D1-backed permanent IP/email block list and support reports expose client IP only in admin tooling; public sale feed remains privacy-masked.
5. Versioned asset URLs are refreshed to `v=56`.

## Important limitations
- No code has been deployed to production in this task.
- Image review is manual, not AI-based NSFW classification.
- Runtime secrets for SMTP, AI and Telegram need to be configured in Cloudflare; without them email/remote AI/Telegram may not work.
- Cloudflare WAF and edge rate-limit rules must be configured separately; Worker throttles alone are not full DDoS protection.
- No single measure guarantees protection from every bypass or abuse.
