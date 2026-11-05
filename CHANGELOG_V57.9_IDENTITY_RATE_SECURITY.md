# TeoStudio V57.9 — Persistent identity and network abuse throttling

## Security changes
- Only the edge-populated `CF-Connecting-IP` header is used as the visitor IP source. `X-Forwarded-For`, `X-Real-IP`, and browser-provided forwarding headers are not trusted.
- IPv4 addresses are normalized and grouped by `/24`; IPv6 addresses are normalized and grouped by `/64` for a secondary nearby-network abuse bucket.
- Added the additive D1 table `security_login_attempts`. It stores only HMAC-SHA-256 keyed subject hashes and counters/timestamps, not raw emails, usernames, tenant IDs, or IP addresses. Hashing is keyed by `LOGIN_RATE_HASH_KEY` when set, otherwise by the existing `ADMIN_KEY` or `TURNSTILE_SECRET`.
- Failed buyer-account authentication increments both the normalized login identifier and the stable buyer account ID bucket. Switching between login ID and email, or changing IP, does not reset the account bucket.
- Failed tenant authentication increments the supplied identifier and the stable IDs of all matching tenant rows. Alternate slug/ID aliases therefore share the stable tenant bucket.
- The legacy tenant login and saved-device Admin security-password login both require Turnstile and share persistent IP/network throttles; the saved-device password also has a stable tenant-ID cooldown.
- Persistent cooldowns: 8 failures per account/input in 15 minutes; 24 failures per exact IP in 15 minutes; 60 failures per IPv4 `/24` or IPv6 `/64` in 15 minutes. Cooldown is 15 minutes. The network thresholds are deliberately higher to reduce collateral blocking on shared mobile networks.
- The D1 upsert is atomic. Expired windows reset both the counter and stale cooldown timestamp. Old hash rows are purged after 24 hours by the existing maintenance path.
- Existing Cloudflare rate-limit bindings, Turnstile checks, admin blocks, and tenant-level blocks are preserved. This release does not create permanent automatic IP bans.

## Threat model and limits
- A user cannot bypass the IP source by merely adding a fake `X-Forwarded-For` header to a normal request to the Cloudflare edge. Cloudflare supplies `CF-Connecting-IP` to the origin/Worker.
- A VPN, proxy, Tor exit, mobile carrier address rotation, or a different network can change the source IP. Account-ID throttling and Turnstile help against this; zone-level WAF rules are still recommended.
- Cloudflare Worker Rate Limiting API bindings are approximate and local to each Cloudflare location. They are an edge safety layer, not a strict global counter.
- No system can reliably attribute all distributed requests to one person using IP alone. Do not make permanent IP bans the only control; shared home/mobile IPs can belong to many legitimate users.

## Provider compliance note
- The Link4M API screenshot documents URL shortening, not a signed callback proving that an ad was completed.
- Link4M's public rules prohibit incentivized traffic unless specially permitted. Keep `LINK4M_REWARDED_TRAFFIC_APPROVED` unset unless Link4M grants explicit written permission. Do not infer approval from possession of an API token.
