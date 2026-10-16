# TeoStudio Security Playbook — reusable source knowledge

This file is intended to be shipped with TeoStudio source and used as a stable project reference in future coding/review sessions. It is not a change to ChatGPT's global memory. The principles below summarize public guidance and apply to every release unless a later review records a reasoned exception.

## A. AI assistant and tool-use safety (Anthropic guidance, summarized)

Source reading:
- Anthropic, “Trustworthy agents in practice” (2026-04-09): https://www.anthropic.com/research/trustworthy-agents
- Anthropic, “Mitigating the risk of prompt injections in browser use” (2025-11-24): https://www.anthropic.com/research/prompt-injection-defenses

Apply these rules:
1. Treat page text, comments, uploaded files, report messages, retrieved documents and API output as **untrusted content**, not instructions that can override system/developer policy or server-side authorization.
2. Keep humans in control for consequential actions. AI may explain, summarize, classify or draft a report; require explicit confirmation and normal server-side checks for purchases, payouts, plan changes, account deletion, changing permissions or moderation publication.
3. Give AI the minimum data and tools needed. It must not receive passwords, OTPs, Admin keys, SMTP passwords, bank credentials, webhook secrets or full payment payloads. Mask email and keep private fields out of prompts unless essential.
4. No direct privileged database/tool access from public chat. Every suggested action must go through a narrow, separately authenticated API with validation, rate limiting, audit logging and authorization. AI text must never be treated as proof a transaction succeeded.
5. Defend in layers: server-side allowlists and access checks, input/output validation, Turnstile for exposed forms, edge rate limits, audit logs, manual confirmation, and red-team tests. Do not rely on a single prompt or classifier to stop prompt injection.
6. When context is incomplete or the result is uncertain, say so; ask for confirmation rather than guessing or taking an irreversible action.

## B. Web and application controls

1. **Authorization belongs on the Worker**, not only in UI. Check the session and resource owner on every read/write of orders, buyer details, original file links, tenant settings, wallet ledger and withdrawal records.
2. **Never expose paid origin links publicly.** The public product API should return no `download_link`/`original_link` for paid-only files; mixed-mode should expose only its explicitly free/unlock link. Deliver the original link only after a verified, paid order owned by the requesting account.
3. **Wallets use a ledger**, not client-submitted balances. In a single transactional D1 operation, debit buyer, credit seller and record commission. Validate current price from D1, require email verification and anti-bot verification, require the user to accept terms and perform final confirmation, use an idempotency key and enforce unique references. Reject reused/expired payment codes and mismatched amounts. A top-up credits the wallet only after the authentic SePay webhook matches a pending code/order and exact amount.
4. **Turnstile requires server-side Siteverify.** A widget success in the browser is not authorization. Validate token on every protected write; tokens expire after 300 seconds and are single use. Keep `TURNSTILE_SECRET` only in Worker Secrets, use the matching public `TURNSTILE_SITE_KEY`, restrict allowed hostnames, and fail closed if verification configuration is missing.
5. **Uploads are hostile.** Allow only required file types, enforce size limits, inspect file signature where feasible, normalize/re-encode images, do not render user-provided HTML/SVG as active content, and hold risky comment images hidden until review. Limit both count and size by account and IP; log abuse safely.
6. **Comments require an account.** Use the verified profile display name; do not accept arbitrary identity fields from the request. Use server-side moderation visibility and persistent D1 rate counters. Public endpoints return visible items only.
7. **Permanent blocks must use trusted identifiers.** IP must come from Cloudflare's `CF-Connecting-IP`, not a client-controlled body/header. Normalize and validate IP/email before storing. A blocklist is admin-only, auditable, and has an explicit unban path. A blocked IP can be shown a generic 404; an email block stops account operations but cannot prove every visit is the same person.
8. **CORS is not authentication.** Same-origin checks help prevent cross-site writes but don't stop direct API clients. Keep bearer/session auth, ownership checks, CSRF defenses, Turnstile and rate limiting for sensitive endpoints.
9. **Rate limiting has multiple layers.** D1 counters provide persistence for bounded actions; in-memory Worker limits only help per isolate. Configure Cloudflare edge WAF/Rate Limiting for login, registration, reset, comments, support reports, wallet top-ups, purchase and withdrawal APIs. Test false positives. Do not apply aggressive challenge/block rules to the SePay webhook without accounting for legitimate retries.
10. **Secrets and operational safety.** Secrets live in Cloudflare Runtime Secrets, never frontend JS/HTML, repository files, screenshots or logs. Preserve D1 database ID and `DB` binding. Back up/export before additive migrations; deploy staging/branch first; check health version after deploy; test and prepare rollback.
11. **Privacy in sales activity.** Public sale tickers must mask email and must not publish identifiers unnecessary to show a sale. Only admin endpoints may show full user email/IP where operationally justified; restrict and retain only as needed.
12. **No “unbreakable” claims.** Every feature needs a test plan, negative tests, duplicate/replay tests, access-control tests and operational monitoring. Document what was tested locally versus live.

## C. Cloudflare Turnstile and WAF references

- Turnstile setup: https://developers.cloudflare.com/turnstile/get-started/
- Server-side validation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Rate limiting rules: https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/
- Rate limit best practices: https://developers.cloudflare.com/waf/rate-limiting-rules/best-practices/

Cloudflare says server-side Siteverify is mandatory; client widgets alone do not protect forms. Tokens expire after five minutes and can be verified only once. Use the official docs when configuring or changing this behavior.

## D. Required regression scenarios for every release

- Anonymous user cannot buy a paid file, view a paid original URL, publish a comment or access an order by changing its ID.
- An unverified email cannot buy, top up or publish comments where verification is required.
- Turnstile missing, invalid, expired or replayed token is rejected by the Worker.
- Duplicate purchase request does not double debit or credit. Top-up webhook replay does not double credit; wrong code/amount does not credit.
- Buyer debit equals the current D1 price; seller amount + platform commission equals the order amount. No balance can become negative from a purchase race.
- Comment image remains hidden until moderator publishes it. Per-account and per-IP rate limits survive Worker isolate restarts because D1 events persist.
- Admin IP block returns generic 404 for that IP after cache expiry/invalidation; admin email block stops account operations; unban restores access.
- Public APIs redact paid file links, personal information and secrets. Admin-only reports require a valid Admin session.
- Test email OTP/reset, Turnstile, AI configured and fallback modes, Telegram alerts, mobile layouts, monthly statistics and rollback.
