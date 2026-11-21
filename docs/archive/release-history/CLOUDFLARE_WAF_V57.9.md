# Recommended Cloudflare WAF rules for TeoStudio V57.9

These rules are created in the Cloudflare dashboard (Security → WAF → Rate limiting rules). They are not deployable from the Worker ZIP because they are zone-level Cloudflare configuration. Apply cautiously and review Security Events after activation.

## Rule 1 — Authentication endpoints

Expression:

```text
(http.host eq "teostudio.top" and http.request.method eq "POST" and http.request.uri.path in {"/api/account/login" "/api/tenant/login" "/api/tenant/security-login" "/api/account/register" "/api/account/password/reset/start"})
```

Suggested starting threshold: 12 requests per 60 seconds per source IP. Action: Managed Challenge or Block for 10 minutes, depending on the plan and dashboard options. Start with Managed Challenge to reduce false positives for users behind shared mobile carrier NAT.

## Rule 2 — Free bypass endpoints

Expression:

```text
(http.host eq "teostudio.top" and http.request.method eq "POST" and http.request.uri.path in {"/api/rental/free/bypass/start" "/api/rental/free/bypass/issue" "/api/rental/free/bypass/redeem" "/api/rental/free/bypass/complete"})
```

Suggested starting threshold: 20 requests per 60 seconds per source IP. Action: Managed Challenge or Block for 10 minutes. Do not use the same aggressive threshold as login because normal bypass flows require several requests.

## General protections
- Enable Cloudflare Managed Rules (if available on the account) and Bot Fight Mode / Super Bot Fight Mode if available.
- Keep the site's DNS record proxied through Cloudflare. An exposed origin/VPS IP can bypass zone WAF controls.
- Review Security → Events for repeated 401/403/429 patterns. Prefer temporary challenges/rate-limits over permanent IP bans.
- Do not block entire countries or broad carrier networks just because one user reports abuse. Check request paths, timestamps, User-Agent, and WAF event details first.
- If the origin is a separate VPS, firewall it to accept web traffic only from Cloudflare IP ranges or use Cloudflare Tunnel. For Cloudflare Workers with D1 and Workers Assets, there is no separate public origin to expose.

## Limits
- Worker Rate Limiting API counters are approximate and maintained separately per Cloudflare location. Zone-level rate limiting is an additional layer, not a guarantee that all distributed proxy traffic can be attributed to one person.
- The Worker only trusts `CF-Connecting-IP` for normal inbound client-IP attribution. Do not change it to trust `X-Forwarded-For` or a custom header from the browser.
