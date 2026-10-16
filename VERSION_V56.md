# TeoStudio V56 — Security, moderation, account flows

## Scope
V56 is a source package based on the V54 ZIP shared in this conversation and the V55 work package. It has **not** been deployed to production. It is not a live export from the GitHub main branch or Cloudflare production.

## Changes in this package

1. **Legacy QR path is no longer used by the purchase UI.** Paid file purchases go through the shared-account wallet flow. Old QR/order records are preserved in D1; do not reset or delete them. The legacy create endpoint returns `WALLET_PURCHASE_REQUIRED` (410).
2. **Fix old detail/download page startup.** `detail.html` and `download.html` had stale script cache versions and inline calls to `renderDetailPage()` / `renderDownloadPage()` that are not defined in this frontend. They now load `config.js` and the versioned `main.js`; the existing `DOMContentLoaded` entry point initializes the pages.
3. **Comments require a shared user account and verified email.** Display name comes from the account profile, not from a user-supplied field. Turnstile is required and verified server-side. One image is accepted per comment; images are stored hidden for moderation before public display.
4. **Persistent anti-spam controls for comments.** D1 rate counters limit each account to 2 comments/minute and 10/day; up to 5 image comments/day per account, with an additional IP limit of 5 comments/minute. These controls supplement, not replace, Cloudflare edge rate limiting.
5. **Permanent admin blocklist.** `/api/admin/security/blocks` is authenticated by the master Admin session, persists normalized IP/email blocks in D1, displays a 404-style result for blocked IPs, and blocks account operations for blocked emails. Admin can remove a block explicitly.
6. **Support report triage.** Admin report rows include the client IP for admin-only review, with buttons to prefill the permanent block form. Telegram report text includes the recorded IP when configured. Public sale widgets continue to use masked email, not raw email.
7. **Asset cache busting.** Updated frontend pages reference the current `v=56` JS/CSS versions; the details page no longer invokes the old QR creation fallback.
8. **AI assistant stays read-only.** It can explain account/status data provided to it and guide a report. It cannot change wallet balances, payment states, tenant privileges, blocks, or withdrawals by itself. An AI API needs runtime variables before it uses a remote model.

## Known limits
- Image moderation is **manual via the existing admin comment moderation panel**; this is not an automatic sexual-content classifier. An image remains hidden until a moderator makes it visible.
- Blocking an email prevents that account from account-backed actions; it cannot identify every visit by that person. A persistent IP block makes requests from that IP receive a 404-style response. VPNs, carrier NAT, changing IPs and multiple accounts can limit identity-based blocking.
- Worker in-memory throttles are per-isolate and are not a global DDoS control. Configure Cloudflare WAF / Rate Limiting separately.
- V56 does not migrate old QR orders into wallet purchases, does not auto-pay seller withdrawals, and does not guarantee that SMTP, SePay, Turnstile, Telegram, or AI providers work until configured and tested in runtime.
- No single security measure guarantees protection against every bypass or abuse method.
