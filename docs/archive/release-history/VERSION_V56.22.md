# TeoStudio V56.23 — Social Preview + AI Request Fix

## Changes
- `/detail?id=...` and `/detail.html?id=...` return server-generated Open Graph/Twitter metadata for every user-agent, not only recognized crawler user agents. This lets Zalo/Telegram/Facebook fetch the product title, description, and thumbnail from the initial HTML.
- Product Open Graph thumbnail endpoint attempts to proxy remote image bytes as a same-origin image response rather than relying on a 302 redirect; falls back to redirect if the remote host cannot be fetched.
- Gemini OpenAI-compatible request body now sends only `model` and `messages`, removing `max_tokens`/`stream` parameters that can be rejected by some model/API combinations. HTTP error details from the provider remain surfaced by the existing backend.
- Version/cache markers updated to `v56.23-ai-telegram-diagnostics-fix`.

## Limitations
- Social apps cache previews independently; after deploy, old previews may remain cached. Zalo may also suppress previews depending on client settings.
- Live Gemini operation still requires a valid `AI_API_KEY`, model access, and successful Admin → AI connection test. This build was not deployed to production and cannot verify production secrets.
