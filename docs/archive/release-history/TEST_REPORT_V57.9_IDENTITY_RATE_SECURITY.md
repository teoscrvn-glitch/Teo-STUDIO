# V57.9 local regression test report

Date: 2026-11-05

## Executed checks
- `node --check cloudflare/worker.js` — PASS.
- `python scripts/test-v57.9-identity-security.py` — PASS (26 assertions covering source invariants, IP parsing, spoofed forwarding headers, Turnstile on both tenant login surfaces, HMAC subject hashes, IPv4 `/24`, IPv6 `/64`, persistent account/IP/network thresholds, and 15-minute window reset).
- `bash scripts/check-build.sh` — PASS, all 20/20 groups completed.
- `unzip -t` — verified on the final release archive before handoff.

## Scope limitation
These are local static/helper/SQLite regression tests. They do not execute the live Cloudflare Worker, production D1, zone WAF, Turnstile provider, or Android browser. Production acceptance must be confirmed after deploy using `/api/health` and ordinary login flows.
