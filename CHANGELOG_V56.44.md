# TeoStudio V56.44 — AI web search, activity context, tenant isolation

## Changes
- Added optional Tavily web search through the Cloudflare Worker using the `TAVILY_API_KEY` Secret. Search results are bounded and passed as untrusted source material; the model is instructed to cite source URLs and not follow embedded page instructions.
- Added buyer-scoped activity events for page visits, successful wallet purchases, and logout. The AI only receives activity belonging to the authenticated buyer. Page paths are stored without query strings.
- Added recent purchase context for the authenticated buyer and tenant-admin activity context only after verifying the admin session for that exact tenant.
- Fixed tenant recent-sales feed isolation: a purchase row must match both the current tenant and the tenant product owner (`tp.tenant_id = p.tenant_id`), preventing a colliding product ID from exposing another tenant's sale.
- Updated assistant persona for Vietnamese-first help, source-backed discussion of Vietnamese sovereignty topics, and light playful replies while avoiding threats or abusive targeting.
- Kept password hashes, session tokens, OTPs, API keys, full payment credentials, and other tenants' private data out of assistant context.

## Configuration
- Existing AI settings remain `AI_API_URL`, `AI_MODEL`, and Secret `AI_API_KEY`.
- Optional live search: add Cloudflare Worker Secret `TAVILY_API_KEY`. Create a key in the Tavily dashboard. Without this secret, the assistant must not claim it searched the web.
- No model weights are retrained by this release. Personalization uses authenticated account context and recorded activity; it is not autonomous self-training.

## Validation
- `node --check cloudflare/worker.js` passed.
- All frontend JS files passed `node --check`.
- `node scripts/check-inline-js.mjs` passed.
- `bash scripts/check-build.sh` passed after updating stale assertions for the stricter tenant-product join.
- These are static/local checks only. Live Cloudflare, D1 migrations, Tavily key, OpenRouter, and phone UI have not been tested against Production.
