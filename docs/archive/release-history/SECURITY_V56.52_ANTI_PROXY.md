# TeoStudio V56.52 — Anti-proxy / burst hardening

## Code changes
- Keeps existing per-IP request limits.
- Adds a secondary, deliberately higher soft limit for requests from the same IPv4 /24 or IPv6 /64 network prefix. This can catch some rotating proxy pools that share a network.
- Applies this secondary limit to rapid HTML navigation and broad API bursts only. It does not permanently ban a network and returns HTTP 429 temporarily.
- Does not change D1 schema, billing, SePay webhook, Telegram, AI, Turnstile secrets, or payment logic.

## Important limitation
Worker in-memory counters are isolate-local and short-lived. They are defense-in-depth, NOT a replacement for Cloudflare edge DDoS protection. Distributed attackers using many unrelated proxy networks can bypass application-level IP/prefix counters. Do not promise that this makes a site immune to DDoS.

## Recommended Cloudflare dashboard protection (primary layer)
1. In Cloudflare Dashboard, select `teostudio.top` → Security → Settings. Enable Bot Fight Mode if available on the plan. Test login, link previews, checkout, and API integrations afterwards.
2. Under Security → WAF / Custom rules, create a Managed Challenge rule for suspicious browser page requests. Do not challenge all requests globally, because APIs and payment webhooks may be non-browser traffic.
3. Create rate-limiting rules for high-cost endpoints such as login/email-code/reset/comment endpoints, based on the actual paths in `cloudflare/worker.js`. Start with a challenge/block action only after reviewing Security Events. Keep `/api/webhook/sepay` excluded from browser challenges/rate limits unless a safe provider-specific policy is established.
4. Review Security → Events and Workers → Metrics after enabling rules. Tune thresholds to avoid blocking normal mobile users behind carrier NAT.
5. Keep Turnstile server-side verification on sensitive POST endpoints. Never trust a client-side widget alone.

## Validation
Run `node --check cloudflare/worker.js` before deployment. Deploy to a staging/preview Worker first if available, then test site navigation, login, email verification, comments, SePay webhook, Telegram notifications, tenant admin, and file purchases.
