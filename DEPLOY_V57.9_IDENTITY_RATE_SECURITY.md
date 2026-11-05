# Deploy TeoStudio V57.9 — Identity and rate-limit security

## Files
Deploy the complete `cloudflare/worker.js` and the complete `frontend/` directory from this release. Do not copy only one file. Frontend asset cache tokens for the configuration script are bumped to `57.9`.

## Cloudflare settings to keep
The screenshot shows these Production bindings already exist. Keep their current encrypted values and bindings:
- Secrets: `ADMIN_KEY`, `AI_API_KEY`, `BUMX_API_KEY`, `LINK4M_API_KEY`, `OXMAIL_SMTP_PASS`, `SEPAY_API_KEY`, Telegram secrets, `TURNSTILE_SECRET`.
- Variables: `AI_API_URL`, `AI_MODEL`, `BUMX_API_URL`, `LINK4M_API_URL`, payment/Telegram values, `TURNSTILE_SITE_KEY`.
- D1 binding: `DB` -> `teo-studio`.
- Rate limit bindings: `API_EDGE_LIMITER`, `AUTH_EDGE_LIMITER`, `BYPASS_EDGE_LIMITER`, `FINANCE_EDGE_LIMITER`.

Do not copy secret values into `wrangler.toml`, source code, screenshots, or chat. This build requires no new Secret or Binding: HMAC keying falls back to existing `ADMIN_KEY` or `TURNSTILE_SECRET`. For key stability independent of Admin key rotation, you may optionally add a new Production Secret named `LOGIN_RATE_HASH_KEY` (a random 32+ character value). The Worker uses the existing `DB` binding and automatically creates `security_login_attempts` with `CREATE TABLE IF NOT EXISTS`; this is additive and does not reset existing tables or data.

## Deploy steps
1. Download and extract the V57.9 ZIP.
2. In Cloudflare Workers & Pages, open `teo-studio` and deploy the updated Worker code from `cloudflare/worker.js`.
3. Upload/deploy the complete contents of `frontend/` as the Worker assets using the same deployment method already used for this site.
4. Keep the existing Production secrets and D1 binding. Do not delete/recreate the D1 database.
5. Open `https://teostudio.top/api/health` and check that the returned build/version is `v57.9-identity-rate-security`.
6. Verify an ordinary tenant login, an ordinary buyer login, and a protected admin route. Do not deliberately submit eight wrong passwords on a real account to test throttling.

## New login cooldowns
- A buyer account or tenant identity gets a temporary 15-minute cooldown after 8 failed attempts within 15 minutes.
- A source IP gets a temporary 15-minute cooldown after 24 failed attempts within 15 minutes.
- A nearby IPv4 `/24` or IPv6 `/64` network gets a temporary cooldown after 60 failed attempts within 15 minutes.
- The account/tenant counter is based on the stable database ID where possible. Switching from email to login ID, changing slug alias, or changing IP does not reset that identity counter. Both tenant login and saved-device Admin re-authentication require Turnstile.
- IP/network counters store only hashed identifiers in D1. They are not permanent bans and expire/reset after the window.
- Shared mobile or carrier networks can contain many users. The network threshold is intentionally higher; do not lower it aggressively.

## Important
The Worker Rate Limiting bindings are approximate per Cloudflare location. For additional protection, configure the zone-level WAF rate-limit rules in `CLOUDFLARE_WAF_V57.9.md`. Do not treat a Worker binding as a strict global limit.
