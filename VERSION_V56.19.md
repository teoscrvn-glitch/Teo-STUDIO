# TeoStudio v56.19 — Sales Feed, Detail Sharing & AI Diagnostics

## Changes
- Added a recent-purchase section between channel links and the file grid on the main page and tenant share pages. It displays the buyer display name, masked email, purchased file, thumbnail, paid amount, and timestamp in Vietnam time.
- Main catalog cards use the clean `/detail?id=...` URL. Human visitors are routed to the existing detail HTML while preserving the query string.
- Detail pages now display their thumbnail, copyable share URL, and native share action when supported. Social crawler responses are injected with per-file Open Graph/Twitter title, description, image, canonical URL, and product thumbnail endpoint; default metadata is removed first to prevent duplicate tags taking precedence.
- Teo AI surfaces the Worker's sanitized Gemini-provider diagnostic instead of hiding all causes behind a generic message.
- Gemini endpoint/model are included as non-secret Wrangler vars so config can stay in sync with Cloudflare Builds. The `AI_API_KEY` must remain a Cloudflare Secret; no secret value is included in the ZIP.
- Cache-busting/version fingerprint is now `v56.19-sales-feed-detail-share-ai-diagnostics`.

## Verification scope
Local syntax and static build checks passed. Live Gemini, D1 production data, browser/device interactions, external social-platform previews, and payment/email/Turnstile integrations were not available for verification in this packaging environment.
