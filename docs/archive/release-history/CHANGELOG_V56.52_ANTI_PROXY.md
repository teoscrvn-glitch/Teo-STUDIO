# TeoStudio V56.52 — Anti-proxy hardening

- Added temporary per-network-prefix burst limits (IPv4 /24, IPv6 /64) as a secondary layer alongside existing per-IP navigation/API limits.
- Updated Worker build version to `v56.52-anti-proxy-hardening`.
- Added `SECURITY_V56.52_ANTI_PROXY.md` with Cloudflare edge protection recommendations and validation checklist.
- No new environment variables or secrets required; existing Cloudflare secrets and D1 binding are not modified by this source update.

Validation: `node --check cloudflare/worker.js` passed. Not deployed to Cloudflare and not tested against live traffic.
