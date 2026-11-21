# Changelog V57.10 — Link4M shortlink API diagnostic

- Added a real server-side API probe for BumX and Link4M using the existing Cloudflare secrets.
- The test route can probe Link4M shortlink creation even if rewarded traffic is not approved; this override is limited to the diagnostic route and cannot start a user reward attempt.
- Test responses report HTTP status, provider status, and returned domain only. They never return the API key, complete short URL, or raw provider body.
- Provider errors redact the API secret and URLs.
- Free gate and Tenant Admin Settings now show per-provider diagnostic results.
- Rewarded traffic remains gated separately. Shortener API `success` is not treated as completed ad verification.
- No new D1 schema, secret, or binding is required.
