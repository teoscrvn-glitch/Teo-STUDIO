# TeoStudio V56.29 — Teo AI + Share Sales Routing Fix

## Changes
- Teo AI now keeps a local conversation list on the current browser/device, supports starting a new chat and reopening saved chats (up to 20).
- AI replies safely render Markdown links and plain URLs as clickable links, with escaping to prevent injected HTML.
- Assistant instructions are more TeoStudio-specific and enforce consent/security boundaries; bug report submission now asks for explicit confirmation.
- AI provider diagnostics no longer assume the provider is Gemini, improving compatibility with OpenAI-compatible providers such as OpenRouter.
- Recent sales routing on clean `/share?tenant=...` URLs now uses the tenant-specific recent-sales endpoint rather than falling through to the main-site feed.
- Updated cache-busting references for modified frontend scripts.

## Important limitations
- Chat history is local to this browser/device and is not synchronized across devices or browsers.
- The configured AI provider still depends on Cloudflare variables `AI_API_URL`, `AI_API_KEY`, and `AI_MODEL`; this patch does not change secrets.
- No production deployment has been performed from this ZIP.
- The tenant `TENANT_REQUIRED` error should be retried after checking tenant session and owner identity; this patch does not bypass backend tenant authorization.

## Validation
- JavaScript syntax checks and ZIP structure checks are run separately before packaging.
