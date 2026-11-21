# TeoStudio V56 — local regression report

Date: 2026-10-16

## Confirmed by source-level/local checks

- Fixed stale detail/download entry points: removed inline calls to `renderDetailPage()` and `renderDownloadPage()` and load `config.js` plus versioned `main.js?v=56`; initialization is owned by the existing `DOMContentLoaded` handler.
- Updated cached frontend JS/CSS references to v56 for the pages changed by this package.
- Comment UI no longer asks users to type an arbitrary public display name. It requires a shared-account session and Turnstile token; server derives display name from the profile.
- Worker routes require server-side Turnstile validation on comment and support-report submissions; D1-backed rate events limit comments and image count.
- Comment images are inserted with `visible=0` and do not appear in public comment list until a moderator publishes them.
- Permanent admin IP/email blocks are stored in `security_blocks`, invalidation is performed on create/remove, and blocked IPs are checked before page/API/asset routing.
- Support admin view includes a manual IP/email block shortcut; Telegram notification includes the recorded client IP when configured.
- Purchase frontend no longer initiates the legacy QR-per-file API. Public legacy order creation returns `WALLET_PURCHASE_REQUIRED` (410), and public paid product rows redact the original link.

## Local checks completed for this archive

- `node --check cloudflare/worker.js` — passed.
- `node --check` across every JavaScript file in `frontend/assets/js/` — passed.
- Grep/source assertions — passed: no stale `renderDetailPage()` / `renderDownloadPage()` inline calls; detail/download pages load `config.js` and `main.js?v=56`; wallet-only purchase marker, Turnstile use, image moderation state, blocklist path and Telegram IP text are present.
- SQLite in-memory validation — passed for `security_blocks` and `comment_rate_events` DDL/indexes, a saved email block, the Vietnam-midnight day boundary expression, and rate-limit insertion: two events in a minute pass; the third for the same account is rejected by the SQL condition.

## Not tested from this environment

- Live deployment, exact current GitHub default branch, real Cloudflare D1/Workers runtime, concurrent race behavior in production, live SePay webhook retries or actual bank transfers.
- SMTP mail acceptance/deliverability, real Turnstile hostname settings, live AI provider API, Telegram delivery, or all devices' UI.
- Cloudflare WAF / edge rate-limit rules. These need dashboard configuration.
- Whether a particular photo contains sexual content: V56 holds user-uploaded comment photos for manual review; it does not include a dedicated automated NSFW classification model.

## Release decision

**Not production-approved solely from local/source checks.** Back up D1, compare/merge against the actual GitHub main branch, configure runtime secrets, deploy staging first, and run the regression tests in `DEPLOY_V56_MOBILE.md`. Do not describe the site as upgraded until `/api/health` confirms the V56 Worker version and test flows pass.
