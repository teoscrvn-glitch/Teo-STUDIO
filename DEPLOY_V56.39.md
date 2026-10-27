# TeoStudio V56.39 — deploy / verification notes

## What changed
- AI requests now include bounded, role-filtered prior messages from the currently selected browser conversation. The server caps the history and redacts common credential patterns before sending it to the configured AI provider. History remains browser-local; separate chat IDs do not share history unless the client sends that selected history.
- YouTube URLs for main and tenant tags are validated server-side and normalized. The main Admin tag form can add a tutorial URL; existing tag editing can change or clear the link. The detail view uses the exact tag, then its parent tag when needed, and lazily embeds the official YouTube no-cookie player.
- The global registration tutorial setting remains empty until the Admin enters a URL. The public registration form only displays the video section when a valid URL is configured; the iframe is created after the user taps play.
- Support-report images are compressed in the browser, revalidated by actual file signatures in the Worker, capped at 350 KB, stored in D1 with migration-safe columns, and accessible only to an authenticated Admin session. No report image is sent to the AI provider.
- Local brand assets are bundled under `frontend/assets/img`; the Téo Linh avatar matches the supplied image, and the icon/favicon were cropped from the supplied T-logo image to reduce excessive empty margin. Static pages receive a Content Security Policy that allows the official YouTube no-cookie player and Cloudflare Turnstile.
- Existing server-side main/tenant sales-feed query boundaries and tenant product Open Graph crawler routes are retained.

## Deploy steps
1. Back up the existing Worker source/configuration and the D1 database before deploying. Do not reset D1 or replace the production database ID.
2. Review `cloudflare/wrangler.toml` and make sure the existing D1 binding and `assets.directory = "../frontend"` remain correct for the repository structure. Do not add API keys to source or change production secrets during this update.
3. From the `cloudflare` directory, use the deployment method already used by this project (Wrangler deploy, with the existing account and environment). Only the owner with the correct Cloudflare account/authorization can publish the production Worker.
4. The `support_reports` image columns are added via the existing idempotent `ensureV55Schema` migration helper on its next invocation. Run a staging test for a fresh report and an image-bearing report before production rollout. Do not execute any destructive SQL migration.
5. Enter a valid YouTube link in **Admin → Giao diện → Video hướng dẫn đăng ký tài khoản** only after the video is ready. To configure a tag tutorial, open **Admin → File / Code → Tag chính & tag phụ** and paste the URL when creating/editing a tag; tenant Admin has its own tenant-scoped tag form. Empty fields intentionally remain empty.
6. Check `/api/health` and `/api/admin/config-status` after deployment. Verify a main-site purchase appears only in the main recent-sales feed and a tenant purchase only in that tenant’s feed. Test share metadata using the actual target site and crawler debugger.

## Security / DDoS reality check
The Worker keeps application-level rate limits, Turnstile checks, authorization and tenant-scoped SQL predicates, but in-memory rate counters are not a substitute for edge protection and can reset across Worker isolates. Configure Cloudflare WAF managed rules, Bot Fight/appropriate bot protections, and edge Rate Limiting rules in the Cloudflare dashboard for login, account registration, AI chat, support reports, purchase and rental endpoints. Apply a stricter challenge/block threshold to repeated authentication attempts and volumetric abuse, and monitor false positives before blocking broad traffic. This ZIP does not change Cloudflare account-level WAF rules, DNS/proxy settings, secrets or production.

## Checks already runnable locally
```sh
sh scripts/check-build.sh
node scripts/check-inline-js.mjs
node scripts/check-local-refs.mjs
python scripts/test-wallet-ledger.py
```

These checks verify Worker/frontend syntax, inline scripts, local references, YouTube allowlist and AI-history redaction/bounds, static scope guardrails and a SQLite wallet-ledger model. They do **not** prove the live D1 schema, Worker bindings, Gemini API, social crawler previews or mobile UI work in production; those need a staged/live deployment test.


## Acode Preview
Open `frontend/index.html` directly in Acode Preview. Static stylesheet and HTML image references use document-relative `assets/...` paths so they resolve from the `frontend` folder. On Cloudflare, the same paths resolve from the site root for clean URLs such as `/` and `/detail`. API-backed features still require a deployed Worker/API and will not fully function in a local file preview.
