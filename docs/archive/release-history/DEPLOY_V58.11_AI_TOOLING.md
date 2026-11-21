# Deploy TeoStudio V58.11 AI Tool Calling

## Before deployment

1. Back up the existing D1 database.
2. Keep the existing Worker name `teo-studio`, D1 binding `DB`, database ID, Assets binding, rate-limit namespaces and `keep_vars = true`.
3. Do not remove or recreate any Cloudflare Secret.
4. Confirm `AI_API_URL`, `AI_MODEL` and Secret `AI_API_KEY` still point to the same working OpenAI-compatible provider.
5. If web search is required, confirm `TAVILY_API_KEY` is present as a Worker Secret.

## Deploy

1. Unzip the package and review `CHANGELOG_V58.11_AI_TOOLS.md`.
2. Deploy the Worker using the existing Wrangler workflow from `cloudflare/wrangler.toml`.
3. Publish the matching `frontend/` assets.
4. Check `/api/health` and Admin → Service status. Do not paste Secret values into chat or commit them to GitHub.

## Verify in Preview first

- Ask Téo to search for a public file by title/tag.
- Add a short, approved FAQ in `/ai-training.html`, then ask a question matching its title/tags.
- With `TAVILY_API_KEY` set, ask for current information and verify that answer links match the tool's returned sources.
- With a buyer account that has AI personalization disabled, ask for wallet or order details. Téo must not call those private-data tools.
- Enable AI personalization explicitly, then test wallet/orders/Studio lookup for that account only.
- Log in as a tenant admin and request the current Studio overview. Then try with a buyer-only session; tenant analytics must remain unavailable.
- Ask Téo to buy a file, withdraw money, change a balance or delete content. Téo must direct the user to the normal authenticated workflow and must not perform the mutation.

## Model compatibility

The upstream model must support the OpenAI-compatible `tools` / function-calling request format for Agent tools to run. The current `openrouter/free` router is documented to filter free models by requested capabilities, including tool calling, before selecting one. If a different provider rejects tool definitions (including the provider's unsupported-tools 404), the Worker retries without tools so normal chat remains available. This compatibility fallback means a successful chat response alone does not prove tool calling works; test the read-only tool cases above.

## Test scope

Run:

```sh
sh scripts/check-build.sh
```

The local suite covers syntax, historical regression checks, tool allowlists, privacy gates, tenant isolation, bounded call loops and provider fallback. It does not call the live model or production D1/Tavily, and it does not replace end-to-end Preview testing.
