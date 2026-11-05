# TeoStudio V57.9

V57.9 is a security hardening patch on top of the existing V57 feature set.

- Worker build: `v57.9-identity-rate-security`.
- Durable D1 login cooldowns by hashed account/tenant identity, exact IP, and network prefix.
- Turnstile protection for tenant login and saved-device Admin re-authentication.
- IP attribution trusts only Cloudflare `CF-Connecting-IP`; IPv4 `/24` and IPv6 `/64` prefix normalization.
- Additive D1 migration; existing DB and Secrets are preserved.
- Manual zone-level WAF recommendations are in `CLOUDFLARE_WAF_V57.9.md`.

Local tests do not equal a production penetration test. Deploy the full Worker + frontend and verify on Preview/production with ordinary accounts.
